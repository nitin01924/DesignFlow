import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import UnderConstruction from "./pages/UnderConstruction.jsx";
import { Analytics } from "@vercel/analytics/react";

//
//  FUNCTION - APP
function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    const checkAuth = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Unauthorized");

        const data = await res.json();
        setUser(data.user);
      } catch (error) {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    checkAuth();
  }, [token]);

  const handleAuthSuccess = (nextToken) => {
    localStorage.setItem("token", nextToken);
    setToken(nextToken);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className={darkMode ? "dark min-h-screen" : "min-h-screen"}>
      {token && (
        <Navbar
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          onLogout={handleLogout}
        />
      )}

      <Routes>
        <Route path="/" element={<Login />} />

        <Route
          path="/register"
          element={<Register onAuthSuccess={handleAuthSuccess} />}
        />
        <Route
          path="/notes"
          element={token ? <Notes /> : <Navigate to="/" />}
        />
        <Route path="/under-construction" element={<UnderConstruction />} />
      </Routes>
      <ToastContainer position="top-right" autoClose={2000} />
       <Analytics />
    </div>
  );
}

export default App;
