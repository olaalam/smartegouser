import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Toaster } from "sonner";
import LoginPage          from "./pages/LoginPage";
import DashboardPage      from "./pages/DashboardPage";
import OrderPage          from "./pages/OrderPage";
import ProfilePage        from "./pages/ProfilePage";
import WhatsAppPage       from "./pages/WhatsAppWizard";
import DirectWhatsAppPage from "./pages/directWhats";
import MessengerChatPage  from "./pages/MessengerChatPage";
import WhatsAppChatPage   from "./pages/WhatsAppChatPage";
import InstagramChatPage from "./pages/InstagramChatPage";
import InstagramSubscriptionPage from "./pages/InstagramSubscriptionPage";
import ConnectManagerPage from "./pages/ConnectManagerPage";
import FacebookPagesPage from "./pages/FacebookPagesPage";
import FacebookPageManagePage from "./pages/FacebookPageManagePage";
import InstagramPageManagePage from "./pages/InstagramPageManagePage";
import AppLayout from "./components/layout/AppLayout";
import UserOrdersPage from "./pages/UserOrdersPage";
import ChatsPage from "./pages/ChatsPage";
import PaymentResultPage from "./pages/PaymentResultPage";

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
          element={<PrivateRoute><AppLayout><DashboardPage /></AppLayout></PrivateRoute>}
        />

        <Route
          path="/connect"
          element={<PrivateRoute><AppLayout><ConnectManagerPage /></AppLayout></PrivateRoute>}
        />

        <Route
          path="/connect-manager"
          element={<PrivateRoute><AppLayout><ConnectManagerPage /></AppLayout></PrivateRoute>}
        />

        <Route
          path="/order"
          element={<PrivateRoute><AppLayout><OrderPage /></AppLayout></PrivateRoute>}
        />

        <Route
          path="/user-orders"
          element={<PrivateRoute><AppLayout><UserOrdersPage /></AppLayout></PrivateRoute>}
        />

        <Route
          path="/fb-pages"
          element={<PrivateRoute><AppLayout><FacebookPagesPage /></AppLayout></PrivateRoute>}
        />

        <Route
          path="/fb-pages/:pageId/manage"
          element={<PrivateRoute><AppLayout><FacebookPageManagePage /></AppLayout></PrivateRoute>}
        />

        <Route
          path="/instagram-pages/:instagramId/manage"
          element={<PrivateRoute><AppLayout><InstagramPageManagePage /></AppLayout></PrivateRoute>}
        />

        <Route
          path="/profile"
          element={<PrivateRoute><AppLayout><ProfilePage /></AppLayout></PrivateRoute>}
        />

        <Route
          path="/whatsapp"
          element={<PrivateRoute><AppLayout><WhatsAppPage /></AppLayout></PrivateRoute>}
        />

        <Route
          path="/direct-whatsapp"
          element={<PrivateRoute><AppLayout><DirectWhatsAppPage /></AppLayout></PrivateRoute>}
        />

        <Route
          path="/chats"
          element={<PrivateRoute><AppLayout><ChatsPage /></AppLayout></PrivateRoute>}
        />

        <Route
          path="/messenger-chat"
          element={<PrivateRoute><AppLayout><MessengerChatPage /></AppLayout></PrivateRoute>}
        />

        <Route
          path="/whatsapp-chat"
          element={<PrivateRoute><AppLayout><WhatsAppChatPage /></AppLayout></PrivateRoute>}
        />

        <Route
          path="/instagram-chat"
          element={<PrivateRoute><AppLayout><InstagramChatPage /></AppLayout></PrivateRoute>}
        />

        <Route
          path="/instagram-subscription"
          element={<PrivateRoute><AppLayout><InstagramSubscriptionPage /></AppLayout></PrivateRoute>}
        />
        <Route path="/payment/result" element={<PaymentResultPage />} />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
