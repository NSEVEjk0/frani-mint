import { NextRequest, NextResponse } from "next/server";
import { ensureListingsTable, createListing, listListings } from "@/lib/turso";

export async function GET() {
  try {
    await ensureListingsTable();
    const listings = await listListings();
    return NextResponse.json({ listings });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not load listings" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  let body: {
    id?: string;
    nftId?: string;
    seller?: string;
    price?: string;
    expiresAt?: string;
    nft?: {
      name?: string;
      description?: string;
      symbol?: string;
      collection?: string;
      imageType?: string;
      image?: string;
      artSeed?: number;
    };
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.id || !body.nftId || !body.seller || !body.price || !body.nft?.name) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  const price = Number(body.price);
  if (!Number.isFinite(price) || price <= 0) {
    return NextResponse.json({ error: "Price must be a positive number" }, { status: 400 });
  }

  try {
    await ensureListingsTable();
    await createListing({
      id: body.id,
      nftId: body.nftId,
      seller: body.seller,
      price: String(price),
      listedAt: new Date().toISOString(),
      expiresAt: body.expiresAt,
      nft: {
        name: body.nft.name,
        description: body.nft.description ?? "",
        symbol: body.nft.symbol ?? "",
        collection: body.nft.collection,
        imageType: body.nft.imageType ?? "generative",
        image: body.nft.image,
        artSeed: body.nft.artSeed,
      },
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not create listing" },
      { status: 400 }
    );
  }
}
