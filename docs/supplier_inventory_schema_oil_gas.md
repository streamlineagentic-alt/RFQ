# Oil & Gas Supplier Inventory Schema
**RFQ Management Platform — Supplier Product Database**

---

## Overview

Suppliers upload their product inventory using the CSV template (`supplier_inventory_template_oil_gas.csv`). Each row represents one SKU/product.
Products are classified by **sector** and **product family**, then enriched with technical specifications relevant to oil & gas procurement.

---

## Sector Classification

| Sector | Typical Product Families |
|--------|--------------------------|
| `upstream` | Wellhead & Christmas Tree, Drilling Equipment, Casing & Tubing, BOP Equipment, Drilling Chemicals, Downhole Tools, Subsea Equipment |
| `midstream` | Pipeline Fittings, Ball Valves, Gate Valves, Check Valves, Compressors, Metering & Fiscal, SCADA & Control, Pig Launchers |
| `downstream` | Heat Exchangers, Pressure Vessels & Reactors, Refinery Pumps, Storage Tanks, Instrumentation & Analyzers, Fired Heaters, Catalysts |
| `consumer` | Safety & PPE, Fire & Gas Detection, Lifting & Rigging, Electrical & Lighting, Mechanical Seals, Gaskets & Seals, Lubricants |

---

## Column Definitions

### Supplier Identification
| Column | Required | Description | Example |
|--------|----------|-------------|---------|
| `supplier_company_name` | ✅ | Registered company name on the platform | `DrilTech Supply Co.` |
| `supplier_type` | | OEM (original manufacturer) or Distributor | `OEM` / `Distributor` |

### Product Identification
| Column | Required | Description | Example |
|--------|----------|-------------|---------|
| `vendor_sku` | ✅ | Your internal SKU / catalogue number | `DTS-WHD-36-5000` |
| `manufacturer_name` | | OEM name if you are a distributor | `Cameron` |
| `manufacturer_part_number` | | OEM's own part number / MPN | `C-WH-3650-FL` |
| `product_description` | ✅ | Full description: type, size, rating, material | `Wellhead Casing Spool 13-3/8" x 10-3/4" 5000 PSI API 6A` |

### Classification
| Column | Required | Description | Allowed Values |
|--------|----------|-------------|----------------|
| `sector` | ✅ | Oil & gas sector | `upstream` / `midstream` / `downstream` / `consumer` |
| `product_family` | | Broad product group | See sector table above |
| `category` | | Specific sub-category | e.g. `Wellhead Equipment`, `Drill Bits`, `Flow Meters` |

### Standards & Specifications
| Column | Description | Example |
|--------|-------------|---------|
| `api_standard` | Primary API specification | `API 6A`, `API 5CT`, `API 6D`, `API 610`, `API 650` |
| `astm_standard` | ASTM material standard | `ASTM A105`, `ASTM A516 Gr70`, `ASTM A234 WPB` |
| `other_standard` | Any other applicable standard | `ASME B16.5`, `EN 60079`, `TEMA C`, `NFPA 30` |

### Pressure & Temperature Ratings
| Column | Description | Example |
|--------|-------------|---------|
| `pressure_rating_psi` | Working pressure in PSI | `5000`, `1440`, `2220` |
| `pressure_class_ansi` | ANSI/ASME pressure class | `150#`, `300#`, `600#`, `900#`, `1500#`, `2500#`, `PN40` |
| `temperature_rating_min_c` | Minimum design temperature °C | `-60`, `-29` |
| `temperature_rating_max_c` | Maximum design temperature °C | `121`, `200`, `427` |

### Material & Dimensions
| Column | Description | Example |
|--------|-------------|---------|
| `material_grade` | Material specification | `ASTM A216 WCB`, `API 5L X65`, `AISI 4130`, `SS316L` |
| `size_nps` | Nominal pipe size in inches | `2`, `4`, `8`, `12`, `16` |
| `size_mm` | Outer diameter in mm | `60.3`, `114.3`, `323.85`, `406.4` |
| `wall_thickness_in` | Wall thickness in inches | `0.254`, `0.500`, `0.472` |
| `end_connection` | Connection type | `Flanged RF`, `Flanged RTJ`, `Butt Weld`, `Threaded`, `EUE 8rd`, `BTC`, `Hub` |
| `bore_configuration` | Bore type | `Full Bore`, `Reduced Bore` |
| `actuator_type` | Valve actuator | `Manual`, `Manual (Gear)`, `Pneumatic`, `Electric`, `Hydraulic` |

