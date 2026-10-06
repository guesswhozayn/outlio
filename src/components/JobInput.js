import { ArrowLeftRight } from "lucide-react";

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
  viewMode,
  setViewMode,
  hasExtracted,
}) {
  return (
    <div className="card" style={{ height: "100%" }}>
      <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div className="card-title">Paste Job Description</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span className="char-counter">{postText.length} chars</span>
          {setViewMode && (
            <button
              type="button"
              className="icon-btn"
              onClick={() => setViewMode("workspace")}
              title="Switch to Email Box"
              aria-label="Switch to Email Box"
            >
              <ArrowLeftRight size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="form-group" style={{ flexGrow: 1 }}>
        <textarea
          className="post-input"
          placeholder="Paste job description text..."
          value={postText}
          onChange={(e) => setPostText(e.target.value)}
        />
      </div>

      <div className="status-text" style={{ minHeight: "1rem" }}>
        {logs.length > 0 && logs[logs.length - 1].message}
      </div>

      <div className="flex-row" style={{ marginBottom: "1rem", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
        <button
          type="button"
          className="btn btn-secondary"
          style={{ fontSize: "0.8rem", padding: "0.4rem 0.8rem", minHeight: "36px" }}
          onClick={async () => {
            try {
              if (navigator.clipboard && navigator.clipboard.readText) {
                const clipText = await navigator.clipboard.readText();
                if (clipText && clipText.trim()) {
                  setPostText(clipText);
                }
              }
            } catch (err) {
              console.warn("Clipboard access denied or unavailable:", err);
            }
          }}
          title="Paste text from clipboard"
        >
          Paste
        </button>

        <button
          type="button"
          className="btn btn-secondary"
          style={{ fontSize: "0.8rem", padding: "0.4rem 0.8rem", minHeight: "36px" }}
          onClick={handleImageUploadClick}
        >
          Upload Screenshot
        </button>
        <input type="file" ref={imageInputRef} style={{ display: "none" }} accept="image/*" onChange={handleImageChange} />
        {screenshotName && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", background: "var(--bg-secondary)", padding: "0.25rem 0.5rem", borderRadius: "var(--radius-sm)", border: "1px solid var(--glass-border)", maxWidth: "100%", overflow: "hidden" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{screenshotName}</span>
            <button
              style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.85rem", padding: "0 0.2rem" }}
              onClick={() => {
                setScreenshotData(null);
                setScreenshotName("");
                if (imageInputRef.current) {
                  imageInputRef.current.value = "";
                }
              }}
              aria-label="Remove screenshot"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      <button
        className="btn btn-primary"
        disabled={isParsing || (!postText.trim() && !screenshotData)}
        onClick={() => handleParsePost()}
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
