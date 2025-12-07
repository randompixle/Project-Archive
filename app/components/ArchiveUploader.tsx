"use client";

import type React from "react";
import { useState } from "react";

type UploadState = "idle" | "uploading" | "success" | "error";

export default function ArchiveUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [state, setState] = useState<UploadState>("idle");
  const [message, setMessage] = useState<string>("");
  const [storedPath, setStoredPath] = useState<string>("");

  const handleUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      setState("error");
      setMessage("Choose a file to upload.");
      return;
    }

    const data = new FormData();
    data.append("file", file);

    setState("uploading");
    setMessage("Uploading...");
    setStoredPath("");

    try {
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
            On Vercel, files land in Blob (public link). In dev, they stash to <code>archives/</code>.
            Set <code>BLOB_READ_WRITE_TOKEN</code> to enable uploads on Vercel.
          </p>
        </div>
        <span className="pill">{state === "uploading" ? "Uploading..." : "Blob or local"}</span>
      </div>

      <form onSubmit={handleUpload} className="grid grid--two">
        <label className="card" style={{ borderStyle: "dashed", cursor: "pointer" }}>
          <strong>Select a file</strong>
          <p className="muted">Images, zips, logs—anything you want to share.</p>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            style={{ marginTop: "8px" }}
          />
        </label>
        <div className="stack">
          <button className="btn btn--primary" type="submit" disabled={state === "uploading"}>
            {state === "uploading" ? "Uploading..." : "Get share link"}
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
