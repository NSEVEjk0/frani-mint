/**
 * AI Horde client helpers (free, anonymous).
 *
 * Submit a text prompt, then poll until the image is ready. The actual HTTP
 * calls go through our own /api/horde route so the anonymous key and CORS
 * never touch the browser.
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

/** Poll until done, calling `onTick` with status each round. Max ~4 minutes. */
export async function waitForHorde(
  id: string,
  onTick?: (status: HordeStatusResult) => void
): Promise<string> {
  const MAX_ATTEMPTS = 40;
  const INTERVAL_MS = 6000;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const status = await pollHorde(id);
    onTick?.(status);
    if (status.done) {
      if (!status.image) throw new Error("Generation finished without an image");
      return status.image;
    }
    await new Promise((r) => setTimeout(r, INTERVAL_MS));
  }
  throw new Error("Generation timed out — please try again");
}
