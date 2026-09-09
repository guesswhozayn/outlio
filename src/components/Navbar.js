"use client";

import { useState, useRef, useEffect } from "react";
import { Mail, Settings, LogOut, Sun, Moon, CheckCircle2, ChevronDown } from "lucide-react";
import { signOut } from "next-auth/react";

export default function Navbar({ mounted, theme, setTheme, setSettingsOpen, session }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  const user = session?.user;
  const userInitial = user?.name
    ? user.name.charAt(0).toUpperCase()
    : user?.email
    ? user.email.charAt(0).toUpperCase()
    : "U";

  return (
    <header className="floating-nav">
      <div className="logo-section">
        <div className="nav-logo">
          <Mail size={18} className="nav-logo-icon" />
        </div>
        <div>
          <h1 className="nav-title">Outlio</h1>
        </div>
      </div>
      <div className="nav-actions">
        {mounted && (
          <button
            className="icon-btn"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            title="Toggle Theme"
            aria-label="Toggle Theme"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        )}
        <button
          className="icon-btn"
          onClick={() => setSettingsOpen(true)}
          title="Configuration Settings"
          aria-label="Configuration Settings"
        >
          <Settings size={18} />
        </button>

        {user && (
          <div ref={menuRef} style={{ position: "relative" }}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.25rem 0.65rem 0.25rem 0.35rem",
                borderRadius: "9999px",
                background: menuOpen ? "var(--hover-bg)" : "var(--bg-secondary)",
                border: "1px solid var(--glass-border)",
                cursor: "pointer",
                transition: "var(--transition)",
                color: "var(--text-primary)",
                outline: "none"
              }}
              title={`Linked Google Account: ${user.email}`}
              aria-expanded={menuOpen}
              aria-haspopup="true"
            >
              <div style={{ position: "relative", display: "inline-flex" }}>
                {user.image && !imgError ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.image}
                    alt={user.name || "Profile"}
                    onError={() => setImgError(true)}
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      display: "block"
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      background: "var(--bg-tertiary)",
                      border: "1px solid var(--glass-border)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      color: "var(--text-primary)"
                    }}
                  >
                    {userInitial}
                  </div>
                )}
                <span
                  style={{
                    position: "absolute",
                    bottom: "-1px",
                    right: "-1px",
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "#10b981",
                    boxShadow: "0 0 6px #10b981",
                    border: "1.5px solid var(--bg-primary)"
                  }}
                  title="Google Account Connected"
                />
              </div>

              <span
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 500,
                  maxWidth: "120px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  color: "var(--text-primary)"
                }}
              >
                {user.name || user.email?.split("@")[0]}
              </span>

              <ChevronDown
                size={13}
                style={{
                  color: "var(--text-muted)",
                  transform: menuOpen ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.15s ease"
                }}
              />
            </button>

            {menuOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  right: 0,
                  width: "260px",
                  background: "var(--bg-secondary)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  border: "1px solid var(--glass-border)",
                  borderRadius: "var(--radius-lg)",
                  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.4)",
                  padding: "0.85rem",
                  zIndex: 100
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
                  {user.image && !imgError ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.image}
                      alt={user.name || "Profile"}
                      style={{
                        width: "38px",
                        height: "38px",
                        borderRadius: "50%",
                        border: "1px solid var(--glass-border)"
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "38px",
                        height: "38px",
                        borderRadius: "50%",
                        background: "var(--bg-tertiary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "1px solid var(--glass-border)",
                        fontSize: "0.95rem",
                        fontWeight: 600
                      }}
                    >
                      {userInitial}
                    </div>
                  )}

                  <div style={{ overflow: "hidden" }}>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: "0.88rem",
                        color: "var(--text-primary)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                      }}
                    >
                      {user.name || "Google User"}
                    </div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--text-muted)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                      }}
                    >
                      {user.email}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    padding: "0.5rem 0.65rem",
                    borderRadius: "var(--radius-md)",
                    background: "rgba(16, 185, 129, 0.08)",
                    border: "1px solid rgba(16, 185, 129, 0.25)",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    marginBottom: "0.75rem"
                  }}
                >
                  <CheckCircle2 size={15} style={{ color: "#10b981", flexShrink: 0 }} />
                  <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", lineHeight: 1.3 }}>
                    <strong style={{ color: "#10b981", display: "block" }}>Google Account Linked</strong>
                    1-Click Gmail Sending active
                  </div>
                </div>

                <hr style={{ border: "none", borderTop: "1px solid var(--glass-border)", margin: "0.5rem 0" }} />

                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      setSettingsOpen(true);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.6rem",
                      width: "100%",
                      padding: "0.5rem 0.6rem",
                      background: "transparent",
                      border: "none",
                      borderRadius: "var(--radius-sm)",
                      color: "var(--text-primary)",
                      fontSize: "0.8rem",
                      cursor: "pointer",
                      textAlign: "left"
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--hover-bg)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <Settings size={15} style={{ color: "var(--text-secondary)" }} />
                    Configuration Settings
                  </button>

                  <button
                    onClick={() => signOut()}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.6rem",
                      width: "100%",
                      padding: "0.5rem 0.6rem",
                      background: "transparent",
                      border: "none",
                      borderRadius: "var(--radius-sm)",
                      color: "var(--accent-rose)",
                      fontSize: "0.8rem",
                      cursor: "pointer",
                      textAlign: "left"
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255, 0, 0, 0.08)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <LogOut size={15} style={{ color: "var(--accent-rose)" }} />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
