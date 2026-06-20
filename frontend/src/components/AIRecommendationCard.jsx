export default function AIRecommendationCard({ recommendation }) {
  if (!recommendation) return null;

  const {
    recommended_price,
    price_reasoning,
    target_market_segment,
    promotion_strategies,
  } = recommendation;

  return (
    <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
        </span>
        <h3 className="text-sm font-semibold text-indigo-900">
          Rekomendasi Strategi Penjualan (AI)
        </h3>
      </div>

      <div className="mb-4 rounded-lg bg-white p-4 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          Harga Jual Disarankan
        </p>
        <p className="mt-1 text-2xl font-bold text-indigo-700">
          Rp{Number(recommended_price).toLocaleString("id-ID")}
        </p>
        <p className="mt-2 text-sm text-gray-600">{price_reasoning}</p>
      </div>

      <div className="mb-4">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          Target Segmentasi Pasar
        </p>
        <p className="mt-1 text-sm text-gray-700">{target_market_segment}</p>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
          Ide Strategi Promosi Digital
        </p>
        <ul className="space-y-2">
          {promotion_strategies.map((strategy, idx) => (
            <li key={idx} className="flex gap-2 text-sm text-gray-700">
              <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700">
                {idx + 1}
              </span>
              <span>{strategy}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
