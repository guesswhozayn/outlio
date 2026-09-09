import { NextResponse } from "next/server";

function cleanHtml(html) {
  if (!html) return "";
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<li>/gi, "\n• ")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .trim();
}

export async function POST(req) {
  try {
    const { url: rawUrl, text: rawText, title: rawTitle } = await req.json();

    // 1. Find any URL in url, text, or title
    let targetUrl = rawUrl;
    if (!targetUrl && rawText) {
      const urlMatch = rawText.match(/https?:\/\/[^\s]+/i);
      if (urlMatch) targetUrl = urlMatch[0];
    }
    if (!targetUrl && rawTitle) {
      const urlMatch = rawTitle.match(/https?:\/\/[^\s]+/i);
      if (urlMatch) targetUrl = urlMatch[0];
    }

    // If no URL at all, return the raw text
    if (!targetUrl) {
      const combined = [rawTitle, rawText].filter(Boolean).join("\n\n");
      return NextResponse.json({
        success: true,
        text: combined,
        source: "raw_text",
      });
    }

    // 2. Check if it's a LinkedIn Job URL
    // e.g. /jobs/view/1234567890 or ?currentJobId=1234567890
    const jobIdMatch = targetUrl.match(/(?:jobs\/view\/(?:[^\/]+-)?(\d+)|currentJobId=(\d+))/);
    if (jobIdMatch) {
      const jobId = jobIdMatch[1] || jobIdMatch[2];
      const guestJobUrl = `https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${jobId}`;

      try {
        const jobRes = await fetch(guestJobUrl, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9",
          },
          cache: "no-store",
        });

        if (jobRes.ok) {
          const html = await jobRes.text();

          const title = (
            html.match(/<h2[^>]*class="[^"]*top-card-layout__title[^"]*"[^>]*>([\s\S]*?)<\/h2>/i) ||
            html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
          )?.[1]?.replace(/<[^>]+>/g, "").trim();

          const company = (
            html.match(/<a[^>]*class="[^"]*topcard__org-name-link[^"]*"[^>]*>([\s\S]*?)<\/a>/i) ||
            html.match(/<span[^>]*class="[^"]*topcard__flavor[^"]*"[^>]*>([\s\S]*?)<\/span>/i)
          )?.[1]?.replace(/<[^>]+>/g, "").trim();

          const location = (
            html.match(/<span[^>]*class="[^"]*topcard__flavor--bullet[^"]*"[^>]*>([\s\S]*?)<\/span>/i)
          )?.[1]?.replace(/<[^>]+>/g, "").trim();

          const descMatch = html.match(
            /<div[^>]*class="[^"]*(?:show-more-less-html__markup|description__text)[^"]*"[^>]*>([\s\S]*?)<\/div>/i
          );
          const description = descMatch ? cleanHtml(descMatch[1]) : "";

          // Extract job criteria (Seniority, Employment type, etc.)
          const criteria = [];
          const criteriaMatches = html.matchAll(
            /<h3 class="description__job-criteria-subheader">\s*([\s\S]*?)\s*<\/h3>[\s\S]*?<span class="description__job-criteria-text[^"]*">\s*([\s\S]*?)\s*<\/span>/gi
          );
          for (const match of criteriaMatches) {
            const label = cleanHtml(match[1]);
            const val = cleanHtml(match[2]);
            if (label && val) criteria.push(`${label}: ${val}`);
          }

          const formattedOutput = [
            title ? `Position: ${title}` : "",
            company ? `Company: ${company}` : "",
            location ? `Location: ${location}` : "",
            criteria.length > 0 ? criteria.join(" | ") : "",
            description ? `\nJob Description:\n${description}` : "",
          ]
            .filter(Boolean)
            .join("\n");

          if (formattedOutput.length > 50) {
            return NextResponse.json({
              success: true,
              text: formattedOutput,
              title: title || rawTitle,
              company: company || "",
              source: "linkedin_job_api",
            });
          }
        }
      } catch (err) {
        console.warn("Failed fetching LinkedIn job guest API:", err);
      }
    }

    // 3. For general LinkedIn posts or external links: attempt OpenGraph tag extraction
    try {
      const pageRes = await fetch(targetUrl, {
        headers: {
          "User-Agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
          "Accept-Language": "en-US,en;q=0.9",
        },
        redirect: "follow",
        cache: "no-store",
      });

      if (pageRes.ok) {
        const pageHtml = await pageRes.text();

        const ogTitle = (
          pageHtml.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
          pageHtml.match(/<meta[^>]*name=["']twitter:title["'][^>]*content=["']([^"']+)["']/i) ||
          pageHtml.match(/<title>([^<]+)<\/title>/i)
        )?.[1];

        const ogDesc = (
          pageHtml.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i) ||
          pageHtml.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)
        )?.[1];

        const decodedTitle = ogTitle ? cleanHtml(ogTitle) : "";
        const decodedDesc = ogDesc ? cleanHtml(ogDesc) : "";

        // If og:description contains real post text (not generic LinkedIn login prompt)
        const isGenericAuthwall = /sign in|join linkedin|log in to see/i.test(decodedDesc);

        if (decodedDesc && !isGenericAuthwall) {
          const parts = [
            decodedTitle && !decodedTitle.toLowerCase().includes("linkedin") ? decodedTitle : "",
            decodedDesc,
            rawText && !rawText.includes(targetUrl) ? rawText : "",
          ].filter(Boolean);

          return NextResponse.json({
            success: true,
            text: parts.join("\n\n"),
            source: "opengraph",
          });
        }
      }
    } catch (err) {
      console.warn("OpenGraph extraction error:", err);
    }

    // 4. Fallback: Return raw text and title provided by LinkedIn's share sheet
    const fallbackParts = [rawTitle, rawText, `Link: ${targetUrl}`].filter(Boolean);
    return NextResponse.json({
      success: true,
      text: fallbackParts.join("\n\n"),
      source: "fallback",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error.message, text: req?.body?.text || "" },
      { status: 500 }
    );
  }
}
