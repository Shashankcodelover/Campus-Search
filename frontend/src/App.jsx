import React, { useState, useEffect, useCallback } from "react";
import { Search, Plus, ShieldAlert, CheckCircle2, Radio, X, ChevronRight, Cpu, LayoutGrid, ShieldCheck, AlertTriangle, Phone, Trash2, Inbox, LogOut } from "lucide-react";
import { api, setToken, clearToken, hasToken } from "./api";

const CATEGORIES = ["Microcontrollers", "Sensors", "Motors & Actuators", "Power & Wiring", "Passive Components", "Full Kits", "Tools"];

function StatusDot({ status }) {
  const map = {
    available: { color: "#6EE7A0", label: "Available" },
    pending: { color: "#F0A93B", label: "Pending" },
    claimed: { color: "#E2665F", label: "Claimed" },
    expired: { color: "#63756A", label: "Expired" },
  };
  const s = map[status] || map.available;
  return (
    <span className="mono" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, color: s.color, textTransform: "uppercase" }}>
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: s.color, boxShadow: `0 0 6px ${s.color}` }} />
      {s.label}
    </span>
  );
}

function Badge({ children, tone = "muted" }) {
  const tones = {
    muted: { bg: "#1C2921", color: "#8FA298", border: "#26362C" },
    green: { bg: "rgba(110,231,160,0.1)", color: "#6EE7A0", border: "rgba(110,231,160,0.35)" },
    amber: { bg: "rgba(240,169,59,0.1)", color: "#F0A93B", border: "rgba(240,169,59,0.35)" },
    red: { bg: "rgba(226,102,95,0.1)", color: "#E2665F", border: "rgba(226,102,95,0.35)" },
  };
  const t = tones[tone];
  return (
    <span className="mono" style={{ padding: "3px 7px", borderRadius: 4, background: t.bg, color: t.color, border: `1px solid ${t.border}`, fontSize: 10.5, textTransform: "uppercase" }}>
      {children}
    </span>
  );
}

/* ---------------- Auth screen ---------------- */
function AuthScreen({ onAuthed }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", phone: "", department: "", year: "", password: "" });
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setError("");
    try {
      const res = mode === "login" ? await api.login({ email: form.email, password: form.password }) : await api.register(form);
      setToken(res.token);
      onAuthed();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div className="card" style={{ width: "100%", maxWidth: 380, padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 18 }}>
          <div style={{ width: 26, height: 26, borderRadius: 6, background: "#6EE7A0", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Cpu size={15} color="#0D1310" />
          </div>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 16 }}>CampusSearch</span>
        </div>
        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          <button onClick={() => setMode("login")} className="btn" style={{ flex: 1, justifyContent: "center", background: mode === "login" ? "#1C2921" : "transparent", color: mode === "login" ? "#6EE7A0" : "#8FA298", border: "1px solid #26362C" }}>Log in</button>
          <button onClick={() => setMode("register")} className="btn" style={{ flex: 1, justifyContent: "center", background: mode === "register" ? "#1C2921" : "transparent", color: mode === "register" ? "#6EE7A0" : "#8FA298", border: "1px solid #26362C" }}>Register</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {mode === "register" && (
            <>
              <input className="input" placeholder="Full name" value={form.name} onChange={set("name")} />
              <input className="input" placeholder="Phone" value={form.phone} onChange={set("phone")} />
              <input className="input" placeholder="Department" value={form.department} onChange={set("department")} />
              <input className="input" placeholder="Year (e.g. 1st yr)" value={form.year} onChange={set("year")} />
            </>
          )}
          <input className="input" placeholder="Campus email (name@college.edu)" value={form.email} onChange={set("email")} />
          <input className="input" type="password" placeholder="Password" value={form.password} onChange={set("password")} />
        </div>

        {error && <div style={{ color: "#E2665F", fontSize: 12.5, marginTop: 10 }}>{error}</div>}

        <button onClick={submit} className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 16 }}>
          {mode === "login" ? "Log in" : "Create account"}
        </button>

        <div style={{ fontSize: 11.5, color: "#63756A", marginTop: 12 }}>
          Registration is restricted to the campus email domain — this is what stands in for identity verification in v1.
        </div>
      </div>
    </div>
  );
}

