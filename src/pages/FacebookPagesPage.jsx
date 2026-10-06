// import { useState } from "react";
// import { useSelector } from "react-redux";
// import { useNavigate } from "react-router-dom";
// import { PanelsTopLeft, Camera, ExternalLink, CreditCard, Search, X, CheckCircle2 } from "lucide-react";
// import { useGet } from "../hooks/useGet";
// import { API_ENDPOINTS } from "../utils/constants";
// import { useMinimumLoading } from "../hooks/useMinimumLoading";
// import { hasChatAccess } from "../utils/chatAccess";
// import Loader from "../components/common/Loader";
// import EmptyState from "../components/ui/EmptyState";

// const copy = {
//   en: {
//     title: "Facebook Pages", subtitle: "Choose a page to manage or start its subscription.",
//     instagramTitle: "Instagram accounts", instagramSubtitle: "Choose an account to manage or start its subscription.",
//     all: "All pages", pageSubscribe: "Subscribe", pageManage: "Manage page",
//     subscription: "Start subscription", loading: "Loading Facebook pages…",
//     instagramLoading: "Loading Instagram accounts…", instagramSubscribe: "Subscribe", instagramManage: "Manage account",
//     noInstagram: "No Instagram accounts found", instagramFailed: "Could not load Instagram accounts",
//     noPages: "No Facebook pages found", noPagesHelp: "Connect Facebook and grant pages_show_list access to see your pages.",
//     failed: "Could not load Facebook pages", pageId: "Page ID", category: "Category", status: "Status",
//     search: "Search pages", noMatches: "No pages match your search", subscribed: "Subscribed", notSubscribed: "Not subscribed",
//   },
//   ar: {
//     title: "صفحات فيسبوك", subtitle: "اختاري صفحة لإدارتها أو لبدء الاشتراك بها.",
//     instagramTitle: "حسابات Instagram", instagramSubtitle: "اختاري حسابًا لإدارته أو لبدء الاشتراك به.",
//     all: "كل الصفحات", pageSubscribe: "اشتراك", pageManage: "إدارة الصفحة",
//     subscription: "ابدئي الاشتراك", loading: "جاري تحميل صفحات فيسبوك…",
//     instagramLoading: "جاري تحميل حسابات Instagram…", instagramSubscribe: "اشتراك", instagramManage: "إدارة الحساب",
//     noInstagram: "لم يتم العثور على حسابات Instagram", instagramFailed: "تعذر تحميل حسابات Instagram",
//     noPages: "لم يتم العثور على صفحات", noPagesHelp: "اربطي حساب فيسبوك وامنحي صلاحية pages_show_list لعرض صفحاتك.",
//     failed: "تعذر تحميل صفحات فيسبوك", pageId: "معرّف الصفحة", category: "التصنيف", status: "الحالة",
//     search: "ابحثي في الصفحات", noMatches: "لا توجد صفحات تطابق البحث", subscribed: "مشتركة", notSubscribed: "غير مشتركة",
//   },
// };

// function PageAvatar({ page, size = "md" }) {
//   const [failed, setFailed] = useState(false);
//   const image = page.picture?.data?.url || page.picture?.url || page.picture || page.profile_picture || page.page_picture || page.logo || page.avatar;
//   const dimensions = {
//     md: "h-12 w-12 rounded-xl text-base",
//     lg: "h-20 w-20 rounded-2xl text-3xl",
//   }[size];
//   return (
//     <div className={`flex shrink-0 items-center justify-center overflow-hidden bg-[oklch(0.94_0.05_240)] font-bold text-[oklch(0.42_0.14_240)] shadow-sm ring-1 ring-black/5 ${dimensions}`}>
//       {image && !failed
//         ? <img src={image} alt="" className="h-full w-full object-cover" onError={() => setFailed(true)} />
//         : (page.page_name?.charAt(0)?.toUpperCase() || "F")}
//     </div>
//   );
// }

