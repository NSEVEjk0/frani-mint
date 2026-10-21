import { createClient } from "@libsql/client";

/**
 * Turso client for the shared marketplace (server-side only).
 *
 * Listings live in a shared edge SQLite database so every visitor sees the
 * same marketplace, regardless of browser or wallet.
 */

function client() {
  const url = process.env.TURSO_DATABASE_URL;
  const token = process.env.TURSO_AUTH_TOKEN;
  if (!url || !token) {
    throw new Error("Turso is not configured (TURSO_DATABASE_URL / TURSO_AUTH_TOKEN)");
  }
  return createClient({ url, authToken: token });
}

export async function ensureListingsTable() {
  const db = client();
  await db.execute(`
    CREATE TABLE IF NOT EXISTS mint_listings (
      id TEXT PRIMARY KEY,
      nft_id TEXT NOT NULL,
      seller TEXT NOT NULL,
      price TEXT NOT NULL,
      listed_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      buyer TEXT,
      sold_at TEXT,
      sold_price TEXT,
      expires_at TEXT,
      nft_name TEXT NOT NULL,
      nft_description TEXT NOT NULL DEFAULT '',
      nft_symbol TEXT NOT NULL DEFAULT '',
      nft_collection TEXT,
      nft_image_type TEXT NOT NULL DEFAULT 'generative',
      nft_image TEXT,
      nft_art_seed INTEGER
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS mint_offers (
      id TEXT PRIMARY KEY,
      listing_id TEXT NOT NULL,
      bidder TEXT NOT NULL,
      price TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TEXT NOT NULL
    )
  `);

  // Idempotent migrations for tables created before these columns existed.
  const MIGRATIONS: Array<[string, string]> = [
    ["mint_listings", "sold_price TEXT"],
    ["mint_listings", "expires_at TEXT"],
    ["mint_listings", "nft_collection TEXT"],
  ];
  for (const [table, col] of MIGRATIONS) {
    try {
      await db.execute(`ALTER TABLE ${table} ADD COLUMN ${col}`);
    } catch {
      // Column already exists — fine.
    }
  }

  await db.close();
}

export interface ListingRow {
  id: string;
  nftId: string;
  seller: string;
  price: string;
  listedAt: string;
  status: "active" | "sold" | "cancelled";
  buyer: string | null;
  soldAt: string | null;
  soldPrice: string | null;
  expiresAt: string | null;
  nft: {
    name: string;
    description: string;
    symbol: string;
    collection?: string;
    imageType: string;
    image?: string;
    artSeed?: number;
  };
}

export interface OfferRow {
  id: string;
  listingId: string;
  bidder: string;
  price: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
}

function rowToListing(r: Record<string, unknown>): ListingRow {
  return {
    id: String(r.id),
    nftId: String(r.nft_id),
    seller: String(r.seller),
    price: String(r.price),
    listedAt: String(r.listed_at),
    status: String(r.status) as ListingRow["status"],
    buyer: r.buyer ? String(r.buyer) : null,
    soldAt: r.sold_at ? String(r.sold_at) : null,
    soldPrice: r.sold_price ? String(r.sold_price) : null,
    expiresAt: r.expires_at ? String(r.expires_at) : null,
    nft: {
      name: String(r.nft_name),
      description: String(r.nft_description ?? ""),
      symbol: String(r.nft_symbol ?? ""),
      collection: r.nft_collection ? String(r.nft_collection) : undefined,
      imageType: String(r.nft_image_type ?? "generative"),
      image: r.nft_image ? String(r.nft_image) : undefined,
      artSeed: r.nft_art_seed != null ? Number(r.nft_art_seed) : undefined,
    },
  };
}

function rowToOffer(r: Record<string, unknown>): OfferRow {
  return {
    id: String(r.id),
    listingId: String(r.listing_id),
    bidder: String(r.bidder),
    price: String(r.price),
    status: String(r.status) as OfferRow["status"],
    createdAt: String(r.created_at),
  };
}

