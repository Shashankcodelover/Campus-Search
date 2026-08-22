/**
 * notionService
 * --------------
 * Server-side proxy to the Notion API.
 * The frontend never calls Notion directly — this keeps the API key safe
 * and lets us cache/transform content before sending it to the client.
 *
 * Endpoints used:
 *   POST https://api.notion.com/v1/search — find pages/databases
 *   GET  https://api.notion.com/v1/blocks/{id}/children — page content
 *   GET  https://api.notion.com/v1/pages/{id} — page metadata
 */

const NOTION_API_KEY = process.env.NOTION_API_KEY || "";
const NOTION_VERSION = "2022-06-28";
const BASE = "https://api.notion.com/v1";

// Simple in-memory cache with TTL to avoid hammering Notion's rate limits
const cache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function cached(key, fn) {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.ts < CACHE_TTL_MS) return Promise.resolve(hit.data);
  return fn().then((data) => {
    cache.set(key, { data, ts: Date.now() });
    return data;
  });
}

async function notionFetch(path, options = {}) {
  if (!NOTION_API_KEY) throw new Error("NOTION_API_KEY not configured.");

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${NOTION_API_KEY}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`[notion] ${res.status} ${path}:`, body);
    throw new Error(`Notion API error: ${res.status}`);
  }

  return res.json();
}

/**
 * Search for pages and databases shared with the integration.
 */
async function searchPages(query = "") {
  return cached(`search:${query}`, () =>
    notionFetch("/search", {
      method: "POST",
      body: JSON.stringify({
        query,
        page_size: 20,
        sort: { direction: "descending", timestamp: "last_edited_time" },
      }),
    }).then((res) => res.results.map(simplifyPage))
  );
}

/**
 * Get all pages accessible to the integration (knowledge hub listing).
 */
async function getAllPages() {
  return cached("hub:all", () =>
    notionFetch("/search", {
      method: "POST",
      body: JSON.stringify({
        page_size: 100,
        filter: { value: "page", property: "object" },
        sort: { direction: "descending", timestamp: "last_edited_time" },
      }),
    }).then((res) => res.results.map(simplifyPage))
  );
}

/**
 * Get the content of a single page by recursively fetching block children.
 */
async function getPageContent(pageId) {
  return cached(`page:${pageId}`, async () => {
    const [pageMeta, blocks] = await Promise.all([
      notionFetch(`/pages/${pageId}`),
      fetchAllBlocks(pageId),
    ]);
    return {
      ...simplifyPage(pageMeta),
      html: blocksToHtml(blocks),
      blocks,
    };
  });
}

/**
 * Recursively fetch all blocks (handles nested children).
 */
async function fetchAllBlocks(blockId) {
  const blocks = [];
  let cursor = undefined;

  do {
    const qs = cursor ? `?start_cursor=${cursor}` : "";
    const res = await notionFetch(`/blocks/${blockId}/children${qs}`);
    for (const block of res.results) {
      if (block.has_children) {
        block._children = await fetchAllBlocks(block.id);
      }
      blocks.push(block);
    }
    cursor = res.has_more ? res.next_cursor : undefined;
  } while (cursor);

  return blocks;
}

/**
 * Convert a Notion page object to a simpler shape for the frontend.
 */
function simplifyPage(page) {
  const titleProp = findTitle(page);
  return {
    id: page.id,
    object: page.object,
    title: titleProp || "Untitled",
    icon: page.icon?.emoji || page.icon?.external?.url || null,
    cover: page.cover?.external?.url || page.cover?.file?.url || null,
    lastEdited: page.last_edited_time,
    createdTime: page.created_time,
    url: page.url,
  };
}

function findTitle(page) {
  if (!page.properties) return null;
  for (const [, prop] of Object.entries(page.properties)) {
    if (prop.type === "title" && prop.title?.length) {
      return prop.title.map((t) => t.plain_text).join("");
    }
  }
  return null;
}

/**
 * Convert Notion blocks to simple HTML for rendering.
 */
function blocksToHtml(blocks) {
  return blocks.map(blockToHtml).join("\n");
}

function richTextToHtml(richText) {
  if (!richText || !richText.length) return "";
  return richText
    .map((t) => {
      let html = escapeHtml(t.plain_text);
      if (t.annotations?.bold) html = `<strong>${html}</strong>`;
      if (t.annotations?.italic) html = `<em>${html}</em>`;
      if (t.annotations?.strikethrough) html = `<del>${html}</del>`;
      if (t.annotations?.underline) html = `<u>${html}</u>`;
      if (t.annotations?.code) html = `<code>${html}</code>`;
      if (t.href) html = `<a href="${escapeHtml(t.href)}" target="_blank" rel="noopener">${html}</a>`;
      return html;
    })
    .join("");
}

function blockToHtml(block) {
  const type = block.type;
  const data = block[type];
  const childrenHtml = block._children ? blocksToHtml(block._children) : "";

  switch (type) {
    case "paragraph":
      return `<p>${richTextToHtml(data?.rich_text)}</p>${childrenHtml}`;
    case "heading_1":
      return `<h1>${richTextToHtml(data?.rich_text)}</h1>${childrenHtml}`;
    case "heading_2":
      return `<h2>${richTextToHtml(data?.rich_text)}</h2>${childrenHtml}`;
    case "heading_3":
      return `<h3>${richTextToHtml(data?.rich_text)}</h3>${childrenHtml}`;
    case "bulleted_list_item":
      return `<li>${richTextToHtml(data?.rich_text)}${childrenHtml ? `<ul>${childrenHtml}</ul>` : ""}</li>`;
    case "numbered_list_item":
      return `<li>${richTextToHtml(data?.rich_text)}${childrenHtml ? `<ol>${childrenHtml}</ol>` : ""}</li>`;
    case "to_do":
      const checked = data?.checked ? "checked" : "";
      return `<div class="todo"><input type="checkbox" ${checked} disabled />${richTextToHtml(data?.rich_text)}</div>${childrenHtml}`;
    case "toggle":
      return `<details><summary>${richTextToHtml(data?.rich_text)}</summary>${childrenHtml}</details>`;
    case "code":
      return `<pre><code class="language-${data?.language || "text"}">${escapeHtml(data?.rich_text?.map((t) => t.plain_text).join("") || "")}</code></pre>`;
    case "quote":
      return `<blockquote>${richTextToHtml(data?.rich_text)}</blockquote>${childrenHtml}`;
    case "callout":
      return `<div class="callout">${data?.icon?.emoji || "💡"} ${richTextToHtml(data?.rich_text)}</div>${childrenHtml}`;
    case "divider":
      return `<hr />`;
    case "image":
      const url = data?.file?.url || data?.external?.url || "";
      const caption = data?.caption ? richTextToHtml(data.caption) : "";
      return `<figure><img src="${escapeHtml(url)}" alt="${caption}" />${caption ? `<figcaption>${caption}</figcaption>` : ""}</figure>`;
    case "bookmark":
      return `<a class="bookmark" href="${escapeHtml(data?.url || "")}" target="_blank">${escapeHtml(data?.url || "")}</a>`;
    case "table":
      return `<table>${childrenHtml}</table>`;
    case "table_row":
      const cells = data?.cells || [];
      return `<tr>${cells.map((c) => `<td>${richTextToHtml(c)}</td>`).join("")}</tr>`;
    default:
      return childrenHtml || `<!-- unsupported block: ${type} -->`;
  }
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

module.exports = { searchPages, getAllPages, getPageContent };
