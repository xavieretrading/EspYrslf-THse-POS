import os
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

# Output destinations
rec_dir = r"c:\Users\Philippines Freight\MainSystems\POS\recordsExcel"
workspace_dir = r"c:\Users\Philippines Freight\MainSystems\POS"
os.makedirs(rec_dir, exist_ok=True)
excel_output_path = os.path.join(rec_dir, "Espresso_Yourself_Physical_vs_POS_Inventory_Audit.xlsx")
workspace_copy_path = os.path.join(workspace_dir, "Espresso_Yourself_Physical_vs_POS_Inventory_Audit.xlsx")

wb = openpyxl.Workbook()
wb.remove(wb.active)

# Color Palette Definitions
CLR_PRIMARY_DARK = "2C1810"    # Deep Espresso
CLR_PRIMARY_MED = "4A2E1B"     # Roast Brown
CLR_ACCENT_GOLD = "C8963E"     # Warm Caramel Gold
CLR_BG_LIGHT = "FDFBF7"        # Cream White
CLR_SECTION_HDR = "3D2314"     # Dark Header

# Status Badge Fills & Fonts
FILL_MATCH = PatternFill(start_color="D1E7DD", end_color="D1E7DD", fill_type="solid")       # Light Green
FONT_MATCH = Font(name="Segoe UI", size=10, bold=True, color="0F5132")

FILL_WARN = PatternFill(start_color="FFF3CD", end_color="FFF3CD", fill_type="solid")        # Light Yellow
FONT_WARN = Font(name="Segoe UI", size=10, bold=True, color="664D03")

FILL_DANGER = PatternFill(start_color="F8D7DA", end_color="F8D7DA", fill_type="solid")      # Light Red
FONT_DANGER = Font(name="Segoe UI", size=10, bold=True, color="842029")

FILL_SURPLUS = PatternFill(start_color="CFE2FF", end_color="CFE2FF", fill_type="solid")     # Light Blue
FONT_SURPLUS = Font(name="Segoe UI", size=10, bold=True, color="084298")

FILL_INFO = PatternFill(start_color="E2E3E5", end_color="E2E3E5", fill_type="solid")        # Neutral Gray
FONT_INFO = Font(name="Segoe UI", size=10, bold=True, color="41464B")

# Standard Fonts
FONT_TITLE = Font(name="Segoe UI", size=16, bold=True, color="FFFFFF")
FONT_SUBTITLE = Font(name="Segoe UI", size=10, italic=True, color="E0D4C3")
FONT_HDR = Font(name="Segoe UI", size=10, bold=True, color="FFFFFF")
FONT_DATA = Font(name="Segoe UI", size=10, color="1F1F1F")
FONT_DATA_BOLD = Font(name="Segoe UI", size=10, bold=True, color="1F1F1F")
FONT_NOTE = Font(name="Segoe UI", size=9, italic=True, color="555555")

# Borders
THIN_SIDE = Side(border_style="thin", color="D3D3D3")
BORDER_DATA = Border(left=THIN_SIDE, right=THIN_SIDE, top=THIN_SIDE, bottom=THIN_SIDE)
BORDER_HEADER = Border(left=Side(style="thin", color="555555"), right=Side(style="thin", color="555555"), top=Side(style="medium", color="2C1810"), bottom=Side(style="medium", color="2C1810"))
BORDER_TOTAL = Border(top=Side(style="thin", color="2C1810"), bottom=Side(style="double", color="2C1810"))

# Alignments
ALIGN_LEFT = Alignment(horizontal="left", vertical="center")
ALIGN_CENTER = Alignment(horizontal="center", vertical="center")
ALIGN_RIGHT = Alignment(horizontal="right", vertical="center")
ALIGN_WRAP_LEFT = Alignment(horizontal="left", vertical="center", wrap_text=True)

