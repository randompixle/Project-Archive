import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

export const runtime = "nodejs";

const CHUNK_PREFIX = "chunks";

export async function POST(request: Request) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "BLOB_READ_WRITE_TOKEN not set. Configure Vercel Blob to enable chunk uploads." },
      { status: 400 }
    );
  }

  const { searchParams } = new URL(request.url);
  const store = searchParams.get("store") === "pages" ? "pages" : "files";

  const fileId = request.headers.get("x-file-id");
  const chunkIndexHeader = request.headers.get("x-chunk-index");
  const totalChunksHeader = request.headers.get("x-total-chunks");
  const originalName = request.headers.get("x-original-name") || "upload.bin";
  const contentType = request.headers.get("x-content-type") || "application/octet-stream";
  const totalSizeHeader = request.headers.get("x-total-size");

  if (!fileId || !chunkIndexHeader || !totalChunksHeader || !totalSizeHeader) {
    return NextResponse.json(
      { error: "Missing chunk metadata headers (file-id, chunk-index, total-chunks, total-size)." },
      { status: 400 }
    );
  }

  const chunkIndex = Number(chunkIndexHeader);
  const totalChunks = Number(totalChunksHeader);
  const totalSize = Number(totalSizeHeader);

  if (
    Number.isNaN(chunkIndex) ||
    Number.isNaN(totalChunks) ||
    chunkIndex < 0 ||
    totalChunks <= 0 ||
    chunkIndex >= totalChunks
  ) {
    return NextResponse.json({ error: "Invalid chunk indexes." }, { status: 400 });
  }

  const fileBlob = await request.blob();
  const chunkPath = `${CHUNK_PREFIX}/${store}/${fileId}/chunk-${chunkIndex}`;

  const result = await put(chunkPath, fileBlob, { access: "public", token, contentType: "application/octet-stream" });

  const isLast = chunkIndex === totalChunks - 1;
  let manifestUrl: string | null = null;

  if (isLast) {
    const manifestPath = `${CHUNK_PREFIX}/${store}/${fileId}/manifest.json`;
    const manifest = {
      fileId,
      store,
      originalName,
      contentType,
      totalSize,
      totalChunks,
      chunkPrefix: `${CHUNK_PREFIX}/${store}/${fileId}/`
    };
    const manifestBuffer = Buffer.from(JSON.stringify(manifest, null, 2));
    const manifestRes = await put(manifestPath, manifestBuffer, {
      access: "public",
      token,
      contentType: "application/json"
    });
    manifestUrl = manifestRes.url;
  }

  return NextResponse.json({
    chunkUrl: result.url,
    chunkIndex,
    totalChunks,
    done: isLast,
    manifestUrl
  });
}
