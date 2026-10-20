import { NextRequest, NextResponse } from "next/server";

/**
 * AI Horde proxy.
 *
 * The browser talks to this route; this route talks to AI Horde. Keeps the
 * anonymous API key out of the client bundle and sidesteps CORS entirely.
 *
 *   POST /api/horde  { prompt, model }  ->  { id }
 *   GET  /api/horde?id=<id>             ->  { done, image?, waiting?, queue?, processing?, faulted?, expired?, message? }
 */

const HORDE_API = "https://aihorde.net/api/v2";
const ANON_KEY = "0000000000";

const DEFAULT_MODEL = "AlbedoBase XL (SDXL)";

export async function POST(req: NextRequest) {
  let body: { prompt?: string; model?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const prompt = (body.prompt ?? "").trim();
  if (!prompt) {
    return NextResponse.json({ error: "A prompt is required" }, { status: 400 });
  }
  if (prompt.length > 1000) {
    return NextResponse.json({ error: "Prompt too long (max 1000 chars)" }, { status: 400 });
  }

  const model = body.model?.trim() || DEFAULT_MODEL;

  try {
    const res = await fetch(`${HORDE_API}/generate/async`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: ANON_KEY,
      },
      body: JSON.stringify({
        prompt,
        params: {
          width: 512,
          height: 512,
          nsfw: false,
          censor_nsfw: true,
          steps: 25,
          sampler_name: "k_euler_a",
        },
        models: [model],
      }),
      signal: AbortSignal.timeout(30_000),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { error: data.message || `AI Horde returned ${res.status}` },
        { status: res.status }
      );
    }
    if (!data.id) {
      return NextResponse.json({ error: "AI Horde did not return a job id" }, { status: 502 });
    }
    return NextResponse.json({ id: data.id as string });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not reach AI Horde" },
      { status: 502 }
    );
  }
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  try {
    const res = await fetch(`${HORDE_API}/generate/status/${encodeURIComponent(id)}`, {
      headers: { apikey: ANON_KEY },
      signal: AbortSignal.timeout(20_000),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { error: data.message || `AI Horde returned ${res.status}` },
        { status: res.status }
      );
    }

    // Surface terminal failure states so the client can stop polling.
    if (data.faulted) {
      return NextResponse.json({
        done: false,
        faulted: true,
        message: data.message || "Worker faulted",
      });
    }
    if (data.expired) {
      return NextResponse.json({ done: false, expired: true });
    }

    if (data.done && Array.isArray(data.generations) && data.generations.length > 0) {
      const img = data.generations[0].img as string | undefined;
      if (img) {
        return NextResponse.json({ done: true, image: `data:image/jpeg;base64,${img}` });
      }
      return NextResponse.json({ error: "Generation finished without an image" }, { status: 502 });
    }

    return NextResponse.json({
      done: false,
      waiting: typeof data.waiting === "number" ? data.waiting : undefined,
      queue: typeof data.queue_position === "number" ? data.queue_position : undefined,
      processing: data.processing === true,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not reach AI Horde" },
      { status: 502 }
    );
  }
}
