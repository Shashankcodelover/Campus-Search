import React, { useState, useEffect } from "react";
import { LayoutGrid, Inbox, Radio, Heart, BookOpen, User, ShieldCheck, Moon, Sun } from "lucide-react";
import { api, hasToken, clearToken, connectSSE } from "./api";
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
import { LandingPage } from "./pages/LandingPage";
import { ToastContainer } from "./components/notifications/ToastContainer";

export default function App() {
  const [authed, setAuthed] = useState(hasToken());
  const [tab, setTab] = useState("browse");
  const [requestListing, setRequestListing] = useState(null);
  const [paymentRequestId, setPaymentRequestId] = useState(null);
  const [listModal, setListModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadBreakdown, setUnreadBreakdown] = useState({});
  const [latestToast, setLatestToast] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem("cs_theme") || "dark");
  const [serverSleeping, setServerSleeping] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("cs_theme", theme);
  }, [theme]);

  useEffect(() => {
    const handleAuthError = () => {
      clearToken();
      setAuthed(false);
    };
    const handleSleeping = () => setServerSleeping(true);
    const handleAwake = () => setServerSleeping(false);

    window.addEventListener("auth_error", handleAuthError);
    window.addEventListener("server_sleeping", handleSleeping);
    window.addEventListener("server_awake", handleAwake);
    
    return () => {
      window.removeEventListener("auth_error", handleAuthError);
      window.removeEventListener("server_sleeping", handleSleeping);
      window.removeEventListener("server_awake", handleAwake);
    }
  }, []);

  // Real-time notification polling
  useEffect(() => {
    if (!authed) return;
    
    // Initial fetch
    api.getUnreadCount().then(res => {
      setUnreadCount(res.count);
      setUnreadBreakdown(res.breakdown || {});
    }).catch(console.error);

    const conn = connectSSE((event) => {
      if (event.type === "notification_count") {
        setUnreadCount(event.count);
        if (event.breakdown) setUnreadBreakdown(event.breakdown);
      } else if (event.type === "notification") {
        setLatestToast(event.notification);
      }
    });
    return () => conn?.close();
  }, [authed]);

  useEffect(() => {
    const handleOpenPayment = (e) => setPaymentRequestId(e.detail);
    window.addEventListener("open_payment", handleOpenPayment);
    return () => window.removeEventListener("open_payment", handleOpenPayment);
  }, []);

  const [showLanding, setShowLanding] = useState(!hasToken());

  if (!authed) {
    if (showLanding) {
      return <LandingPage onGetStarted={() => setShowLanding(false)} />;
    }
    return <AuthScreen onAuthed={() => setAuthed(true)} />;
  }

  const logout = () => { clearToken(); setAuthed(false); };
  const toggleTheme = () => setTheme(t => t === "dark" ? "light" : "dark");

  const tabs = [
    { id: "browse", label: "Browse", icon: <LayoutGrid size={14} /> },
    { 
      id: "inquiries", label: "Inquiries", icon: <Radio size={14} />,
      badge: (unreadBreakdown["inquiry_broadcast"] || 0) + (unreadBreakdown["inquiry_response"] || 0)
    },
    { 
      id: "inbox", label: "Requests", icon: <Inbox size={14} />,
      badge: (unreadBreakdown["new_request"] || 0) + (unreadBreakdown["request_accepted"] || 0) + (unreadBreakdown["new_message"] || 0)
    },
    { id: "wishlist", label: "Wanted / Alerts", icon: <Heart size={14} /> },
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
            <span className="desktop-only">{theme === "dark" ? "Light" : "Dark"}</span>
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

      {requestListing && <RequestModal listing={requestListing} onClose={() => setRequestListing(null)} onRefresh={() => setTab("inbox")} />}
      {paymentRequestId && <PaymentModal requestId={paymentRequestId} onClose={() => setPaymentRequestId(null)} onPaymentConfirmed={() => setTab("inbox")} />}
      {listModal && <ListItemModal onClose={() => setListModal(false)} onCreated={() => { setListModal(false); setTab("browse"); }} />}
      <ToastContainer event={latestToast} />
      
      {serverSleeping && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999,
          color: "white", flexDirection: "column", gap: 16
        }}>
          <div className="spinner" style={{ width: 40, height: 40, border: "4px solid rgba(255,255,255,0.3)", borderTop: "4px solid var(--signal)", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <div style={{ textAlign: "center", maxWidth: "400px" }}>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "18px" }}>Waking up the server...</h3>
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.8)", margin: 0 }}>
              Because this app is hosted on Render's free tier, the server goes to sleep after 15 minutes of inactivity. 
              It usually takes <b>~50 seconds</b> to boot back up. Please hang tight!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
