import { NextRequest, NextResponse } from "next/server";
import { ensureListingsTable, createOffer, listOffers } from "@/lib/turso";

export async function GET(req: NextRequest) {
  const listingId = req.nextUrl.searchParams.get("listing") ?? undefined;
  const seller = req.nextUrl.searchParams.get("seller") ?? undefined;
  const bidder = req.nextUrl.searchParams.get("bidder") ?? undefined;
  try {
    await ensureListingsTable();
    const offers = await listOffers({ listingId, seller, bidder });
    return NextResponse.json({ offers });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not load offers" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  let body: { listingId?: string; bidder?: string; price?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.listingId || !body.bidder || !body.price) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  const price = Number(body.price);
  if (!Number.isFinite(price) || price <= 0) {
    return NextResponse.json({ error: "Offer must be a positive number" }, { status: 400 });
  }

  try {
    await ensureListingsTable();
    const id = `off_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e9).toString(36)}`;
    await createOffer({
      id,
      listingId: body.listingId,
      bidder: body.bidder,
      price: String(price),
    });
    return NextResponse.json(
      {
        offer: { id, listingId: body.listingId, bidder: body.bidder, price: String(price), status: "pending", createdAt: new Date().toISOString() },
      },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not place offer" },
      { status: 400 }
    );
  }
}