// function StatusBadge({ subscribed, t }) {
//   return (
//     <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
//       subscribed ? "bg-emerald-100 text-emerald-700" : "bg-[var(--muted)] text-[var(--muted-foreground)]"
//     }`}>
//       {subscribed
//         ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
//         : <span className="h-1.5 w-1.5 rounded-full bg-[var(--muted-foreground)]" aria-hidden="true" />}
//       {subscribed ? t.subscribed : t.notSubscribed}
//     </span>
//   );
// }

// export default function FacebookPagesPage() {
//   const lang = useSelector((state) => state.ui.lang);
//   const isRTL = lang === "ar";
//   const t = copy[lang] ?? copy.en;
//   const navigate = useNavigate();
//   const { data, loading, error, refetch } = useGet(API_ENDPOINTS.MESSENGER.PAGES);
//   const { data: instagramData, loading: instagramLoading, error: instagramError } = useGet(API_ENDPOINTS.INSTAGRAM.ACCOUNTS);
//   const { data: instagramChatData } = useGet(API_ENDPOINTS.INSTAGRAM.CHAT_ACCOUNTS);
//   const { isVisible: showLoader, beginLoading } = useMinimumLoading(loading);
//   const pages = data?.data ?? [];
//   const instagramAccounts = instagramData?.data ?? [];
//   const instagramChatAccounts = instagramChatData?.data ?? [];
//   const [search, setSearch] = useState("");
//   const filteredPages = pages.filter((page) =>
//     [page.page_name, page.page_category, page.page_id]
//       .some((value) => String(value ?? "").toLowerCase().includes(search.trim().toLowerCase()))
//   );
//   const filteredInstagramAccounts = instagramAccounts.filter((account) =>
//     [account.username, account.name, account.instagram_id]
//       .some((value) => String(value ?? "").toLowerCase().includes(search.trim().toLowerCase()))
//   );

//   const openInstagramAccount = (account) => {
//     const chatAccount = instagramChatAccounts.find((item) => String(item.instagram_id) === String(account.instagram_id));
//     const subscribed = hasChatAccess(chatAccount) || hasChatAccess(account);
//     navigate(subscribed
//       ? `/instagram-pages/${encodeURIComponent(account.instagram_id)}/manage`
//       : `/instagram-subscription?instagramId=${encodeURIComponent(account.instagram_id)}`);
//   };

//   const openFacebookPage = (page) => navigate(hasChatAccess(page)
//     ? `/fb-pages/${encodeURIComponent(page.page_id)}/manage`
//     : `/order?pageId=${encodeURIComponent(page.page_id)}`);

//   return (
//     <div className="min-h-screen bg-[var(--background)]">
//       <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 lg:px-8">
//         <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
//           <div>
//             <h1 className="text-2xl font-bold text-[var(--foreground)]">{t.title}</h1>
//             <p className="mt-1 text-sm text-[var(--muted-foreground)]">{t.subtitle}</p>
//           </div>

//           {!showLoader && !error && pages.length > 0 && (
//             <div className="flex h-11 w-full items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--ring)] sm:w-80">
//               <Search className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]" aria-hidden="true" />
//               <input
//                 type="search"
//                 value={search}
//                 onChange={(event) => setSearch(event.target.value)}
//                 placeholder={t.search}
//                 aria-label={t.search}
//                 className="min-w-0 flex-1 bg-transparent text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)]"
//               />
//               {search && (
//                 <button type="button" onClick={() => setSearch("")} aria-label={isRTL ? "مسح البحث" : "Clear search"}
//                   className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]">
//                   <X className="h-4 w-4" aria-hidden="true" />
//                 </button>
//               )}
//             </div>
//           )}
//         </header>

