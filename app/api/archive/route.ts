import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

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

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const archiveDir = path.join(process.cwd(), "archives");
  await mkdir(archiveDir, { recursive: true });

  const filePath = path.join(archiveDir, fileName);
  await writeFile(filePath, buffer);

  return NextResponse.json({
    fileName,
    storedAt: `archives/${fileName}`,
    bytes: buffer.length
  });
}
