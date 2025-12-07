"use client";

import { useState } from "react";

type UploadState = "idle" | "uploading" | "success" | "error";

// Keep chunks small to fit Vercel function payload limits (reduce if you hit 413s).
const CHUNK_SIZE = 2 * 1024 * 1024; // ~2 MB

export default function ChunkUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<UploadState>("idle");
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState("");

  const uploadChunks = async (currentFile: File) => {
    const totalChunks = Math.ceil(currentFile.size / CHUNK_SIZE);
    const fileId = crypto.randomUUID();
    const store = "files";

    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, currentFile.size);
      const chunk = currentFile.slice(start, end);

      const res = await fetch(`/api/chunk?store=${store}`, {
        method: "POST",
        headers: {
          "x-file-id": fileId,
          "x-chunk-index": i.toString(),
          "x-total-chunks": totalChunks.toString(),
          "x-original-name": currentFile.name,
          "x-content-type": currentFile.type || "application/octet-stream",
          "x-total-size": currentFile.size.toString()
        },
        body: chunk
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        throw new Error(errorBody.error || "Chunk upload failed");
      }

      setProgress(Math.round(((i + 1) / totalChunks) * 100));
    }

    return { fileId, store };
  };

  const handleUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      setState("error");
      setMessage("Pick a file first.");
      return;
    }

    setState("uploading");
    setMessage("Uploading in chunks...");
    setProgress(0);
    setDownloadUrl("");

    try {
      const { fileId, store } = await uploadChunks(file);
      const link = `/api/download?id=${encodeURIComponent(fileId)}&store=${store}`;
      setDownloadUrl(link);
      setState("success");
      setMessage("Uploaded! Use the link below to download.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setState("error");
      setMessage(msg);
    }
  };

  return (
    <div className="card">
      <div className="section__header" style={{ marginBottom: "10px" }}>
        <div>
          <p className="section__title">Large file uploader (chunked)</p>
          <p className="muted">
            Splits files into ~2 MB chunks, stores them on Blob, and provides a stitched download link.
          </p>
        </div>
        <span className="pill">{state === "uploading" ? `Uploading ${progress}%` : "Blob chunks"}</span>
      </div>

      <form onSubmit={handleUpload} className="grid grid--two">
        <label className="card" style={{ borderStyle: "dashed", cursor: "pointer" }}>
          <strong>Select a large file</strong>
          <p className="muted">We will split it into ~2 MB pieces automatically.</p>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            style={{ marginTop: "8px" }}
          />
        </label>
        <div className="stack">
          <button className="btn btn--primary" type="submit" disabled={state === "uploading"}>
            {state === "uploading" ? "Uploading..." : "Upload in chunks"}
          </button>
          {message && (
            <span className={`pill ${state === "success" ? "pill--accent" : "pill--warm"}`}>{message}</span>
          )}
          {downloadUrl && (
            <div className="stack">
              <code style={{ background: "rgba(255,255,255,0.04)", padding: "6px", borderRadius: "8px" }}>
                {downloadUrl}
              </code>
              <a className="btn btn--ghost" href={downloadUrl} target="_blank" rel="noreferrer">
                Download stitched file
              </a>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
