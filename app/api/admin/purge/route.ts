import { NextResponse } from "next/server";
import { del, list } from "@vercel/blob";

export const runtime = "nodejs";

type StoreScope = "all" | "files" | "pages";

function prefixesFor(store: StoreScope) {
  if (store === "files") return ["uploads/files/", "chunks/files/"];
  if (store === "pages") return ["uploads/pages/", "chunks/pages/"];
  return ["uploads/files/", "uploads/pages/", "chunks/files/", "chunks/pages/"];
}

export async function POST(request: Request) {
  const adminToken = process.env.ADMIN_PURGE_TOKEN;
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (!adminToken) {
    return NextResponse.json({ error: "ADMIN_PURGE_TOKEN not set" }, { status: 500 });
  }
  if (!blobToken) {
    return NextResponse.json({ error: "BLOB_READ_WRITE_TOKEN not set" }, { status: 500 });
  }

  const provided = request.headers.get("x-admin-token");
  if (!provided || provided !== adminToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const store: StoreScope = body?.store === "pages" ? "pages" : body?.store === "files" ? "files" : "all";

  let deleted = 0;
  const errors: string[] = [];

  for (const prefix of prefixesFor(store)) {
    try {
      const blobs = await list({ prefix, token: blobToken });
      for (const blob of blobs.blobs ?? []) {
        if (!blob.url) continue;
        try {
          await del(blob.url, { token: blobToken });
          deleted += 1;
        } catch (err) {
          errors.push(`delete failed for ${blob.url}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    } catch (err) {
      errors.push(`list failed for ${prefix}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return NextResponse.json({ deleted, errors });
}
