import os
import json
import logging
from google import genai
from google.genai import types
from google.genai.errors import APIError as GeminiAPIError, ClientError

from .models import AIRecommendationRequest, AIRecommendationResponse

logger = logging.getLogger(__name__)

GEMINI_MODEL = "gemini-2.5-flash"
REQUEST_TIMEOUT_MS = 25_000  # google-genai expects milliseconds

_client: genai.Client | None = None


def get_client() -> genai.Client:
    """Lazy singleton so missing API key fails at request time with a clear error,
    not at import time (which would crash the whole server)."""
    global _client
    if _client is None:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError(
                "GEMINI_API_KEY tidak ditemukan di environment variables."
            )
        _client = genai.Client(api_key=api_key)
    return _client


def _build_system_prompt() -> str:
    """
    Prompt dirancang agar Gemini SELALU mengembalikan JSON murni yang sesuai
    skema AIRecommendationResponse. Dikombinasikan dengan response_schema di
    request agar output terstruktur secara andal (structured output Gemini).
    """
    return (
        "Anda adalah seorang konsultan strategi bisnis dan pricing senior yang "
        "berpengalaman di pasar Indonesia. Anda akan menerima data biaya produksi "
        "(HPP per unit), margin keuntungan yang diinginkan, dan deskripsi produk.\n\n"
        "Tugas Anda:\n"
        "1. Tentukan rekomendasi harga jual final yang kompetitif dan realistis untuk pasar Indonesia, "
        "dengan mempertimbangkan HPP, margin yang diminta, dan psikologi harga (contoh: harga charm pricing seperti Rp49.000 alih-alih Rp50.000 jika relevan).\n"
        "2. Berikan alasan singkat (1-2 kalimat) di balik harga tersebut.\n"
        "3. Tentukan segmentasi target pasar yang paling ideal untuk produk ini.\n"
        "4. Berikan TEPAT 3 ide strategi promosi digital yang konkret dan actionable "
        "(sebutkan platform atau taktik spesifik, bukan saran generik).\n\n"
        "Semua teks dalam respons harus menggunakan Bahasa Indonesia."
    )


def _build_user_prompt(payload: AIRecommendationRequest) -> str:
    target_price_line = (
        f"- Target harga jual yang diinginkan user: Rp{payload.target_price:,.0f}\n"
        if payload.target_price
        else ""
    )
    return (
        f"Data produk:\n"
        f"- Deskripsi produk: {payload.product_description}\n"
        f"- HPP (Harga Pokok Penjualan) per unit: Rp{payload.hpp_per_unit:,.0f}\n"
        f"- Margin keuntungan yang diinginkan: {payload.margin_percentage}%\n"
        f"{target_price_line}"
        f"\nBerikan rekomendasi sesuai skema yang telah ditentukan."
    )


# Skema JSON eksplisit untuk structured output Gemini.
# Ini jauh lebih andal daripada meminta Gemini "menulis JSON" lewat instruksi teks saja.
_RESPONSE_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "recommended_price": {"type": "NUMBER"},
        "price_reasoning": {"type": "STRING"},
        "target_market_segment": {"type": "STRING"},
        "promotion_strategies": {
            "type": "ARRAY",
            "items": {"type": "STRING"},
            "minItems": 3,
            "maxItems": 3,
        },
    },
    "required": [
        "recommended_price",
        "price_reasoning",
        "target_market_segment",
        "promotion_strategies",
    ],
}


async def get_sales_recommendation(
    payload: AIRecommendationRequest,
) -> AIRecommendationResponse:
    """
    Memanggil Gemini untuk menghasilkan rekomendasi strategi penjualan.
    Melempar exception spesifik agar layer API bisa mengembalikan
    HTTP status & pesan error yang sesuai ke frontend.
    """
    client = get_client()

    try:
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=_build_user_prompt(payload),
            config=types.GenerateContentConfig(
                system_instruction=_build_system_prompt(),
                response_mime_type="application/json",
                response_schema=_RESPONSE_SCHEMA,
                max_output_tokens=1024,
                http_options=types.HttpOptions(timeout=REQUEST_TIMEOUT_MS),
            ),
        )
    except TimeoutError as exc:
        logger.warning("Gemini API timeout: %s", exc)
        raise TimeoutError("Permintaan ke AI melebihi batas waktu.") from exc
    except ClientError as exc:
        # Termasuk error auth (API key salah/expired) dan rate limit
        logger.error("Gemini API client error: %s", exc)
        raise RuntimeError(f"AI service error: {exc}") from exc
    except GeminiAPIError as exc:
        logger.error("Gemini API error: %s", exc)
        raise RuntimeError(f"AI service error: {exc}") from exc

    raw_text = response.text

    if not raw_text:
        logger.error("Gemini returned empty response")
        raise ValueError("Respons AI kosong atau tidak sesuai format yang diharapkan.")

    try:
        parsed = json.loads(raw_text)
        return AIRecommendationResponse(**parsed)
    except (json.JSONDecodeError, TypeError, ValueError) as exc:
        logger.error("Failed to parse AI response: %s | raw=%s", exc, raw_text)
        raise ValueError("Respons AI tidak sesuai format yang diharapkan.") from exc