### Service Conditions
| Column | Description | Allowed Values |
|--------|-------------|----------------|
| `fluid_service` | Process fluid type | `Oil`, `Gas`, `Water`, `Multiphase`, `H2S`, `Steam`, `Chemicals`, `Hydrocarbons` |
| `is_h2s_service` | Suitable for H2S sour service | `Yes` / `No` |
| `nace_compliant` | Meets NACE MR0175 / ISO 15156 | `Yes` / `No` |
| `ex_rating` | Hazardous area classification | `ATEX Zone 1`, `ATEX Zone 2`, `IECEx`, `NEC Class I Div 1` |
| `hazard_class` | Dangerous goods class | `9`, `3`, `8` (for chemicals) |
| `un_number` | UN dangerous goods number | `UN1863`, `UN2810` |

### Compliance & Origin
| Column | Description | Example |
|--------|-------------|---------|
| `certifications` | JSON array of certs held | `{"API 6A": true, "CE": true, "ATEX": true, "NACE MR0175": true}` |
| `country_of_origin` | Manufacturing country | `USA`, `Germany`, `Italy` |
| `hs_code` | Harmonised System tariff code | `8481.80.39`, `7304.29.10` |
| `export_controlled` | Subject to export licence | `Yes` / `No` |

### Commercial
| Column | Required | Description | Example |
|--------|----------|-------------|---------|
| `min_order_qty` | | Minimum order quantity | `1`, `25`, `50` |
| `min_order_qty_uom` | | UOM for MOQ | `pcs`, `ton`, `meters`, `set` |
| `lead_time_days` | | Typical delivery lead time in calendar days | `21`, `60`, `90` |
| `incoterms` | | Trade terms | `EXW`, `FCA`, `FOB`, `CIF`, `DAP`, `DDP` |

### Availability
| Column | Required | Description | Example |
|--------|----------|-------------|---------|
| `qty_available` | ✅ | Quantity currently in stock | `4`, `350`, `800` |
| `qty_uom` | ✅ | Unit of measure | `pcs`, `joints`, `ton`, `meters`, `set`, `pail` |
| `condition` | | Product condition | `new`, `surplus_new`, `refurbished`, `used` |
| `unit_price` | ✅ | Price per UOM | `28500`, `185`, `1850` |
| `currency` | ✅ | ISO 4217 currency code | `USD`, `EUR`, `GBP` |
| `ship_from_location` | | City/warehouse | `Houston, TX`, `Aberdeen` |
| `ship_from_country` | | Country of shipment origin | `USA`, `UK`, `Germany` |
| `earliest_ship_date` | | Earliest available ship date | `2026-03-15` (YYYY-MM-DD) |
| `notes` | | Additional notes for buyers | Certifications, test reports, storage, options |

---

## Common API Standards Reference

| Standard | Scope |
|----------|-------|
| API 5CT | Casing and tubing for oil wells |
| API 5L | Line pipe for oil & gas pipelines |
| API 6A | Wellhead and Christmas tree equipment |
| API 6D | Pipeline valves |
| API 16A | Blowout preventers (BOPs) |
| API 17D | Subsea wellhead and Christmas tree equipment |
| API 610 | Centrifugal pumps for petroleum |
| API 618 | Reciprocating compressors |
| API 650 | Welded tanks for oil storage |
| AGA-9 | Measurement of gas by multipath ultrasonic meters |
| ASME VIII Div.1 | Pressure vessel construction code |
| ASME B16.5 | Pipe flanges and flanged fittings |
| NACE MR0175 / ISO 15156 | Materials for H2S sour service |
| EN 60079 | Electrical equipment for explosive atmospheres |

---

## Import Notes

1. **One row = one SKU.** If a product comes in multiple sizes/ratings, submit one row per variant.
2. **Certifications** column uses JSON format: `{"API 6A": true, "CE": true}` — use double-quotes and escape inner quotes.
3. **Dates** must be in `YYYY-MM-DD` format.
4. **is_h2s_service / nace_compliant / export_controlled**: use `Yes` or `No`.
5. **Prices** are per `qty_uom`. For bulk chemicals sold by the ton, enter price per ton.
6. Delete the instruction row (row 2) before importing.
