import React, { useState, useEffect } from "react";
import { LayoutGrid, Inbox, Heart, BookOpen, User, ShieldCheck } from "lucide-react";
import { hasToken, clearToken, connectSSE } from "./api";
import { Navbar } from "./components/layout/Navbar";
import { AuthScreen } from "./components/modals/AuthScreen";
import { RequestModal } from "./components/modals/RequestModal";
import { ListItemModal } from "./components/modals/ListItemModal";
import { BrowsePage } from "./pages/BrowsePage";
import { SellerInbox } from "./pages/SellerInbox";
import { WishlistBoard } from "./pages/WishlistBoard";
import { NotionHub } from "./pages/NotionHub";
import { ProfilePage } from "./pages/ProfilePage";
import { AdminPanel } from "./pages/AdminPanel";

export default function App() {
  const [authed, setAuthed] = useState(hasToken());
  const [tab, setTab] = useState("browse");
  const [requestListing, setRequestListing] = useState(null);
  const [listModal, setListModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Real-time notification count polling
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

  const tabs = [
    { id: "browse", label: "Browse", icon: <LayoutGrid size={14} /> },
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
      />

      <div className="container page-content">
        {tab === "browse" && <BrowsePage onRequestListing={setRequestListing} />}
        {tab === "inbox" && <SellerInbox />}
        {tab === "wishlist" && <WishlistBoard />}
        {tab === "notion" && <NotionHub />}
        {tab === "profile" && <ProfilePage />}
        {tab === "admin" && <AdminPanel />}
      </div>

      {requestListing && <RequestModal listing={requestListing} onClose={() => setRequestListing(null)} onRefresh={() => setTab("browse")} />}
      {listModal && <ListItemModal onClose={() => setListModal(false)} onCreated={() => { setListModal(false); setTab("browse"); }} />}
    </div>
  );
}
