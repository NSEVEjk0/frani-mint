import { NextRequest, NextResponse } from "next/server";
import { ensureListingsTable, cancelListing, markSold } from "@/lib/turso";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  let body: { action?: string; by?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    await ensureListingsTable();
    if (body.action === "cancel") {
      if (!body.by) return NextResponse.json({ error: "Missing 'by'" }, { status: 400 });
      await cancelListing(params.id, body.by);
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not update listing" },
      { status: 400 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  let body: { buyer?: string; soldPrice?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.buyer) {
    return NextResponse.json({ error: "Missing buyer" }, { status: 400 });
  }

  try {
    await ensureListingsTable();
    await markSold(params.id, body.buyer, body.soldPrice);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not complete purchase" },
      { status: 400 }
    );
  }
}
