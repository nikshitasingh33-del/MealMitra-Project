// Diagnostic function: tests the Groq API and returns the raw result.
// Uses SUPABASE_URL and SUPABASE_ANON_KEY (auto-injected secrets) to self-test.
// Does NOT expose the GROQ_API_KEY value.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const apiKey = Deno.env.get("GROQ_API_KEY");
  const hasKey = Boolean(apiKey);
  const keyLen = apiKey?.length ?? 0;
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const reqUrl = req.url;

  if (!apiKey) {
    return new Response(JSON.stringify({
      error: "GROQ_API_KEY is not set",
      hasKey: false,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // Test 1: Direct Groq API call
  const model = "openai/gpt-oss-20b";
  const url = "https://api.groq.com/openai/v1/chat/completions";

  let groqResult: Record<string, unknown> = {};
  try {
    const groqRes = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: "Say hello in 5 words." },
        ],
        temperature: 0.4,
        max_tokens: 50,
      }),
    });

    const resText = await groqRes.text();
    let resJson: unknown = null;
    try { resJson = JSON.parse(resText); } catch { /* not json */ }

    groqResult = {
      groqStatus: groqRes.status,
      groqOk: groqRes.ok,
      groqResponse: resJson ?? resText.slice(0, 500),
      model,
      endpoint: url,
    };
  } catch (err) {
    groqResult = {
      groqError: err instanceof Error ? err.message : String(err),
    };
  }

  // Test 2: Self-call the chat function via SUPABASE_URL
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
  let selfTest: Record<string, unknown> = {};

  if (supabaseUrl && supabaseAnonKey) {
    try {
      const selfRes = await fetch(`${supabaseUrl}/functions/v1/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseAnonKey}`,
          apikey: supabaseAnonKey,
        },
        body: JSON.stringify({ message: "hello", history: [] }),
      });
      const selfText = await selfRes.text();
      let selfJson: unknown = null;
      try { selfJson = JSON.parse(selfText); } catch { /* not json */ }
      selfTest = {
        selfStatus: selfRes.status,
        selfOk: selfRes.ok,
        selfResponse: selfJson ?? selfText.slice(0, 500),
        chatEndpoint: `${supabaseUrl}/functions/v1/chat`,
      };
    } catch (err) {
      selfTest = {
        selfError: err instanceof Error ? err.message : String(err),
        chatEndpoint: `${supabaseUrl}/functions/v1/chat`,
      };
    }
  } else {
    selfTest = {
      supabaseUrl: supabaseUrl ?? "NOT SET",
      supabaseAnonKey: supabaseAnonKey ? "SET" : "NOT SET",
    };
  }

  return new Response(JSON.stringify({
    hasKey: true,
    keyLen,
    supabaseUrl: supabaseUrl ?? "NOT SET",
    reqUrl,
    groq: groqResult,
    selfTest,
  }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
});
