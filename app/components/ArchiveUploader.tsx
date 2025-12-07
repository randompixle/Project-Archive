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
      setMessage("Choose a file to archive locally.");
      return;
    }

    const data = new FormData();
    data.append("file", file);

    setState("uploading");
    setMessage("Uploading...");
    setStoredPath("");

    try {
      const response = await fetch("/api/archive", {
        method: "POST",
        body: data
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.error || "Upload failed");
      }

      const body = await response.json();
      setState("success");
      setStoredPath(body.storedAt);
      setMessage(`Stored ${body.fileName} (${body.bytes} bytes)`);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Upload failed";
      setState("error");
      setMessage(errorMessage);
    }
  };

  return (
    <div className="card">
      <div className="section__header" style={{ marginBottom: "10px" }}>
        <div>
          <p className="section__title">Local archive drop</p>
          <p className="muted">
            Drop a file and it will be written to <code>archives/</code> on this server.
          </p>
        </div>
        <span className="pill">{state === "uploading" ? "Uploading..." : "Local only"}</span>
      </div>

      <form onSubmit={handleUpload} className="grid grid--two">
        <label className="card" style={{ borderStyle: "dashed", cursor: "pointer" }}>
          <strong>Select a file</strong>
          <p className="muted">Logs, bundles, evidence—anything you want to stash locally.</p>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            style={{ marginTop: "8px" }}
          />
        </label>
        <div className="stack">
          <button className="btn btn--primary" type="submit" disabled={state === "uploading"}>
            {state === "uploading" ? "Archiving..." : "Archive locally"}
          </button>
          {message && (
            <span className={`pill ${state === "success" ? "pill--accent" : "pill--warm"}`}>
              {message}
            </span>
          )}
          {storedPath && (
            <span className="muted">Stored at: <code>{storedPath}</code></span>
          )}
        </div>
      </form>
    </div>
  );
}
