import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { BadgeCheck, Camera, ExternalLink, FileText, LoaderCircle, Upload } from "lucide-react";
import { useGet } from "../hooks/useGet";
import { API_ENDPOINTS } from "../utils/constants";
import { createInstagramOrder, getInstagramAIData } from "../api/instagramApi";
import Loader from "../components/common/Loader";

const inputClass = "w-full rounded-lg border border-[#dbdbdb] bg-white px-3 py-2.5 text-sm text-[#262626] outline-none focus:border-[#a8a8a8]";
const MAX_FILE_BYTES = 2 * 1024 * 1024;

const COPY = {
  en: {
    title: "Instagram subscription", subtitle: "Choose an account and plan to activate Instagram messaging.",
    account: "Instagram account", package: "Choose a plan", details: "Account details", context: "AI context",
    website: "Website URL", android: "Android app link", ios: "iOS app link", file: "AI knowledge file (max 2 MB)",
    chooseAccount: "Choose an account", choosePackage: "Choose a plan", noAccounts: "No Instagram accounts available.",
    noPackages: "No plans available right now.", noLinkedItem: "This account has no Instagram item available for AI file updates.",
    order: "Submit subscription request", ordering: "Submitting…", upload: "Upload AI file", uploading: "Uploading…",
    orderSuccess: "Subscription request submitted.", aiSuccess: "AI file updated.", fileTooLarge: "The file must be 2 MB or smaller.",
    required: "Choose an account and a plan first.", loadError: "Could not load Instagram data.",
    chats: "Open Instagram inbox", messageCount: "messages", months: "months", month: "month",
    linked: "Linked", notLinked: "Not linked", status: "Status", active: "Active", fileNone: "No file selected",
    aiNoFile: "Choose a file to upload.", confirm: "Order requests are reviewed by the team before activation.",
  },
  ar: {
    title: "اشتراك Instagram", subtitle: "اختر حسابًا وباقة لتفعيل رسائل Instagram.",
    account: "حساب Instagram", package: "اختر باقة", details: "بيانات الحساب", context: "سياق الذكاء الاصطناعي",
    website: "رابط الموقع", android: "رابط تطبيق Android", ios: "رابط تطبيق iOS", file: "ملف معرفة AI (حتى 2 ميجابايت)",
    chooseAccount: "اختر حسابًا", choosePackage: "اختر باقة", noAccounts: "لا توجد حسابات Instagram متاحة.",
    noPackages: "لا توجد باقات متاحة حاليًا.", noLinkedItem: "لا يوجد عنصر Instagram مسجل لهذا الحساب لتحديث ملف AI.",
    order: "إرسال طلب الاشتراك", ordering: "جاري الإرسال…", upload: "رفع ملف AI", uploading: "جاري الرفع…",
    orderSuccess: "تم إرسال طلب الاشتراك.", aiSuccess: "تم تحديث ملف AI.", fileTooLarge: "يجب ألا يتجاوز حجم الملف 2 ميجابايت.",
    required: "اختر الحساب والباقة أولًا.", loadError: "تعذر تحميل بيانات Instagram.",
    chats: "فتح رسائل Instagram", messageCount: "رسالة", months: "أشهر", month: "شهر",
    linked: "مرتبط", notLinked: "غير مرتبط", status: "الحالة", active: "نشط", fileNone: "لم يتم اختيار ملف",
    aiNoFile: "اختر ملفًا لرفعه.", confirm: "تتم مراجعة طلبات الاشتراك قبل التفعيل.",
  },
};

function packagePrice(pkg) {
  const price = Number(pkg.price) || 0;
  const discount = Number(pkg.discount?.amount) || 0;
  const discounted = pkg.discount
    ? pkg.discount.type === "percentage" ? price * (1 - discount / 100) : Math.max(0, price - discount)
    : price;
  const tax = Number(pkg.tax?.amount) || 0;
  const total = pkg.tax
    ? pkg.tax.type === "percentage" ? discounted * (1 + tax / 100) : discounted + tax
    : discounted;
  return { price, total };
}

