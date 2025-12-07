"use client";

import { useEffect, useState } from "react";

type Comment = { id: string; text: string; createdAt: number };

export default function FileComments({ storageKey }: { storageKey: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      try {
        setComments(JSON.parse(raw));
      } catch {
        setComments([]);
      }
    }
  }, [storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(comments));
  }, [comments, storageKey]);

  const add = () => {
    if (!input.trim()) return;
    const next: Comment = { id: crypto.randomUUID(), text: input.trim(), createdAt: Date.now() };
    setComments([next, ...comments]);
    setInput("");
  };

  return (
    <div className="card">
      <div className="section__header">
        <div>
          <p className="section__title">Comments</p>
          <p className="muted">Stored locally in your browser for this file.</p>
        </div>
      </div>
      <div className="stack">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Leave a note about this file..."
          style={{
            width: "100%",
            minHeight: "80px",
            borderRadius: "12px",
            border: "1px solid var(--border)",
            background: "rgba(255,255,255,0.02)",
            color: "var(--text)",
            padding: "10px"
          }}
        />
        <button className="btn btn--primary" type="button" onClick={add}>
          Add comment
        </button>
      </div>
      <div style={{ marginTop: "14px" }}>
        {comments.length === 0 && <p className="muted">No comments yet.</p>}
        {comments.map((comment) => (
          <div
            key={comment.id}
            className="card"
            style={{ background: "var(--panel-2)", marginBottom: "10px" }}
          >
            <p style={{ margin: 0 }}>{comment.text}</p>
            <p className="muted" style={{ margin: "6px 0 0", fontSize: "13px" }}>
              {new Date(comment.createdAt).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
