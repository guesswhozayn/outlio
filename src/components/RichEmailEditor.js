"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  RemoveFormatting,
  Palette,
  Undo,
  Redo,
  Eye,
  Code,
  Type,
  X
} from "lucide-react";
import { textToHtml, htmlToPlainText } from "@/lib/emailFormatter";

const FONT_FAMILIES = [
  { label: "Sans Serif", value: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" },
  { label: "Georgia (Serif)", value: "Georgia, serif" },
  { label: "Times New Roman", value: "'Times New Roman', Times, serif" },
  { label: "Courier New (Mono)", value: "'Courier New', Courier, monospace" },
  { label: "Trebuchet MS", value: "'Trebuchet MS', 'Lucida Sans Unicode', sans-serif" },
  { label: "Arial", value: "Arial, Helvetica, sans-serif" },
];

const FONT_SIZES = [
  { label: "Small (13px)", value: "13px" },
  { label: "Normal (15px)", value: "15px" },
  { label: "Medium (18px)", value: "18px" },
  { label: "Large (22px)", value: "22px" },
  { label: "Heading (26px)", value: "26px" },
];

const QUICK_COLORS = [
  { label: "Default", value: "inherit", colorCode: "var(--text-primary)" },
  { label: "Slate", value: "#475569", colorCode: "#475569" },
  { label: "Blue", value: "#2563eb", colorCode: "#2563eb" },
  { label: "Emerald", value: "#059669", colorCode: "#059669" },
  { label: "Rose", value: "#dc2626", colorCode: "#dc2626" },
  { label: "Amber", value: "#d97706", colorCode: "#d97706" },
  { label: "Purple", value: "#7c3aed", colorCode: "#7c3aed" },
];

export default function RichEmailEditor({
  emailBody,
  setEmailBody,
  emailHtml,
  setEmailHtml,
  setIsManuallyEdited,
  recipientEmail = "",
  subject = "",
  settings = {},
  setSettings,
}) {
  const [editorMode, setEditorMode] = useState("rich");
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [overrideFont, setOverrideFont] = useState(null);
  const [overrideSize, setOverrideSize] = useState(null);

  const selectedFont = overrideFont ?? settings?.EMAIL_FONT_FAMILY ?? FONT_FAMILIES[0].value;
  const selectedSize = overrideSize ?? settings?.EMAIL_FONT_SIZE ?? "15px";

  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikeThrough: false,
    insertUnorderedList: false,
    insertOrderedList: false,
    justifyLeft: false,
    justifyCenter: false,
    justifyRight: false,
  });

  const editorRef = useRef(null);
  const isComposingRef = useRef(false);
  const colorPickerRef = useRef(null);

  useEffect(() => {
    if (editorRef.current && !isComposingRef.current) {
      const currentHtml = editorRef.current.innerHTML;
      const targetHtml = emailHtml || textToHtml(emailBody || "", { fontFamily: selectedFont, fontSize: selectedSize });
      if (currentHtml !== targetHtml) {
        editorRef.current.innerHTML = targetHtml;
      }
    }
  }, [emailHtml, emailBody, selectedFont, selectedSize]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (colorPickerRef.current && !colorPickerRef.current.contains(event.target)) {
        setShowColorPicker(false);
      }
    }
    if (showColorPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showColorPicker]);

  const updateActiveFormats = useCallback(() => {
    if (typeof document === "undefined" || !editorRef.current) return;
    try {
      setActiveFormats({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        strikeThrough: document.queryCommandState("strikeThrough"),
        insertUnorderedList: document.queryCommandState("insertUnorderedList"),
        insertOrderedList: document.queryCommandState("insertOrderedList"),
        justifyLeft: document.queryCommandState("justifyLeft"),
        justifyCenter: document.queryCommandState("justifyCenter"),
        justifyRight: document.queryCommandState("justifyRight"),
      });
    } catch {
    }
  }, []);

  const handleInput = useCallback(() => {
    if (!editorRef.current) return;
    const currentHtml = editorRef.current.innerHTML;
    const plainText = htmlToPlainText(currentHtml);

    isComposingRef.current = true;
    setEmailHtml(currentHtml);
    setEmailBody(plainText);
    setIsManuallyEdited(true);

    setTimeout(() => {
      isComposingRef.current = false;
    }, 60);

    updateActiveFormats();
  }, [setEmailHtml, setEmailBody, setIsManuallyEdited, updateActiveFormats]);

  const executeCommand = useCallback((command, value = null) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    try {
      document.execCommand("styleWithCSS", false, true);
    } catch {
    }
    document.execCommand(command, false, value);
    handleInput();
  }, [handleInput]);

  const saveStylePreference = useCallback((key, value) => {
    if (setSettings) {
      setSettings((prev) => {
        const next = { ...prev, [key]: value };
        try {
          if (typeof window !== "undefined") {
            const stored = JSON.parse(localStorage.getItem("outlio_style_prefs") || "{}");
            stored[key] = value;
            localStorage.setItem("outlio_style_prefs", JSON.stringify(stored));
          }
        } catch {
        }
        return next;
      });
    }
  }, [setSettings]);

  const handleFontFamilyChange = (fontFamily) => {
    setOverrideFont(fontFamily);
    saveStylePreference("EMAIL_FONT_FAMILY", fontFamily);

    if (!editorRef.current) return;
    editorRef.current.focus();

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;

    try {
      document.execCommand("styleWithCSS", false, true);
    } catch {
    }
    document.execCommand("fontName", false, fontFamily);

    const fontTags = editorRef.current.querySelectorAll("font[face]");
    fontTags.forEach((el) => {
      const face = el.getAttribute("face");
      el.removeAttribute("face");
      el.style.fontFamily = face;
    });

    handleInput();
  };

  const handleFontSizeChange = (sizePx) => {
    setOverrideSize(sizePx);
    saveStylePreference("EMAIL_FONT_SIZE", sizePx);

    if (!editorRef.current) return;
    editorRef.current.focus();

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;

    try {
      document.execCommand("styleWithCSS", false, true);
    } catch {
    }
    document.execCommand("fontSize", false, "7");

    const fontTags = editorRef.current.querySelectorAll('font[size="7"]');
    fontTags.forEach((el) => {
      el.removeAttribute("size");
      el.style.fontSize = sizePx;
    });

    const spans = editorRef.current.querySelectorAll('span[style*="-webkit-xxx-large"]');
    spans.forEach((el) => {
      el.style.fontSize = sizePx;
    });

    handleInput();
  };

  const handleColorChange = (colorValue) => {
    setShowColorPicker(false);
    if (!editorRef.current) return;
    editorRef.current.focus();

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;

    if (colorValue === "inherit") {
      document.execCommand("removeFormat", false, null);
    } else {
      try {
        document.execCommand("styleWithCSS", false, true);
      } catch {
      }
      document.execCommand("foreColor", false, colorValue);

      const fontTags = editorRef.current.querySelectorAll("font[color]");
      fontTags.forEach((el) => {
        const col = el.getAttribute("color");
        el.removeAttribute("color");
        el.style.color = col;
      });
    }

    handleInput();
  };

  const handleClearFormatting = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand("removeFormat", false, null);
    handleInput();
  };

  const handlePlainTextChange = (e) => {
    const newText = e.target.value;
    setEmailBody(newText);
    setEmailHtml(textToHtml(newText, { fontFamily: selectedFont, fontSize: selectedSize }));
    setIsManuallyEdited(true);
  };

  const handleSwitchMode = (mode) => {
    setEditorMode(mode);
    if (mode === "rich") {
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.innerHTML = emailHtml || textToHtml(emailBody || "", { fontFamily: selectedFont, fontSize: selectedSize });
        }
      }, 0);
    }
  };

  return (
    <div className="rich-editor-wrapper">
      <div className="rich-editor-header">
        <label style={{ margin: 0, fontWeight: 600 }}>Email Body</label>
        
        <div className="rich-editor-mode-toggle">
          <button
            type="button"
            className={`btn-mode ${editorMode === "rich" ? "active" : ""}`}
            onClick={() => handleSwitchMode("rich")}
            title="Rich visual text formatting"
          >
            <Type size={13} />
            <span>Rich Text</span>
          </button>
          <button
            type="button"
            className={`btn-mode ${editorMode === "plain" ? "active" : ""}`}
            onClick={() => handleSwitchMode("plain")}
            title="Plain text mode"
          >
            <Code size={13} />
            <span>Plain Text</span>
          </button>
          <button
            type="button"
            className="btn-mode preview-btn"
            onClick={() => setShowPreviewModal(true)}
            title="Preview how this formatted email looks to the recipient"
          >
            <Eye size={13} />
            <span>Preview</span>
          </button>
        </div>
      </div>

      {editorMode === "rich" ? (
        <div className="rich-editor-container">
          <div className="rich-toolbar">
            <div className="toolbar-group">
              <select
                className="toolbar-select font-family-select"
                value={selectedFont}
                onChange={(e) => handleFontFamilyChange(e.target.value)}
                title="Font Style (Saved to Preferences)"
                aria-label="Font Style"
              >
                {FONT_FAMILIES.map((f) => (
                  <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="toolbar-group">
              <select
                className="toolbar-select font-size-select"
                value={selectedSize}
                onChange={(e) => handleFontSizeChange(e.target.value)}
                title="Font Size (Saved to Preferences)"
                aria-label="Font Size"
              >
                {FONT_SIZES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="toolbar-divider" />

            <div className="toolbar-group">
              <button
                type="button"
                className={`toolbar-btn ${activeFormats.bold ? "active" : ""}`}
                onMouseDown={(e) => { e.preventDefault(); executeCommand("bold"); }}
                title="Bold (Ctrl+B)"
                aria-label="Bold"
              >
                <Bold size={15} />
              </button>
              <button
                type="button"
                className={`toolbar-btn ${activeFormats.italic ? "active" : ""}`}
                onMouseDown={(e) => { e.preventDefault(); executeCommand("italic"); }}
                title="Italic (Ctrl+I)"
                aria-label="Italic"
              >
                <Italic size={15} />
              </button>
              <button
                type="button"
                className={`toolbar-btn ${activeFormats.underline ? "active" : ""}`}
                onMouseDown={(e) => { e.preventDefault(); executeCommand("underline"); }}
                title="Underline (Ctrl+U)"
                aria-label="Underline"
              >
                <Underline size={15} />
              </button>
              <button
                type="button"
                className={`toolbar-btn ${activeFormats.strikeThrough ? "active" : ""}`}
                onMouseDown={(e) => { e.preventDefault(); executeCommand("strikeThrough"); }}
                title="Strikethrough"
                aria-label="Strikethrough"
              >
                <Strikethrough size={15} />
              </button>
            </div>

            <div className="toolbar-divider" />

            <div className="toolbar-group" ref={colorPickerRef} style={{ position: "relative" }}>
              <button
                type="button"
                className="toolbar-btn"
                onClick={() => setShowColorPicker(!showColorPicker)}
                title="Text Color"
                aria-label="Text Color"
              >
                <Palette size={15} />
              </button>

              {showColorPicker && (
                <div className="color-dropdown">
                  <div className="color-dropdown-title">Text Color</div>
                  <div className="color-swatches">
                    {QUICK_COLORS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        className="color-swatch-btn"
                        onMouseDown={(e) => { e.preventDefault(); handleColorChange(c.value); }}
                        title={c.label}
                      >
                        <span
                          className="color-swatch-circle"
                          style={{
                            backgroundColor: c.value === "inherit" ? "var(--text-primary)" : c.colorCode,
                            border: c.value === "inherit" ? "1px dashed var(--glass-border)" : "none",
                          }}
                        />
                        <span className="color-swatch-label">{c.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="toolbar-divider" />

            <div className="toolbar-group">
              <button
                type="button"
                className={`toolbar-btn ${activeFormats.insertUnorderedList ? "active" : ""}`}
                onMouseDown={(e) => { e.preventDefault(); executeCommand("insertUnorderedList"); }}
                title="Bulleted List"
                aria-label="Bulleted List"
              >
                <List size={15} />
              </button>
              <button
                type="button"
                className={`toolbar-btn ${activeFormats.insertOrderedList ? "active" : ""}`}
                onMouseDown={(e) => { e.preventDefault(); executeCommand("insertOrderedList"); }}
                title="Numbered List"
                aria-label="Numbered List"
              >
                <ListOrdered size={15} />
              </button>
            </div>

            <div className="toolbar-divider" />

            <div className="toolbar-group">
              <button
                type="button"
                className={`toolbar-btn ${activeFormats.justifyLeft ? "active" : ""}`}
                onMouseDown={(e) => { e.preventDefault(); executeCommand("justifyLeft"); }}
                title="Align Left"
                aria-label="Align Left"
              >
                <AlignLeft size={15} />
              </button>
              <button
                type="button"
                className={`toolbar-btn ${activeFormats.justifyCenter ? "active" : ""}`}
                onMouseDown={(e) => { e.preventDefault(); executeCommand("justifyCenter"); }}
                title="Align Center"
                aria-label="Align Center"
              >
                <AlignCenter size={15} />
              </button>
              <button
                type="button"
                className={`toolbar-btn ${activeFormats.justifyRight ? "active" : ""}`}
                onMouseDown={(e) => { e.preventDefault(); executeCommand("justifyRight"); }}
                title="Align Right"
                aria-label="Align Right"
              >
                <AlignRight size={15} />
              </button>
            </div>

            <div className="toolbar-divider" />

            <div className="toolbar-group">
              <button
                type="button"
                className="toolbar-btn"
                onMouseDown={(e) => { e.preventDefault(); handleClearFormatting(); }}
                title="Clear Formatting"
                aria-label="Clear Formatting"
              >
                <RemoveFormatting size={15} />
              </button>
              <button
                type="button"
                className="toolbar-btn"
                onMouseDown={(e) => { e.preventDefault(); executeCommand("undo"); }}
                title="Undo (Ctrl+Z)"
                aria-label="Undo"
              >
                <Undo size={14} />
              </button>
              <button
                type="button"
                className="toolbar-btn"
                onMouseDown={(e) => { e.preventDefault(); executeCommand("redo"); }}
                title="Redo (Ctrl+Y)"
                aria-label="Redo"
              >
                <Redo size={14} />
              </button>
            </div>
          </div>

          <div
            ref={editorRef}
            className="rich-editor-content"
            contentEditable
            suppressContentEditableWarning
            onInput={handleInput}
            onKeyUp={updateActiveFormats}
            onMouseUp={updateActiveFormats}
            aria-label="Formatted Email Body"
            data-placeholder="Compose your formatted email..."
          />
        </div>
      ) : (
        <textarea
          className="email-body-input"
          style={{ flexGrow: 1, minHeight: "300px", fontFamily: "inherit" }}
          value={emailBody}
          onChange={handlePlainTextChange}
          placeholder="Compose your email..."
        />
      )}

      {showPreviewModal && (
        <div className="modal-backdrop" onClick={() => setShowPreviewModal(false)}>
          <div
            className="email-preview-modal-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Eye size={18} />
                <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>Recipient Email Preview</span>
              </div>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setShowPreviewModal(false)}
                title="Close preview"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mock-email-window">
              <div className="mock-email-header">
                <div className="mock-email-meta-row">
                  <span className="mock-meta-label">To:</span>
                  <span className="mock-meta-val">{recipientEmail || "recruiter@company.com"}</span>
                </div>
                <div className="mock-email-meta-row">
                  <span className="mock-meta-label">Subject:</span>
                  <span className="mock-meta-val" style={{ fontWeight: 600 }}>{subject || "(No Subject)"}</span>
                </div>
              </div>

              <div className="mock-email-body">
                <div
                  dangerouslySetInnerHTML={{
                    __html: emailHtml || textToHtml(emailBody || "", { fontFamily: selectedFont, fontSize: selectedSize }),
                  }}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowPreviewModal(false)}
              >
                Done Previewing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
