"use client";

import { useState } from "react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleUpload = async () => {
    if (!file) {
      alert("Please upload a PDF file");
      return;
    }

    // ⚠️ Prevent very large files (Vercel limit protection)
    if (file.size > 4 * 1024 * 1024) {
      setError("File too large. Please upload a PDF under 4MB.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const text = await res.text();

      let data: any;

      try {
        data = JSON.parse(text);
      } catch {
        // If Vercel returns plain text error (like FUNCTION_PAYLOAD_TOO_LARGE)
        throw new Error(text || "Unexpected server error");
      }

      if (!res.ok) {
        if (data.error === "SCANNED_PDF") {
          setError("SCANNED_FILE");
          return;
        }

        if (text.includes("FUNCTION_PAYLOAD_TOO_LARGE")) {
          setError("File too large for server processing.");
          return;
        }

        throw new Error(data.error || "Processing failed");
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- EXPORT FUNCTIONS ---------------- */

  const downloadJSON = () => {
    if (!result) return;

    const blob = new Blob([JSON.stringify(result, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "analysis-report.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const convertToCSV = (data: any) => {
    const rows: string[] = [];
    rows.push("Section,Value");

    const addRow = (section: string, value: string) => {
      rows.push(`"${section}","${value.replace(/"/g, '""')}"`);
    };

    Object.keys(data).forEach((key) => {
      const value = data[key];
      if (!value) return;

      if (typeof value === "string") {
        addRow(key, value);
      } else if (Array.isArray(value)) {
        value.forEach((item: any, index: number) => {
          addRow(`${key} ${index + 1}`, String(item));
        });
      } else if (typeof value === "object") {
        Object.keys(value).forEach((subKey) => {
          addRow(`${key} - ${subKey}`, String(value[subKey]));
        });
      }
    });

    return rows.join("\n");
  };

  const downloadCSV = () => {
    if (!result) return;

    const csv = convertToCSV(result);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "analysis-report.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-blue-950 via-blue-800 to-blue-600">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl p-12">

        <h1 className="text-4xl font-bold text-center text-black mb-4 tracking-wide">
          Internal Research Portal
        </h1>

        <p className="text-center text-gray-500 mb-8 text-sm">
          Structured AI-powered earnings call analysis for internal research use.
        </p>

        {!result && (
          <>
            <div className="mb-4 text-black font-semibold">
              Research Tool: Earnings Call / Management Commentary Analyzer
            </div>

            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full border border-black p-4 rounded-xl text-black bg-white"
            />

            {file && (
              <p className="mt-4 text-sm text-black font-medium">
                Selected file: {file.name}
              </p>
            )}

            <button
              onClick={handleUpload}
              disabled={loading}
              className="w-full mt-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold text-lg shadow-lg"
            >
              {loading ? "Analyzing..." : "Run Earnings Call Analysis"}
            </button>

            {error && (
              <div className="mt-6 bg-red-100 border border-red-400 text-red-700 p-4 rounded-lg text-center font-medium">
                {error === "SCANNED_FILE"
                  ? "This appears to be a scanned (image-based) PDF. Only text-based PDFs are supported."
                  : error}
              </div>
            )}
          </>
        )}

        {result && (
          <>
            <div className="mt-6 space-y-8 max-h-[500px] overflow-y-auto pr-2">

              <h2 className="text-2xl font-bold text-center border-b pb-4 text-black">
                Structured Analysis
              </h2>

              <Section title="Executive Summary" value={result.executive_summary} />

              <GridTwo>
                <Section title="Management Tone" value={result.management_tone} />
                <Section title="Confidence Level" value={result.confidence_level} />
              </GridTwo>

              <GridTwo>
                <Section title="Sentiment Score" value={result.sentiment_score} />
                <Section title="AI Confidence Score" value={result.ai_confidence_score} />
              </GridTwo>

              <SmartList title="Financial Highlights" data={result.financial_highlights} />
              <SmartList title="Key Positives" data={result.key_positives} />
              <SmartList title="Key Concerns" data={result.key_concerns} />
              <SmartList title="Risk Factors" data={result.risk_factors} />

            </div>

            <div className="mt-8 space-y-4">
              <button
                onClick={downloadJSON}
                className="w-full py-4 rounded-xl bg-black text-white font-semibold text-lg shadow-lg"
              >
                Download JSON Report
              </button>

              <button
                onClick={downloadCSV}
                className="w-full py-4 rounded-xl bg-green-600 text-white font-semibold text-lg shadow-lg"
              >
                Download Excel (CSV)
              </button>

              <button
                onClick={() => {
                  setResult(null);
                  setFile(null);
                }}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold text-lg shadow-lg"
              >
                Analyze Another Document
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ---------------- COMPONENTS ---------------- */

function Section({ title, value }: any) {
  if (!value || value === "Not mentioned") return null;

  return (
    <div>
      <h3 className="font-bold text-black mb-2 text-lg">{title}</h3>
      <p className="text-black leading-relaxed">{String(value)}</p>
    </div>
  );
}

function SmartList({ title, data }: any) {
  if (!data || data.length === 0) return null;

  return (
    <div>
      <h3 className="font-bold text-black mb-3 text-lg">{title}</h3>
      <ul className="list-disc pl-6 space-y-2 text-black leading-relaxed">
        {data.map((item: any, index: number) => (
          <li key={index}>{String(item)}</li>
        ))}
      </ul>
    </div>
  );
}

function GridTwo({ children }: any) {
  return <div className="grid md:grid-cols-2 gap-8">{children}</div>;
}