//         {showLoader ? (
//           <div className="grid min-h-[320px] place-items-center border-y border-[var(--border)] bg-[var(--card)]">
//             <Loader text={t.loading} />
//           </div>
//         ) : error ? (
//           <div className="flex min-h-56 flex-col items-center justify-center gap-3">
//             <p role="alert" className="text-sm text-[var(--destructive)]">{error || t.failed}</p>
//             <button type="button" onClick={() => { beginLoading(); refetch(); }} className="rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ background: "var(--primary)" }}>
//               {isRTL ? "حاول مرة أخرى" : "Try again"}
//             </button>
//           </div>
//         ) : pages.length === 0 ? (
//           <EmptyState icon={PanelsTopLeft} title={t.noPages} description={t.noPagesHelp} />
//         ) : (
//           <section aria-labelledby="all-pages-heading">
//             <div className="mb-3 flex items-center justify-between">
//               <h2 id="all-pages-heading" className="text-sm font-semibold text-[var(--foreground)]">{t.all}</h2>
//               <span className="text-xs text-[var(--muted-foreground)]">{filteredPages.length} / {pages.length}</span>
//             </div>

//             {filteredPages.length === 0 ? (
//               <p className="rounded-xl border border-dashed border-[var(--border)] px-3 py-12 text-center text-sm text-[var(--muted-foreground)]">{t.noMatches}</p>
//             ) : (
//               <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
//                 {filteredPages.map((page) => {
//                   const subscribed = hasChatAccess(page);
//                   return (
//                     <li key={page.page_id}>
//                       <div className="flex h-full flex-col justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
//                         <div className="flex min-w-0 items-center gap-3">
//                           <PageAvatar page={page} />
//                           <span className="min-w-0 flex-1">
//                             <span className="block truncate text-sm font-semibold text-[var(--foreground)]">{page.page_name}</span>
//                             <span className="mt-0.5 block truncate text-xs text-[var(--muted-foreground)]">{page.page_category || page.page_id}</span>
//                           </span>
//                         </div>
//                         <div className="flex items-center justify-between gap-3">
//                           <StatusBadge subscribed={subscribed} t={t} />
//                           <button type="button" onClick={() => openFacebookPage(page)}
//                             className="inline-flex min-h-9 items-center gap-2 rounded-lg px-3 text-xs font-semibold text-white transition-opacity hover:opacity-90"
//                             style={{ background: "var(--primary)" }}>
//                             {subscribed ? <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /> : <CreditCard className="h-3.5 w-3.5" aria-hidden="true" />}
//                             {subscribed ? t.pageManage : t.pageSubscribe}
//                           </button>
//                         </div>
//                       </div>
//                     </li>
//                   );
//                 })}
//               </ul>
//             )}
//           </section>
//         )}

