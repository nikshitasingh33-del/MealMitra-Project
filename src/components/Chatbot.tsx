// Floating AI chatbot widget. Calls the /functions/v1/chat edge function
// which proxies to the Groq API with the server-side GROQ_API_KEY.

import { useState, useRef, useEffect, type FormEvent } from "react";
import { MessageSquare, X, Send, Sparkles, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { cn, timeAgo } from "@/lib/utils";

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
  ts: number;
}

const SUGGESTIONS = [
  "How do I donate food?",
  "How does an NGO register and get verified?",
  "What are the donation statuses?",
  "How is food safety handled?",
];

const WELCOME: ChatMsg = {
  role: "assistant",
  content:
    "Hi! I'm MealMitra Assistant. I can help you donate food, register as an NGO, understand how the platform works, and answer safe food handling questions. What would you like to know?",
  ts: Date.now(),
};

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading, open]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMsg = { role: "user", content: trimmed, ts: Date.now() };
    const history = [...messages.slice(1).map((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }))];

    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke("chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, history }),
      });

      if (invokeError) {
        const msg = "Unable to reach the AI assistant. Please try again.";
        setError(msg);
        setMessages((m) => [...m, { role: "assistant", content: msg, ts: Date.now() }]);
      } else if (data?.error) {
        const msg = data.error;
        setError(msg);
        setMessages((m) => [...m, { role: "assistant", content: msg, ts: Date.now() }]);
      } else if (data?.reply) {
        setMessages((m) => [...m, { role: "assistant", content: data.reply, ts: Date.now() }]);
      } else {
        const msg = "The AI assistant returned an unexpected response. Please try again.";
        setError(msg);
        setMessages((m) => [...m, { role: "assistant", content: msg, ts: Date.now() }]);
      }
    } catch (err) {
      const isNetwork =
        err instanceof TypeError &&
        (err.message.includes("Failed to fetch") || err.message.includes("NetworkError"));
      const msg = isNetwork
        ? "Unable to reach the MealMitra AI assistant. Please check your connection and try again."
        : "Something went wrong while contacting the AI service. Please try again.";
      setError(msg);
      setMessages((m) => [...m, { role: "assistant", content: msg, ts: Date.now() }]);
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    send(input);
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-3.5 text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 hover:scale-105 transition animate-float"
          aria-label="Open AI Assistant"
        >
          <Sparkles className="w-5 h-5" />
          <span className="font-semibold text-sm hidden sm:inline">Ask AI Assistant</span>
        </button>
      )}

      {open && (
        <div className="fixed bottom-5 right-5 z-50 w-[calc(100vw-2.5rem)] sm:w-96 max-h-[70vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-slate-200 animate-slide-up overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="font-semibold text-sm">MealMitra Assistant</p>
                <p className="text-[10px] text-emerald-100">Powered by Groq AI</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white p-1">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-slate-50">
            {messages.map((m, i) => (
              <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                    m.role === "user"
                      ? "bg-emerald-600 text-white rounded-br-md"
                      : "bg-white text-slate-700 border border-slate-200 rounded-bl-md"
                  )}
                >
                  <p className="whitespace-pre-wrap">{m.content}</p>
                  <p className={cn("text-[10px] mt-1", m.role === "user" ? "text-emerald-100" : "text-slate-400")}>
                    {timeAgo(new Date(m.ts).toISOString())}
                  </p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-3.5 py-2.5 flex items-center gap-2 text-slate-500 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-600" /> Thinking...
                </div>
              </div>
            )}
            {messages.length === 1 && !loading && (
              <div className="space-y-1.5 pt-1">
                <p className="text-[11px] text-slate-400 px-1">Try asking:</p>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="block w-full text-left text-xs rounded-lg bg-white border border-slate-200 px-3 py-2 text-slate-600 hover:border-emerald-300 hover:text-emerald-700 transition"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            {error && error.includes("not configured") && (
              <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                The Groq API key isn't configured yet. Add the <code>GROQ_API_KEY</code> secret in your Supabase project settings (Edge Functions &gt; Secrets).
                Meanwhile explore the <Link to="/how-it-works" className="underline" onClick={() => setOpen(false)}>guide</Link>.
              </div>
            )}
          </div>

          <form onSubmit={onSubmit} className="border-t border-slate-200 p-2.5 flex items-center gap-2 bg-white">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about donating, NGOs, food safety..."
              className="flex-1 rounded-full border border-slate-300 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center disabled:opacity-40 hover:bg-emerald-700 transition flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
