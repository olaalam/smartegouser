import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Toaster } from "sonner";
import LoginPage     from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import OrderPage     from "./pages/OrderPage";
import ProfilePage   from "./pages/ProfilePage";
import WhatsAppPage  from "./pages/WhatsAppWizard";

// ─── Route guards ─────────────────────────────────────────────────────────────

function PrivateRoute({ children }) {
  const isAuthenticated = useSelector((s) => s.auth.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const isAuthenticated = useSelector((s) => s.auth.isAuthenticated);
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        richColors
        toastOptions={{ style: { fontFamily: "var(--font-sans, sans-serif)" } }}
      />

      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />

        <Route
          path="/login"
          element={<PublicRoute><LoginPage /></PublicRoute>}
        />

        <Route
          path="/dashboard"
          element={<PrivateRoute><DashboardPage /></PrivateRoute>}
        />

        <Route
          path="/order"
          element={<PrivateRoute><OrderPage /></PrivateRoute>}
        />

        <Route
          path="/profile"
          element={<PrivateRoute><ProfilePage /></PrivateRoute>}
        />

        <Route
          path="/whatsapp"
          element={<PrivateRoute><WhatsAppPage /></PrivateRoute>}
        />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