//         <section aria-labelledby="instagram-accounts-heading" className="border-t border-[var(--border)] pt-6">
//           <div className="mb-3 flex items-end justify-between gap-3">
//             <div>
//               <h2 id="instagram-accounts-heading" className="text-lg font-semibold text-[var(--foreground)]">{t.instagramTitle}</h2>
//               <p className="mt-1 text-sm text-[var(--muted-foreground)]">{t.instagramSubtitle}</p>
//             </div>
//             {!instagramLoading && !instagramError && <span className="text-xs text-[var(--muted-foreground)]">{filteredInstagramAccounts.length} / {instagramAccounts.length}</span>}
//           </div>
//           {instagramLoading ? <div className="grid min-h-36 place-items-center"><Loader text={t.instagramLoading} /></div>
//             : instagramError ? <p role="alert" className="py-8 text-center text-sm text-[var(--destructive)]">{instagramError || t.instagramFailed}</p>
//               : instagramAccounts.length === 0 ? <EmptyState icon={Camera} title={t.noInstagram} />
//                 : filteredInstagramAccounts.length === 0 ? <p className="rounded-xl border border-dashed border-[var(--border)] px-3 py-12 text-center text-sm text-[var(--muted-foreground)]">{t.noMatches}</p>
//                   : (
//                     <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
//                       {filteredInstagramAccounts.map((account) => {
//                         const chatAccount = instagramChatAccounts.find((item) => String(item.instagram_id) === String(account.instagram_id));
//                         const subscribed = hasChatAccess(chatAccount) || hasChatAccess(account);
//                         const name = account.username ? `@${account.username}` : account.name || account.instagram_id;
//                         const image = account.profile_picture_url || account.profile_picture || account.picture;
//                         return (
//                           <li key={account.instagram_id}>
//                             <div className="flex h-full flex-col justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
//                               <div className="flex min-w-0 items-center gap-3">
//                                 <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 font-semibold text-white">
//                                   {image ? <img src={image} alt="" className="h-full w-full object-cover" /> : <Camera className="h-5 w-5" aria-hidden="true" />}
//                                 </span>
//                                 <span className="min-w-0 flex-1">
//                                   <span className="block truncate text-sm font-semibold text-[var(--foreground)]">{name}</span>
//                                   <span className="mt-0.5 block truncate text-xs text-[var(--muted-foreground)]">{account.instagram_id}</span>
//                                 </span>
//                               </div>
//                               <div className="flex items-center justify-between gap-3">
//                                 <StatusBadge subscribed={subscribed} t={t} />
//                                 <button type="button" onClick={() => openInstagramAccount(account)}
//                                   className="inline-flex min-h-9 items-center gap-2 rounded-lg px-3 text-xs font-semibold text-white transition-opacity hover:opacity-90"
//                                   style={{ background: "var(--primary)" }}>
//                                   {subscribed ? <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /> : <CreditCard className="h-3.5 w-3.5" aria-hidden="true" />}
//                                   {subscribed ? t.instagramManage : t.instagramSubscribe}
//                                 </button>
//                               </div>
//                             </div>
//                           </li>
//                         );
//                       })}
//                     </ul>
//                   )}
//         </section>
//       </main>

