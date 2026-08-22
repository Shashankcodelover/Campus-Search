import React, { useState, useEffect } from "react";
import { BookOpen, Search, AlertTriangle, ArrowLeft, ExternalLink, ChevronRight } from "lucide-react";
import { api } from "../api";
import { EmptyState } from "../components/common/EmptyState";
import { Skeleton } from "../components/common/Skeleton";

export function NotionHub() {
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState(null);
  const [pageContent, setPageContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQ, setSearchQ] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await api.notionHub();
        setPages(data);
      } catch (e) { setError(e.message); }
      setLoading(false);
    })();
  }, []);

  const openPage = async (page) => {
    setSelectedPage(page);
    setPageContent(null);
    try {
      const content = await api.notionPage(page.id);
      setPageContent(content);
    } catch (e) {
      setPageContent({ html: `<p style="color:var(--red)">Failed to load: ${e.message}</p>` });
    }
  };

  const doSearch = async () => {
    if (!searchQ.trim()) return;
    setLoading(true);
    try {
      const data = await api.notionSearch(searchQ);
      setPages(data);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  if (selectedPage) {
    return (
      <div className="page-enter">
        <button onClick={() => { setSelectedPage(null); setPageContent(null); }} className="btn btn-ghost" style={{ marginBottom: 16 }}>
          <ArrowLeft size={14} /> Back to Knowledge Base
        </button>
        <div className="card card-glow">
          <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--trace)" }}>
            <div style={{ fontSize: 24, marginRight: 8, display: "inline" }}>{selectedPage.icon || "📄"}</div>
            <h2 style={{ display: "inline", verticalAlign: "middle" }}>{selectedPage.title}</h2>
            <div style={{ fontSize: 11, color: "var(--muted-dim)", marginTop: 6 }} className="font-mono">
              Last edited: {new Date(selectedPage.lastEdited).toLocaleDateString()}
              {selectedPage.url && (
                <a href={selectedPage.url} target="_blank" rel="noopener" style={{ marginLeft: 12 }}>
                  Open in Notion <ExternalLink size={10} style={{ verticalAlign: "middle" }} />
                </a>
              )}
            </div>
          </div>
          {pageContent ? (
            <div className="notion-content" dangerouslySetInnerHTML={{ __html: pageContent.html }} />
          ) : (
            <div style={{ padding: 24 }}><Skeleton type="text" count={8} /></div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="page-enter">
      <div className="section-header">
        <h2 className="section-title"><BookOpen size={22} /> Knowledge Base</h2>
      </div>

      <p style={{ color: "var(--muted)", fontSize: 13, marginBottom: 20 }}>
        Browse documentation and guides from our Notion workspace. Powered by the Notion API.
      </p>

      <div className="search-bar" style={{ marginBottom: 20 }}>
        <div className="search-bar__input-wrapper">
          <Search size={14} className="search-bar__icon" />
          <input
            className="input search-bar__input"
            placeholder="Search knowledge base…"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            onKeyUp={(e) => e.key === "Enter" && doSearch()}
          />
        </div>
        <button onClick={doSearch} className="btn btn-ghost"><Search size={14} /> Search</button>
      </div>

      {error && (
        <div className="alert alert--warn" style={{ marginBottom: 16 }}>
          <AlertTriangle size={14} className="alert__icon" />
          <div>{error}. Make sure the Notion API key is configured and pages are shared with the integration.</div>
        </div>
      )}

      {loading ? (
        <Skeleton type="card" count={4} />
      ) : pages.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="📚"
            title="No pages found"
            sub="Share pages with your Notion integration to see them here."
          />
        </div>
      ) : (
        <div className="card notion-page-list" style={{ overflow: "hidden" }}>
          {pages.map((p) => (
            <div key={p.id} className="notion-page-item" onClick={() => openPage(p)}>
              <div className="notion-page-item__icon">{p.icon || "📄"}</div>
              <div className="notion-page-item__title">{p.title}</div>
              <div className="notion-page-item__date">{new Date(p.lastEdited).toLocaleDateString()}</div>
              <ChevronRight size={14} color="var(--muted-dim)" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
