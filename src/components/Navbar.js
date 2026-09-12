"use client";

import { Mail, Settings, Sun, Moon, LogOut, HelpCircle, LogIn } from "lucide-react";
import { signOut, signIn } from "next-auth/react";

export default function Navbar({ mounted, theme, setTheme, setSettingsOpen, setHelpOpen, session }) {
  const user = session?.user;

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
          onClick={() => setHelpOpen(true)}
          title="How to Use Outlio"
          aria-label="How to Use Outlio"
        >
          <HelpCircle size={18} />
        </button>

        <button
          className="icon-btn"
          onClick={() => setSettingsOpen(true)}
          title="Configuration Settings"
          aria-label="Configuration Settings"
        >
          <Settings size={18} />
        </button>

        {user ? (
          <button
            className="icon-btn"
            onClick={() => signOut({ callbackUrl: "/" })}
            title={`Sign Out (${user.email || 'User'})`}
            aria-label="Sign Out"
            style={{
              color: "var(--accent-rose)",
            }}
          >
            <LogOut size={18} />
          </button>
        ) : (
          <button
            className="btn btn-primary"
            onClick={() => signIn("google")}
            style={{
              padding: "0.35rem 0.75rem",
              fontSize: "0.825rem",
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              borderRadius: "var(--radius-sm)",
            }}
          >
            <LogIn size={15} />
            <span>Sign In</span>
          </button>
        )}
      </div>
    </header>
  );
}
