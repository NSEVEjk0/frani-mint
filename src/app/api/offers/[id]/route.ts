import { NextRequest, NextResponse } from "next/server";
import { ensureListingsTable, updateOfferStatus } from "@/lib/turso";

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

  if (!body.by || (body.action !== "accept" && body.action !== "reject")) {
    return NextResponse.json({ error: "action (accept|reject) and by are required" }, { status: 400 });
  }

  try {
    await ensureListingsTable();
    const status = body.action === "accept" ? "accepted" : "rejected";
    await updateOfferStatus(params.id, status, body.by);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not update offer" },
      { status: 400 }
    );
  }
}
