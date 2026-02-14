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

      const data = await res.json();

      if (!res.ok) {
        if (data.error === "SCANNED_PDF") {
          setError("SCANNED_FILE");
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

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-blue-950 via-blue-800 to-blue-600">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl p-12">

        <h1 className="text-4xl font-bold text-center text-black mb-4 tracking-wide">
          Internal Research Portal
        </h1>

        <p className="text-center text-gray-500 mb-8 text-sm">
          Structured AI-powered earnings call analysis for internal research use.
        </p>

        {/* TOOL LABEL */}
        {!result && (
          <div className="mb-4 text-black font-semibold">
            Research Tool: Earnings Call / Management Commentary Analyzer
          </div>
        )}

        {/* ---------------- UPLOAD SECTION ---------------- */}
        {!result && (
          <>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full border border-black p-4 rounded-xl
              text-black bg-white
              focus:outline-none focus:ring-2 focus:ring-blue-600
              transition"
            />

            {file && (
              <p className="mt-4 text-sm text-black font-medium">
                Selected file: {file.name}
              </p>
            )}

            <button
              onClick={handleUpload}
              disabled={loading}
              className="w-full mt-8 py-4 rounded-xl
              bg-gradient-to-r from-blue-600 to-blue-700
              text-white font-semibold text-lg
              shadow-lg hover:shadow-xl
              hover:scale-[1.01]
              transition duration-200"
            >
              {loading ? "Analyzing..." : "Run Earnings Call Analysis"}
            </button>

            {error && (
              <div className="mt-6 bg-red-100 border border-red-400 text-red-700 p-4 rounded-lg text-center font-medium">
                {error === "SCANNED_FILE" ? (
                  <>
                    <p className="text-sm font-semibold mb-2">
                      This appears to be a scanned (image-based) PDF.
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Only text-based PDFs are supported. 
                      Please upload a machine-readable transcript.
                    </p>
                  </>
                ) : (
                  error
                )}
              </div>
            )}
          </>
        )}

        {/* ---------------- RESULT SECTION ---------------- */}
        {result && (
          <div className="mt-6 space-y-10 max-h-[650px] overflow-y-auto pr-2">

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

            {/* Forward Guidance */}
            <div>
              <h3 className="font-bold text-black mb-3 text-lg">Forward Guidance</h3>
              <div className="space-y-2 text-black">
                <p><strong>Revenue:</strong> {result.forward_guidance?.revenue_outlook || "Not mentioned"}</p>
                <p><strong>Margin:</strong> {result.forward_guidance?.margin_outlook || "Not mentioned"}</p>
                <p><strong>Capex:</strong> {result.forward_guidance?.capex_outlook || "Not mentioned"}</p>
              </div>
            </div>

            <Section
              title="Capacity Utilization Trend"
              value={result.capacity_utilization_trend}
            />

            <SmartList title="Growth Initiatives" data={result.growth_initiatives} />
            <SmartList title="Strategic Actions" data={result.strategic_actions} />
            <SmartList title="Notable Quotes" data={result.notable_quotes} />

            <button
              onClick={() => {
                setResult(null);
                setFile(null);
              }}
              className="w-full mt-8 py-4 rounded-xl
              bg-gradient-to-r from-blue-600 to-blue-700
              text-white font-semibold text-lg
              shadow-lg hover:shadow-xl
              hover:scale-[1.01]
              transition duration-200"
            >
              Analyze Another Document
            </button>
          </div>
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
          <li key={index}>
            {typeof item === "object"
              ? Object.entries(item).map(([k, v]) => (
                  <div key={k}>
                    <strong>{formatKey(k)}:</strong> {String(v)}
                  </div>
                ))
              : item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function GridTwo({ children }: any) {
  return (
    <div className="grid md:grid-cols-2 gap-8">
      {children}
    </div>
  );
}

function formatKey(key: string) {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
}
