"""
Entry point untuk Vercel Python Serverless Function.
Vercel akan meng-import variabel `app` di file ini dan menjalankannya
sebagai ASGI app. Kita hanya re-export FastAPI app yang sudah ada
di backend/app/main.py agar tidak ada duplikasi logika.
"""
import os
import sys

# Tambahkan folder backend ke sys.path agar `from app.main import app` bisa ditemukan
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.main import app  # noqa: E402
