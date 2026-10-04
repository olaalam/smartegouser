import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Link2 } from "lucide-react";
import { toast } from "sonner";
import axiosInstance from "../api/axiosInstance";
import { setAuth, saveAuthToStorage } from "../redux/slices/authSlice";
import { API_ENDPOINTS } from "../utils/constants";
import { isChannelConnected, saveChannelConnection } from "../utils/channelConnections";

// App ID الخاص بفيسبوك
const FB_APP_ID = import.meta.env.VITE_FB_APP_ID || "1522838669646043";
const FACEBOOK_AUTH_URL = `https://bcknd.smartego.org/api/${API_ENDPOINTS.AUTH.FACEBOOK}`;

// شعار فيسبوك الرسمي (SVG)
const FacebookIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

// شعار واتساب الرسمي (SVG)
const WhatsappIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99 0-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
  </svg>
);

const COPY = {
  en: {
    title: "Connect accounts",
    subtitle: "Connect your messaging channels and manage their inboxes from one place.",
    available: "Available connections",
    whatsappDescription: "Link a WhatsApp Business number and reply to customers.",
    messengerDescription: "Connect a Facebook page to manage Messenger conversations.",
    whatsappConnect: "Set up WhatsApp",
    facebookConnect: "Connect by FB",
    manage: "Manage",
    connecting: "Connecting...",
    allChannels: "Messaging channels",
    channelCount: "2 channels",
    facebookType: "MESSAGING CHANNEL",
    whatsappType: "BUSINESS CHANNEL",
    connectHint: "Not connected",
    connectedHint: "Connected",
    facebookConnectFailed: "Could not connect Facebook. Please try again.",
  },
  ar: {
    title: "ربط الحسابات",
    subtitle: "اربطي قنوات المراسلة وأديري محادثاتها من مكان واحد.",
    available: "القنوات المتاحة",
    whatsappDescription: "اربطي رقم WhatsApp Business للرد على العملاء.",
    messengerDescription: "اربطي صفحة فيسبوك لإدارة محادثات Messenger.",
    whatsappConnect: "إعداد WhatsApp",
    facebookConnect: "ربط باستخدام FB",
    manage: "إدارة",
    connecting: "جاري الربط...",
    allChannels: "قنوات المراسلة",
    channelCount: "قناتان",
    facebookType: "قناة مراسلة",
    whatsappType: "قناة أعمال",
    connectHint: "غير متصلة",
    connectedHint: "متصلة",
    facebookConnectFailed: "تعذر ربط Facebook. حاولي مرة أخرى.",
  },
};

function ConnectionCard({ icon: Icon, title, type, description, accent, onConnect, connectLabel, loading, connectHint }) {
  return (
    <article className="group flex h-full min-w-0 flex-col rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 transition-colors hover:border-[var(--primary)]/40">
      <div className="flex items-start gap-4">
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--background)]"
          >
            <Icon className="h-5 w-5" style={{ color: accent }} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1 pt-0.5">
            <p className="text-[10px] font-semibold text-[var(--muted-foreground)]">{type}</p>
            <h2 className="mt-1 text-base font-semibold text-[var(--foreground)]">{title}</h2>
          </div>
      </div>
      <p className="mt-4 min-h-10 text-sm leading-5 text-[var(--muted-foreground)]">{description}</p>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-4">
        <span className="text-xs text-[var(--muted-foreground)]">{connectHint}</span>
        <button
          type="button"
          onClick={onConnect}
          disabled={loading}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          style={{ backgroundColor: accent }}
        >
          <Link2 className="h-4 w-4" aria-hidden="true" />
          {connectLabel}
        </button>
      </div>
    </article>
  );
}

