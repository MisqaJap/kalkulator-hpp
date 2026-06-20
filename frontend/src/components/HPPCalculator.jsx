import { useMemo, useState } from "react";
import CostInputSection from "./CostInputSection.jsx";
import AIRecommendationCard from "./AIRecommendationCard.jsx";
import ErrorBanner from "./ErrorBanner.jsx";
import { getSalesRecommendation, APIError } from "../api/client.js";

const emptyItem = () => ({ id: crypto.randomUUID(), name: "", amount: "" });

export default function HPPCalculator() {
  const [rawMaterials, setRawMaterials] = useState([emptyItem()]);
  const [directLabor, setDirectLabor] = useState([emptyItem()]);
  const [overhead, setOverhead] = useState([emptyItem()]);
  const [unitCount, setUnitCount] = useState("");

  const [marginPercentage, setMarginPercentage] = useState("");
  const [productDescription, setProductDescription] = useState("");

  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [aiResult, setAiResult] = useState(null);

  // --- Kalkulasi HPP real-time di sisi klien (responsif, tanpa round-trip ke server) ---
  const totals = useMemo(() => {
    const sum = (items) => items.reduce((acc, i) => acc + (Number(i.amount) || 0), 0);

    const totalRaw = sum(rawMaterials);
    const totalLabor = sum(directLabor);
    const totalOverhead = sum(overhead);
    const totalHPP = totalRaw + totalLabor + totalOverhead;
    const units = Number(unitCount) || 0;
    const hppPerUnit = units > 0 ? totalHPP / units : 0;

    return { totalRaw, totalLabor, totalOverhead, totalHPP, hppPerUnit, units };
  }, [rawMaterials, directLabor, overhead, unitCount]);

  const canRequestAI =
    totals.hppPerUnit > 0 &&
    Number(marginPercentage) >= 0 &&
    productDescription.trim().length >= 3;

  const handleGetRecommendation = async () => {
    setAiError(null);
    setAiResult(null);
    setAiLoading(true);

    try {
      const result = await getSalesRecommendation({
        hpp_per_unit: totals.hppPerUnit,
        margin_percentage: Number(marginPercentage),
        product_description: productDescription.trim(),
      });
      setAiResult(result);
    } catch (err) {
      if (err instanceof APIError) {
        setAiError(err.message);
      } else {
        setAiError("Terjadi kesalahan tak terduga. Silakan coba lagi.");
      }
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <header>
        <h1 className="text-xl font-bold text-gray-900">
          Kalkulator HPP & Rekomendasi Strategi Penjualan
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Hitung Harga Pokok Penjualan secara real-time dan dapatkan rekomendasi
          harga jual serta strategi promosi dari AI.
        </p>
      </header>

      {/* === Input Biaya === */}
      <div className="space-y-4">
        <CostInputSection
          title="Biaya Bahan Baku (Raw Materials)"
          items={rawMaterials}
          onChange={setRawMaterials}
        />
        <CostInputSection
          title="Biaya Tenaga Kerja Langsung (Direct Labor)"
          items={directLabor}
          onChange={setDirectLabor}
        />
        <CostInputSection
          title="Biaya Overhead Pabrik (Overhead)"
          items={overhead}
          onChange={setOverhead}
        />

        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <label className="block text-sm font-semibold text-gray-800">
            Jumlah Unit Diproduksi
          </label>
          <input
            type="number"
            min="1"
            placeholder="Contoh: 100"
            value={unitCount}
            onChange={(e) => setUnitCount(e.target.value)}
            className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:w-48"
          />
        </div>
      </div>

      {/* === Ringkasan HPP (real-time) === */}
      <div className="rounded-xl bg-gray-900 p-5 text-white shadow-sm">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <SummaryStat label="Total Bahan Baku" value={totals.totalRaw} />
          <SummaryStat label="Total Tenaga Kerja" value={totals.totalLabor} />
          <SummaryStat label="Total Overhead" value={totals.totalOverhead} />
          <SummaryStat label="Total HPP" value={totals.totalHPP} highlight />
        </div>
        <div className="mt-4 border-t border-gray-700 pt-4">
          <p className="text-xs uppercase tracking-wide text-gray-400">HPP per Unit</p>
          <p className="mt-1 text-3xl font-bold text-emerald-400">
            Rp{totals.hppPerUnit.toLocaleString("id-ID", { maximumFractionDigits: 0 })}
          </p>
        </div>
      </div>

      {/* === Input untuk Rekomendasi AI === */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-gray-800">
          Dapatkan Rekomendasi Strategi Penjualan
        </h3>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600">
              Deskripsi Singkat Produk
            </label>
            <textarea
              rows={2}
              placeholder="Contoh: Kaos katun combed 30s dengan desain custom untuk anak muda"
              value={productDescription}
              onChange={(e) => setProductDescription(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600">
              Margin Keuntungan yang Diinginkan (%)
            </label>
            <input
              type="number"
              min="0"
              step="0.5"
              placeholder="Contoh: 30"
              value={marginPercentage}
              onChange={(e) => setMarginPercentage(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:w-48"
            />
          </div>

          <button
            type="button"
            disabled={!canRequestAI || aiLoading}
            onClick={handleGetRecommendation}
            className="w-full rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-300 sm:w-auto"
          >
            {aiLoading ? "Menganalisis..." : "Dapatkan Rekomendasi AI"}
          </button>

          {!canRequestAI && !aiLoading && (
            <p className="text-xs text-gray-400">
              Lengkapi HPP, margin, dan deskripsi produk untuk mengaktifkan tombol ini.
            </p>
          )}
        </div>
      </div>

      {/* === Hasil / Error === */}
      {aiLoading && (
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-500 shadow-sm">
          <svg className="h-5 w-5 animate-spin text-indigo-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          Mengirim data ke AI dan menyusun rekomendasi...
        </div>
      )}

      <ErrorBanner message={aiError} onRetry={handleGetRecommendation} />

      <AIRecommendationCard recommendation={aiResult} />
    </div>
  );
}

function SummaryStat({ label, value, highlight }) {
  return (
    <div>
      <p className="text-xs text-gray-400">{label}</p>
      <p className={`mt-1 text-sm font-semibold ${highlight ? "text-white" : "text-gray-200"}`}>
        Rp{Number(value).toLocaleString("id-ID")}
      </p>
    </div>
  );
}