export async function createListing(entry: {
  id: string;
  nftId: string;
  seller: string;
  price: string;
  listedAt: string;
  expiresAt?: string;
  nft: {
    name: string;
    description: string;
    symbol: string;
    collection?: string;
    imageType: string;
    image?: string;
    artSeed?: number;
  };
}) {
  const db = client();
  await db.execute({
    sql: `INSERT INTO mint_listings
      (id, nft_id, seller, price, listed_at, status, expires_at, nft_name, nft_description, nft_symbol, nft_collection, nft_image_type, nft_image, nft_art_seed)
      VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      entry.id,
      entry.nftId,
      entry.seller,
      entry.price,
      entry.listedAt,
      entry.expiresAt ?? null,
      entry.nft.name,
      entry.nft.description,
      entry.nft.symbol,
      entry.nft.collection ?? null,
      entry.nft.imageType,
      entry.nft.image ?? null,
      entry.nft.artSeed ?? null,
    ],
  });
  await db.close();
}

export async function listListings(includeCancelled = false): Promise<ListingRow[]> {
  const db = client();
  const res = await db.execute({
    sql: `SELECT * FROM mint_listings
      WHERE status IN ('active', 'sold') OR (status = 'cancelled' AND ?)
      ORDER BY listed_at DESC`,
    args: [includeCancelled ? 1 : 0],
  });
  await db.close();
  return res.rows.map((r) => rowToListing(r as unknown as Record<string, unknown>));
}

export async function cancelListing(id: string, by: string) {
  const db = client();
  const existing = await db.execute({ sql: "SELECT * FROM mint_listings WHERE id = ?", args: [id] });
  const row = existing.rows[0] as unknown as Record<string, unknown> | undefined;
  if (!row) throw new Error("Listing not found");
  if (String(row.status) !== "active") throw new Error("Listing is not active");
  if (String(row.seller) !== by) throw new Error("Only the seller can cancel");
  await db.execute({
    sql: "UPDATE mint_listings SET status = 'cancelled' WHERE id = ?",
    args: [id],
  });
  await db.close();
}

export async function markSold(id: string, buyer: string, soldPrice?: string) {
  const db = client();
  const existing = await db.execute({ sql: "SELECT * FROM mint_listings WHERE id = ?", args: [id] });
  const row = existing.rows[0] as unknown as Record<string, unknown> | undefined;
  if (!row) throw new Error("Listing not found");
  if (String(row.status) !== "active") throw new Error("Listing is not active");
  if (String(row.seller) === buyer) throw new Error("You can't buy your own listing");
  await db.execute({
    sql: "UPDATE mint_listings SET status = 'sold', buyer = ?, sold_at = ?, sold_price = ? WHERE id = ?",
    args: [buyer, new Date().toISOString(), soldPrice ?? null, id],
  });
  await db.close();
}

/* ------------------------------ offers ------------------------------ */

export async function createOffer(entry: {
  id: string;
  listingId: string;
  bidder: string;
  price: string;
}) {
  const db = client();
  const existing = await db.execute({
    sql: "SELECT * FROM mint_listings WHERE id = ?",
    args: [entry.listingId],
  });
  const row = existing.rows[0] as unknown as Record<string, unknown> | undefined;
  if (!row) throw new Error("Listing not found");
  if (String(row.status) !== "active") throw new Error("Listing is not active");
  if (String(row.seller) === entry.bidder) throw new Error("You can't offer on your own listing");
  await db.execute({
    sql: "INSERT INTO mint_offers (id, listing_id, bidder, price, status, created_at) VALUES (?, ?, ?, ?, 'pending', ?)",
    args: [entry.id, entry.listingId, entry.bidder, entry.price, new Date().toISOString()],
  });
  await db.close();
}

export async function listOffers(params?: { listingId?: string; seller?: string }): Promise<OfferRow[]> {
  const db = client();
  let sql = "SELECT * FROM mint_offers WHERE 1=1";
  const args: (string | number | bigint | null | Uint8Array)[] = [];
  if (params?.listingId) {
    sql += " AND listing_id = ?";
    args.push(params.listingId);
  }
  if (params?.seller) {
    sql += " AND listing_id IN (SELECT id FROM mint_listings WHERE seller = ?)";
    args.push(params.seller);
  }
  sql += " ORDER BY created_at DESC";
  const res = await db.execute({ sql, args });
  await db.close();
  return res.rows.map((r) => rowToOffer(r as unknown as Record<string, unknown>));
}

export async function updateOfferStatus(id: string, status: "accepted" | "rejected", by: string) {
  const db = client();
  const existing = await db.execute({ sql: "SELECT * FROM mint_offers WHERE id = ?", args: [id] });
  const row = existing.rows[0] as unknown as Record<string, unknown> | undefined;
  if (!row) throw new Error("Offer not found");
  if (String(row.status) !== "pending") throw new Error("Offer is no longer pending");
  // Only the listing seller may accept/reject.
  const listing = await db.execute({
    sql: "SELECT * FROM mint_listings WHERE id = ?",
    args: [String(row.listing_id)],
  });
  const lrow = listing.rows[0] as unknown as Record<string, unknown> | undefined;
  if (!lrow || String(lrow.seller) !== by) throw new Error("Only the seller can respond to offers");
  await db.execute({
    sql: "UPDATE mint_offers SET status = ? WHERE id = ?",
    args: [status, id],
  });
  await db.close();
}
