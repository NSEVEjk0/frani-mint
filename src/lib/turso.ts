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
      nft_name TEXT NOT NULL,
      nft_description TEXT NOT NULL DEFAULT '',
      nft_symbol TEXT NOT NULL DEFAULT '',
      nft_image_type TEXT NOT NULL DEFAULT 'generative',
      nft_image TEXT,
      nft_art_seed INTEGER
    )
  `);
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
  nft: {
    name: string;
    description: string;
    symbol: string;
    imageType: string;
    image?: string;
    artSeed?: number;
  };
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
    nft: {
      name: String(r.nft_name),
      description: String(r.nft_description ?? ""),
      symbol: String(r.nft_symbol ?? ""),
      imageType: String(r.nft_image_type ?? "generative"),
      image: r.nft_image ? String(r.nft_image) : undefined,
      artSeed: r.nft_art_seed != null ? Number(r.nft_art_seed) : undefined,
    },
  };
}

export async function createListing(entry: {
  id: string;
  nftId: string;
  seller: string;
  price: string;
  listedAt: string;
  nft: {
    name: string;
    description: string;
    symbol: string;
    imageType: string;
    image?: string;
    artSeed?: number;
  };
}) {
  const db = client();
  await db.execute({
    sql: `INSERT INTO mint_listings
      (id, nft_id, seller, price, listed_at, status, nft_name, nft_description, nft_symbol, nft_image_type, nft_image, nft_art_seed)
      VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, ?)`,
    args: [
      entry.id,
      entry.nftId,
      entry.seller,
      entry.price,
      entry.listedAt,
      entry.nft.name,
      entry.nft.description,
      entry.nft.symbol,
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

export async function markSold(id: string, buyer: string) {
  const db = client();
  const existing = await db.execute({ sql: "SELECT * FROM mint_listings WHERE id = ?", args: [id] });
  const row = existing.rows[0] as unknown as Record<string, unknown> | undefined;
  if (!row) throw new Error("Listing not found");
  if (String(row.status) !== "active") throw new Error("Listing is not active");
  if (String(row.seller) === buyer) throw new Error("You can't buy your own listing");
  await db.execute({
    sql: "UPDATE mint_listings SET status = 'sold', buyer = ?, sold_at = ? WHERE id = ?",
    args: [buyer, new Date().toISOString(), id],
  });
  await db.close();
}
