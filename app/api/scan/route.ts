import { NextResponse } from "next/server";

const VIRUSTOTAL_API_KEY = process.env.VIRUSTOTAL_API_KEY;

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

type VirusTotalAnalysisResponse = {
  data?: {
    attributes?: {
      status?: string;
      stats?: {
        harmless?: number;
        malicious?: number;
        suspicious?: number;
        undetected?: number;
      };
    };
  };
};

function getVirusTotalRiskLevel(data: VirusTotalAnalysisResponse) {
  const stats = data.data?.attributes?.stats;
  const malicious = stats?.malicious ?? 0;
  const suspicious = stats?.suspicious ?? 0;

  if (malicious > 0) {
    return { status: "danger" as const, label: "Malicious" };
  }

  if (suspicious > 0) {
    return { status: "warning" as const, label: "Suspicious" };
  }

  return { status: "safe" as const, label: "No obvious issues" };
}

async function scanUrlWithVirusTotal(targetUrl: string, apiKey: string) {
  const submitResponse = await fetch("https://www.virustotal.com/api/v3/urls", {
    method: "POST",
    headers: {
      "x-apikey": apiKey,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ url: targetUrl }),
  });

  if (!submitResponse.ok) {
    throw new Error(`VirusTotal submission failed with status ${submitResponse.status}`);
  }

  const submitData = (await submitResponse.json()) as { data?: { id?: string } };
  const analysisId = submitData.data?.id;

  if (!analysisId) {
    throw new Error("VirusTotal did not return an analysis ID.");
  }

  const analysisResponse = await fetch(`https://www.virustotal.com/api/v3/analyses/${analysisId}`, {
    headers: {
      "x-apikey": apiKey,
      accept: "application/json",
    },
  });

  if (!analysisResponse.ok) {
    throw new Error(`VirusTotal analysis failed with status ${analysisResponse.status}`);
  }

  const analysisData = (await analysisResponse.json()) as VirusTotalAnalysisResponse;
  const status = analysisData.data?.attributes?.status ?? "queued";
  const stats = analysisData.data?.attributes?.stats;
  const malicious = stats?.malicious ?? 0;
  const suspicious = stats?.suspicious ?? 0;
  const harmless = stats?.harmless ?? 0;
  const undetected = stats?.undetected ?? 0;
  const risk = getVirusTotalRiskLevel(analysisData);

  if (status !== "completed") {
    return buildResult("VirusTotal analysis pending", "VirusTotal has not finished analyzing this URL yet.", "warning", [
      `Scanned URL: ${targetUrl}`,
      "VirusTotal: analysis pending",
      "Please try again shortly for a completed report.",
    ], "VirusTotal");
  }

  const details = [
    `Scanned URL: ${targetUrl}`,
    `VirusTotal: ${risk.label}`,
    `Malicious: ${malicious}`,
    `Suspicious: ${suspicious}`,
    `Harmless: ${harmless}`,
    `Undetected: ${undetected}`,
  ];

  if (risk.status === "danger") {
    return buildResult("Suspicious URL detected", "VirusTotal reported this URL as malicious.", "danger", details, "VirusTotal");
  }

  if (risk.status === "warning") {
    return buildResult("Potentially risky URL", "VirusTotal reported suspicious signals for this URL.", "warning", details, "VirusTotal");
  }

  return buildResult("No obvious threats found", "VirusTotal did not report a known threat for this URL.", "safe", details, "VirusTotal");
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ScanRequest;

    if (body.mode === "url") {
      const targetUrl = normalizeUrl(body.targetUrl || "");
      if (!targetUrl) {
        return NextResponse.json(buildResult("Missing target", "Please provide a URL to inspect.", "warning", ["No target URL was supplied."], "Validation"));
      }

      const apiKey = VIRUSTOTAL_API_KEY;

      if (!apiKey) {
        return NextResponse.json(buildResult("URL safety check unavailable", "VirusTotal is not configured right now, so no live safety scan could be performed.", "warning", [
          `Scanned URL: ${targetUrl}`,
          "VirusTotal: unavailable",
          "Add a valid VirusTotal API key to your environment to enable live scanning.",
        ], "VirusTotal"));
      }

      try {
        return NextResponse.json(await scanUrlWithVirusTotal(targetUrl, apiKey));
      } catch (error) {
        return NextResponse.json(buildResult("URL safety check could not be completed", "The live VirusTotal scan did not complete, so HoaxShield did not produce a false positive review.", "warning", [
          `Scanned URL: ${targetUrl}`,
          "VirusTotal: unavailable",
          error instanceof Error ? `Reason: ${error.message}` : "Reason: unknown error",
        ], "VirusTotal"));
      }
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