export default function InstagramSubscriptionPage() {
  const lang = useSelector((state) => state.ui.lang);
  const t = COPY[lang] ?? COPY.en;
  const isRTL = lang === "ar";
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: accountsData, loading: accountsLoading, error: accountsError } = useGet(API_ENDPOINTS.INSTAGRAM.ACCOUNTS);
  const { data: itemsData } = useGet(API_ENDPOINTS.INSTAGRAM.ITEMS);
  const { data: packagesData, loading: packagesLoading, error: packagesError } = useGet(API_ENDPOINTS.INSTAGRAM.PACKAGES, { lang });
  const accounts = useMemo(() => accountsData?.data ?? [], [accountsData]);
  const items = itemsData?.data ?? [];
  const packages = packagesData?.instagram_packages ?? packagesData?.data ?? [];
  const [instagramId, setInstagramId] = useState(() => searchParams.get("instagramId") || "");
  const [packageId, setPackageId] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [androidLink, setAndroidLink] = useState("");
  const [iosLink, setIosLink] = useState("");
  const [aiContext, setAiContext] = useState("");
  const [aiFile, setAiFile] = useState(null);
  const aiFileInputRef = useRef(null);
  const [ordering, setOrdering] = useState(false);
  const [uploading, setUploading] = useState(false);

  const selectedAccount = accounts.find((item) => String(item.instagram_id) === String(instagramId)) ?? null;
  const selectedItem = items.find((item) => String(item.instagram_id) === String(instagramId)) ?? null;
  const defaultAccount = useMemo(() => accounts.find((item) => !item.already_linked) ?? accounts[0] ?? null, [accounts]);
  const activeInstagramId = instagramId || defaultAccount?.instagram_id || "";
  const activeAccount = selectedAccount ?? (!instagramId ? defaultAccount : null);
  const activeItem = selectedItem ?? items.find((item) => String(item.instagram_id) === String(activeInstagramId)) ?? null;

  const onSelectAccount = (event) => {
    const nextId = event.target.value;
    setInstagramId(nextId);
    const item = items.find((entry) => String(entry.instagram_id) === String(nextId));
    setWebsiteUrl(item?.website_url ?? "");
    setAiContext(item?.ai_context ?? "");
    setAiFile(null);
    if (aiFileInputRef.current) aiFileInputRef.current.value = "";
  };

  const onFileChange = (event) => {
    const file = event.target.files?.[0] ?? null;
    if (file && file.size > MAX_FILE_BYTES) {
      toast.error(t.fileTooLarge);
      event.target.value = "";
      return;
    }
    setAiFile(file);
  };

  const placeOrder = async (event) => {
    event.preventDefault();
    if (!activeAccount || !packageId) {
      toast.error(t.required);
      return;
    }
    const payload = new FormData();
    payload.append("instagram_id", activeAccount.instagram_id);
    payload.append("package_id", packageId);
    payload.append("android_link", androidLink || "");
    payload.append("ios_link", iosLink || "");
    payload.append("website_url", websiteUrl || "");
    payload.append("ai_context", aiContext || "");
    if (aiFile) payload.append("ai_file", aiFile);
    setOrdering(true);
    try {
      await createInstagramOrder(payload);
      toast.success(t.orderSuccess);
      setAiFile(null);
      if (aiFileInputRef.current) aiFileInputRef.current.value = "";
    } catch (error) {
      toast.error(error.response?.data?.message || t.loadError);
    } finally {
      setOrdering(false);
    }
  };

  const uploadAiFile = async () => {
    if (!activeAccount || !activeItem || !aiFile) {
      toast.error(activeItem ? t.aiNoFile : t.noLinkedItem);
      return;
    }
    const payload = new FormData();
    payload.append("instagram_id", activeAccount.instagram_id);
    payload.append("instagram_item_id", String(activeItem.id));
    payload.append("ai_file", aiFile);
    setUploading(true);
    try {
      await getInstagramAIData(payload);
      toast.success(t.aiSuccess);
      setAiFile(null);
      if (aiFileInputRef.current) aiFileInputRef.current.value = "";
    } catch (error) {
      toast.error(error.response?.data?.message || t.loadError);
    } finally {
      setUploading(false);
    }
  };

  const pageError = accountsError || packagesError;

  return (
    <main className="min-h-screen bg-[#fafafa] text-[#262626]" dir={isRTL ? "rtl" : "ltr"}>
      <header className="border-b border-[#dbdbdb] bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600 text-white"><Camera className="h-5 w-5" aria-hidden="true" /></span>
            <div className="min-w-0"><h1 className="truncate text-lg font-semibold">{t.title}</h1><p className="mt-0.5 text-xs text-[#737373]">{t.subtitle}</p></div>
          </div>
          <button type="button" onClick={() => navigate("/instagram-chat")} className="shrink-0 rounded-lg bg-[#0095f6] px-3 py-2 text-xs font-semibold text-white hover:bg-[#1877f2] sm:px-4 sm:text-sm">{t.chats}</button>
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-7 lg:py-8">
        <section className="space-y-5">
          <div className="border-b border-[#dbdbdb] pb-3"><h2 className="text-base font-semibold">{t.package}</h2></div>
          {packagesLoading ? <Loader text={t.package} /> : packagesError ? <p role="alert" className="text-sm text-red-600">{packagesError}</p> : !packages.length ? (
            <p className="py-8 text-center text-sm text-[#737373]">{t.noPackages}</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {packages.map((pkg) => {
                const { price, total } = packagePrice(pkg);
                const selected = String(pkg.id) === String(packageId);
                return (
                  <button type="button" key={pkg.id} onClick={() => setPackageId(String(pkg.id))}
                    className={`min-h-36 rounded-xl border bg-white p-4 text-start transition-colors ${selected ? "border-[#0095f6] ring-1 ring-[#0095f6]" : "border-[#dbdbdb] hover:border-[#a8a8a8]"}`}>
                    <span className="flex items-start justify-between gap-3"><span className="font-semibold">{pkg.names?.[lang] ?? pkg.name}</span>{selected && <BadgeCheck className="h-5 w-5 shrink-0 text-[#0095f6]" aria-hidden="true" />}</span>
                    <span className="mt-2 block text-xs text-[#737373]">{pkg.msg_number} {t.messageCount} · {pkg.months} {pkg.months === 1 ? t.month : t.months}</span>
                    <span className="mt-4 flex items-baseline gap-2"><span className="text-xl font-semibold">{total.toFixed(2)}</span>{price > total && <span className="text-xs text-[#8e8e8e] line-through">{price.toFixed(2)}</span>}</span>
                  </button>
                );
              })}
            </div>
          )}

          <form onSubmit={placeOrder} className="space-y-5 border-t border-[#dbdbdb] pt-5">
            <h2 className="text-base font-semibold">{t.details}</h2>
            {accountsLoading ? <Loader text={t.account} /> : pageError ? <p role="alert" className="text-sm text-red-600">{pageError}</p> : !accounts.length ? (
              <p className="text-sm text-[#737373]">{t.noAccounts}</p>
            ) : (
              <label className="block space-y-1.5 text-sm font-medium">
                <span>{t.account}</span>
                <select required value={activeInstagramId} onChange={onSelectAccount} className={inputClass}>
                  {!activeInstagramId && <option value="">{t.chooseAccount}</option>}
                  {accounts.map((item) => <option key={item.instagram_id} value={item.instagram_id}>@{item.username || item.name || item.instagram_id} · {item.already_linked ? t.linked : t.notLinked}</option>)}
                </select>
              </label>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1.5 text-sm font-medium"><span>{t.website}</span><input type="url" value={websiteUrl} onChange={(event) => setWebsiteUrl(event.target.value)} className={inputClass} /></label>
              <label className="block space-y-1.5 text-sm font-medium"><span>{t.android}</span><input type="url" value={androidLink} onChange={(event) => setAndroidLink(event.target.value)} className={inputClass} /></label>
            </div>
            <label className="block space-y-1.5 text-sm font-medium"><span>{t.ios}</span><input type="url" value={iosLink} onChange={(event) => setIosLink(event.target.value)} className={inputClass} /></label>
            <label className="block space-y-1.5 text-sm font-medium"><span>{t.context}</span><textarea rows={4} value={aiContext} onChange={(event) => setAiContext(event.target.value)} className={`${inputClass} resize-y`} /></label>
            <label className="block space-y-2 text-sm font-medium">
              <span>{t.file}</span>
              <span className="flex flex-wrap items-center gap-3">
                <span className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#dbdbdb] px-3 py-2 text-sm hover:bg-[#f5f5f5]"><Upload className="h-4 w-4" aria-hidden="true" />{t.file}</span>
                <span className="min-w-0 truncate text-xs text-[#737373]">{aiFile?.name || t.fileNone}</span>
              </span>
              <input ref={aiFileInputRef} type="file" className="sr-only" onChange={onFileChange} />
            </label>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#efefef] pt-4">
              <p className="text-xs text-[#737373]">{t.confirm}</p>
              <button type="submit" disabled={ordering || !activeAccount || !packageId || packagesLoading || accountsLoading}
                className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#0095f6] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1877f2] disabled:cursor-not-allowed disabled:opacity-50">
                {ordering && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}{ordering ? t.ordering : t.order}
              </button>
            </div>
          </form>
        </section>

        <aside className="h-fit space-y-4 border-t border-[#dbdbdb] pt-5 lg:border-t-0 lg:border-s lg:pt-0 lg:ps-6">
          <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-[#737373]" aria-hidden="true" /><h2 className="text-sm font-semibold">{t.file}</h2></div>
          <p className="text-xs leading-5 text-[#737373]">{activeItem?.ai_file || t.noLinkedItem}</p>
          <button type="button" onClick={uploadAiFile} disabled={!aiFile || !activeItem || uploading}
            className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-[#dbdbdb] px-3 py-2 text-sm font-semibold hover:bg-white disabled:cursor-not-allowed disabled:opacity-50">
            {uploading ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Upload className="h-4 w-4" aria-hidden="true" />}{uploading ? t.uploading : t.upload}
          </button>
          {activeAccount?.connected_page_name && <p className="flex items-center gap-2 text-xs text-[#737373]"><ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />{activeAccount.connected_page_name}</p>}
        </aside>
      </div>
    </main>
  );
}
