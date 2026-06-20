from .models import HPPRequest, HPPResponse


def calculate_hpp(payload: HPPRequest) -> HPPResponse:
    """
    Menghitung Harga Pokok Penjualan (HPP).

    Total HPP = Total Bahan Baku + Total Tenaga Kerja Langsung + Total Overhead
    HPP per unit = Total HPP / Jumlah Unit
    """
    total_raw_materials = sum(item.amount for item in payload.raw_materials)
    total_direct_labor = sum(item.amount for item in payload.direct_labor)
    total_overhead = sum(item.amount for item in payload.overhead)

    total_hpp = total_raw_materials + total_direct_labor + total_overhead
    hpp_per_unit = total_hpp / payload.unit_count if payload.unit_count > 0 else 0.0

    return HPPResponse(
        total_raw_materials=round(total_raw_materials, 2),
        total_direct_labor=round(total_direct_labor, 2),
        total_overhead=round(total_overhead, 2),
        total_hpp=round(total_hpp, 2),
        hpp_per_unit=round(hpp_per_unit, 2),
        unit_count=payload.unit_count,
    )