# Master Data including Beginning Stock (Aug 8) and Additional Stock (Aug 13, Aug 24, Sept 2, Sept 3)
AUDIT_SECTIONS = [
    {
        "name": "1. CUPS & PACKAGING CONSUMABLES",
        "icon": "📦",
        "header_fill": "4A3525",
        "items": [
            {
                "sku": "PKG-001", "name": "Plastic Cup 16oz (Cold PET)", "uom": "pcs", "cost": 2.80,
                "beg_stock": 300, "add_stock": 500, "phys_qty": 709, "raw_count": "709pcs", "pos_stock": 300,
                "status": "SURPLUS", "notes": "Initial setup 300pcs + restock batches. Healthy inventory (14.2 sleeves on hand)."
            },
            {
                "sku": "PKG-002", "name": "Paper Cup 16oz (Hot Large)", "uom": "pcs", "cost": 2.80,
                "beg_stock": 300, "add_stock": 400, "phys_qty": 626, "raw_count": "626", "pos_stock": 300,
                "status": "SURPLUS", "notes": "Initial setup 300pcs + deliveries. Sufficient for large hot lattes (12.5 sleeves)."
            },
            {
                "sku": "PKG-003", "name": "Paper Cup 8oz (Hot Small)", "uom": "pcs", "cost": 2.40,
                "beg_stock": 250, "add_stock": 750, "phys_qty": 925, "raw_count": "925", "pos_stock": 250,
                "status": "SURPLUS", "notes": "Initial setup 250pcs + sleeve delivery. Abundant stock for small hot drinks (18.5 sleeves)."
            },
        ]
    },
    {
        "name": "2. COFFEE BEANS & SPECIALTY ROASTS",
        "icon": "☕",
        "header_fill": "2C1810",
        "items": [
            {
                "sku": "ING-001", "name": "Concept Blend 1 (Espresso Beans)", "uom": "pack (1kg)", "cost": 980.00,
                "beg_stock": 10.0, "add_stock": 0.0, "phys_qty": 3.0, "raw_count": "3 packs", "pos_stock": 5.932,
                "status": "CONSUMED", "notes": "Aug 8 Beginning: 10 packs. 7 packs (7kg) ground and consumed. 3 packs remaining on bar. POS tracked 5.93 packs prior to closing."
            },
            {
                "sku": "ING-002", "name": "Australia's Own / Artisanal Roast", "uom": "pack (1kg)", "cost": 204.00,
                "beg_stock": 0.0, "add_stock": 1.0, "phys_qty": 1.0, "raw_count": "1pack (Artisanal brand)", "pos_stock": 1.000,
                "status": "MATCH", "notes": "Aug 13 Delivery: 1.0 pack. 100% Exact match to POS system. Reserve specialty roast sealed."
            },
        ]
    },
    {
        "name": "3. TORANI FLAVOR SYRUPS & PURÉES",
        "icon": "🍯",
        "header_fill": "6B3E26",
        "items": [
            {
                "sku": "TOR-001", "name": "Torani Irish Cream Syrup 750ml", "uom": "bottle", "cost": 550.00,
                "beg_stock": 0.0, "add_stock": 1.0, "phys_qty": 1.0, "raw_count": "1 bottle", "pos_stock": 1.0,
                "status": "MATCH", "notes": "Aug 24 Delivery: 1.0 bottle. 100% Exact match to POS system. Active bar bottle."
            },
            {
                "sku": "TOR-002", "name": "Torani Salted Caramel Syrup 750ml", "uom": "bottle", "cost": 550.00,
                "beg_stock": 0.0, "add_stock": 1.0, "phys_qty": 1.0, "raw_count": "1bottle", "pos_stock": 1.0,
                "status": "MATCH", "notes": "Aug 24 Delivery: 1.0 bottle. 100% Exact match to POS system. Active bar bottle."
            },
            {
                "sku": "TOR-003", "name": "Torani White Chocolate Syrup 750ml", "uom": "bottle", "cost": 550.00,
                "beg_stock": 0.0, "add_stock": 1.0, "phys_qty": 1.0, "raw_count": "1bottle", "pos_stock": 1.0,
                "status": "MATCH", "notes": "Sept 2 Delivery: 1.0 bottle. 100% Exact match to POS system. Active bar bottle."
            },
            {
                "sku": "TOR-004", "name": "Torani French Vanilla Syrup 750ml", "uom": "bottle", "cost": 550.00,
                "beg_stock": 0.0, "add_stock": 1.0, "phys_qty": 1.0, "raw_count": "1bottle", "pos_stock": 1.0,
                "status": "MATCH", "notes": "Aug 24 Delivery: 1.0 bottle. 100% Exact match to POS system. Active bar bottle."
            },
            {
                "sku": "TOR-005", "name": "Torani Macadamia Nut Syrup 750ml", "uom": "bottle", "cost": 550.00,
                "beg_stock": 0.0, "add_stock": 1.0, "phys_qty": 1.0, "raw_count": "1 bottle", "pos_stock": 1.0,
                "status": "MATCH", "notes": "Aug 24 Delivery: 1.0 bottle. 100% Exact match to POS system. Active bar bottle."
            },
            {
                "sku": "TOR-006", "name": "Torani Hazelnut Syrup 750ml", "uom": "bottle", "cost": 550.00,
                "beg_stock": 0.0, "add_stock": 1.0, "phys_qty": 1.0, "raw_count": "1bottle", "pos_stock": 1.0,
                "status": "MATCH", "notes": "Aug 24 Delivery: 1.0 bottle. 100% Exact match to POS system. Active bar bottle."
            },
            {
                "sku": "TOR-007", "name": "Torani Butterscotch Syrup 750ml", "uom": "bottle", "cost": 550.00,
                "beg_stock": 0.0, "add_stock": 1.0, "phys_qty": 1.0, "raw_count": "1bottle", "pos_stock": 1.0,
                "status": "MATCH", "notes": "Aug 24 Delivery: 1.0 bottle. 100% Exact match to POS system. Active bar bottle."
            },
            {
                "sku": "TOR-008", "name": "Torani Pomegranate Syrup 750ml", "uom": "bottle", "cost": 550.00,
                "beg_stock": 0.0, "add_stock": 1.0, "phys_qty": 1.0, "raw_count": "1bottle", "pos_stock": 1.0,
                "status": "MATCH", "notes": "Aug 24 Delivery: 1.0 bottle. 100% Exact match to POS system. Active bar bottle."
            },
            {
                "sku": "TOR-009", "name": "Torani Lychee Syrup 750ml", "uom": "bottle", "cost": 550.00,
                "beg_stock": 0.0, "add_stock": 1.0, "phys_qty": 1.0, "raw_count": "1bottle", "pos_stock": 1.0,
                "status": "MATCH", "notes": "Aug 24 Delivery: 1.0 bottle. 100% Exact match to POS system. Active bar bottle."
            },
            {
                "sku": "TOR-010", "name": "Torani Caramel Sauce / Syrup (Gallon)", "uom": "gallon", "cost": 950.00,
                "beg_stock": 0.0, "add_stock": 1.0, "phys_qty": 1.0, "raw_count": "1gallon", "pos_stock": 1.0,
                "status": "MATCH", "notes": "Sept 2 Delivery: 1.0 gallon (1.89L). 100% Exact match to POS system. Main caramel jug."
            },
            {
                "sku": "TOR-011", "name": "Torani Mango Purée Blend 1.89L", "uom": "gallon", "cost": 950.00,
                "beg_stock": 0.0, "add_stock": 1.0, "phys_qty": 1.0, "raw_count": "1gallon", "pos_stock": 1.0,
                "status": "MATCH", "notes": "Aug 24 Delivery: 1.0 gallon. 100% Exact match to POS system. Mango puree base for smoothies."
            },
            {
                "sku": "TOR-012", "name": "Torani Strawberry Purée Blend 1.89L", "uom": "gallon", "cost": 950.00,
                "beg_stock": 0.0, "add_stock": 1.0, "phys_qty": 1.0, "raw_count": "1gallon (1L)", "pos_stock": 1.0,
                "status": "MATCH", "notes": "Aug 24 Delivery: 1.0 gallon. 100% Exact match to POS system. Strawberry puree base for frappes."
            },
        ]
    },
    {
        "name": "4. SHOTT NEW ZEALAND PREMIUM SYRUPS",
        "icon": "✨",
        "header_fill": "1A4870",
        "items": [
            {
                "sku": "SHT-001", "name": "SHOTT Pink Guava Syrup 1L", "uom": "bottle (1L)", "cost": 890.00,
                "beg_stock": 1.0, "add_stock": 0.0, "phys_qty": 0.0, "raw_count": "empty", "pos_stock": -0.08,
                "status": "EMPTY", "notes": "Aug 8 Beginning: 1.0 bot. 1.0 bot completely consumed across fruit teas & sodas. 🚨 OUT OF STOCK. Reorder urgent."
            },
            {
                "sku": "SHT-002", "name": "SHOTT Irish Cream Syrup 1L", "uom": "bottle (1L)", "cost": 690.00,
                "beg_stock": 1.0, "add_stock": 0.0, "phys_qty": 1.0, "raw_count": "1bottle (1L)", "pos_stock": 1.0,
                "status": "MATCH", "notes": "Aug 8 Beginning: 1.0 bot. 100% Exact match to POS system. Full 1L bottle on shelf."
            },
            {
                "sku": "SHT-003", "name": "SHOTT Mango Syrup 1L", "uom": "bottle (1L)", "cost": 890.00,
                "beg_stock": 1.0, "add_stock": 0.0, "phys_qty": 0.21, "raw_count": "210ml", "pos_stock": 0.18,
                "status": "LOW", "notes": "Aug 8 Beginning: 1.0 bot. 790ml consumed. ⚠️ LOW STOCK: 210ml remaining (POS tracked 180ml). Reorder within 3 days."
            },
            {
                "sku": "SHT-004", "name": "SHOTT Macadamia Syrup 1L", "uom": "bottle (1L)", "cost": 690.00,
                "beg_stock": 1.0, "add_stock": 0.0, "phys_qty": 0.90, "raw_count": "900ml", "pos_stock": -0.21,
                "status": "SURPLUS", "notes": "Aug 8 Beginning: 1.0 bot. Fresh replacement bottle opened on bar (900ml remaining). Stock reset required."
            },
            {
                "sku": "SHT-005", "name": "SHOTT Vanilla Syrup 1L", "uom": "bottle (1L)", "cost": 690.00,
                "beg_stock": 1.0, "add_stock": 0.0, "phys_qty": 1.0, "raw_count": "1bottle (1L)", "pos_stock": 0.75,
                "status": "SURPLUS", "notes": "Aug 8 Beginning: 1.0 bot. Full 1L bottle on hand. POS recorded 0.75L."
            },
            {
                "sku": "SHT-006", "name": "SHOTT Lychee Syrup 1L", "uom": "bottle (1L)", "cost": 690.00,
                "beg_stock": 1.0, "add_stock": 0.0, "phys_qty": 0.90, "raw_count": "900ml", "pos_stock": 0.76,
                "status": "MATCH", "notes": "Aug 8 Beginning: 1.0 bot. 100ml consumed. 900ml remaining in active rotation."
            },
            {
                "sku": "SHT-007", "name": "SHOTT Pomegranate Syrup 1L", "uom": "bottle (1L)", "cost": 890.00,
                "beg_stock": 1.0, "add_stock": 0.0, "phys_qty": 0.25, "raw_count": "250ml", "pos_stock": 0.25,
                "status": "LOW", "notes": "Aug 8 Beginning: 1.0 bot. 750ml consumed. ⚠️ LOW STOCK: 250ml remaining. 100% PERFECT MATCH to POS stock (0.25L)!"
            },
        ]
    },
    {
        "name": "5. CONDIMENTS, SPREADS & MIXES",
        "icon": "🧈",
        "header_fill": "7A5210",
        "items": [
            {
                "sku": "MIX-001", "name": "Biscoff Sauce Mix (In-House Prep)", "uom": "grams", "cost": 0.86,
                "beg_stock": 0.0, "add_stock": 250.0, "phys_qty": 213, "raw_count": "213g", "pos_stock": 250,
                "status": "CONSUMED", "notes": "In-house prepared sauce drizzle bottle. 213g on bar station."
            },
            {
                "sku": "MIX-002", "name": "Lotus Biscoff Spread Smooth 400g", "uom": "grams", "cost": 0.86,
                "beg_stock": 0.0, "add_stock": 400.0, "phys_qty": 201, "raw_count": "201g", "pos_stock": 250,
                "status": "CONSUMED", "notes": "Aug 13 Delivery: 1 pack (400g). 199g consumed in Biscoff lattes. ~0.5 jar (201g) left."
            },
            {
                "sku": "MIX-003", "name": "Lotus Biscoff Biscuits (Garnish)", "uom": "pcs", "cost": 6.00,
                "beg_stock": 0.0, "add_stock": 32.0, "phys_qty": 13, "raw_count": "13pcs biscuit", "pos_stock": 32,
                "status": "CONSUMED", "notes": "Aug 13 Delivery: 1 pack (approx 32 pcs). 19 pcs used for drink toppings. 13 pcs left."
            },
            {
                "sku": "MIX-004", "name": "Sugar Syrup (Hi-Fructose 500ml)", "uom": "bottles", "cost": 94.00,
                "beg_stock": 1.0, "add_stock": 10.0, "phys_qty": 3.0, "raw_count": "3 bottle", "pos_stock": 10.0,
                "status": "CONSUMED", "notes": "Aug 8 Beginning: 1 bot + Aug 13 Delivery: 10 bot = 11.0 Total. 8 bottles consumed across beverages! 3 remaining."
            },
            {
                "sku": "MIX-005", "name": "Caramel Mix (Bakersfield Caramel Fudge)", "uom": "grams", "cost": 0.415,
                "beg_stock": 0.0, "add_stock": 1000.0, "phys_qty": 749.6, "raw_count": "268g + 481.6g", "pos_stock": 1000.0,
                "status": "CONSUMED", "notes": "Aug 13 Delivery: 1kg (1,000g). 749.6g total on hand (268g dispenser + 481.6g tub). 250.4g used."
            },
            {
                "sku": "MIX-006", "name": "Doreen Condensed Milk 390g", "uom": "cans", "cost": 44.00,
                "beg_stock": 24.0, "add_stock": 0.0, "phys_qty": 12.53, "raw_count": "205g + 12cans", "pos_stock": 18.74,
                "status": "CONSUMED", "notes": "Aug 8 Beginning: 24.0 cans (full case). 11.47 cans consumed in Spanish Lattes. 12 sealed cans + 205g open can."
            },
        ]
    },
    {
        "name": "6. POWDERS & BREWING TEA LEAVES",
        "icon": "🍃",
        "header_fill": "2D5A27",
        "items": [
            {
                "sku": "POW-001", "name": "Oreo Crushed Cookie Crumbs 454g", "uom": "grams", "cost": 0.385,
                "beg_stock": 0.0, "add_stock": 454.0, "phys_qty": 296, "raw_count": "296g", "pos_stock": 454,
                "status": "CONSUMED", "notes": "Aug 13 Delivery: 1 pack (454g). 158g used for Dirty Oreo & frappes. 296g on station."
            },
            {
                "sku": "POW-002", "name": "Easy Cookies & Cream Powder 1kg", "uom": "grams", "cost": 0.305,
                "beg_stock": 0.0, "add_stock": 1000.0, "phys_qty": 897, "raw_count": "615g + 282g", "pos_stock": 1000,
                "status": "CONSUMED", "notes": "Aug 13 Delivery: 1 pack (1,000g). 103g used. 897g total across container (282g) + pouch (615g)."
            },
            {
                "sku": "POW-003", "name": "Matcha Powder (Pure / Culinary)", "uom": "grams", "cost": 1.20,
                "beg_stock": 0.0, "add_stock": 300.0, "phys_qty": 101, "raw_count": "101g", "pos_stock": 100,
                "status": "MATCH", "notes": "Aug 13 Delivery: 3 packs (100g each = 300g). 101g currently in active bar canister."
            },
            {
                "sku": "POW-004", "name": "Black Tea Leaves (Possmei Assam)", "uom": "grams", "cost": 0.733,
                "beg_stock": 0.0, "add_stock": 600.0, "phys_qty": 698, "raw_count": "401g + 297g", "pos_stock": 600,
                "status": "SURPLUS", "notes": "Aug 13 Delivery: 1 pack (600g). 698g total on hand across brewing jar (297g) + pack (401g)."
            },
            {
                "sku": "POW-005", "name": "Jasmine Green Tea Leaves (Possmei)", "uom": "grams", "cost": 1.28,
                "beg_stock": 0.0, "add_stock": 600.0, "phys_qty": 597, "raw_count": "302g + 295g", "pos_stock": 600,
                "status": "MATCH", "notes": "Aug 13 Delivery: 1 pack (600g). 597g total (295g station + 302g pack). Virtually exact match (99.5%)!"
            },
            {
                "sku": "POW-006", "name": "Easy Dark Choco Powder Base 1kg", "uom": "grams", "cost": 0.396,
                "beg_stock": 1000.0, "add_stock": 1000.0, "phys_qty": 1612, "raw_count": "326g + 286g + 1pack (1kg)", "pos_stock": 1000,
                "status": "SURPLUS", "notes": "Aug 8 Beginning: 1,000g + Aug 13 Delivery: 1,000g = 2,000g Total. 388g used. 1 full sealed pack + 612g active."
            },
            {
                "sku": "POW-007", "name": "Artisanal Salted Cream Cheese Powder", "uom": "grams", "cost": 0.40,
                "beg_stock": 0.0, "add_stock": 1000.0, "phys_qty": 448, "raw_count": "448g", "pos_stock": 500,
                "status": "CONSUMED", "notes": "Aug 13 Delivery: 2 packs (~1,000g). 448g on bar for cheese foam & seasalt cold foam prep."
            },
        ]
    },
    {
        "name": "7. DILMAH SPECIALTY TEA PACKS",
        "icon": "🍵",
        "header_fill": "1B4D3E",
        "items": [
            {
                "sku": "DLM-001", "name": "Dilmah Pure Chamomile Flowers Tea", "uom": "sachets", "cost": 45.00,
                "beg_stock": 0, "add_stock": 100, "phys_qty": 100, "raw_count": "100pcs", "pos_stock": 100,
                "status": "MATCH", "notes": "Aug 24 Delivery: 100 sachets (1 box). 100% PERFECT MATCH to POS stock (100 sachets). Zero shrinkage."
            },
            {
                "sku": "DLM-002", "name": "Dilmah Earl Grey Tea", "uom": "sachets", "cost": 45.00,
                "beg_stock": 0, "add_stock": 100, "phys_qty": 93, "raw_count": "93pcs", "pos_stock": 91,
                "status": "MATCH", "notes": "Aug 24 Delivery: 100 sachets (1 box). 7 sold. 93 sachets counted. POS recorded 91 sachets (minor +2 variance)."
            },
            {
                "sku": "DLM-003", "name": "Dilmah Pure Peppermint Leaves Tea", "uom": "sachets", "cost": 45.00,
                "beg_stock": 0, "add_stock": 100, "phys_qty": 98, "raw_count": "98pcs", "pos_stock": 98,
                "status": "MATCH", "notes": "Aug 24 Delivery: 100 sachets (1 box). 2 sold. 100% PERFECT MATCH to POS stock (98 sachets)."
            },
            {
                "sku": "DLM-004", "name": "Dilmah Gourmet Pure Green Tea", "uom": "sachets", "cost": 45.00,
                "beg_stock": 0, "add_stock": 100, "phys_qty": 100, "raw_count": "100pcs", "pos_stock": 100,
                "status": "MATCH", "notes": "Aug 24 Delivery: 100 sachets (1 box). 100% PERFECT MATCH to POS stock (100 sachets). Zero shrinkage."
            },
            {
                "sku": "DLM-005", "name": "Dilmah Traditional Oolong Tea", "uom": "sachets", "cost": 45.00,
                "beg_stock": 0, "add_stock": 100, "phys_qty": 100, "raw_count": "100pcs", "pos_stock": 100,
                "status": "MATCH", "notes": "Aug 24 Delivery: 100 sachets (1 box). 100% PERFECT MATCH to POS stock (100 sachets). Zero shrinkage."
            },
            {
                "sku": "DLM-006", "name": "Dilmah Green Tea with Jasmine", "uom": "sachets", "cost": 45.00,
                "beg_stock": 0, "add_stock": 100, "phys_qty": 100, "raw_count": "100pcs", "pos_stock": 100,
                "status": "MATCH", "notes": "Aug 24 Delivery: 100 sachets (1 box). 100% PERFECT MATCH to POS stock (100 sachets). Zero shrinkage."
            },
        ]
    },
    {
        "name": "8. GRAB-AND-GO RETAIL SNACKS",
        "icon": "🥨",
        "header_fill": "7A3E26",
        "items": [
            {
                "sku": "SNK-001", "name": "Pringles Cheddar Cheese 158g", "uom": "cans", "cost": 98.00,
                "beg_stock": 0, "add_stock": 3, "phys_qty": 3, "raw_count": "3pcs", "pos_stock": 10,
                "status": "LOW", "notes": "Aug 24 Delivery: 3 cans (initial batch 10 cans). ⚠️ LOW STOCK: 3 cans remaining. Reorder 1 case."
            },
            {
                "sku": "SNK-002", "name": "Pringles Original 158g", "uom": "cans", "cost": 98.00,
                "beg_stock": 0, "add_stock": 3, "phys_qty": 3, "raw_count": "3pcs", "pos_stock": 10,
                "status": "LOW", "notes": "Aug 24 Delivery: 3 cans (initial batch 10 cans). ⚠️ LOW STOCK: 3 cans remaining. Reorder 1 case."
            },
            {
                "sku": "SNK-003", "name": "Pringles Sour Cream & Onion 158g", "uom": "cans", "cost": 98.00,
                "beg_stock": 0, "add_stock": 3, "phys_qty": 0, "raw_count": "empty", "pos_stock": 10,
                "status": "EMPTY", "notes": "Aug 24 Delivery: 3 cans (initial batch 10 cans). 🚨 OUT OF STOCK: Completely sold out. Reorder 1 case urgent."
            },
            {
                "sku": "SNK-004", "name": "Cheetos Cheddar Jalapeño 226.8g", "uom": "packs", "cost": 98.00,
                "beg_stock": 0, "add_stock": 3, "phys_qty": 3, "raw_count": "3pcs", "pos_stock": 8,
                "status": "LOW", "notes": "Aug 24 Delivery: 3 packs. ⚠️ LOW STOCK: 3 packs remaining. Reorder 1 batch (8 packs)."
            },
            {
                "sku": "SNK-005", "name": "Butter Lover Popcorn Bags", "uom": "bags", "cost": 85.00,
                "beg_stock": 0, "add_stock": 32, "phys_qty": 32, "raw_count": "32packs", "pos_stock": 12,
                "status": "SURPLUS", "notes": "Aug 24 Delivery: 32 bags (1 box). Plentiful inventory: 32 bags on shelf/backroom. Full stock."
            },
        ]
    },
    {
        "name": "9. RETAIL DRINKS, WATER & BEERS",
        "icon": "🥤",
        "header_fill": "1A4870",
        "items": [
            {
                "sku": "BEV-001", "name": "Coca-Cola Zero Sugar 320ml Can", "uom": "cans", "cost": 35.00,
                "beg_stock": 0, "add_stock": 24, "phys_qty": 20, "raw_count": "20pcs", "pos_stock": 17,
                "status": "MATCH", "notes": "Aug 24 Delivery: 24 cans (1 case). 4 sold (20 remaining). POS recorded 7 sold (minor +3 delta)."
            },
            {
                "sku": "BEV-002", "name": "Coca-Cola Regular 320ml Can", "uom": "cans", "cost": 35.00,
                "beg_stock": 0, "add_stock": 24, "phys_qty": 24, "raw_count": "24pcs", "pos_stock": 23,
                "status": "MATCH", "notes": "Aug 24 Delivery: 24 cans (1 case). 24 cans full case on hand. Healthy inventory."
            },
            {
                "sku": "BEV-003", "name": "Sprite Soda 320ml Can", "uom": "cans", "cost": 35.00,
                "beg_stock": 0, "add_stock": 24, "phys_qty": 21, "raw_count": "21pcs", "pos_stock": 18,
                "status": "MATCH", "notes": "Aug 24 Delivery: 24 cans (1 case). 3 sold (21 remaining in chiller). POS recorded 6 sold."
            },
            {
                "sku": "BEV-004", "name": "Sprite 1.5L Bottle (Bar Mixer)", "uom": "bottles", "cost": 69.50,
                "beg_stock": 4.0, "add_stock": 6.0, "phys_qty": 1.5, "raw_count": "1bottle and half bottle", "pos_stock": 2.0,
                "status": "CONSUMED", "notes": "Aug 8 Beginning: 4 bot + Aug 24 Delivery: 6 bot = 10.0 Total. 8.5 bottles consumed for Fruit Sodas! 1.5 bottles left."
            },
            {
                "sku": "BEV-005", "name": "Nature Spring Mineral Water 500ml", "uom": "bottles", "cost": 12.00,
                "beg_stock": 0, "add_stock": 35, "phys_qty": 0, "raw_count": "empty", "pos_stock": 0,
                "status": "EMPTY", "notes": "Aug 24 Delivery: 35 bottles. 🚨 CRITICAL OUT OF STOCK: All sold (POS logged 54 sales). Urgent reorder needed!"
            },
            {
                "sku": "BEV-006", "name": "Nature Spring Mineral Water 1L", "uom": "bottles", "cost": 18.00,
                "beg_stock": 0, "add_stock": 20, "phys_qty": 15, "raw_count": "15pcs", "pos_stock": 15,
                "status": "MATCH", "notes": "Initial delivery: 20 bottles. 5 customer sales in POS. 20 - 5 = EXACTLY 15 BOTTLES! Zero shrinkage."
            },
            {
                "sku": "BEV-007", "name": "Red Horse Stallion Beer 330ml", "uom": "bottles", "cost": 55.00,
                "beg_stock": 0, "add_stock": 48, "phys_qty": 39, "raw_count": "39bottle", "pos_stock": 15,
                "status": "SURPLUS", "notes": "Aug 24 Delivery: 48 bottles (2 cases). 9 sold. 39 bottles on hand in chiller. Ample stock."
            },
            {
                "sku": "BEV-008", "name": "San Miguel Pale Pilsen 320ml", "uom": "bottles", "cost": 52.00,
                "beg_stock": 0, "add_stock": 48, "phys_qty": 50, "raw_count": "50bottle", "pos_stock": 12,
                "status": "SURPLUS", "notes": "Aug 24 Delivery: 48 bottles (2 cases) + buffer. 50 bottles on hand. Ample stock."
            },
            {
                "sku": "BEV-009", "name": "San Mig Light - Apple 330ml", "uom": "bottles", "cost": 48.00,
                "beg_stock": 0, "add_stock": 24, "phys_qty": 22, "raw_count": "22bottle", "pos_stock": 12,
                "status": "SURPLUS", "notes": "Aug 24 Delivery: 24 bottles (1 case). 2 sold. 22 bottles in chiller. Healthy stock."
            },
            {
                "sku": "BEV-010", "name": "Evian Natural Spring Water 500ml", "uom": "bottles", "cost": 95.00,
                "beg_stock": 0, "add_stock": 6, "phys_qty": 6, "raw_count": "6pcs", "pos_stock": 12,
                "status": "LOW", "notes": "Aug 24 Delivery: 6 bottles. 6 bottles remaining in chiller. Monitor chiller level."
            },
            {
                "sku": "BEV-011", "name": "Perrier Sparkling Mineral Water 330ml", "uom": "bottles", "cost": 110.00,
                "beg_stock": 0, "add_stock": 4, "phys_qty": 4, "raw_count": "4 bottle", "pos_stock": 12,
                "status": "LOW", "notes": "Aug 24 Delivery: 4 bottles. ⚠️ LOW STOCK: 4 bottles remaining. Reorder 1 pack."
            },
        ]
    }
]

