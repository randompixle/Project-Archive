"use client";

import { useState } from "react";

type Scope = "all" | "files" | "pages";

export default function PurgeAllCard() {
  const [token, setToken] = useState("");
  const [scope, setScope] = useState<Scope>("all");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [deleted, setDeleted] = useState<number | null>(null);

  const handlePurge = async () => {
    if (!token.trim()) {
      setMessage("Enter the admin token to proceed.");
      return;
    }
    setBusy(true);
    setMessage("Purging...");
    setErrors([]);
    setDeleted(null);
    try {
      const res = await fetch("/api/admin/purge", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token.trim()
        },
        body: JSON.stringify({ store: scope })
      });
      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.error || "Failed to purge");
      }
      setDeleted(body.deleted ?? 0);
      setErrors(body.errors || []);
      setMessage("Purge complete.");
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Purge failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card" style={{ border: "1px solid rgba(255,0,0,0.2)" }}>
      <div className="section__header">
        <div>
          <p className="section__title">Danger zone: delete all</p>
          <p className="muted">
            Deletes uploads from Blob (uploads/ and chunks/). Requires <code>ADMIN_PURGE_TOKEN</code>. This cannot be
            undone.
          </p>
        </div>
        <span className="pill pill--warm">Destructive</span>
      </div>
      <div className="stack">
        <div className="stack" style={{ marginBottom: "8px" }}>
          <label className="pill">
            <input
              type="radio"
              name="scope"
              value="all"
              checked={scope === "all"}
              onChange={() => setScope("all")}
            />
            All
          </label>
          <label className="pill">
            <input
              type="radio"
              name="scope"
              value="files"
              checked={scope === "files"}
              onChange={() => setScope("files")}
            />
            Files only
          </label>
          <label className="pill">
            <input
              type="radio"
              name="scope"
              value="pages"
              checked={scope === "pages"}
              onChange={() => setScope("pages")}
            />
            Pages only
          </label>
        </div>
        <input
          type="password"
          placeholder="Admin purge token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          style={{
            padding: "10px",
            borderRadius: "10px",
            border: "1px solid var(--border)",
            background: "rgba(255,255,255,0.02)",
            color: "var(--text)"
          }}
        />
        <button className="btn btn--primary" type="button" onClick={handlePurge} disabled={busy}>
          {busy ? "Deleting..." : "Delete everything in scope"}
        </button>
        {message && <span className="pill">{message}</span>}
        {deleted !== null && <span className="muted">Deleted: {deleted}</span>}
        {errors.length > 0 && (
          <div className="card" style={{ background: "rgba(255,0,0,0.05)" }}>
            <p className="muted">Errors:</p>
            <ul>
              {errors.map((e) => (
                <li key={e} style={{ color: "#f9c87c" }}>
                  {e}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
