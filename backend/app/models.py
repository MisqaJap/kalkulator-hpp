from pydantic import BaseModel, Field
from typing import List


class CostItem(BaseModel):
    """Single line item for raw material / labor / overhead."""
    name: str = Field(..., min_length=1, description="Nama item biaya")
    amount: float = Field(..., ge=0, description="Nominal biaya (Rupiah)")


class HPPRequest(BaseModel):
    raw_materials: List[CostItem] = Field(default_factory=list)
    direct_labor: List[CostItem] = Field(default_factory=list)
    overhead: List[CostItem] = Field(default_factory=list)
    unit_count: int = Field(..., gt=0, description="Jumlah unit yang diproduksi")


class HPPResponse(BaseModel):
    total_raw_materials: float
    total_direct_labor: float
    total_overhead: float
    total_hpp: float
    hpp_per_unit: float
    unit_count: int


class AIRecommendationRequest(BaseModel):
    hpp_per_unit: float = Field(..., gt=0)
    margin_percentage: float = Field(..., ge=0, le=1000, description="Persentase margin, contoh 30 = 30%")
    target_price: float | None = Field(default=None, ge=0, description="Opsional: target harga jual manual")
    product_description: str = Field(..., min_length=3, max_length=500)


class AIRecommendationResponse(BaseModel):
    recommended_price: float
    price_reasoning: str
    target_market_segment: str
    promotion_strategies: List[str]