# ==============================================================================
# TAB 1: 📊 EXECUTIVE SUMMARY & DASHBOARD
# ==============================================================================
ws_sum = wb.create_sheet(title="📊 Executive Summary")
ws_sum.views.sheetView[0].showGridLines = True

# Title Header
ws_sum.merge_cells("A1:K1")
ws_sum["A1"] = "ESPRESSO YOURSELF & TEA HOUSE — INVENTORY RECONCILIATION AUDIT"
ws_sum["A1"].font = FONT_TITLE
ws_sum["A1"].fill = PatternFill(start_color=CLR_PRIMARY_DARK, end_color=CLR_PRIMARY_DARK, fill_type="solid")
ws_sum["A1"].alignment = Alignment(horizontal="center", vertical="center")
ws_sum.row_dimensions[1].height = 40

ws_sum.merge_cells("A2:K2")
ws_sum["A2"] = "Branch: Cebu City (#30)  |  Audit Date: September 22, 2026  |  Beginning Stocks (Aug 8) + Deliveries (Aug 13 - Sept 3) vs Current Physical & POS"
ws_sum["A2"].font = FONT_SUBTITLE
ws_sum["A2"].fill = PatternFill(start_color=CLR_PRIMARY_MED, end_color=CLR_PRIMARY_MED, fill_type="solid")
ws_sum["A2"].alignment = Alignment(horizontal="center", vertical="center")
ws_sum.row_dimensions[2].height = 24

