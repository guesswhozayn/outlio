import { Zap, Image as ImageIcon } from "lucide-react";

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
}) {
  return (
    <div className="card" style={{ height: "100%" }}>
      <div className="card-header">
        <div className="card-title">LinkedIn Post / Job Description</div>
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

      <div className="flex-row" style={{ marginBottom: "1rem", gap: "1rem", alignItems: "center" }}>
        <button className="btn btn-secondary" style={{ fontSize: "0.8rem", padding: "0.4rem 0.8rem" }} onClick={handleImageUploadClick}>
          <ImageIcon size={14} /> Upload
        </button>
        <input type="file" ref={imageInputRef} style={{ display: "none" }} accept="image/*" onChange={handleImageChange} />
        {screenshotName && <span style={{ fontSize: "0.8rem", color: "var(--text-primary)" }}>{screenshotName}</span>}
        {screenshotName && (
          <button
            style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
            onClick={() => {
              setScreenshotData(null);
              setScreenshotName("");
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
          <>
            <Zap size={16} /> Extract
          </>
        )}
      </button>
    </div>
  );
}
