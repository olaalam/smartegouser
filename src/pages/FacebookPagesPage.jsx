import { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { PanelsTopLeft, ExternalLink, CreditCard, Search, X, CheckCircle2 } from "lucide-react";
import { useGet } from "../hooks/useGet";
import { API_ENDPOINTS } from "../utils/constants";
import { useMinimumLoading } from "../hooks/useMinimumLoading";
import { hasChatAccess } from "../utils/chatAccess";
import Loader from "../components/common/Loader";
import EmptyState from "../components/ui/EmptyState";

const copy = {
  en: {
    title: "Facebook Pages", subtitle: "Choose a page to manage or start its subscription.",
    all: "All pages", choose: "Selected page", select: "Select a Facebook page",
    subscription: "Subscription", manage: "Manage", loading: "Loading Facebook pages…",
    noPages: "No Facebook pages found", noPagesHelp: "Connect Facebook and grant pages_show_list access to see your pages.",
    failed: "Could not load Facebook pages", pageId: "Page ID", category: "Category", status: "Status",
    search: "Search pages", noMatches: "No pages match your search", subscribed: "Subscribed", notSubscribed: "Not subscribed",
  },
  ar: {
    title: "صفحات فيسبوك", subtitle: "اختاري صفحة لإدارتها أو لبدء الاشتراك بها.",
    all: "كل الصفحات", choose: "الصفحة المحددة", select: "اختاري صفحة فيسبوك",
    subscription: "الاشتراك", manage: "إدارة", loading: "جاري تحميل صفحات فيسبوك…",
    noPages: "لم يتم العثور على صفحات", noPagesHelp: "اربطي حساب فيسبوك وامنحي صلاحية pages_show_list لعرض صفحاتك.",
    failed: "تعذر تحميل صفحات فيسبوك", pageId: "معرّف الصفحة", category: "التصنيف", status: "الحالة",
    search: "ابحثي في الصفحات", noMatches: "لا توجد صفحات تطابق البحث", subscribed: "مشتركة", notSubscribed: "غير مشتركة",
  },
};

function PageAvatar({ page, large = false }) {
  const [failed, setFailed] = useState(false);
  const image = page.picture?.data?.url || page.picture?.url || page.picture || page.profile_picture || page.page_picture || page.logo || page.avatar;
  const dimensions = large ? "h-14 w-14 rounded-xl text-xl" : "h-10 w-10 rounded-lg text-sm";
  return (
    <div className={`flex shrink-0 items-center justify-center overflow-hidden bg-[oklch(0.94_0.05_240)] font-bold text-[oklch(0.42_0.14_240)] ${dimensions}`}>
      {image && !failed
        ? <img src={image} alt="" className="h-full w-full object-cover" onError={() => setFailed(true)} />
        : (page.page_name?.charAt(0)?.toUpperCase() || "F")}
    </div>
  );
}

export default function FacebookPagesPage() {
  const lang = useSelector((state) => state.ui.lang);
  const isRTL = lang === "ar";
  const t = copy[lang] ?? copy.en;
  const navigate = useNavigate();
  const { data, loading, error, refetch } = useGet(API_ENDPOINTS.MESSENGER.PAGES);
  const { isVisible: showLoader, beginLoading } = useMinimumLoading(loading);
  const pages = data?.data ?? [];
  const [selectedPageId, setSelectedPageId] = useState("");
  const [search, setSearch] = useState("");
  const selectedPage = pages.find((page) => String(page.page_id) === selectedPageId) ?? pages[0] ?? null;
  const filteredPages = pages.filter((page) =>
    [page.page_name, page.page_category, page.page_id]
      .some((value) => String(value ?? "").toLowerCase().includes(search.trim().toLowerCase()))
  );
  const isSubscribed = hasChatAccess(selectedPage);
  const choosePage = (page) => setSelectedPageId(String(page.page_id));
  const goToSubscription = () => {
    if (selectedPage) navigate(`/order?pageId=${encodeURIComponent(selectedPage.page_id)}`);
  };
  const goToManage = () => {
    if (selectedPage) navigate(`/fb-pages/${encodeURIComponent(selectedPage.page_id)}/manage`);
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 lg:px-8">
        <header>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">{t.title}</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">{t.subtitle}</p>
        </header>

        {showLoader ? (
          <div className="grid min-h-[320px] place-items-center border-y border-[var(--border)] bg-[var(--card)]">
            <Loader text={t.loading} />
          </div>
        )
          : error ? (
            <div className="flex min-h-56 flex-col items-center justify-center gap-3">
              <p role="alert" className="text-sm text-[var(--destructive)]">{error || t.failed}</p>
              <button type="button" onClick={() => { beginLoading(); refetch(); }} className="rounded-lg px-4 py-2 text-sm font-semibold text-white" style={{ background: "var(--primary)" }}>
                {isRTL ? "حاول مرة أخرى" : "Try again"}
              </button>
            </div>
          )
          : pages.length === 0 ? <EmptyState icon={PanelsTopLeft} title={t.noPages} description={t.noPagesHelp} />
            : (
              <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.85fr)]">
                <section className="min-w-0" aria-labelledby="all-pages-heading">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 id="all-pages-heading" className="text-sm font-semibold text-[var(--foreground)]">{t.all}</h2>
                    <span className="text-xs text-[var(--muted-foreground)]">{filteredPages.length} / {pages.length}</span>
                  </div>
                  <div className="mb-3 flex h-11 items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--ring)]">
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
                  <div className="max-h-[480px] divide-y divide-[var(--border)] overflow-y-auto border-y border-[var(--border)]">
                    {filteredPages.length === 0 ? (
                      <p className="px-3 py-8 text-center text-sm text-[var(--muted-foreground)]">{t.noMatches}</p>
                    ) : filteredPages.map((page) => {
                      const isSelected = selectedPage?.page_id === page.page_id;
                      const pageIsSubscribed = hasChatAccess(page);
                      return (
                        <button
                          type="button"
                          key={page.page_id}
                          onClick={() => choosePage(page)}
                          aria-pressed={isSelected}
                          className={`flex w-full items-center gap-3 px-3 py-3 text-start transition-colors ${isSelected ? "bg-[var(--accent)]" : "hover:bg-[var(--muted)]"}`}
                        >
                          <PageAvatar page={page} />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-[var(--foreground)]">{page.page_name}</span>
                            <span className="mt-0.5 block truncate text-xs text-[var(--muted-foreground)]">{page.page_category || page.page_id}</span>
                          </span>
                          <span className={`hidden shrink-0 items-center gap-1 text-xs sm:flex ${pageIsSubscribed ? "text-[oklch(0.48_0.13_150)]" : "text-[var(--muted-foreground)]"}`}>
                            {pageIsSubscribed && <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />}
                            {pageIsSubscribed ? t.subscribed : t.notSubscribed}
                          </span>
                          <span className={`h-4 w-4 shrink-0 rounded-full border ${isSelected ? "border-[var(--primary)] bg-[var(--primary)] ring-2 ring-[var(--primary)]/20" : "border-[var(--border)]"}`} aria-hidden="true" />
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section className="border-t border-[var(--border)] pt-4 lg:border-t-0 lg:border-s lg:ps-5 lg:pt-0" aria-labelledby="selected-page-heading">
                  <h2 id="selected-page-heading" className="mb-3 text-sm font-semibold text-[var(--foreground)]">{t.choose}</h2>
                  <label htmlFor="fb-page-select" className="sr-only">{t.select}</label>
                  <div className="relative">
                    <select
                      id="fb-page-select"
                      value={selectedPageId}
                      onChange={(event) => setSelectedPageId(event.target.value)}
                      className="h-11 w-full appearance-none rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--ring)]"
                    >
                      <option value="">{t.select}</option>
                      {pages.map((page) => <option key={page.page_id} value={page.page_id}>{page.page_name}</option>)}
                    </select>
                  </div>

                  {selectedPage && (
                    <div className="mt-4 border-y border-[var(--border)] py-4">
                      <div className="flex items-center gap-3">
                        <PageAvatar page={selectedPage} large />
                        <div className="min-w-0">
                          <h3 className="truncate text-base font-semibold text-[var(--foreground)]">{selectedPage.page_name}</h3>
                          <p className="mt-0.5 truncate text-xs text-[var(--muted-foreground)]">{selectedPage.page_category || selectedPage.page_id}</p>
                        </div>
                      </div>
                      <p className={`mt-4 flex items-center gap-2 text-xs font-medium ${isSubscribed ? "text-[oklch(0.48_0.13_150)]" : "text-[var(--muted-foreground)]"}`}>
                        {isSubscribed && <CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
                        {isSubscribed ? t.subscribed : t.notSubscribed}
                      </p>
                    </div>
                  )}

                  {selectedPage && (isSubscribed ? (
                    <button type="button" onClick={goToManage}
                      className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                      style={{ background: "var(--primary)" }}>
                      <ExternalLink className="h-4 w-4" aria-hidden="true" />{t.manage}
                    </button>
                  ) : (
                    <button type="button" onClick={goToSubscription}
                      className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                      style={{ background: "var(--primary)" }}>
                      <CreditCard className="h-4 w-4" aria-hidden="true" />{t.subscription}
                    </button>
                  ))}
                </section>
              </div>
            )}
      </main>
    </div>
  );
}