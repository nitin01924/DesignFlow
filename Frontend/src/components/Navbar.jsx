import { Link } from "react-router-dom";
import Button from "./Button";

function Navbar({ user, darkMode, setDarkMode, onLogout }) {
  return (
    <header className="border-b border-gray-200 bg-white transition-colors dark:border-slate-800 dark:bg-slate-950">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/dashboard" className="text-xl font-bold text-gray-900 dark:text-white">
          DesignFlow
        </Link>

        <div className="flex items-center gap-3">
          {user?.name && (
            <span className="hidden text-sm text-gray-600 dark:text-slate-300 sm:inline">
              {user.name}
            </span>
          )}
          <button
            type="button"
            onClick={() => setDarkMode((value) => !value)}
            aria-pressed={darkMode}
            aria-label={`Switch to ${darkMode ? "light" : "dark"} mode`}
            className="rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {darkMode ? "Light" : "Dark"}
          </button>
          <Button type="button" variant="secondary" onClick={onLogout}>
            Logout
          </Button>
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
