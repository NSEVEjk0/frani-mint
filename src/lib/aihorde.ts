/**
 * AI Horde client helpers (free, anonymous).
 *
 * Submit a text prompt, then poll until the image is ready. The actual HTTP
 * calls go through our own /api/horde route so the anonymous key and CORS
 * never touch the browser.
 *
 * Queue behavior: AI Horde's queue_position counts down to 0 while the job is
 * in the queue; once it reaches 0 the job is being processed (or about to be).
 * A job can sit at 0 for a while before a worker picks it up, so we keep
 * polling until `done` is true, `faulted`/`expired` is true, or we time out.
 */

export const HORDE_MODELS = [
  "AlbedoBase XL (SDXL)",
  "Juggernaut XL",
  "RealVisXL V4.0",
] as const;

export type HordeModel = (typeof HORDE_MODELS)[number];

export interface HordeSubmitResult {
  id: string;
}

export interface HordeStatusResult {
  done: boolean;
  image?: string;
  waiting?: number;
  queue?: number;
  processing?: boolean;
  faulted?: boolean;
  expired?: boolean;
  message?: string;
}

export async function submitHorde(prompt: string, model: string): Promise<HordeSubmitResult> {
  const res = await fetch("/api/horde", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, model }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Could not start image generation");
  }
  return data as HordeSubmitResult;
}

export async function pollHorde(id: string): Promise<HordeStatusResult> {
  const res = await fetch(`/api/horde?id=${encodeURIComponent(id)}`);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Could not check generation status");
  }
  return data as HordeStatusResult;
}

/**
 * Poll until done, calling `onTick` with status each round.
 * Max ~12 minutes (120 polls × 6s). A job that faults or expires is an error.
 */
export async function waitForHorde(
  id: string,
  onTick?: (status: HordeStatusResult) => void
): Promise<string> {
  const MAX_ATTEMPTS = 120;
  const INTERVAL_MS = 6000;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const status = await pollHorde(id);
    onTick?.(status);

    if (status.faulted) {
      throw new Error(status.message || "The AI worker reported an error — try again");
    }
    if (status.expired) {
      throw new Error("The generation request expired — please try again");
    }
    if (status.done) {
      if (!status.image) throw new Error("Generation finished without an image");
      return status.image;
    }

    await new Promise((r) => setTimeout(r, INTERVAL_MS));
  }
  throw new Error("Generation timed out — the free queue is busy right now. Try again in a few minutes.");
}
