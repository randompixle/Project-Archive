"use client";

import type React from "react";
import { useState } from "react";

type UploadState = "idle" | "uploading" | "success" | "error";

export default function ArchiveUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<UploadState>("idle");
  const [message, setMessage] = useState<string>("");
  const [storedPath, setStoredPath] = useState<string>("");
  const [mode, setMode] = useState<"standard" | "chunked">("standard");
  const [progress, setProgress] = useState(0);

  const CHUNK_SIZE = 2 * 1024 * 1024; // ~2 MB to stay under Vercel limits

  const handleUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      setState("error");
      setMessage("Choose a file to upload.");
      return;
    }

    setState("uploading");
    setMessage("Uploading...");
    setStoredPath("");
    setProgress(0);

    try {
      if (mode === "standard") {
        const data = new FormData();
        data.append("file", file);
        const response = await fetch("/api/archive", { method: "POST", body: data });
        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          throw new Error(errorBody.error || "Upload failed");
        }
        const body = await response.json();
        setState("success");
        setStoredPath(body.storedAt);
        setMessage(
          body.location === "vercel-blob"
            ? "Uploaded to Vercel Blob. Share the link below."
            : "Saved locally in archives/. Shareable in dev only."
        );
      } else {
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
        const fileId = crypto.randomUUID();
        const store = "files";

        for (let i = 0; i < totalChunks; i++) {
          const start = i * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, file.size);
          const chunk = file.slice(start, end);

          const res = await fetch(`/api/chunk?store=${store}`, {
            method: "POST",
            headers: {
              "x-file-id": fileId,
              "x-chunk-index": i.toString(),
              "x-total-chunks": totalChunks.toString(),
              "x-original-name": file.name,
              "x-content-type": file.type || "application/octet-stream",
              "x-total-size": file.size.toString()
            },
            body: chunk
          });

          if (!res.ok) {
            const errorBody = await res.json().catch(() => ({}));
            throw new Error(errorBody.error || "Chunk upload failed");
          }

          setProgress(Math.round(((i + 1) / totalChunks) * 100));
        }

        const link = `/api/download?id=${encodeURIComponent(fileId)}&store=${store}`;
        setStoredPath(link);
        setState("success");
        setMessage("Chunked upload complete. Download with the link below.");
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Upload failed";
      setState("error");
      setMessage(errorMessage);
    }
  };

  const handleCopy = async () => {
    if (!storedPath) return;
    try {
      await navigator.clipboard.writeText(storedPath);
      setMessage("Link copied to clipboard.");
    } catch {
      setMessage("Copy failed. Manually copy the link below.");
    }
  };

  return (
    <div className="card">
      <div className="section__header" style={{ marginBottom: "10px" }}>
        <div>
          <p className="section__title">Upload & share</p>
          <p className="muted">
            Standard for small/medium files, chunked for large files. On Vercel, files land in Blob (public link). In
            dev, they stash to <code>archives/</code>. Set <code>BLOB_READ_WRITE_TOKEN</code> to enable uploads on
            Vercel.
          </p>
        </div>
        <span className="pill">
          {state === "uploading"
            ? mode === "chunked"
              ? `Chunking ${progress}%`
              : "Uploading..."
            : mode === "chunked"
            ? "Chunked"
            : "Standard"}
        </span>
      </div>

      <form onSubmit={handleUpload} className="grid grid--two">
        <label className="card" style={{ borderStyle: "dashed", cursor: "pointer" }}>
          <strong>Select a file</strong>
          <p className="muted">Images, zips, ISOs—anything you want to share.</p>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            style={{ marginTop: "8px" }}
          />
        </label>
        <div className="stack">
          <div className="stack" style={{ marginBottom: "6px" }}>
            <label className="pill">
              <input
                type="radio"
                name="mode"
                value="standard"
                checked={mode === "standard"}
                onChange={() => setMode("standard")}
              />
              Standard
            </label>
            <label className="pill">
              <input
                type="radio"
                name="mode"
                value="chunked"
                checked={mode === "chunked"}
                onChange={() => setMode("chunked")}
              />
              Chunked
            </label>
          </div>
          <button className="btn btn--primary" type="submit" disabled={state === "uploading"}>
            {state === "uploading" ? "Uploading..." : mode === "chunked" ? "Upload chunked" : "Get share link"}
          </button>
          {message && (
            <span className={`pill ${state === "success" ? "pill--accent" : "pill--warm"}`}>
              {message}
            </span>
          )}
          {storedPath && (
            <div className="stack">
              <code style={{ background: "rgba(255,255,255,0.04)", padding: "8px", borderRadius: "8px" }}>
                {storedPath}
              </code>
              <button className="btn btn--ghost" type="button" onClick={handleCopy}>
                Copy link
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
