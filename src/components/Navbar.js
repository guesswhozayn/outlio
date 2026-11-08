"use client";

import { Settings, Sun, Moon } from "lucide-react";
import OutlioLogo from "./OutlioLogo";

export default function Navbar({ mounted, theme, setTheme, setSettingsOpen, onReturnToLanding }) {
  return (
    <header className="floating-nav">
      <div
        className="logo-section"
        style={{ cursor: onReturnToLanding ? "pointer" : "default" }}
        onClick={onReturnToLanding}
        title={onReturnToLanding ? "Return to home page" : ""}
      >
        <OutlioLogo size={32} bg="#000000" shape="circle" />
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
      </div>
    </header>
  );
}
