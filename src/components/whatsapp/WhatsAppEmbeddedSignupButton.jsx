import { useState } from "react";
import { Link2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { usePost } from "../../hooks/usePost";
import { API_ENDPOINTS } from "../../utils/constants";
import { loginWithWhatsAppEmbeddedSignup } from "../../utils/facebookAuth";

export default function WhatsAppEmbeddedSignupButton({ t, refetch }) {
  const [connecting, setConnecting] = useState(false);
  const { execute } = usePost();

  const connect = async () => {
    setConnecting(true);
    try {
      const code = await loginWithWhatsAppEmbeddedSignup();
      if (!code) return;

      const result = await execute(API_ENDPOINTS.WHATSAPP.EMBEDDED_SIGNUP, { code });
      if (!result.success || result.data?.status === false) {
        toast.error(result.error || result.data?.message || t.error);
        return;
      }

      toast.success(result.data?.message || t.success);
      await refetch();
    } catch (error) {
      toast.error(error.message || t.error);
    } finally {
      setConnecting(false);
    }
  };

  return (
    <button
      type="button"
      disabled={connecting}
      onClick={connect}
      className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-[var(--primary-foreground)] disabled:cursor-not-allowed disabled:opacity-50"
      style={{ background: "var(--primary)" }}
    >
      {connecting
        ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        : <Link2 className="h-4 w-4" aria-hidden="true" />}
      {connecting ? t.connecting : t.label}
    </button>
  );
}
