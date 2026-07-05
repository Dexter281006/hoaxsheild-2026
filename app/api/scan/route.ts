import { NextResponse } from "next/server";

const GOOGLE_SAFE_BROWSING_API_KEY = process.env.GOOGLE_SAFE_BROWSING_API_KEY;

type ScanRequest = {
  mode: "url" | "text" | "file" | "image";
  targetUrl?: string;
  message?: string;
  fileName?: string;
  mimeType?: string;
  size?: number;
  textPreview?: string;
};

function normalizeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function scoreMessage(text: string) {
  const lower = text.toLowerCase();
  const riskTerms = [
    "verify",
    "urgent",
    "click",
    "winner",
    "gift",
    "bonus",
    "free",
    "password",
    "bank",
    "login",
    "crypto",
    "wallet",
    "invoice",
    "suspended",
  ];
  const matches = riskTerms.filter((term) => lower.includes(term));
  return matches.length;
}

function buildResult(title: string, summary: string, status: "safe" | "warning" | "danger" | "error", details: string[], source: string) {
  return { title, summary, status, details, source, scanUrl: "" };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ScanRequest;

    if (body.mode === "url") {
      const targetUrl = normalizeUrl(body.targetUrl || "");
      if (!targetUrl) {
        return NextResponse.json(buildResult("Missing target", "Please provide a URL to inspect.", "warning", ["No target URL was supplied."], "Validation"));
      }

      const apiKey = GOOGLE_SAFE_BROWSING_API_KEY;
      const apiUrl = "https://safebrowsing.googleapis.com/v4/threatMatches:find?key=" + apiKey;

      if (!apiKey) {
        return NextResponse.json(buildResult("Google review not available", "Google Safe Browsing is not configured right now, so no live review was returned.", "warning", [
          `Scanned URL: ${targetUrl}`,
          "Google review: Not available",
        ], "Google Safe Browsing"));
      }

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client: { clientId: "hoaxshield", clientVersion: "1.0.0" },
          threatInfo: {
            threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
            platformTypes: ["ANY_PLATFORM"],
            threatEntryTypes: ["URL"],
            threatEntries: [{ url: targetUrl }],
          },
        }),
      });

      if (!response.ok) {
        return NextResponse.json(buildResult("Google review not available", "The Google review request did not return a valid result.", "warning", [
          `Scanned URL: ${targetUrl}`,
          `Google review: Not available`,
          `Status: ${response.status}`,
        ], "Google Safe Browsing"));
      }

      const data = (await response.json()) as { matches?: Array<{ threatType: string }> };
      if (data.matches && data.matches.length > 0) {
        const threatTypes = data.matches.map((match) => match.threatType).join(", ");
        return NextResponse.json(buildResult("Suspicious URL detected", "Google Safe Browsing reported a matching threat for this URL.", "danger", [
          `Threat types: ${threatTypes}`,
          `Scanned URL: ${targetUrl}`,
          "Google review: Available",
        ], "Google Safe Browsing"));
      }

      return NextResponse.json(buildResult("No obvious threats found", "Google Safe Browsing did not report a known threat for this URL.", "safe", [
        `Scanned URL: ${targetUrl}`,
        "Google review: No threats found",
      ], "Google Safe Browsing"));
    }

    if (body.mode === "text") {
      const message = body.message || "";
      const riskScore = scoreMessage(message);
      const details = [
        `Message length: ${message.length} characters`,
        riskScore > 0 ? `Detected phishing terms: ${riskScore}` : "No obvious phishing terms were found",
      ];
      if (riskScore > 0) {
        return NextResponse.json(buildResult("Suspicious message", "The message uses urgent or scam-like language that resembles phishing content.", "danger", details, "Message heuristic scan"));
      }
      return NextResponse.json(buildResult("Message looks normal", "The text does not contain many obvious phishing cues.", "warning", details, "Message heuristic scan"));
    }

    if (body.mode === "file") {
      const name = body.fileName || "unknown-file";
      const size = body.size || 0;
      const preview = body.textPreview || "";
      const riskyName = /(?:\.exe|\.scr|\.bat|\.cmd|\.js|\.jar|\.dll|\.msi)$/i.test(name);
      const suspiciousText = preview.toLowerCase().includes("cmd") || preview.toLowerCase().includes("powershell") || preview.toLowerCase().includes("http") || preview.toLowerCase().includes("download");
      if (riskyName || suspiciousText || size > 5000000) {
        return NextResponse.json(buildResult("Risky file detected", "The file appears suspicious and could contain malware-related payload indicators.", "danger", [
          `Filename: ${name}`,
          `Size: ${size} bytes`,
          suspiciousText ? "Embedded script-like content was detected." : "No obvious script-like content was found.",
        ], "File heuristic scan"));
      }
      return NextResponse.json(buildResult("File looks ordinary", "The file did not show obvious malware or phishing indicators.", "warning", [
        `Filename: ${name}`,
        `Size: ${size} bytes`,
        "A deeper sandbox inspection would still be recommended for sensitive uploads.",
      ], "File heuristic scan"));
    }

    if (body.mode === "image") {
      const name = body.fileName || "unknown-image";
      const size = body.size || 0;
      const suspiciousName = /(?:phish|login|verify|bank|wallet|invoice|scan|promo)/i.test(name);
      if (suspiciousName || size > 4000000) {
        return NextResponse.json(buildResult("Suspicious image detected", "The image appears suspicious due to the filename or file size.", "danger", [
          `Filename: ${name}`,
          `Size: ${size} bytes`,
          "Image-based phishing content can be used in social-engineering campaigns.",
        ], "Image heuristic scan"));
      }
      return NextResponse.json(buildResult("Image looks harmless", "The image did not trigger obvious threat markers.", "warning", [
        `Filename: ${name}`,
        `Size: ${size} bytes`,
        "Visual review is still useful for login or credential-themed imagery.",
      ], "Image heuristic scan"));
    }

    return NextResponse.json(buildResult("Unsupported scan mode", "The requested inspection mode is not supported.", "error", ["Try URL, message, file, or image scan."], "Validation"));
  } catch (error) {
    return NextResponse.json(buildResult("Scan error", "The scanner hit an unexpected error.", "error", [error instanceof Error ? error.message : "Unknown error"], "Server error"));
  }
}
