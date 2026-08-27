import React from "react";
import { Cpu, Bell, Plus, LogOut } from "lucide-react";
import { NotificationPanel } from "../notifications/NotificationPanel";

export function Navbar({ tabs, activeTab, setTab, unreadCount, showNotifications, setShowNotifications, onOpenListModal, onLogout, themeToggle }) {
  return (
    <>
      <nav className="navbar">
        <div className="navbar__inner">
          <div className="navbar__brand" onClick={() => setTab("browse")}>
            <div className="navbar__logo"><Cpu size={16} color="#060a08" /></div>
            <span className="navbar__title">CampusSearch</span>
            <span className="navbar__version">v2.0</span>
          </div>

          <div className="navbar__tabs">
            {tabs.map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`navbar__tab ${activeTab === t.id ? "navbar__tab--active" : ""}`}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          <div className="navbar__actions">
            {themeToggle}

            <div className="notification-bell" style={{ position: "relative" }}>
              <button className="btn-icon" onClick={() => setShowNotifications(!showNotifications)}>
                <Bell size={16} />
              </button>
              {unreadCount > 0 && (
                <div className="notification-bell__badge">{unreadCount > 9 ? "9+" : unreadCount}</div>
              )}
              {showNotifications && <NotificationPanel onClose={() => setShowNotifications(false)} />}
            </div>

            <button onClick={onOpenListModal} className="btn btn-primary" id="nav-list-btn">
              <Plus size={14} /> List
            </button>
            <button onClick={onLogout} className="btn-icon" title="Log out"><LogOut size={15} /></button>
          </div>
        </div>
      </nav>
    </>
  );
}
