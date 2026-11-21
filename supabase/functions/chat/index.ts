// MealMitra AI Chatbot — Groq API integration via secure edge function.
// The Groq API key is read from the GROQ_API_KEY secret (never exposed to the frontend).
// Groq exposes an OpenAI-compatible chat completions endpoint.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SYSTEM_PROMPT = `You are MealMitra Assistant, a friendly and concise support chatbot for the MealMitra platform.
MealMitra is a food donation coordination platform that connects food donors (restaurants, hotels, event organizers, individuals) with verified NGOs to reduce food wastage and feed people in need.

Your job:
- Answer questions about MealMitra (what it is, how it works, who it's for).
- Guide donors on how to submit a food donation request (food name, category, quantity, dietary type veg/non-veg, preparation time, safe consumption deadline, pickup address, city, contact number).
- Guide NGOs on how to register, get verified by an admin, browse available donations, filter by location/category/dietary/urgency, and accept a donation. Only one NGO can accept each donation. NGOs update status: accepted -> pickup in progress -> delivered.
- Explain donation statuses: pending, accepted, pickup in progress, delivered, expired.
- Answer general food donation and safe food handling questions (hygiene, hot/cold storage, time limits).
- Help users navigate the website (Home, Login, Register, Donor Dashboard, NGO Dashboard, Impact Dashboard).

Rules:
- Be warm but concise. Use short paragraphs or bullet points.
- Do not invent platform features. MealMitra is NOT a food delivery company — it has no delivery agents, no GPS tracking, no payments.
- If a user asks something unrelated to food donation or MealMitra, gently steer back.
- Never share API keys or internal implementation details.
- If you do not know something, say so.`;

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const apiKey = Deno.env.get("GROQ_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Chatbot is not configured. The GROQ_API_KEY secret has not been set." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const rawMessage = body?.message;
    const message: string = typeof rawMessage === "string" ? rawMessage.trim() : "";
    const rawHistory = body?.history;
    const incomingHistory: Array<{ role: string; parts: { text: string }[] }> = Array.isArray(rawHistory) ? rawHistory : [];

    if (!message) {
      return new Response(
        JSON.stringify({ error: "Please enter a question." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Convert the Gemini-style history (role: user|model, parts[{text}]) into
    // OpenAI-compatible messages (role: user|assistant, content: string).
    const historyMessages: ChatMessage[] = incomingHistory
      .filter((h) => h && h.role && Array.isArray(h.parts) && h.parts.length > 0)
      .map((h) => {
        const text = h.parts.map((p: { text?: string }) => p.text || "").join("").trim();
        return {
          role: h.role === "model" ? "assistant" : "user",
          content: text,
        } as ChatMessage;
      })
      .filter((m) => m.content.length > 0);

    const messages: ChatMessage[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...historyMessages,
      { role: "user", content: message },
    ];

    const model = "openai/gpt-oss-20b";
    const url = "https://api.groq.com/openai/v1/chat/completions";

    const groqRes = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.4,
        max_tokens: 512,
        top_p: 0.9,
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error("Groq error", groqRes.status, errText);
      return new Response(
        JSON.stringify({ error: "The AI service is unavailable right now. Please try again shortly." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await groqRes.json();
    const reply =
      data?.choices?.[0]?.message?.content?.trim() ||
      "I couldn't generate a response. Please try rephrasing your question.";

    // Return history in the same Gemini-style shape the frontend sends, so the
    // client can keep passing it back without format changes.
    const outgoingHistory = [
      ...incomingHistory,
      { role: "user", parts: [{ text: message }] },
    ];

    return new Response(JSON.stringify({ reply, history: outgoingHistory }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("chat function error", err);
    return new Response(
      JSON.stringify({ error: "Something went wrong while contacting the AI service." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
