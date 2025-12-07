import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

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
