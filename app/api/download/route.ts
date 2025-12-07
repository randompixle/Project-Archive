import { NextResponse } from "next/server";
import { list } from "@vercel/blob";

export const runtime = "nodejs";

type Manifest = {
  fileId: string;
  store: string;
  originalName: string;
  contentType: string;
  totalSize: number;
  totalChunks: number;
  chunkPrefix: string;
};

export async function GET(request: Request) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "BLOB_READ_WRITE_TOKEN not set." }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const fileId = searchParams.get("id");
  const store = searchParams.get("store") === "pages" ? "pages" : "files";

  if (!fileId) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const prefix = `chunks/${store}/${fileId}/`;
  const blobList = await list({ prefix, token });
  const manifestEntry = blobList.blobs?.find((b) => b.pathname?.endsWith("manifest.json"));
  if (!manifestEntry?.url) {
    return NextResponse.json({ error: "Manifest not found" }, { status: 404 });
  }

  const manifestRes = await fetch(manifestEntry.url, { cache: "no-store" });
  if (!manifestRes.ok) {
    return NextResponse.json({ error: "Unable to fetch manifest" }, { status: 500 });
  }
  const manifest = (await manifestRes.json()) as Manifest;

  const chunkEntries =
    blobList.blobs
      ?.filter((b) => b.pathname?.includes("chunk-"))
      ?.map((b) => ({
        url: b.url,
        index: Number(b.pathname?.split("chunk-").pop())
      }))
      ?.filter((c) => Number.isFinite(c.index)) ?? [];

  chunkEntries.sort((a, b) => a.index - b.index);

  if (!chunkEntries.length) {
    return NextResponse.json({ error: "No chunks found" }, { status: 404 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for (const chunk of chunkEntries) {
          const res = await fetch(chunk.url);
          if (!res.body) throw new Error("No body in chunk fetch");
          const reader = res.body.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }
        }
        controller.close();
      } catch (err) {
        console.error(err);
        controller.error(err);
      }
    }
  });

  return new NextResponse(stream, {
    status: 200,
    headers: {
      "Content-Type": manifest.contentType || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(manifest.originalName)}"`,
      ...(manifest.totalSize ? { "Content-Length": manifest.totalSize.toString() } : {})
    }
  });
}
