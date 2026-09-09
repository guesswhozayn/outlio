import { Share2 } from "lucide-react";

export default function JobInput({
  postText,
  setPostText,
  logs,
  handleImageUploadClick,
  imageInputRef,
  handleImageChange,
  screenshotName,
  setScreenshotData,
  setScreenshotName,
  isParsing,
  screenshotData,
  handleParsePost,
  isSharedFromLinkedIn,
}) {
  return (
    <div className="card" style={{ height: "100%" }}>
      <div className="card-header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div className="card-title">Paste Job Description</div>
          {isSharedFromLinkedIn && (
            <span
              style={{
                fontSize: "0.7rem",
                fontWeight: 600,
                padding: "0.15rem 0.5rem",
                borderRadius: "9999px",
                background: "rgba(10, 102, 194, 0.15)",
                color: "#0a66c2",
                border: "1px solid rgba(10, 102, 194, 0.3)",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.25rem",
              }}
            >
              <Share2 size={11} /> Shared from LinkedIn
            </span>
          )}
        </div>
        <span className="char-counter">{postText.length} chars</span>
      </div>

      <div className="form-group" style={{ flexGrow: 1 }}>
        <textarea
          className="post-input"
          placeholder="Paste the LinkedIn post description or job listing content here. Our AI extractor will pull out the target email, position, skills, and manager details..."
          value={postText}
          onChange={(e) => setPostText(e.target.value)}
        />
      </div>

      <div className="status-text" style={{ minHeight: "1rem" }}>
        {logs.length > 0 && logs[logs.length - 1].message}
      </div>

      <div className="flex-row" style={{ marginBottom: "1rem", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
        <button
          type="button"
          className="btn btn-secondary"
          style={{ fontSize: "0.8rem", padding: "0.4rem 0.8rem" }}
          onClick={async () => {
            try {
              if (navigator.clipboard && navigator.clipboard.readText) {
                const clipText = await navigator.clipboard.readText();
                if (clipText && clipText.trim()) {
                  setPostText(clipText);
                  if (clipText.includes("linkedin.com/")) {
                    handleParsePost(clipText);
                  }
                }
              }
            } catch (err) {
              console.warn("Clipboard access denied or unavailable:", err);
            }
          }}
          title="Paste link or text from clipboard and auto-extract"
        >
          Paste
        </button>

        <button className="btn btn-secondary" style={{ fontSize: "0.8rem", padding: "0.4rem 0.8rem" }} onClick={handleImageUploadClick}>
          Upload
        </button>
        <input type="file" ref={imageInputRef} style={{ display: "none" }} accept="image/*" onChange={handleImageChange} />
        {screenshotName && <span style={{ fontSize: "0.8rem", color: "var(--text-primary)" }}>{screenshotName}</span>}
        {screenshotName && (
          <button
            style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
            onClick={() => {
              setScreenshotData(null);
              setScreenshotName("");
              if (imageInputRef.current) {
                imageInputRef.current.value = "";
              }
            }}
          >
            ✕
          </button>
        )}
      </div>

      <button
        className="btn btn-primary"
        disabled={isParsing || (!postText.trim() && !screenshotData)}
        onClick={handleParsePost}
      >
        {isParsing ? (
          <>
            <div className="spinner"></div> Extracting details...
          </>
        ) : (
          "Extract"
        )}
      </button>
    </div>
  );
}
