import MessengerChatPage from "./MessengerChatPage";
import InstagramChatPage from "./InstagramChatPage";
import WhatsAppChatPage from "./WhatsAppChatPage";

export default function ChatsPage() {
  return (
    <main className="grid grid-cols-1 gap-3 bg-[var(--background)] p-2 md:grid-cols-2 2xl:grid-cols-3">
      <section className="h-[calc(100dvh-4.5rem)] min-h-[520px] min-w-0 overflow-hidden rounded-xl border border-[var(--border)]">
          <MessengerChatPage embedded />
      </section>
      <section className="h-[calc(100dvh-4.5rem)] min-h-[520px] min-w-0 overflow-hidden rounded-xl border border-[var(--border)]">
          <InstagramChatPage embedded />
      </section>
      <section className="h-[calc(100dvh-4.5rem)] min-h-[520px] min-w-0 overflow-hidden rounded-xl border border-[var(--border)]">
          <WhatsAppChatPage embedded />
      </section>
    </main>
  );
}