/* ---------------- Request modal — real accept/decline flow ---------------- */
function RequestModal({ listing, onClose, onRefresh }) {
  const [request, setRequest] = useState(null);
  const [contact, setContact] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const r = await api.createRequest(listing.id);
        setRequest(r);
      } catch (e) {
        setError(e.message);
      }
    })();
  }, [listing.id]);

  useEffect(() => {
    if (!request) return;
    const poll = setInterval(async () => {
      try {
        const { asBuyer } = await api.myRequests();
        const mine = asBuyer.find((r) => r.id === request.id);
        if (mine && mine.status !== request.status) {
          setRequest(mine);
          if (mine.status === "accepted") {
            const c = await api.getContact(mine.id);
            setContact(c);
          }
        }
      } catch (e) {}
    }, 3000);
    return () => clearInterval(poll);
  }, [request]);

  const close = () => {
    onRefresh();
    onClose();
  };

  return (
    <div style={overlayStyle} onClick={close}>
      <div className="card" style={{ maxWidth: 420, width: "100%", padding: 22, position: "relative" }} onClick={(e) => e.stopPropagation()}>
        <button onClick={close} style={closeBtnStyle}><X size={16} /></button>
        <div className="mono" style={{ fontSize: 11, color: "#8FA298", marginBottom: 6 }}>REQUEST · {listing.id?.slice(0, 8) || listing.id}</div>
        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 19, margin: "0 0 18px" }}>{listing.item_name}</h3>

        {error && <div style={{ color: "#E2665F", fontSize: 13 }}>{error}</div>}

        {!error && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <StepRow done icon={<Radio size={15} />} label="Seller notified" sub="No payment or contact shared yet" />
            <StepRow
              done={request?.status === "accepted"}
              active={request?.status === "notified"}
              icon={<CheckCircle2 size={15} />}
              label={request?.status === "accepted" ? "Seller accepted" : request?.status === "declined" ? "Seller declined" : "Waiting for seller response"}
              sub={request?.status === "accepted" ? `Committed to ${request.delivery_day}` : request?.status === "declined" ? "Try another seller with this item" : "Usually responds within 2 hours"}
            />
            <StepRow done={!!contact} active={request?.status === "accepted" && !contact} icon={<Phone size={15} />} label="Contact revealed" sub={contact ? "Coordinate pickup directly" : "Unlocks once accepted"} />
          </div>
        )}

        {contact && (
          <div style={{ marginTop: 18, padding: 14, borderRadius: 8, background: "#111A15", border: "1px solid #26362C" }}>
            <div className="mono" style={{ fontSize: 11, color: "#8FA298", marginBottom: 6 }}>SELLER CONTACT</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{contact.name} · {contact.department}</div>
                <div className="mono" style={{ color: "#6EE7A0", fontSize: 15, marginTop: 2 }}>+91 {contact.phone}</div>
              </div>
              <a href={`tel:${contact.phone}`} className="btn btn-primary" style={{ padding: "8px 14px", fontSize: 12.5 }}>Call</a>
            </div>
            <div style={{ marginTop: 12, fontSize: 11.5, color: "#8FA298", display: "flex", gap: 6 }}>
              <ShieldAlert size={13} style={{ marginTop: 1, flexShrink: 0, color: "#F0A93B" }} />
              Pay only after you receive and check the item.
            </div>
            <button
              onClick={async () => {
                await api.confirmDelivered(request.id);
                close();
              }}
              className="btn btn-ghost"
              style={{ width: "100%", justifyContent: "center", marginTop: 12 }}
            >
              I've received the item
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function StepRow({ active, done, icon, label, sub }) {
  const color = done ? "#6EE7A0" : active ? "#F0A93B" : "#4A5A50";
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
      <div style={{ width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: done ? "rgba(110,231,160,0.12)" : active ? "rgba(240,169,59,0.12)" : "#1C2921", color, flexShrink: 0, border: `1px solid ${color}` }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 13.5, fontWeight: 500 }}>{label}</div>
        <div style={{ fontSize: 11.5, color: "#8FA298", marginTop: 1 }}>{sub}</div>
      </div>
    </div>
  );
}

/* ---------------- List item modal ---------------- */
function ListItemModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ item_name: "", category: CATEGORIES[0], condition_notes: "", price: "", listing_type: "sale" });
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const valid = form.item_name && form.condition_notes;

  const submit = async () => {
    try {
      await api.createListing({ ...form, price: Number(form.price) || 0 });
      onCreated();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div className="card" style={{ maxWidth: 440, width: "100%", padding: 22, position: "relative" }} onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} style={closeBtnStyle}><X size={16} /></button>
        <h3 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 19, margin: "0 0 18px" }}>List a component</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input className="input" placeholder="Item name" value={form.item_name} onChange={set("item_name")} />
          <div style={{ display: "flex", gap: 10 }}>
            <select className="input" value={form.category} onChange={set("category")}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <input className="input" style={{ width: 100 }} type="number" placeholder="Price ₹" value={form.price} onChange={set("price")} />
          </div>
          <input className="input" placeholder="Condition (e.g. Working, minor wear)" value={form.condition_notes} onChange={set("condition_notes")} />
        </div>
        {error && <div style={{ color: "#E2665F", fontSize: 12.5, marginTop: 10 }}>{error}</div>}
        <button disabled={!valid} onClick={submit} className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 16 }}>
          Publish listing
        </button>
      </div>
    </div>
  );
}

