"use client";

import { Mail, Settings, Sun, Moon, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export default function Navbar({ mounted, theme, setTheme, setSettingsOpen, session }) {
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
          onClick={() => setSettingsOpen(true)}
          title="Configuration Settings"
          aria-label="Configuration Settings"
        >
          <Settings size={18} />
        </button>

        {user && (
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
        )}
      </div>
    </header>
  );
}