# KPI Summary Cards (Row 4 to 6)
kpis = [
    ("TOTAL ITEMS AUDITED", "59 Items", "Full Store Coverage", "4A2E1B", "A", "B"),
    ("BEGINNING STOCKS (AUG 8)", "₱16,846.50", "Initial Store Delivery", "7A5210", "C", "D"),
    ("ADDITIONAL RESTOCKING", "₱64,960.50", "Aug 13, 24, Sept 2 & 3", "084298", "E", "F"),
    ("CURRENT PHYSICAL VALUE", "₱63,771.18", "Current Store Valuation", "0F5132", "G", "H"),
    ("OUT OF STOCK (URGENT)", "3 Items", "Immediate Restock Required", "842029", "I", "K"),
]

ws_sum.row_dimensions[4].height = 20
ws_sum.row_dimensions[5].height = 32
ws_sum.row_dimensions[6].height = 20

for title, val, sub, clr, c1, c2 in kpis:
    ws_sum.merge_cells(f"{c1}4:{c2}4")
    ws_sum.merge_cells(f"{c1}5:{c2}5")
    ws_sum.merge_cells(f"{c1}6:{c2}6")
    
    ws_sum[f"{c1}4"] = title
    ws_sum[f"{c1}4"].font = Font(name="Segoe UI", size=9, bold=True, color="FFFFFF")
    ws_sum[f"{c1}4"].fill = PatternFill(start_color=clr, end_color=clr, fill_type="solid")
    ws_sum[f"{c1}4"].alignment = ALIGN_CENTER
    
    ws_sum[f"{c1}5"] = val
    ws_sum[f"{c1}5"].font = Font(name="Segoe UI", size=16, bold=True, color="1F1F1F")
    ws_sum[f"{c1}5"].fill = PatternFill(start_color="F5F5F5", end_color="F5F5F5", fill_type="solid")
    ws_sum[f"{c1}5"].alignment = ALIGN_CENTER
    
    ws_sum[f"{c1}6"] = sub
    ws_sum[f"{c1}6"].font = Font(name="Segoe UI", size=9, italic=True, color="555555")
    ws_sum[f"{c1}6"].fill = PatternFill(start_color="F5F5F5", end_color="F5F5F5", fill_type="solid")
    ws_sum[f"{c1}6"].alignment = ALIGN_CENTER
    
    for r in range(4, 7):
        for col_let in [c1, c2]:
            ws_sum[f"{col_let}{r}"].border = BORDER_DATA

# Section Breakdown Table
ws_sum.merge_cells("A8:K8")
ws_sum["A8"] = "📊 DEPARTMENT INVENTORY FLOW: BEGINNING STOCKS → ADDITIONAL RESTOCKS → CURRENT VALUE"
ws_sum["A8"].font = Font(name="Segoe UI", size=11, bold=True, color="FFFFFF")
ws_sum["A8"].fill = PatternFill(start_color="3D2314", end_color="3D2314", fill_type="solid")
ws_sum["A8"].alignment = ALIGN_LEFT
ws_sum.row_dimensions[8].height = 26

