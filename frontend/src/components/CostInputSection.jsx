function formatRupiahInput(value) {
  // Hanya angka, tanpa pemisah ribuan saat editing agar cursor tidak melompat
  return value.replace(/[^0-9]/g, "");
}

export default function CostInputSection({ title, items, onChange }) {
  const handleItemChange = (id, field, value) => {
    const updated = items.map((item) =>
      item.id === id
        ? { ...item, [field]: field === "amount" ? formatRupiahInput(value) : value }
        : item
    );
    onChange(updated);
  };

  const handleAddItem = () => {
    onChange([...items, { id: crypto.randomUUID(), name: "", amount: "" }]);
  };

  const handleRemoveItem = (id) => {
    onChange(items.filter((item) => item.id !== id));
  };

  const subtotal = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        <span className="text-sm font-medium text-gray-500">
          Rp{subtotal.toLocaleString("id-ID")}
        </span>
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Nama item (mis. Kain Katun)"
              value={item.name}
              onChange={(e) => handleItemChange(item.id, "name", e.target.value)}
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <div className="relative w-36">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                Rp
              </span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={item.amount ? Number(item.amount).toLocaleString("id-ID") : ""}
                onChange={(e) => handleItemChange(item.id, "amount", e.target.value)}
                className="w-full rounded-md border border-gray-300 py-2 pl-8 pr-3 text-right text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <button
              type="button"
              onClick={() => handleRemoveItem(item.id)}
              className="rounded-md p-2 text-gray-400 hover:bg-red-50 hover:text-red-500"
              aria-label="Hapus item"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleAddItem}
        className="mt-3 text-sm font-medium text-indigo-600 hover:text-indigo-700"
      >
        + Tambah item
      </button>
    </div>
  );
}