export default function ConnectManagerPage() {
  const lang = useSelector((state) => state.ui.lang);
  const dispatch = useDispatch();
  const isRTL = lang === "ar";
  const t = COPY[lang] ?? COPY.en;
  const navigate = useNavigate();
  const [loadingFb, setLoadingFb] = useState(false);
  const facebookConnected = isChannelConnected("facebook");
  const whatsappConnected = isChannelConnected("whatsapp");

  // تهيئة Facebook SDK
  useEffect(() => {
    if (window.FB) return;
    window.fbAsyncInit = function () {
      window.FB.init({
        appId: FB_APP_ID,
        cookie: true,
        xfbml: true,
        version: "v18.0",
      });
    };
    (function (d, s, id) {
      var js,
        fjs = d.getElementsByTagName(s)[0];
      if (d.getElementById(id)) return;
      js = d.createElement(s);
      js.id = id;
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      fjs.parentNode.insertBefore(js, fjs);
    })(document, "script", "facebook-jssdk");
  }, []);

  // دالة إرسال الـ access_token إلى API الخادم
  const sendFacebookTokenToBackend = useCallback(async (accessToken) => {
    try {
      const response = await axiosInstance.post(FACEBOOK_AUTH_URL, {
        access_token: accessToken,
      });
      saveChannelConnection("facebook");
      const authData = response.data?.data ?? response.data;

      if (authData?.token) {
        saveAuthToStorage(authData);
        dispatch(setAuth(authData));
      }

      navigate("/fb-pages");
    } catch (err) {
      console.error("حدث خطأ أثناء عملية الربط مع الفيسبوك:", err);
      toast.error(err.response?.data?.message || err.message || t.facebookConnectFailed);
    } finally {
      setLoadingFb(false);
    }
  }, [dispatch, navigate, t.facebookConnectFailed]);

  useEffect(() => {
    const accessToken = new URLSearchParams(window.location.hash.slice(1)).get("access_token");
    if (!accessToken) return;

    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    sendFacebookTokenToBackend(accessToken);
  }, [sendFacebookTokenToBackend]);

  // دالة تسجيل الدخول بفيسبوك
  const handleFacebookConnect = () => {
    setLoadingFb(true);

    if (window.FB) {
      window.FB.login(
        (response) => {
          if (response.authResponse?.accessToken) {
            sendFacebookTokenToBackend(response.authResponse.accessToken);
          } else {
            setLoadingFb(false);
          }
        },
        { scope: "pages_show_list,pages_messaging,public_profile" }
      );
    } else {
      const redirectUri = `${window.location.origin}/connect-manager`;
      const fbUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${FB_APP_ID}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&scope=pages_show_list,pages_messaging,public_profile&response_type=token`;
      window.location.href = fbUrl;
    }
  };

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-8 text-[var(--foreground)] sm:px-6 lg:px-8" dir={isRTL ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-5xl">
        <header className="mb-7 flex flex-wrap items-end justify-between gap-5 border-b border-[var(--border)] pb-6">
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-[var(--primary)]">
              <Link2 className="h-4 w-4" aria-hidden="true" />
              {t.allChannels}
            </p>
            <h1 className="text-2xl font-bold">{t.title}</h1>
            <p className="mt-1 max-w-2xl text-sm text-[var(--muted-foreground)]">{t.subtitle}</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-xs font-medium text-[var(--muted-foreground)]">
            <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
            {t.channelCount}
          </div>
        </header>

        <section aria-labelledby="available-connections-heading">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 id="available-connections-heading" className="text-sm font-semibold text-[var(--foreground)]">
              {t.available}
            </h2>
            <span className="text-xs text-[var(--muted-foreground)]">02</span>
          </div>

          <div className="grid items-stretch gap-4 lg:grid-cols-2">
            {/* Facebook Card */}
            <ConnectionCard
              title="Facebook"
              type={t.facebookType}
              description={t.messengerDescription}
              icon={FacebookIcon}
              accent="#0866ff"
              connectLabel={loadingFb ? t.connecting : facebookConnected ? t.manage : t.facebookConnect}
              connectHint={facebookConnected ? t.connectedHint : t.connectHint}
              onConnect={facebookConnected ? () => navigate("/fb-pages") : handleFacebookConnect}
              loading={loadingFb}
            />

            {/* WhatsApp Card */}
            <ConnectionCard
              title="WhatsApp"
              type={t.whatsappType}
              description={t.whatsappDescription}
              icon={WhatsappIcon}
              accent="#25D366"
              connectLabel={whatsappConnected ? t.manage : t.whatsappConnect}
              connectHint={whatsappConnected ? t.connectedHint : t.connectHint}
              onConnect={() => navigate("/whatsapp")}
            />
          </div>
        </section>
      </div>
    </main>
  );
}