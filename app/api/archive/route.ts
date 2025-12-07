import { mkdir, readdir, stat, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { list, put } from "@vercel/blob";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const originalName =
    typeof (file as any).name === "string" ? (file as any).name : "upload.bin";
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const fileName = `${Date.now()}-${safeName}`;
  const targetPath = `uploads/${fileName}`;

  // Prefer Vercel Blob when token is available (Vercel deploys).
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const result = await put(targetPath, file, { access: "public" });
    return NextResponse.json({
      fileName,
      storedAt: result.url,
      bytes: typeof file.size === "number" ? file.size : undefined,
      location: "vercel-blob"
    });
  }

  // On Vercel without a Blob token, skip local writes (ephemeral FS) and prompt for setup.
  if (process.env.VERCEL) {
    return NextResponse.json(
      {
        error: "BLOB_READ_WRITE_TOKEN not set. Add a Blob store in Vercel and set the token."
      },
      { status: 400 }
    );
  }

  // Local dev fallback writes to ./archives.
  const buffer = Buffer.from(await file.arrayBuffer());
  const archiveDir = path.join(process.cwd(), "archives");
  await mkdir(archiveDir, { recursive: true });
  const filePath = path.join(archiveDir, fileName);
  await writeFile(filePath, buffer);

  return NextResponse.json({
    fileName,
    storedAt: `archives/${fileName}`,
    bytes: buffer.length,
    location: "local"
  });
}

export async function GET() {
  // Prefer Blob listing in production.
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blobList = await list({ prefix: "uploads/" });
    const files =
      blobList.blobs?.map((blob: any) => ({
        name: blob.pathname?.split("/").pop() ?? blob.pathname ?? "file",
        url: blob.url,
        size: blob.size ?? null,
        uploadedAt: blob.uploadedAt ?? null,
        contentType: blob.contentType ?? null
      })) ?? [];

    return NextResponse.json({ source: "vercel-blob", files });
  }

  if (process.env.VERCEL) {
    return NextResponse.json(
      {
        error: "BLOB_READ_WRITE_TOKEN not set. Add a Blob store in Vercel and set the token to list uploads."
      },
      { status: 400 }
    );
  }

  // Local listing from ./archives.
  const archiveDir = path.join(process.cwd(), "archives");
  try {
    const entries = await readdir(archiveDir);
    const files = await Promise.all(
      entries.map(async (entry) => {
        const entryPath = path.join(archiveDir, entry);
        const info = await stat(entryPath);
        return {
          name: entry,
          url: `archives/${entry}`,
          size: info.size,
          uploadedAt: info.mtime.toISOString(),
          contentType: null
        };
      })
    );
    return NextResponse.json({ source: "local", files });
  } catch {
    return NextResponse.json({ source: "local", files: [] });
  }
}
