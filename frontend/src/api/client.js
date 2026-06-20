const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

const DEFAULT_TIMEOUT_MS = 30000;

class APIError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "APIError";
    this.status = status;
  }
}

/**
 * Fetch wrapper dengan timeout menggunakan AbortController.
 * Melempar APIError dengan pesan yang ramah untuk ditampilkan di UI.
 */
async function fetchWithTimeout(url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      let detail = "Terjadi kesalahan pada server.";
      try {
        const errorBody = await response.json();
        detail = errorBody.detail || detail;
      } catch {
        // response body bukan JSON, gunakan pesan default
      }
      throw new APIError(detail, response.status);
    }

    return await response.json();
  } catch (err) {
    clearTimeout(timeoutId);

    if (err.name === "AbortError") {
      throw new APIError(
        "Permintaan ke server melebihi batas waktu. Silakan coba lagi.",
        408
      );
    }
    if (err instanceof APIError) {
      throw err;
    }
    // Network error (server mati, CORS, dll)
    throw new APIError(
      "Tidak dapat terhubung ke server. Periksa koneksi Anda atau coba lagi nanti.",
      0
    );
  }
}

export async function calculateHPP(payload) {
  return fetchWithTimeout(`${API_BASE_URL}/api/hpp/calculate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function getSalesRecommendation(payload) {
  // AI call diberi timeout lebih panjang karena butuh waktu generasi lebih lama
  return fetchWithTimeout(
    `${API_BASE_URL}/api/ai/sales-recommendation`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    35000
  );
}

export { APIError };
