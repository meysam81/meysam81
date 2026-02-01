// Server-side AI proxy for Cloudflare Workers AI
// Keeps API credentials secure on server

import type { APIRoute } from "astro";

export const prerender = false;

export var POST: APIRoute = async function handlePost({ request }) {
  try {
    // Try multiple methods to read the body (Astro SSR compatibility)
    var body: { prompt?: string; provider?: string; maxTokens?: number };

    try {
      // Method 1: Direct JSON parsing (preferred)
      body = await request.json();
    } catch {
      // Method 2: Fallback to text parsing
      try {
        var rawBody = await request.text();
        if (!rawBody || rawBody.trim() === "") {
          return new Response(
            JSON.stringify({ error: "Request body is empty" }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            },
          );
        }
        body = JSON.parse(rawBody);
      } catch {
        return new Response(
          JSON.stringify({ error: "Invalid JSON in request body" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }
    }

    var { prompt, provider } = body;

    if (!prompt) {
      return new Response(JSON.stringify({ error: "Prompt required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // For now, return a placeholder response
    // In production, this would call Cloudflare Workers AI
    // using environment variables for API credentials

    // Example Cloudflare Workers AI call (when deployed):
    // var CF_ACCOUNT_ID = import.meta.env.CF_ACCOUNT_ID;
    // var CF_API_TOKEN = import.meta.env.CF_API_TOKEN;
    // var response = await fetch(
    //   `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/@cf/meta/llama-3.2-1b-instruct`,
    //   {
    //     method: "POST",
    //     headers: {
    //       "Authorization": `Bearer ${CF_API_TOKEN}`,
    //       "Content-Type": "application/json",
    //     },
    //     body: JSON.stringify({ prompt, max_tokens: maxTokens }),
    //   }
    // );

    return new Response(
      JSON.stringify({
        result:
          "[Remote AI is configured but not yet deployed. Local AI is available.]",
        provider: provider || "cloudflare",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    var message = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