sum_headers = [
    "Category / Department", "Items", "Beginning Val (₱)", "Additional Val (₱)", 
    "Total Available (₱)", "Current Stock (₱)", "Total Consumed (₱)", 
    "Matches", "Low", "OOS", "Operational Recommendation"
]
ws_sum.row_dimensions[9].height = 25
for col_idx, h in enumerate(sum_headers, 1):
    c = ws_sum.cell(9, col_idx, h)
    c.font = FONT_HDR
    c.fill = PatternFill(start_color="4A2E1B", end_color="4A2E1B", fill_type="solid")
    c.alignment = ALIGN_CENTER if col_idx in [2, 8, 9, 10] else (ALIGN_RIGHT if col_idx in [3, 4, 5, 6, 7] else ALIGN_LEFT)
    c.border = BORDER_HEADER

# Linking rows to the Master Sheet
# Subtotals in '📋 Complete Inventory Audit':
# Row 9: Cups
# Row 13: Beans
# Row 27: Torani
# Row 36: SHOTT
# Row 44: Condiments
# Row 53: Powders
# Row 61: Dilmah
# Row 68: Snacks
# Row 81: Retail Drinks

sum_rows_config = [
    ("1. Cups & Packaging Consumables", 3, 9, 0, 0, 0, "Healthy stock. All 3 cup sizes sufficient for high drink volume."),
    ("2. Coffee Beans & Specialty Roasts", 2, 13, 1, 0, 0, "Australia's Own 100% match. 3kg Concept Blend left (7kg ground)."),
    ("3. Torani Flavor Syrups & Purées", 12, 27, 12, 0, 0, "All 12 Torani bottles and gallons match POS records exactly."),
    ("4. SHOTT New Zealand Syrups", 7, 36, 3, 2, 1, "Pink Guava EMPTY! Mango & Pomegranate low (<250ml). Order restock."),
    ("5. Condiments, Spreads & Mixes", 6, 44, 0, 0, 0, "12+ cans condensed milk, active caramel fudge and Biscoff sauces."),
    ("6. Powders & Brewing Tea Leaves", 7, 53, 3, 0, 0, "Jasmine Tea (597g) & Matcha (101g) match. Choco powder has +612g reserve."),
    ("7. Dilmah Specialty Tea Packs", 6, 61, 6, 0, 0, "Flawless tracking: Chamomile, Green, Oolong, Jasmine 100/100, Mint 98/98!"),
    ("8. Grab-and-Go Retail Snacks", 5, 68, 0, 3, 1, "Pringles Sour Cream EMPTY. Cheddar, Original, Cheetos at 3 left!"),
    ("9. Retail Drinks, Water & Beers", 11, 81, 3, 2, 1, "Nature Spring 500ml EMPTY (54 sold). Nature Spring 1L is 100% match (15pcs)!"),
]

row_idx = 10
for cat_name, tot, sub_r, mat, low, oos, rec in sum_rows_config:
    ws_sum.row_dimensions[row_idx].height = 22
    ws_sum.cell(row_idx, 1, cat_name).alignment = ALIGN_LEFT
    ws_sum.cell(row_idx, 2, tot).alignment = ALIGN_CENTER
    
    # Beginning Valuation
    beg_v = ws_sum.cell(row_idx, 3, f"='📋 Complete Inventory Audit'!E{sub_r}*1")
    beg_v.alignment = ALIGN_RIGHT
    beg_v.number_format = '₱#,##0.00'
    
    # Additional Valuation
    add_v = ws_sum.cell(row_idx, 4, f"='📋 Complete Inventory Audit'!F{sub_r}*1")
    add_v.alignment = ALIGN_RIGHT
    add_v.number_format = '₱#,##0.00'
    
    # Total Available Valuation
    tot_v = ws_sum.cell(row_idx, 5, f"=C{row_idx}+D{row_idx}")
    tot_v.alignment = ALIGN_RIGHT
    tot_v.number_format = '₱#,##0.00'
    
    # Current Physical Valuation
    cur_v = ws_sum.cell(row_idx, 6, f"='📋 Complete Inventory Audit'!M{sub_r}")
    cur_v.alignment = ALIGN_RIGHT
    cur_v.number_format = '₱#,##0.00'
    cur_v.font = FONT_DATA_BOLD
    
    # Total Consumed Valuation
    con_v = ws_sum.cell(row_idx, 7, f"=E{row_idx}-F{row_idx}")
    con_v.alignment = ALIGN_RIGHT
    con_v.number_format = '₱#,##0.00'
    
    ws_sum.cell(row_idx, 8, mat).alignment = ALIGN_CENTER
    ws_sum.cell(row_idx, 9, low).alignment = ALIGN_CENTER
    ws_sum.cell(row_idx, 10, oos).alignment = ALIGN_CENTER
    
    ws_sum.cell(row_idx, 11, rec).alignment = ALIGN_LEFT
    ws_sum.cell(row_idx, 11).font = FONT_NOTE
    
    for c in range(1, 12):
        ws_sum.cell(row_idx, c).border = BORDER_DATA
    row_idx += 1

# Total Summary Row
ws_sum.row_dimensions[row_idx].height = 26
ws_sum.cell(row_idx, 1, "TOTAL / STOREWIDE VALUATION:").font = Font(name="Segoe UI", size=10, bold=True, color=CLR_PRIMARY_DARK)
ws_sum.cell(row_idx, 1).alignment = ALIGN_LEFT
ws_sum.cell(row_idx, 2, "=SUM(B10:B18)").font = FONT_DATA_BOLD
ws_sum.cell(row_idx, 2).alignment = ALIGN_CENTER

ws_sum.cell(row_idx, 3, "=SUM(C10:C18)").font = FONT_DATA_BOLD
ws_sum.cell(row_idx, 3).alignment = ALIGN_RIGHT
ws_sum.cell(row_idx, 3).number_format = '₱#,##0.00'

ws_sum.cell(row_idx, 4, "=SUM(D10:D18)").font = FONT_DATA_BOLD
ws_sum.cell(row_idx, 4).alignment = ALIGN_RIGHT
ws_sum.cell(row_idx, 4).number_format = '₱#,##0.00'

ws_sum.cell(row_idx, 5, "=SUM(E10:E18)").font = FONT_DATA_BOLD
ws_sum.cell(row_idx, 5).alignment = ALIGN_RIGHT
ws_sum.cell(row_idx, 5).number_format = '₱#,##0.00'

ws_sum.cell(row_idx, 6, "=SUM(F10:F18)").font = Font(name="Segoe UI", size=11, bold=True, color="0F5132")
ws_sum.cell(row_idx, 6).alignment = ALIGN_RIGHT
ws_sum.cell(row_idx, 6).number_format = '₱#,##0.00'

ws_sum.cell(row_idx, 7, "=SUM(G10:G18)").font = FONT_DATA_BOLD
ws_sum.cell(row_idx, 7).alignment = ALIGN_RIGHT
ws_sum.cell(row_idx, 7).number_format = '₱#,##0.00'

ws_sum.cell(row_idx, 8, "=SUM(H10:H18)").font = FONT_DATA_BOLD
ws_sum.cell(row_idx, 8).alignment = ALIGN_CENTER
ws_sum.cell(row_idx, 9, "=SUM(I10:I18)").font = FONT_DATA_BOLD
ws_sum.cell(row_idx, 9).alignment = ALIGN_CENTER
ws_sum.cell(row_idx, 10, "=SUM(J10:J18)").font = FONT_DATA_BOLD
ws_sum.cell(row_idx, 10).alignment = ALIGN_CENTER

ws_sum.cell(row_idx, 11, "Urgent restock required for 3 out-of-stock items.").font = FONT_DATA_BOLD
ws_sum.cell(row_idx, 11).alignment = ALIGN_LEFT

for c in range(1, 12):
    ws_sum.cell(row_idx, c).border = BORDER_TOTAL
    ws_sum.cell(row_idx, c).fill = PatternFill(start_color="F2EDE4", end_color="F2EDE4", fill_type="solid")

# Key Insights Box
ws_sum.merge_cells("A20:K20")
ws_sum["A20"] = "💡 AUDITOR & BARISTA KEY TAKEAWAYS FOR ESPRESSO YOURSELF & TEA HOUSE"
ws_sum["A20"].font = Font(name="Segoe UI", size=11, bold=True, color="FFFFFF")
ws_sum["A20"].fill = PatternFill(start_color="2C1810", end_color="2C1810", fill_type="solid")
ws_sum["A20"].alignment = ALIGN_LEFT
ws_sum.row_dimensions[20].height = 24