//     </div>
//   );
// }
///////////////////////////////////////////////////////////
import { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { PanelsTopLeft, Camera, ExternalLink, CreditCard, Search, X, CheckCircle2, Loader2 } from "lucide-react";
import { useGet } from "../hooks/useGet";
import { API_ENDPOINTS } from "../utils/constants";
import { useMinimumLoading } from "../hooks/useMinimumLoading";
import { hasChatAccess } from "../utils/chatAccess";
import Loader from "../components/common/Loader";
import EmptyState from "../components/ui/EmptyState";

/* ------------------------------------------------------------------ */
/* Direct subscription endpoints (kept here so everything is in one file) */
/* ------------------------------------------------------------------ */
const DIRECT_SUBSCRIPTION = {
  messenger: "https://bcknd.smartego.org/api/user/messenger/directSubscription",
  instagram: "https://bcknd.smartego.org/api/user/instagram/directSubscription",
  whats: "https://bcknd.smartego.org/api/user/whats/directSubscription", // body: { whats_item_id: number } (لصفحة الواتساب)
};

const copy = {
  en: {
    title: "Facebook Pages", subtitle: "Choose a page to manage or start its subscription.",
    instagramTitle: "Instagram accounts", instagramSubtitle: "Choose an account to manage or start its subscription.",
    all: "All pages", pageSubscribe: "Subscribe", pageManage: "Manage page",
    subscription: "Start subscription", loading: "Loading Facebook pages…",
    instagramLoading: "Loading Instagram accounts…", instagramSubscribe: "Subscribe", instagramManage: "Manage account",
    noInstagram: "No Instagram accounts found", instagramFailed: "Could not load Instagram accounts",
    noPages: "No Facebook pages found", noPagesHelp: "Connect Facebook and grant pages_show_list access to see your pages.",
    failed: "Could not load Facebook pages", pageId: "Page ID", category: "Category", status: "Status",
    search: "Search pages", noMatches: "No pages match your search", subscribed: "Subscribed", notSubscribed: "Not subscribed",
    subscribing: "Subscribing…", subscribeFailed: "Subscription failed, please try again",
  },
  ar: {
    title: "صفحات فيسبوك", subtitle: "اختاري صفحة لإدارتها أو لبدء الاشتراك بها.",
    instagramTitle: "حسابات Instagram", instagramSubtitle: "اختاري حسابًا لإدارته أو لبدء الاشتراك به.",
    all: "كل الصفحات", pageSubscribe: "اشتراك", pageManage: "إدارة الصفحة",
    subscription: "ابدئي الاشتراك", loading: "جاري تحميل صفحات فيسبوك…",
    instagramLoading: "جاري تحميل حسابات Instagram…", instagramSubscribe: "اشتراك", instagramManage: "إدارة الحساب",
    noInstagram: "لم يتم العثور على حسابات Instagram", instagramFailed: "تعذر تحميل حسابات Instagram",
    noPages: "لم يتم العثور على صفحات", noPagesHelp: "اربطي حساب فيسبوك وامنحي صلاحية pages_show_list لعرض صفحاتك.",
    failed: "تعذر تحميل صفحات فيسبوك", pageId: "معرّف الصفحة", category: "التصنيف", status: "الحالة",
    search: "ابحثي في الصفحات", noMatches: "لا توجد صفحات تطابق البحث", subscribed: "مشتركة", notSubscribed: "غير مشتركة",
    subscribing: "جاري الاشتراك…", subscribeFailed: "فشل الاشتراك، حاولي مرة أخرى",
  },
};

function PageAvatar({ page, size = "md" }) {
  const [failed, setFailed] = useState(false);
  const image = page.picture?.data?.url || page.picture?.url || page.picture || page.profile_picture || page.page_picture || page.logo || page.avatar;
  const dimensions = {
    md: "h-12 w-12 rounded-xl text-base",
    lg: "h-20 w-20 rounded-2xl text-3xl",
  }[size];
  return (
    <div className={`flex shrink-0 items-center justify-center overflow-hidden bg-[oklch(0.94_0.05_240)] font-bold text-[oklch(0.42_0.14_240)] shadow-sm ring-1 ring-black/5 ${dimensions}`}>
      {image && !failed
        ? <img src={image} alt="" className="h-full w-full object-cover" onError={() => setFailed(true)} />
        : (page.page_name?.charAt(0)?.toUpperCase() || "F")}
    </div>
  );
}

function StatusBadge({ subscribed, t }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
      subscribed ? "bg-emerald-100 text-emerald-700" : "bg-[var(--muted)] text-[var(--muted-foreground)]"
    }`}>
      {subscribed
        ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
        : <span className="h-1.5 w-1.5 rounded-full bg-[var(--muted-foreground)]" aria-hidden="true" />}
      {subscribed ? t.subscribed : t.notSubscribed}
    </span>
  );
}

export default function FacebookPagesPage() {
  const lang = useSelector((state) => state.ui.lang);
  // ⚠️ عدّلي السطر ده لو الـ token متخزن في مكان تاني
  const reduxToken = useSelector((state) => state.auth?.token);
  const isRTL = lang === "ar";
  const t = copy[lang] ?? copy.en;
  const navigate = useNavigate();
  const { data, loading, error, refetch } = useGet(API_ENDPOINTS.MESSENGER.PAGES);
  const { data: instagramData, loading: instagramLoading, error: instagramError } = useGet(API_ENDPOINTS.INSTAGRAM.ACCOUNTS);
  const { data: instagramChatData } = useGet(API_ENDPOINTS.INSTAGRAM.CHAT_ACCOUNTS);
  const { isVisible: showLoader, beginLoading } = useMinimumLoading(loading);
  const pages = data?.data ?? [];
  const instagramAccounts = instagramData?.data ?? [];
  const instagramChatAccounts = instagramChatData?.data ?? [];
  const [search, setSearch] = useState("");
  const [subscribingId, setSubscribingId] = useState(null); // مثال: "fb-123" أو "ig-456"
  const [actionError, setActionError] = useState("");

  const filteredPages = pages.filter((page) =>
    [page.page_name, page.page_category, page.page_id]
      .some((value) => String(value ?? "").toLowerCase().includes(search.trim().toLowerCase()))
  );
  const filteredInstagramAccounts = instagramAccounts.filter((account) =>
    [account.username, account.name, account.instagram_id]
      .some((value) => String(value ?? "").toLowerCase().includes(search.trim().toLowerCase()))
  );

  /* ---------------- Direct subscription (API ثم redirect) ---------------- */
  const directSubscribe = async ({ url, body, id, redirectTo }) => {
    setActionError("");
    setSubscribingId(id);
    try {
      const token = reduxToken || localStorage.getItem("token");
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });

      let json = null;
      try { json = await res.json(); } catch { /* response without body */ }

      if (!res.ok || json?.success === false) {
        throw new Error(json?.message || t.subscribeFailed);
      }

      navigate(redirectTo);
    } catch (err) {
      setActionError(err?.message || t.subscribeFailed);
    } finally {
      setSubscribingId(null);
    }
  };

  const openInstagramAccount = (account) => {
    const chatAccount = instagramChatAccounts.find((item) => String(item.instagram_id) === String(account.instagram_id));
    const subscribed = hasChatAccess(chatAccount) || hasChatAccess(account);
    const manageUrl = `/instagram-pages/${encodeURIComponent(account.instagram_id)}/manage`;

    if (subscribed) return navigate(manageUrl);

    directSubscribe({
      url: DIRECT_SUBSCRIPTION.instagram,
      body: { instagram_id: String(account.instagram_id) },
      id: `ig-${account.instagram_id}`,
      redirectTo: manageUrl,
    });
  };

  const openFacebookPage = (page) => {
    const manageUrl = `/fb-pages/${encodeURIComponent(page.page_id)}/manage`;

    if (hasChatAccess(page)) return navigate(manageUrl);

    directSubscribe({
      url: DIRECT_SUBSCRIPTION.messenger,
      body: { page_id: String(page.page_id) },
      id: `fb-${page.page_id}`,
      redirectTo: manageUrl,
    });
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 lg:px-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">{t.title}</h1>
            <p className="mt-1 text-sm text-[var(--muted-foreground)]">{t.subtitle}</p>
          </div>

          {!showLoader && !error && pages.length > 0 && (
            <div className="flex h-11 w-full items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--ring)] sm:w-80">
              <Search className="h-4 w-4 shrink-0 text-[var(--muted-foreground)]" aria-hidden="true" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t.search}
                aria-label={t.search}
                className="min-w-0 flex-1 bg-transparent text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--muted-foreground)]"
              />
              {search && (
                <button type="button" onClick={() => setSearch("")} aria-label={isRTL ? "مسح البحث" : "Clear search"}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]">
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>
          )}
        </header>

        {actionError && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-[var(--destructive)]">
            {actionError}
          </p>
        )}

        {showLoader ? (
          <div className="grid min-h-[320px] place-items-center border-y border-[var(--border)] bg-[var(--card)]">
            <Loader text={t.loading} />
          </div>
        ) : error ? (
          <div className="flex min-h-56 flex-col items-center justify-center gap-3">
            <p role="alert" className="text-sm text-[var(--destructive)]">{error || t.failed}</p>
            <button type="button" onClick={() => { beginLoading(); refetch(); }} className="rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ background: "var(--primary)" }}>
              {isRTL ? "حاول مرة أخرى" : "Try again"}
            </button>
          </div>
        ) : pages.length === 0 ? (
          <EmptyState icon={PanelsTopLeft} title={t.noPages} description={t.noPagesHelp} />
        ) : (
          <section aria-labelledby="all-pages-heading">
            <div className="mb-3 flex items-center justify-between">
              <h2 id="all-pages-heading" className="text-sm font-semibold text-[var(--foreground)]">{t.all}</h2>
              <span className="text-xs text-[var(--muted-foreground)]">{filteredPages.length} / {pages.length}</span>
            </div>

            {filteredPages.length === 0 ? (
              <p className="rounded-xl border border-dashed border-[var(--border)] px-3 py-12 text-center text-sm text-[var(--muted-foreground)]">{t.noMatches}</p>
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredPages.map((page) => {
                  const subscribed = hasChatAccess(page);
                  const isSubscribing = subscribingId === `fb-${page.page_id}`;
                  return (
                    <li key={page.page_id}>
                      <div className="flex h-full flex-col justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <PageAvatar page={page} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold text-[var(--foreground)]">{page.page_name}</span>
                            <span className="mt-0.5 block truncate text-xs text-[var(--muted-foreground)]">{page.page_category || page.page_id}</span>
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <StatusBadge subscribed={subscribed} t={t} />
                          <button type="button" disabled={isSubscribing} onClick={() => openFacebookPage(page)}
                            className="inline-flex min-h-9 items-center gap-2 rounded-lg px-3 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                            style={{ background: "var(--primary)" }}>
                            {isSubscribing
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                              : subscribed
                                ? <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                                : <CreditCard className="h-3.5 w-3.5" aria-hidden="true" />}
                            {isSubscribing ? t.subscribing : subscribed ? t.pageManage : t.pageSubscribe}
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )}

        <section aria-labelledby="instagram-accounts-heading" className="border-t border-[var(--border)] pt-6">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <h2 id="instagram-accounts-heading" className="text-lg font-semibold text-[var(--foreground)]">{t.instagramTitle}</h2>
              <p className="mt-1 text-sm text-[var(--muted-foreground)]">{t.instagramSubtitle}</p>
            </div>
            {!instagramLoading && !instagramError && <span className="text-xs text-[var(--muted-foreground)]">{filteredInstagramAccounts.length} / {instagramAccounts.length}</span>}
          </div>
          {instagramLoading ? <div className="grid min-h-36 place-items-center"><Loader text={t.instagramLoading} /></div>
            : instagramError ? <p role="alert" className="py-8 text-center text-sm text-[var(--destructive)]">{instagramError || t.instagramFailed}</p>
              : instagramAccounts.length === 0 ? <EmptyState icon={Camera} title={t.noInstagram} />
                : filteredInstagramAccounts.length === 0 ? <p className="rounded-xl border border-dashed border-[var(--border)] px-3 py-12 text-center text-sm text-[var(--muted-foreground)]">{t.noMatches}</p>
                  : (
                    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {filteredInstagramAccounts.map((account) => {
                        const chatAccount = instagramChatAccounts.find((item) => String(item.instagram_id) === String(account.instagram_id));
                        const subscribed = hasChatAccess(chatAccount) || hasChatAccess(account);
                        const isSubscribing = subscribingId === `ig-${account.instagram_id}`;
                        const name = account.username ? `@${account.username}` : account.name || account.instagram_id;
                        const image = account.profile_picture_url || account.profile_picture || account.picture;
                        return (
                          <li key={account.instagram_id}>
                            <div className="flex h-full flex-col justify-between gap-4 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
                              <div className="flex min-w-0 items-center gap-3">
                                <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 font-semibold text-white">
                                  {image ? <img src={image} alt="" className="h-full w-full object-cover" /> : <Camera className="h-5 w-5" aria-hidden="true" />}
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-sm font-semibold text-[var(--foreground)]">{name}</span>
                                  <span className="mt-0.5 block truncate text-xs text-[var(--muted-foreground)]">{account.instagram_id}</span>
                                </span>
                              </div>
                              <div className="flex items-center justify-between gap-3">
                                <StatusBadge subscribed={subscribed} t={t} />
                                <button type="button" disabled={isSubscribing} onClick={() => openInstagramAccount(account)}
                                  className="inline-flex min-h-9 items-center gap-2 rounded-lg px-3 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                                  style={{ background: "var(--primary)" }}>
                                  {isSubscribing
                                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                                    : subscribed
                                      ? <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                                      : <CreditCard className="h-3.5 w-3.5" aria-hidden="true" />}
                                  {isSubscribing ? t.subscribing : subscribed ? t.instagramManage : t.instagramSubscribe}
                                </button>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
        </section>
      </main>
    </div>
  );
}