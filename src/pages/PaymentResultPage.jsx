import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import axiosInstance from "../api/axiosInstance";
import { API_ENDPOINTS } from "../utils/constants";
import { hasChatAccess } from "../utils/chatAccess";

export default function PaymentResultPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  useEffect(() => {
    const pageId = sessionStorage.getItem("pendingPaymentPageId");
    const paymobSuccess = params.get("success") === "true";

    // فشل الدفع أو مفيش صفحة معلّقة
    if (!pageId || !paymobSuccess) {
      sessionStorage.removeItem("pendingPaymentPageId");
      navigate("/fb-pages", { replace: true });
      return;
    }

    let tries = 0;
    let done = false;

    const check = async () => {
      if (done) return;
      tries += 1;
      try {
        const { data } = await axiosInstance.get(API_ENDPOINTS.MESSENGER.PAGES);
        const page = (data?.data ?? []).find((p) => String(p.page_id) === pageId);
        if (hasChatAccess(page)) {
          done = true;
          sessionStorage.removeItem("pendingPaymentPageId");
          navigate(`/fb-pages/${encodeURIComponent(pageId)}/manage`, { replace: true });
          return;
        }
      } catch {
        /* نحاول تاني */
      }
      if (tries >= 10) {
        done = true;
        sessionStorage.removeItem("pendingPaymentPageId");
        navigate("/fb-pages", { replace: true });
      }
    };

    check();
    const timer = setInterval(check, 2000);
    return () => { done = true; clearInterval(timer); };
  }, [navigate, params]);

  return (
    <div className="grid min-h-screen place-items-center bg-[var(--background)]">
      <div className="flex items-center gap-3 text-sm text-[var(--muted-foreground)]">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
       payment is being processed, please wait...
      </div>
    </div>
  );
}