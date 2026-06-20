import logging
import os
from dotenv import load_dotenv

load_dotenv()  # memuat .env sebelum modul lain membaca os.getenv (lihat ai_service.py)

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .models import (
    HPPRequest,
    HPPResponse,
    AIRecommendationRequest,
    AIRecommendationResponse,
)
from .hpp_calculator import calculate_hpp
from .ai_service import get_sales_recommendation

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="HPP Calculator & AI Sales Strategy API",
    version="1.0.0",
)

# Sesuaikan origins dengan domain frontend Anda saat deploy ke production.
# Tambahkan domain Vercel via env var ALLOWED_ORIGINS (dipisah koma) jika frontend
# di-hosting terpisah dari backend. Jika satu domain (default setup Vercel di repo ini),
# CORS sebenarnya tidak krusial karena request same-origin, tapi tetap aman untuk diisi.
_extra_origins = os.getenv("ALLOWED_ORIGINS", "")
_origins = ["http://localhost:5173", "http://127.0.0.1:5173"] + [
    o.strip() for o in _extra_origins.split(",") if o.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    return {"status": "ok"}


@app.post("/api/hpp/calculate", response_model=HPPResponse)
async def calculate_hpp_endpoint(payload: HPPRequest):
    """Kalkulasi HPP murni di backend (sumber kebenaran tunggal,
    walau frontend juga menghitung real-time untuk UX)."""
    try:
        return calculate_hpp(payload)
    except ZeroDivisionError:
        raise HTTPException(status_code=400, detail="Jumlah unit harus lebih dari 0.")


@app.post("/api/ai/sales-recommendation", response_model=AIRecommendationResponse)
async def sales_recommendation_endpoint(payload: AIRecommendationRequest):
    """Meneruskan data HPP + margin ke Claude untuk mendapatkan
    rekomendasi harga jual, segmentasi pasar, dan strategi promosi."""
    try:
        return await get_sales_recommendation(payload)
    except TimeoutError as exc:
        raise HTTPException(status_code=504, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=502, detail=str(exc))
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    except Exception as exc:  # safety net — never leak raw stack traces to client
        logger.exception("Unexpected error in AI recommendation endpoint")
        raise HTTPException(status_code=500, detail="Terjadi kesalahan internal pada server.")