/* ---------------- Seller inbox — respond to requests ---------------- */
function SellerInbox() {
  const [requests, setRequests] = useState([]);
  const load = useCallback(async () => {
    const { asSeller } = await api.myRequests();
    setRequests(asSeller.filter((r) => r.status === "notified"));
  }, []);
  useEffect(() => {
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [load]);

  const respond = async (id, decision) => {
    const delivery_day = decision === "accept" ? prompt("What day can you deliver? (e.g. Wednesday)") : null;
    if (decision === "accept" && !delivery_day) return;
    await api.respondToRequest(id, decision, delivery_day);
    load();
  };

  if (requests.length === 0) {
    return <div style={{ padding: 24, textAlign: "center", color: "#8FA298", fontSize: 13 }}>No pending requests on your listings.</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {requests.map((r) => (
        <div key={r.id} className="card" style={{ padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 500 }}>{r.item_name}</div>
            <div style={{ fontSize: 11.5, color: "#8FA298" }}>Requested {new Date(r.created_at).toLocaleString()}</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => respond(r.id, "accept")} className="btn btn-primary" style={{ padding: "7px 12px", fontSize: 12 }}>Accept</button>
            <button onClick={() => respond(r.id, "decline")} className="btn btn-ghost" style={{ padding: "7px 12px", fontSize: 12 }}>Decline</button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Admin panel ---------------- */
function AdminPanel() {
  const [stats, setStats] = useState({});
  const [flags, setFlags] = useState([]);

  const load = useCallback(async () => {
    const [s, f] = await Promise.all([api.adminStats(), api.adminFlags()]);
    setStats(s);
    setFlags(f);
  }, []);
  useEffect(() => { load(); }, [load]);

  const resolve = async (id, action) => {
    await api.resolveFlag(id, action);
    load();
  };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px,1fr))", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Active listings", value: stats.active ?? "—", color: "#6EE7A0" },
          { label: "Pending requests", value: stats.pending ?? "—", color: "#F0A93B" },
          { label: "Flagged for review", value: stats.openFlags ?? "—", color: "#E2665F" },
          { label: "Verified sellers", value: `${stats.verifiedPct ?? "—"}%`, color: "#E9F1EC" },
        ].map((s) => (
          <div key={s.label} className="card" style={{ padding: 16 }}>
            <div className="mono" style={{ fontSize: 24, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11.5, color: "#8FA298", marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <ShieldAlert size={15} color="#E2665F" />
        <h4 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 15, margin: 0 }}>Moderation queue</h4>
      </div>

      {flags.length === 0 ? (
        <div style={{ padding: 24, textAlign: "center", color: "#8FA298", fontSize: 13, border: "1px dashed #26362C", borderRadius: 10 }}>Queue is clear.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {flags.map((f) => (
            <div key={f.id} className="card" style={{ padding: 14, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div>
                <Badge tone={f.severity === "high" ? "red" : "amber"}>{f.severity} risk</Badge>
                <div style={{ fontSize: 13.5, marginTop: 6 }}>{f.item_name}</div>
                <div style={{ fontSize: 12, color: "#8FA298", marginTop: 2 }}>{f.reason}</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => resolve(f.id, "remove")} className="btn" style={{ background: "#E2665F", color: "#fff", padding: "7px 12px", fontSize: 12 }}><Trash2 size={13} /> Remove</button>
                <button onClick={() => resolve(f.id, "clear")} className="btn btn-ghost" style={{ padding: "7px 12px", fontSize: 12 }}>Clear</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 24, padding: 14, borderRadius: 10, background: "rgba(240,169,59,0.06)", border: "1px solid rgba(240,169,59,0.25)", fontSize: 12.5, color: "#C9B98A", display: "flex", gap: 10 }}>
        <AlertTriangle size={15} color="#F0A93B" style={{ flexShrink: 0, marginTop: 1 }} />
        <div>Internship/job postings are admin-verified only. Never pay to confirm a placement.</div>
      </div>
    </div>
  );
}

const overlayStyle = { position: "fixed", inset: 0, background: "rgba(6,10,8,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 };
const closeBtnStyle = { position: "absolute", top: 14, right: 14, background: "none", border: "none", color: "#8FA298", cursor: "pointer" };

/* ---------------- Main app ---------------- */
export default function App() {
  const [authed, setAuthed] = useState(hasToken());
  const [tab, setTab] = useState("browse");
  const [listings, setListings] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [requestListing, setRequestListing] = useState(null);
  const [listModal, setListModal] = useState(false);

  const loadListings = useCallback(async () => {
    try {
      const data = await api.getListings({ search, category });
      setListings(data);
    } catch (e) {}
  }, [search, category]);

  useEffect(() => { if (authed) loadListings(); }, [authed, loadListings]);

  if (!authed) return <AuthScreen onAuthed={() => setAuthed(true)} />;

  const logout = () => { clearToken(); setAuthed(false); };

  return (
    <div style={{ minHeight: "100vh" }}>
      <div style={{ borderBottom: "1px solid #26362C", position: "sticky", top: 0, background: "rgba(13,19,16,0.9)", backdropFilter: "blur(8px)", zIndex: 40 }}>
        <div className="container" style={{ padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ width: 26, height: 26, borderRadius: 6, background: "#6EE7A0", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Cpu size={15} color="#0D1310" />
            </div>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 15.5 }}>CampusSearch</span>
          </div>
          <div className="nav-tabs" style={{ display: "flex", gap: 4, background: "#151F1A", border: "1px solid #26362C", borderRadius: 8, padding: 3 }}>
            {[
              { id: "browse", label: "Browse", icon: <LayoutGrid size={13} /> },
              { id: "inbox", label: "My requests", icon: <Inbox size={13} /> },
              { id: "admin", label: "Admin", icon: <ShieldCheck size={13} /> },
            ].map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)} className="btn" style={{ background: tab === t.id ? "#1C2921" : "transparent", color: tab === t.id ? "#6EE7A0" : "#8FA298", padding: "6px 12px", fontSize: 12.5 }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setListModal(true)} className="btn btn-primary"><Plus size={14} /> List</button>
            <button onClick={logout} className="btn btn-ghost"><LogOut size={14} /></button>
          </div>
        </div>
      </div>

      {tab === "browse" && (
        <div className="container" style={{ padding: "32px 20px 80px" }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
              <Search size={14} color="#63756A" style={{ position: "absolute", left: 11, top: 11 }} />
              <input className="input" style={{ paddingLeft: 32 }} placeholder="Search components…" value={search} onChange={(e) => setSearch(e.target.value)} onKeyUp={loadListings} />
            </div>
            <select className="input" style={{ width: "auto" }} value={category} onChange={(e) => { setCategory(e.target.value); }}>
              <option>All</option>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <button onClick={loadListings} className="btn btn-ghost">Search</button>
          </div>

          <div className="card" style={{ overflow: "hidden" }}>
            {listings.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: "#63756A", fontSize: 13 }}>No components match yet.</div>
            ) : (
              listings.map((l) => (
                <div key={l.id} className="listing-row">
                  <span className="mono row-id" style={{ fontSize: 11.5, color: "#6EE7A0" }}>{l.id.slice(0, 6)}</span>
                  <div className="row-main">
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 14, fontWeight: 500 }}>{l.item_name}</span>
                      {l.seller_verified ? <Badge tone="green">Verified</Badge> : null}
                    </div>
                    <div style={{ fontSize: 12, color: "#8FA298", marginTop: 3 }}>{l.condition_notes} · {l.seller_name}, {l.seller_department}</div>
                  </div>
                  <span className="mono row-price" style={{ fontSize: 14, justifySelf: "end" }}>{l.price === 0 ? "Free" : `₹${l.price}`}</span>
                  <span className="row-status" style={{ justifySelf: "end" }}><StatusDot status={l.status} /></span>
                  <span className="row-action" style={{ justifySelf: "end" }}>
                    <button disabled={l.status !== "available"} onClick={() => setRequestListing(l)} className="btn btn-ghost" style={{ padding: "7px 12px", fontSize: 12 }}>
                      {l.status === "available" ? "Request" : l.status}
                    </button>
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {tab === "inbox" && (
        <div className="container" style={{ padding: "32px 20px 80px" }}>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, marginBottom: 16 }}>Requests on your listings</h2>
          <SellerInbox />
        </div>
      )}

      {tab === "admin" && (
        <div className="container" style={{ padding: "32px 20px 80px" }}>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, marginBottom: 16 }}>Moderation & trust</h2>
          <AdminPanel />
        </div>
      )}

      {requestListing && <RequestModal listing={requestListing} onClose={() => setRequestListing(null)} onRefresh={loadListings} />}
      {listModal && <ListItemModal onClose={() => setListModal(false)} onCreated={() => { setListModal(false); loadListings(); }} />}
    </div>
  );
}