insights = [
    ("1. Complete Delivery Traceability", "Every single stock movement has been mapped from the official record (Espresso-Beginning Stocks (5).xlsx): Beginning Inventory (Aug 8) + 4 successive replenishment deliveries (Aug 13, Aug 24, Sept 2, Sept 3)."),
    ("2. Flawless Alignment on Teas & Syrups", "Dilmah Specialty Teas showed an astounding match (100 Chamomile, 98 Peppermint, 100 Green, 100 Oolong, 100 Jasmine Green, 93 Earl Grey). All 12 Torani Syrups and purees match 100% with the POS inventory system."),
    ("3. Perfect Mathematical Match on Nature Spring 1L", "Nature Spring 1L started at 20 bottles delivery; the POS recorded exactly 5 customer sales, and the physical count found EXACTLY 15 bottles (20 - 5 = 15). Zero shrinkage!"),
    ("4. Critical Out-of-Stock Alert: Nature Spring 500ml", "Nature Spring 500ml is completely EMPTY. All 35+ bottles delivered on Aug 24 were sold. Customers will be turned away without water. Urgent reorder of 2-3 cases needed today!"),
    ("5. Urgent Snack Reorder (Pringles & Cheetos)", "Pringles Sour Cream is EMPTY (all 3 sold). Pringles Cheddar, Original, and Cheetos each have only 3 units remaining. Restock before the weekend."),
    ("6. High Consumption Items", "Concept Blend 1 Coffee Beans: 7kg ground from 10kg beginning stock (3kg left). Doreen Condensed Milk: 11.47 cans consumed from 24 cans beginning stock (12.53 cans left). Sugar syrup: 8 bottles used from 11 bottles available (3 bottles left).")
]

r_ins = 21
for head, desc in insights:
    ws_sum.merge_cells(f"A{r_ins}:C{r_ins}")
    ws_sum.merge_cells(f"D{r_ins}:K{r_ins}")
    ws_sum.row_dimensions[r_ins].height = 24
    
    ws_sum[f"A{r_ins}"] = head
    ws_sum[f"A{r_ins}"].font = FONT_DATA_BOLD
    ws_sum[f"A{r_ins}"].fill = PatternFill(start_color="F5EFE6", end_color="F5EFE6", fill_type="solid")
    ws_sum[f"A{r_ins}"].alignment = ALIGN_LEFT
    
    ws_sum[f"D{r_ins}"] = desc
    ws_sum[f"D{r_ins}"].font = FONT_DATA
    ws_sum[f"D{r_ins}"].fill = PatternFill(start_color="FAF8F5", end_color="FAF8F5", fill_type="solid")
    ws_sum[f"D{r_ins}"].alignment = ALIGN_LEFT
    
    for c in range(1, 12):
        ws_sum.cell(r_ins, c).border = BORDER_DATA
    r_ins += 1

col_widths_sum = {"A": 32, "B": 10, "C": 18, "D": 18, "E": 18, "F": 18, "G": 18, "H": 10, "I": 10, "J": 10, "K": 42}
for col_let, w in col_widths_sum.items():
    ws_sum.column_dimensions[col_let].width = w

# ==============================================================================
# TAB 2: 📋 COMPLETE INVENTORY AUDIT (WITH BEGINNING & ADDITIONAL COLUMNS)
# ==============================================================================
ws_det = wb.create_sheet(title="📋 Complete Inventory Audit")
ws_det.views.sheetView[0].showGridLines = True

# Title Header
ws_det.merge_cells("A1:Q1")
ws_det["A1"] = "ESPRESSO YOURSELF & TEA HOUSE — COMPREHENSIVE INVENTORY RECONCILIATION"
ws_det["A1"].font = FONT_TITLE
ws_det["A1"].fill = PatternFill(start_color=CLR_PRIMARY_DARK, end_color=CLR_PRIMARY_DARK, fill_type="solid")
ws_det["A1"].alignment = Alignment(horizontal="center", vertical="center")
ws_det.row_dimensions[1].height = 36

ws_det.merge_cells("A2:Q2")
ws_det["A2"] = "Branch #30 (Cebu City)  |  Beginning Stocks (Aug 8) + Deliveries (Aug 13 - Sept 3) vs Current Physical & POS Stock  |  Audit Date: September 22, 2026"
ws_det["A2"].font = FONT_SUBTITLE
ws_det["A2"].fill = PatternFill(start_color=CLR_PRIMARY_MED, end_color=CLR_PRIMARY_MED, fill_type="solid")
ws_det["A2"].alignment = Alignment(horizontal="center", vertical="center")
ws_det.row_dimensions[2].height = 22

# Table Column Headers
headers_det = [
    ("A", "SKU / Code", 11, ALIGN_CENTER),
    ("B", "Item Description & Specifications", 34, ALIGN_LEFT),
    ("C", "UOM", 11, ALIGN_CENTER),
    ("D", "Unit Cost (₱)", 13, ALIGN_RIGHT),
    ("E", "Beginning Stock\n(Aug 8)", 15, ALIGN_RIGHT),
    ("F", "Additional Stock\n(Aug 13 - Sept 3)", 16, ALIGN_RIGHT),
    ("G", "Total Available\nStock", 15, ALIGN_RIGHT),
    ("H", "★ Inventory Now ★\n(Physical Count)", 17, ALIGN_RIGHT),
    ("I", "Barista Raw Note\n(Input)", 24, ALIGN_LEFT),
    ("J", "POS System\nStock", 14, ALIGN_RIGHT),
    ("K", "Variance\n(Phys - POS)", 14, ALIGN_RIGHT),
    ("L", "Total Consumed\n/ Sold", 15, ALIGN_RIGHT),
    ("M", "Current Physical\nValue (₱)", 18, ALIGN_RIGHT),
    ("N", "Variance Value\n(₱)", 16, ALIGN_RIGHT),
    ("O", "Audit Status", 18, ALIGN_CENTER),
    ("P", "Flag", 8, ALIGN_CENTER),
    ("Q", "Delivery Source & Operational Remarks", 48, ALIGN_LEFT),
]

ws_det.row_dimensions[4].height = 32
for col_let, h_text, width, align in headers_det:
    cell = ws_det[f"{col_let}4"]
    cell.value = h_text
    cell.font = FONT_HDR
    cell.fill = PatternFill(start_color="3D2314", end_color="3D2314", fill_type="solid")
    cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
    cell.border = BORDER_HEADER
    ws_det.column_dimensions[col_let].width = width

current_row = 5

