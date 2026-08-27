import React, { useState, useEffect } from "react";
import { LayoutGrid, Inbox, Radio, Heart, BookOpen, User, ShieldCheck, Moon, Sun } from "lucide-react";
import { hasToken, clearToken, connectSSE } from "./api";
import { Navbar } from "./components/layout/Navbar";
import { AuthScreen } from "./components/modals/AuthScreen";
import { RequestModal } from "./components/modals/RequestModal";
import { ListItemModal } from "./components/modals/ListItemModal";
import { PaymentModal } from "./components/modals/PaymentModal";
import { BrowsePage } from "./pages/BrowsePage";
import { SellerInbox } from "./pages/SellerInbox";
import { InquiriesPage } from "./pages/InquiriesPage";
import { WishlistBoard } from "./pages/WishlistBoard";
import { NotionHub } from "./pages/NotionHub";
import { ProfilePage } from "./pages/ProfilePage";
import { AdminPanel } from "./pages/AdminPanel";

export default function App() {
  const [authed, setAuthed] = useState(hasToken());
  const [tab, setTab] = useState("browse");
  const [requestListing, setRequestListing] = useState(null);
  const [paymentRequestId, setPaymentRequestId] = useState(null);
  const [listModal, setListModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [theme, setTheme] = useState(localStorage.getItem("cs_theme") || "dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("cs_theme", theme);
  }, [theme]);

  // Real-time notification polling
  useEffect(() => {
    if (!authed) return;
    const conn = connectSSE((event) => {
      if (event.type === "notification_count") {
        setUnreadCount(event.count);
      }
    });
    return () => conn?.close();
  }, [authed]);

  if (!authed) return <AuthScreen onAuthed={() => setAuthed(true)} />;

  const logout = () => { clearToken(); setAuthed(false); };
  const toggleTheme = () => setTheme(t => t === "dark" ? "light" : "dark");

  const tabs = [
    { id: "browse", label: "Browse", icon: <LayoutGrid size={14} /> },
    { id: "inquiries", label: "Inquiries", icon: <Radio size={14} /> },
    { id: "inbox", label: "Requests", icon: <Inbox size={14} /> },
    { id: "wishlist", label: "Wanted", icon: <Heart size={14} /> },
    { id: "notion", label: "Docs", icon: <BookOpen size={14} /> },
    { id: "profile", label: "Profile", icon: <User size={14} /> },
    { id: "admin", label: "Admin", icon: <ShieldCheck size={14} /> },
  ];

  return (
    <div className="page-wrapper">
      <Navbar
        tabs={tabs}
        activeTab={tab}
        setTab={setTab}
        unreadCount={unreadCount}
        showNotifications={showNotifications}
        setShowNotifications={setShowNotifications}
        onOpenListModal={() => setListModal(true)}
        onLogout={logout}
        themeToggle={
          <button className="theme-toggle-btn" onClick={toggleTheme} title="Toggle Light/Dark Theme">
            {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
            <span>{theme === "dark" ? "Light" : "Dark"}</span>
          </button>
        }
      />

      <div className="container page-content">
        {tab === "browse" && <BrowsePage onRequestListing={setRequestListing} />}
        {tab === "inquiries" && <InquiriesPage />}
        {tab === "inbox" && <SellerInbox onOpenPayment={setPaymentRequestId} />}
        {tab === "wishlist" && <WishlistBoard />}
        {tab === "notion" && <NotionHub />}
        {tab === "profile" && <ProfilePage />}
        {tab === "admin" && <AdminPanel />}
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="navbar__tabs--mobile">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`navbar__tab ${tab === t.id ? "navbar__tab--active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {requestListing && <RequestModal listing={requestListing} onClose={() => setRequestListing(null)} onRefresh={() => setTab("inbox")} />}
      {paymentRequestId && <PaymentModal requestId={paymentRequestId} onClose={() => setPaymentRequestId(null)} onPaymentConfirmed={() => setTab("inbox")} />}
      {listModal && <ListItemModal onClose={() => setListModal(false)} onCreated={() => { setListModal(false); setTab("browse"); }} />}
    </div>
  );
}
