"use client";
import React, { useState, useEffect } from "react";

export default function PublicFileShare() {
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [publicUrl, setPublicUrl] = useState<string | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);

  // Load uploaded files from localStorage on mount
  useEffect(() => {
    const cached = localStorage.getItem("public_uploaded_files");
    if (cached) {
      setUploadedFiles(JSON.parse(cached));
    }
  }, []);

  // Save uploaded files to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("public_uploaded_files", JSON.stringify(uploadedFiles));
  }, [uploadedFiles]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
    setPublicUrl(null);
    setError("");
    setSuccess("");
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setPublicUrl(null);
    if (!file) {
      setError("Please select a file.");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("note", note);
      const res = await fetch("/api/upload-public-file", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        setSuccess("File uploaded successfully!");
        setPublicUrl(data.url);
        setUploadedFiles((prev) => [{ url: data.url, name: file.name, note, date: new Date().toISOString() }, ...prev]);
        setFile(null);
        setNote("");
      } else {
        setError(data.message || "Upload failed");
      }
    } catch (err) {
      setError("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="public-file-bg">
      <div className="public-file-centerbox">
        <h1 className="public-file-title">Public File Share</h1>
        <form onSubmit={handleUpload} className="public-file-form">
          <input type="file" onChange={handleFileChange} accept="*" className="public-file-input" />
          <input
            type="text"
            placeholder="Add a note (optional)"
            value={note}
            onChange={e => setNote(e.target.value)}
            className="public-file-note"
          />
          <button type="submit" disabled={uploading} className="public-file-btn">
            {uploading ? "Uploading..." : "Upload File"}
          </button>
        </form>
        {error && <div className="public-file-error">{error}</div>}
        {success && <div className="public-file-success">{success}</div>}
        {publicUrl && (
          <div className="public-file-linkbox">
            <strong>Public Link:</strong>
            <div>
              <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="public-file-link">{publicUrl}</a>
            </div>
          </div>
        )}
        <h2 className="public-file-subtitle">Uploaded Files</h2>
        <ul className="public-file-list">
          {uploadedFiles.map((f, i) => (
            <li key={i} className="public-file-listitem">
              <div><strong>{f.name}</strong> <span className="public-file-date">{f.date ? new Date(f.date).toLocaleString() : ""}</span></div>
              {f.note && <div className="public-file-noteview">Note: {f.note}</div>}
              <a href={f.url} target="_blank" rel="noopener noreferrer" className="public-file-link">{f.url}</a>
            </li>
          ))}
          {uploadedFiles.length === 0 && <li className="public-file-empty">No files uploaded yet.</li>}
        </ul>
      </div>
      <style>{`
        .public-file-bg {
          min-height: 100vh;
          background: #111;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }
        .public-file-centerbox {
          background: #fff;
          border-radius: 16px;
          box-shadow: 0 4px 32px #0002;
          max-width: 420px;
          width: 100%;
          margin: 0 auto;
          padding: 32px 24px 24px 24px;
          display: flex;
          flex-direction: column;
          align-items: stretch;
        }
        .public-file-title {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 18px;
          color: #222;
          text-align: center;
        }
        .public-file-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 18px;
        }
        .public-file-input {
          padding: 8px 0;
        }
        .public-file-note {
          padding: 8px;
          border-radius: 6px;
          border: 1px solid #ccc;
        }
        .public-file-btn {
          padding: 10px 0;
          border-radius: 6px;
          background: #0070f3;
          color: #fff;
          border: 0;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: background 0.2s;
        }
        .public-file-btn:disabled {
          background: #aaa;
          cursor: not-allowed;
        }
        .public-file-error {
          color: #b00;
          margin-bottom: 8px;
          text-align: center;
        }
        .public-file-success {
          color: #090;
          margin-bottom: 8px;
          text-align: center;
        }
        .public-file-linkbox {
          margin-bottom: 16px;
          text-align: center;
        }
        .public-file-link {
          color: #0070f3;
          word-break: break-all;
          font-size: 0.95rem;
        }
        .public-file-subtitle {
          font-size: 1.1rem;
          font-weight: 600;
          margin: 18px 0 10px 0;
          color: #333;
        }
        .public-file-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .public-file-listitem {
          background: #f7f7f7;
          border-radius: 8px;
          margin-bottom: 12px;
          padding: 12px 10px;
          box-shadow: 0 1px 4px #0001;
          font-size: 0.98rem;
        }
        .public-file-date {
          color: #888;
          font-size: 0.85em;
          margin-left: 8px;
        }
        .public-file-noteview {
          font-size: 0.93em;
          color: #555;
          margin-bottom: 2px;
        }
        .public-file-empty {
          color: #888;
          text-align: center;
        }
        @media (max-width: 600px) {
          .public-file-centerbox {
            padding: 18px 4vw 12px 4vw;
            max-width: 98vw;
          }
          .public-file-title {
            font-size: 1.3rem;
          }
        }
      `}</style>
    </div>
  );
}
