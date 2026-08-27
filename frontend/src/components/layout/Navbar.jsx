import React, { useState } from "react";
import { Cpu, Bell, Globe, Plus, LogOut, Menu, X } from "lucide-react";
import { NotificationPanel } from "../notifications/NotificationPanel";

export function Navbar({ tabs, activeTab, setTab, unreadCount, showNotifications, setShowNotifications, onOpenListModal, onLogout, themeToggle }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
                className={`navbar__tab ${activeTab === t.id ? "navbar__tab--active" : ""}`}
                style={{ position: "relative" }}
              >
                {t.icon} {t.label}
                {t.badge > 0 && <span className="tab-badge">{t.badge > 9 ? "9+" : t.badge}</span>}
              </button>
            ))}
          </div>

          <div className="navbar__actions">
            <a href="http://shashankj.tech/" target="_blank" rel="noopener noreferrer" className="btn-icon desktop-only" title="Portfolio (shashankj.tech)"><Globe size={15} /></a>
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
            
            <button onClick={onLogout} className="btn-icon desktop-only" title="Log out"><LogOut size={15} /></button>

            {/* Mobile Menu Toggle */}
            <button className="btn-icon mobile-only" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Vertical Menu Overlay */}
      {mobileMenuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-menu-panel card" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-menu-header">
              <h3 style={{ fontSize: 16 }}>Menu</h3>
              <button className="btn-icon" onClick={() => setMobileMenuOpen(false)}><X size={18} /></button>
            </div>
            <div className="mobile-menu-content">
              {tabs.map((t) => (
                <button 
                  key={t.id} 
                  className={`mobile-menu-item ${activeTab === t.id ? "mobile-menu-item--active" : ""}`}
                  onClick={() => { setTab(t.id); setMobileMenuOpen(false); }}
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <div>
                    <span style={{ marginRight: 12, color: "var(--signal)" }}>{t.icon}</span> 
                    {t.label}
                  </div>
                  {t.badge > 0 && <span className="tab-badge" style={{ position: "static", transform: "none" }}>{t.badge > 9 ? "9+" : t.badge}</span>}
                </button>
              ))}
            </div>
            <div style={{ padding: 16, borderTop: "1px solid var(--trace)" }}>
              <button onClick={() => { onLogout(); setMobileMenuOpen(false); }} className="btn btn-ghost" style={{ width: "100%", justifyContent: "flex-start", color: "var(--red)" }}>
                <LogOut size={16} style={{ marginRight: 12 }} /> Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
