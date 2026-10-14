export function textToHtml(text, options = {}) {
  if (!text) return "";
  if (/<(p|div|ul|ol|table|h[1-6])[\s>]/i.test(text)) return text;

  const font = options.fontFamily ? `font-family: ${options.fontFamily}; ` : "";
  const size = options.fontSize ? `font-size: ${options.fontSize}; ` : "";
  const style = `margin: 0 0 14px 0; line-height: 1.6; ${font}${size}`.trim();

  return text
    .split(/\r?\n\r?\n+/)
    .map((p) => {
      const trimmed = p.trim();
      if (!trimmed) return "";
      const content = trimmed.replace(/\r?\n/g, "<br>");
      return `<p style="${style}">${content}</p>`;
    })
    .filter(Boolean)
    .join("");
}

export function htmlToPlainText(html) {
  if (!html) return "";

  const text = html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  return text.replace(/\n{3,}/g, "\n\n").trim();
}

export function wrapEmailHtml(content, options = {}) {
  if (!content) return "";
  if (/<!doctype html|<html/i.test(content)) return content;

  const font = options.fontFamily || "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
  const size = options.fontSize || "15px";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <style>
    :root {
      color-scheme: light dark;
      supported-color-schemes: light dark;
    }
    body, p, div {
      font-family: ${font};
      font-size: ${size};
      line-height: 1.6;
    }
    p { margin: 0 0 14px 0; }
    a { color: #2563eb; text-decoration: underline; }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: ${font}; font-size: ${size}; line-height: 1.6;">
  ${content}
</body>
</html>`;
}