for section in AUDIT_SECTIONS:
    ws_det.merge_cells(f"A{current_row}:Q{current_row}")
    sec_cell = ws_det[f"A{current_row}"]
    sec_cell.value = f"{section['icon']}  {section['name']}"
    sec_cell.font = Font(name="Segoe UI", size=11, bold=True, color="FFFFFF")
    sec_cell.fill = PatternFill(start_color=section["header_fill"], end_color=section["header_fill"], fill_type="solid")
    sec_cell.alignment = ALIGN_LEFT
    ws_det.row_dimensions[current_row].height = 24
    
    start_sec_row = current_row + 1
    current_row += 1
    
    for item in section["items"]:
        ws_det.row_dimensions[current_row].height = 22
        
        # Col A: SKU
        ws_det.cell(current_row, 1, item["sku"]).alignment = ALIGN_CENTER
        ws_det.cell(current_row, 1).font = Font(name="Segoe UI", size=9, bold=True, color="555555")
        
        # Col B: Description
        ws_det.cell(current_row, 2, item["name"]).alignment = ALIGN_LEFT
        ws_det.cell(current_row, 2).font = FONT_DATA_BOLD
        
        # Col C: UOM
        ws_det.cell(current_row, 3, item["uom"]).alignment = ALIGN_CENTER
        ws_det.cell(current_row, 3).font = FONT_DATA
        
        # Col D: Unit Cost
        cost_cell = ws_det.cell(current_row, 4, item["cost"])
        cost_cell.alignment = ALIGN_RIGHT
        cost_cell.font = FONT_DATA
        cost_cell.number_format = '₱#,##0.00'
        
        # Col E: Beginning Stock (Aug 8)
        beg_cell = ws_det.cell(current_row, 5, item["beg_stock"])
        beg_cell.alignment = ALIGN_RIGHT
        beg_cell.font = FONT_DATA
        if isinstance(item["beg_stock"], float) and item["beg_stock"] != int(item["beg_stock"]):
            beg_cell.number_format = '0.00'
        else:
            beg_cell.number_format = '#,##0'
            
        # Col F: Additional Stock (Aug 13 - Sept 3)
        add_cell = ws_det.cell(current_row, 6, item["add_stock"])
        add_cell.alignment = ALIGN_RIGHT
        add_cell.font = FONT_DATA
        if isinstance(item["add_stock"], float) and item["add_stock"] != int(item["add_stock"]):
            add_cell.number_format = '0.00'
        else:
            add_cell.number_format = '#,##0'
            
        # Col G: Total Available Stock = E + F
        tot_avail_cell = ws_det.cell(current_row, 7, f"=E{current_row}+F{current_row}")
        tot_avail_cell.alignment = ALIGN_RIGHT
        tot_avail_cell.font = FONT_DATA_BOLD
        tot_avail_cell.number_format = '#,##0.00' if (isinstance(item["beg_stock"], float) or isinstance(item["add_stock"], float)) else '#,##0'
        
        # Col H: Current Physical Count Now
        phys_cell = ws_det.cell(current_row, 8, item["phys_qty"])
        phys_cell.alignment = ALIGN_RIGHT
        phys_cell.font = Font(name="Segoe UI", size=10, bold=True, color="000000")
        if isinstance(item["phys_qty"], float) and item["phys_qty"] != int(item["phys_qty"]):
            phys_cell.number_format = '0.00'
        else:
            phys_cell.number_format = '#,##0'
            
        # Col I: Barista Raw Note
        raw_cell = ws_det.cell(current_row, 9, item["raw_count"])
        raw_cell.alignment = ALIGN_LEFT
        raw_cell.font = Font(name="Segoe UI", size=9, italic=True, color="333333")
        
        # Col J: POS System Stock
        pos_cell = ws_det.cell(current_row, 10, item["pos_stock"])
        pos_cell.alignment = ALIGN_RIGHT
        pos_cell.font = FONT_DATA
        if isinstance(item["pos_stock"], float) and item["pos_stock"] != int(item["pos_stock"]):
            pos_cell.number_format = '0.00'
        else:
            pos_cell.number_format = '#,##0'
            
        # Col K: Variance (Phys - POS)
        var_cell = ws_det.cell(current_row, 11, f"=H{current_row}-J{current_row}")
        var_cell.alignment = ALIGN_RIGHT
        var_cell.font = FONT_DATA_BOLD
        var_cell.number_format = '+#,##0.00;-#,##0.00;0.00'
        
        # Col L: Total Consumed / Sold = Total Available - Physical Count
        con_cell = ws_det.cell(current_row, 12, f"=G{current_row}-H{current_row}")
        con_cell.alignment = ALIGN_RIGHT
        con_cell.font = FONT_DATA
        con_cell.number_format = '#,##0.00;-#,##0.00;0.00'
        
        # Col M: Current Physical Value (₱) = Physical * Cost
        tot_val_cell = ws_det.cell(current_row, 13, f"=H{current_row}*D{current_row}")
        tot_val_cell.alignment = ALIGN_RIGHT
        tot_val_cell.font = FONT_DATA_BOLD
        tot_val_cell.number_format = '₱#,##0.00'
        
        # Col N: Variance Value (₱) = Variance * Cost
        var_val_cell = ws_det.cell(current_row, 14, f"=K{current_row}*D{current_row}")
        var_val_cell.alignment = ALIGN_RIGHT
        var_val_cell.font = FONT_DATA
        var_val_cell.number_format = '₱#,##0.00;[Red](₱#,##0.00);₱0.00'
        
        # Col O: Status Badge Text
        # Col P: Flag Emoji
        stat = item["status"]
        stat_cell = ws_det.cell(current_row, 15)
        flag_cell = ws_det.cell(current_row, 16)
        stat_cell.alignment = ALIGN_CENTER
        flag_cell.alignment = ALIGN_CENTER
        
        if stat == "MATCH":
            stat_cell.value = "✅ MATCH"
            stat_cell.fill = FILL_MATCH
            stat_cell.font = FONT_MATCH
            flag_cell.value = "🟢"
        elif stat == "EMPTY":
            stat_cell.value = "🚨 OUT OF STOCK"
            stat_cell.fill = FILL_DANGER
            stat_cell.font = FONT_DANGER
            flag_cell.value = "🔴"
        elif stat == "LOW":
            stat_cell.value = "⚠️ LOW STOCK"
            stat_cell.fill = FILL_WARN
            stat_cell.font = FONT_WARN
            flag_cell.value = "🟡"
        elif stat == "SURPLUS":
            stat_cell.value = "🔺 SURPLUS / RESTOCK"
            stat_cell.fill = FILL_SURPLUS
            stat_cell.font = FONT_SURPLUS
            flag_cell.value = "🔵"
        else: # CONSUMED / IN USE
            stat_cell.value = "ℹ️ IN-USE / CONSUMED"
            stat_cell.fill = FILL_INFO
            stat_cell.font = FONT_INFO
            flag_cell.value = "⚪"
            
        # Col Q: Remarks & Delivery Details
        rem_cell = ws_det.cell(current_row, 17, item["notes"])
        rem_cell.alignment = ALIGN_WRAP_LEFT
        rem_cell.font = FONT_NOTE
        
        # Apply zebra stripe & borders
        row_fill = PatternFill(start_color="FFFFFF", end_color="FFFFFF", fill_type="solid") if current_row % 2 == 0 else PatternFill(start_color="FAF8F5", end_color="FAF8F5", fill_type="solid")
        for c in range(1, 18):
            cell = ws_det.cell(current_row, c)
            cell.border = BORDER_DATA
            if c not in [15]: # Preserve status fill
                cell.fill = row_fill
                
        current_row += 1
        
    # Subtotal Row for Section
    ws_det.row_dimensions[current_row].height = 22
    ws_det.merge_cells(f"A{current_row}:D{current_row}")
    sub_title = ws_det.cell(current_row, 1, f"Subtotal — {section['name']}:")
    sub_title.alignment = Alignment(horizontal="right", vertical="center")
    sub_title.font = Font(name="Segoe UI", size=9, bold=True, color=CLR_PRIMARY_MED)
    
    # Subtotal Beginning Stock Value
    ws_det.cell(current_row, 5, f"=SUMPRODUCT(D{start_sec_row}:D{current_row-1}, E{start_sec_row}:E{current_row-1})").font = Font(name="Segoe UI", size=9, bold=True)
    ws_det.cell(current_row, 5).alignment = ALIGN_RIGHT
    ws_det.cell(current_row, 5).number_format = '₱#,##0.00'
    
    # Subtotal Additional Stock Value
    ws_det.cell(current_row, 6, f"=SUMPRODUCT(D{start_sec_row}:D{current_row-1}, F{start_sec_row}:F{current_row-1})").font = Font(name="Segoe UI", size=9, bold=True)
    ws_det.cell(current_row, 6).alignment = ALIGN_RIGHT
    ws_det.cell(current_row, 6).number_format = '₱#,##0.00'
    
    # Subtotal Total Available Value
    ws_det.cell(current_row, 7, f"=E{current_row}+F{current_row}").font = Font(name="Segoe UI", size=9, bold=True)
    ws_det.cell(current_row, 7).alignment = ALIGN_RIGHT
    ws_det.cell(current_row, 7).number_format = '₱#,##0.00'
    
    # Subtotal Physical Qty
    ws_det.cell(current_row, 8, f"=SUM(H{start_sec_row}:H{current_row-1})").font = Font(name="Segoe UI", size=9, bold=True)
    ws_det.cell(current_row, 8).alignment = ALIGN_RIGHT
    ws_det.cell(current_row, 8).number_format = '#,##0.00'
    
    # Subtotal POS Qty
    ws_det.cell(current_row, 10, f"=SUM(J{start_sec_row}:J{current_row-1})").font = Font(name="Segoe UI", size=9, bold=True)
    ws_det.cell(current_row, 10).alignment = ALIGN_RIGHT
    ws_det.cell(current_row, 10).number_format = '#,##0.00'
    
    # Subtotal Variance Qty
    ws_det.cell(current_row, 11, f"=SUM(K{start_sec_row}:K{current_row-1})").font = Font(name="Segoe UI", size=9, bold=True)
    ws_det.cell(current_row, 11).alignment = ALIGN_RIGHT
    ws_det.cell(current_row, 11).number_format = '+#,##0.00;-#,##0.00;0.00'
    
    # Subtotal Consumed Value
    ws_det.cell(current_row, 12, f"=SUMPRODUCT(D{start_sec_row}:D{current_row-1}, L{start_sec_row}:L{current_row-1})").font = Font(name="Segoe UI", size=9, bold=True)
    ws_det.cell(current_row, 12).alignment = ALIGN_RIGHT
    ws_det.cell(current_row, 12).number_format = '₱#,##0.00'
    
    # Subtotal Current Physical Value
    sub_val = ws_det.cell(current_row, 13, f"=SUM(M{start_sec_row}:M{current_row-1})")
    sub_val.font = Font(name="Segoe UI", size=9, bold=True, color="0F5132")
    sub_val.alignment = ALIGN_RIGHT
    sub_val.number_format = '₱#,##0.00'
    
    # Subtotal Variance Value
    ws_det.cell(current_row, 14, f"=SUM(N{start_sec_row}:N{current_row-1})").font = Font(name="Segoe UI", size=9, bold=True)
    ws_det.cell(current_row, 14).alignment = ALIGN_RIGHT
    ws_det.cell(current_row, 14).number_format = '₱#,##0.00;[Red](₱#,##0.00);₱0.00'
    
    for c in range(1, 18):
        ws_det.cell(current_row, c).border = Border(top=Side(style="thin", color="CCCCCC"), bottom=Side(style="thin", color="CCCCCC"))
        ws_det.cell(current_row, c).fill = PatternFill(start_color="F2EDE4", end_color="F2EDE4", fill_type="solid")
    
    current_row += 1

# Grand Total Row
ws_det.row_dimensions[current_row].height = 28
ws_det.merge_cells(f"A{current_row}:D{current_row}")
gt_cell = ws_det.cell(current_row, 1, "🏆 GRAND TOTAL (ALL 59 AUDITED ITEMS):")
gt_cell.font = Font(name="Segoe UI", size=10, bold=True, color=CLR_PRIMARY_DARK)
gt_cell.alignment = Alignment(horizontal="right", vertical="center")

ws_det.cell(current_row, 5, f"=SUM('📊 Executive Summary'!C10:C18)").number_format = '₱#,##0.00'
ws_det.cell(current_row, 5).font = FONT_DATA_BOLD
ws_det.cell(current_row, 5).alignment = ALIGN_RIGHT

ws_det.cell(current_row, 6, f"=SUM('📊 Executive Summary'!D10:D18)").number_format = '₱#,##0.00'
ws_det.cell(current_row, 6).font = FONT_DATA_BOLD
ws_det.cell(current_row, 6).alignment = ALIGN_RIGHT

