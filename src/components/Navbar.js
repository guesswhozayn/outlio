import { Mail, Settings, LogOut, Sun, Moon } from "lucide-react";
import { signOut } from "next-auth/react";

export default function Navbar({ mounted, theme, setTheme, setSettingsOpen }) {
  return (
    <header className="floating-nav">
      <div className="logo-section">
        <div className="nav-logo">
          <Mail size={18} className="nav-logo-icon" />
        </div>
        <div>
          <h1 className="nav-title">AutoMailer</h1>
        </div>
      </div>
      <div className="nav-actions">
        {mounted && (
          <button
            className="icon-btn"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            title="Toggle Theme"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        )}
        <button className="icon-btn" onClick={() => setSettingsOpen(true)} title="Settings">
          <Settings size={18} />
        </button>
        <button className="icon-btn" onClick={() => signOut()} title="Sign Out">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
