# Project memory

## Product intent & audience

- Production-grade website with an integrated AI chatbot ("Powered by Groq AI").
- Chatbot must return real, dynamic AI responses — no mock or canned replies.

## Brand personality & voice

- User values thorough debugging over cosmetic changes; wants root-cause fixes and clear summaries of cause + resolution.

## Visual design & UX direction

- Existing website and chatbot design must be preserved; UI already updated to say "Powered by Groq AI".
- No visual changes needed in this task.

## Decisions, constraints & rationale

- **Stack:** Vite + React + Tailwind CSS + Lucide React icons; `@/` path alias → `src/`.
- **Backend:** Supabase Edge Functions (Deno) at `supabase/functions/chat/index.ts`.
- **Groq model:** Switched from `llama-3.3-70b-versatile` (now Enterprise-only, returns 404 `model_not_found`) to `openai/gpt-oss-20b` (available on free/developer tier).
- **Known Groq free/developer-tier models:** `llama-3.1-8b-instant`, `meta-llama/llama-4-scout-17b-16e-instruct`, `openai/gpt-oss-20b`, `openai/gpt-oss-120b`, `qwen/qwen3-32b`.
- **Secrets:** `GROQ_API_KEY` configured in Supabase Edge Function secrets; never printed or exposed client-side.
- **Error handling:** Edge function catches Groq errors and returns generic user-friendly message ("The AI service is unavailable right now"); real error logged server-side only. Diagnostic output was temporarily added then reverted.
- **CORS & request/response:** Endpoint, headers, body format, and response parsing were verified correct; only model ID was wrong.
- **Redeployment:** Function redeployed after model ID change; end-to-end test confirmed 200 with genuine AI response.

## Open questions & assumptions

- Groq model availability may change over time; if chatbot breaks again, first check current model tier access.
- No verification done on rate limits for `openai/gpt-oss-20b` under sustained usage.