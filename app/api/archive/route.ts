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

  const { searchParams } = new URL(request.url);
  const storeParam = searchParams.get("store");
  const store = storeParam === "pages" ? "pages" : "files";
  const token = process.env.BLOB_READ_WRITE_TOKEN;

  const originalName =
    typeof (file as any).name === "string" ? (file as any).name : "upload.bin";
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const fileName = `${Date.now()}-${safeName}`;
  const targetPath = `uploads/${store}/${fileName}`;

  // Prefer Vercel Blob when token is available (Vercel deploys).
  if (token) {
    const result = await put(targetPath, file, { access: "public", token });
    return NextResponse.json({
      fileName,
      storedAt: result.url,
      bytes: typeof file.size === "number" ? file.size : undefined,
      location: "vercel-blob",
      store
    });
  }

  // On Vercel without a Blob token, skip local writes (ephemeral FS) and prompt for setup.
  if (process.env.VERCEL) {
    return NextResponse.json(
      {
        error: "BLOB_READ_WRITE_TOKEN not set. Add a Blob store and set BLOB_READ_WRITE_TOKEN."
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
    location: "local",
    store
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filterName = searchParams.get("name");
  const storeParam = searchParams.get("store");
  const store = storeParam === "pages" ? "pages" : "files";
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  const prefix = `uploads/${store}/`;

  const matchesName = (fileName: string, target: string) => {
    if (fileName === target) return true;
    const stripSuffix = (name: string) => {
      const dot = name.lastIndexOf(".");
      const ext = dot >= 0 ? name.slice(dot) : "";
      const base = dot >= 0 ? name.slice(0, dot) : name;
      const lastDash = base.lastIndexOf("-");
      if (lastDash === -1) return { base, ext };
      const suffix = base.slice(lastDash + 1);
      if (suffix.length >= 6) {
        return { base: base.slice(0, lastDash), ext };
      }
      return { base, ext };
    };

    const a = stripSuffix(fileName);
    const b = stripSuffix(target);
    return a.base === b.base && a.ext === b.ext;
  };

  // Prefer Blob listing in production.
  if (token) {
    const blobList = await list({ prefix, token });
    let files =
      blobList.blobs?.map((blob: any) => ({
        name: blob.pathname?.split("/").pop() ?? blob.pathname ?? "file",
        url: blob.url,
        size: blob.size ?? null,
        uploadedAt: blob.uploadedAt ?? null,
        contentType: blob.contentType ?? null
      })) ?? [];

    if (filterName) {
      let filtered = files.filter((f) => f.name === filterName);
      if (filtered.length === 0) {
        filtered = files.filter((f) => matchesName(f.name, filterName));
      }
      files = filtered;
    }

    return NextResponse.json({ source: "vercel-blob", store, files });
  }

  if (process.env.VERCEL) {
    return NextResponse.json(
      {
        error: "BLOB_READ_WRITE_TOKEN not set. Add a Blob store and set BLOB_READ_WRITE_TOKEN."
      },
      { status: 400 }
    );
  }

  // Local listing from ./archives.
  const archiveDir = path.join(process.cwd(), "archives");
  try {
    const entries = await readdir(archiveDir);
    let files = await Promise.all(
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
    if (filterName) {
      let filtered = files.filter((f) => f.name === filterName);
      if (filtered.length === 0) {
        filtered = files.filter((f) => matchesName(f.name, filterName));
      }
      files = filtered;
    }
    return NextResponse.json({ source: "local", store, files });
  } catch {
    return NextResponse.json({ source: "local", store, files: [] });
  }
}