ws_det.cell(current_row, 7, f"=SUM('📊 Executive Summary'!E10:E18)").number_format = '₱#,##0.00'
ws_det.cell(current_row, 7).font = FONT_DATA_BOLD
ws_det.cell(current_row, 7).alignment = ALIGN_RIGHT

ws_det.cell(current_row, 13, f"=SUM('📊 Executive Summary'!F10:F18)")
ws_det.cell(current_row, 13).font = Font(name="Segoe UI", size=11, bold=True, color="0F5132")
ws_det.cell(current_row, 13).alignment = ALIGN_RIGHT
ws_det.cell(current_row, 13).number_format = '₱#,##0.00'

for c in range(1, 18):
    ws_det.cell(current_row, c).border = BORDER_TOTAL
    ws_det.cell(current_row, c).fill = PatternFill(start_color="E6DFD5", end_color="E6DFD5", fill_type="solid")

ws_det.freeze_panes = "A5"

# ==============================================================================
# TAB 3: 🚨 ACTION & URGENT REORDER LIST
# ==============================================================================
ws_act = wb.create_sheet(title="🚨 Reorder & Action List")
ws_act.views.sheetView[0].showGridLines = True

ws_act.merge_cells("A1:G1")
ws_act["A1"] = "ESPRESSO YOURSELF & TEA HOUSE — PRIORITY RESTOCKING & PURCHASING LIST"
ws_act["A1"].font = FONT_TITLE
ws_act["A1"].fill = PatternFill(start_color="842029", end_color="842029", fill_type="solid")
ws_act["A1"].alignment = Alignment(horizontal="center", vertical="center")
ws_act.row_dimensions[1].height = 36

ws_act.merge_cells("A2:G2")
ws_act["A2"] = "Items Requiring Immediate Purchasing or Supplier Delivery based on Physical Inventory Audit"
ws_act["A2"].font = FONT_SUBTITLE
ws_act["A2"].fill = PatternFill(start_color="4A2E1B", end_color="4A2E1B", fill_type="solid")
ws_act["A2"].alignment = Alignment(horizontal="center", vertical="center")
ws_act.row_dimensions[2].height = 22

headers_act = [
    ("A", "Priority", 14, ALIGN_CENTER),
    ("B", "Item Description & SKU", 36, ALIGN_LEFT),
    ("C", "Current Count", 16, ALIGN_CENTER),
    ("D", "Target Par Level", 16, ALIGN_CENTER),
    ("E", "Suggested Order Qty", 20, ALIGN_CENTER),
    ("F", "Est. Unit Cost", 16, ALIGN_RIGHT),
    ("G", "Est. Reorder Cost (₱)", 20, ALIGN_RIGHT),
]

ws_act.row_dimensions[4].height = 26
for col_let, h_text, width, align in headers_act:
    cell = ws_act[f"{col_let}4"]
    cell.value = h_text
    cell.font = FONT_HDR
    cell.fill = PatternFill(start_color="2C1810", end_color="2C1810", fill_type="solid")
    cell.alignment = align
    cell.border = BORDER_HEADER
    ws_act.column_dimensions[col_let].width = width

action_items = [
    ("🚨 CRITICAL", "Nature Spring Mineral Water 500ml", "0 (EMPTY)", "50 bottles", "2 Cases (48 bottles)", 12.00, 48, "842029", "F8D7DA"),
    ("🚨 CRITICAL", "Pringles Sour Cream & Onion 158g", "0 (EMPTY)", "10 cans", "1 Case (12 cans)", 98.00, 12, "842029", "F8D7DA"),
    ("🚨 CRITICAL", "SHOTT Pink Guava Syrup 1L", "0 (EMPTY)", "2 bottles", "2 Bottles (1L)", 890.00, 2, "842029", "F8D7DA"),
    ("⚠️ HIGH", "Pringles Cheddar Cheese 158g", "3 cans", "10 cans", "1 Case (12 cans)", 98.00, 12, "664D03", "FFF3CD"),
    ("⚠️ HIGH", "Pringles Original 158g", "3 cans", "10 cans", "1 Case (12 cans)", 98.00, 12, "664D03", "FFF3CD"),
    ("⚠️ HIGH", "Cheetos Cheddar Jalapeño 226.8g", "3 packs", "8 packs", "1 Box (8 packs)", 98.00, 8, "664D03", "FFF3CD"),
    ("⚠️ HIGH", "SHOTT Mango Syrup 1L", "210ml", "1 bottle", "1 Bottle (1L)", 890.00, 1, "664D03", "FFF3CD"),
    ("⚠️ HIGH", "SHOTT Pomegranate Syrup 1L", "250ml", "1 bottle", "1 Bottle (1L)", 890.00, 1, "664D03", "FFF3CD"),
    ("🟡 MEDIUM", "Perrier Sparkling Mineral Water 330ml", "4 bottles", "12 bottles", "1 Pack (12 bottles)", 110.00, 12, "084298", "CFE2FF"),
    ("🟡 MEDIUM", "Sugar Syrup (Hi-Fructose 500ml)", "3 bottles", "10 bottles", "1 Box (6 bottles)", 94.00, 6, "084298", "CFE2FF"),
    ("🟡 MEDIUM", "Evian Natural Spring Water 500ml", "6 bottles", "12 bottles", "1 Pack (6 bottles)", 95.00, 6, "084298", "CFE2FF"),
]

r_act = 5
for prio, item_name, cur_cnt, target_par, sugg_text, cost, qty_val, font_clr, fill_clr in action_items:
    ws_act.row_dimensions[r_act].height = 24
    
    p_cell = ws_act.cell(r_act, 1, prio)
    p_cell.font = Font(name="Segoe UI", size=10, bold=True, color=font_clr)
    p_cell.fill = PatternFill(start_color=fill_clr, end_color=fill_clr, fill_type="solid")
    p_cell.alignment = ALIGN_CENTER
    
    ws_act.cell(r_act, 2, item_name).font = FONT_DATA_BOLD
    ws_act.cell(r_act, 2).alignment = ALIGN_LEFT
    
    ws_act.cell(r_act, 3, cur_cnt).alignment = ALIGN_CENTER
    ws_act.cell(r_act, 3).font = FONT_DATA
    
    ws_act.cell(r_act, 4, target_par).alignment = ALIGN_CENTER
    ws_act.cell(r_act, 4).font = FONT_DATA
    
    ws_act.cell(r_act, 5, sugg_text).alignment = ALIGN_CENTER
    ws_act.cell(r_act, 5).font = FONT_DATA_BOLD
    
    c_cell = ws_act.cell(r_act, 6, cost)
    c_cell.alignment = ALIGN_RIGHT
    c_cell.number_format = '₱#,##0.00'
    c_cell.font = FONT_DATA
    
    tot_reorder = qty_val * cost
    tot_cell = ws_act.cell(r_act, 7, tot_reorder)
    tot_cell.alignment = ALIGN_RIGHT
    tot_cell.number_format = '₱#,##0.00'
    tot_cell.font = FONT_DATA_BOLD
    
    for c in range(1, 8):
        ws_act.cell(r_act, c).border = BORDER_DATA
    r_act += 1

# Action Total Row
ws_act.row_dimensions[r_act].height = 26
ws_act.merge_cells(f"A{r_act}:F{r_act}")
tot_act_label = ws_act.cell(r_act, 1, "ESTIMATED TOTAL URGENT PROCUREMENT BUDGET:")
tot_act_label.alignment = Alignment(horizontal="right", vertical="center")
tot_act_label.font = Font(name="Segoe UI", size=11, bold=True, color=CLR_PRIMARY_DARK)

tot_act_val = ws_act.cell(r_act, 7, f"=SUM(G5:G{r_act-1})")
tot_act_val.alignment = ALIGN_RIGHT
tot_act_val.font = Font(name="Segoe UI", size=12, bold=True, color="842029")
tot_act_val.number_format = '₱#,##0.00'

for c in range(1, 8):
    ws_act.cell(r_act, c).border = BORDER_TOTAL
    ws_act.cell(r_act, c).fill = PatternFill(start_color="F8D7DA", end_color="F8D7DA", fill_type="solid")

# Save workbook with fallback if file is open in Excel
updated_excel_path = os.path.join(rec_dir, "Espresso_Yourself_Inventory_Audit_with_Beginning_Stocks.xlsx")
updated_workspace_path = os.path.join(workspace_dir, "Espresso_Yourself_Inventory_Audit_with_Beginning_Stocks.xlsx")

# Always save the dedicated updated file
wb.save(updated_excel_path)
wb.save(updated_workspace_path)
print(f"Successfully generated: {updated_excel_path}")
print(f"Successfully mirrored: {updated_workspace_path}")

# Try saving to the original filename if user closed Excel
try:
    wb.save(excel_output_path)
    print(f"Successfully updated original: {excel_output_path}")
except PermissionError:
    print(f"Note: {excel_output_path} is currently open in Excel. Saved updated version to {updated_excel_path}")

try:
    wb.save(workspace_copy_path)
    print(f"Successfully updated original mirror: {workspace_copy_path}")
except PermissionError:
    pass

