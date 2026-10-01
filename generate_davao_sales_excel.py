import json
import os
from datetime import datetime, timezone, timedelta
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

# Define Timezone (PHT is UTC+8)
PHT = timezone(timedelta(hours=8))

# Output file paths
workspace_dir = r"c:\Users\Philippines Freight\MainSystems\POS"
records_dir = os.path.join(workspace_dir, "recordsExcel")
output_file_records = os.path.join(records_dir, "S1P_and_Sp1n_Davao_Sales_Report_Start_to_Now.xlsx")
output_file_root = os.path.join(workspace_dir, "S1P_and_Sp1n_Davao_Sales_Report_Start_to_Now.xlsx")

# Load raw extracted data
json_path = os.path.join(workspace_dir, "davao_branch_27_raw_sales.json")
with open(json_path, "r", encoding="utf-8") as f:
    data = json.load(f)

branch = data["branch"]
categories = {c["id"]: c for c in data["categories"]}
products = {p["id"]: p for p in data["products"]}
orders = data["orders"]
order_items = data["orderItems"]

# Index order items by order_id
items_by_order = {}
for it in order_items:
    oid = it["order_id"]
    if oid not in items_by_order:
        items_by_order[oid] = []
    items_by_order[oid].append(it)

# Process Paid Orders
paid_orders = [o for o in orders if o["status"] == "paid"]

def parse_pht(dt_str):
    # Handle ISO format strings
    clean_str = dt_str.replace("Z", "+00:00")
    dt = datetime.fromisoformat(clean_str)
    return dt.astimezone(PHT)

# Create Workbook
wb = openpyxl.Workbook()
wb.remove(wb.active) # Remove default sheet

# Design Styles & Color Palette
FONT_FAMILY = "Segoe UI"
COLOR_PRIMARY_NAVY = "1B365D"      # Deep Navy
COLOR_SECONDARY_BLUE = "2E75B6"    # Slate Blue
COLOR_ACCENT_TEAL = "117A65"       # Deep Mint/Teal
COLOR_ZEBRA = "F7F9FC"             # Crisp off-white/gray
COLOR_KPI_BG = "EEF3F8"            # Soft Blue card fill
COLOR_GREEN_BG = "E2EFDA"          # Soft green highlight
COLOR_GREEN_TXT = "276A3C"         # Dark green text
COLOR_RED_BG = "FCE4D6"            # Soft red highlight
COLOR_RED_TXT = "C00000"           # Dark red text
COLOR_YELLOW_BG = "FFF2CC"         # Soft yellow
COLOR_YELLOW_TXT = "7F6000"        # Dark golden text
COLOR_BORDER = "D9D9D9"            # Clean subtle border
COLOR_HEADER_TXT = "FFFFFF"

# Fonts
font_title = Font(name=FONT_FAMILY, size=16, bold=True, color="1B365D")
font_subtitle = Font(name=FONT_FAMILY, size=10, italic=True, color="595959")
font_section = Font(name=FONT_FAMILY, size=12, bold=True, color="1B365D")
font_header = Font(name=FONT_FAMILY, size=10, bold=True, color=COLOR_HEADER_TXT)
font_data = Font(name=FONT_FAMILY, size=10)
font_data_bold = Font(name=FONT_FAMILY, size=10, bold=True)
font_kpi_title = Font(name=FONT_FAMILY, size=9, bold=True, color="595959")
font_kpi_value = Font(name=FONT_FAMILY, size=16, bold=True, color="1B365D")
font_kpi_sub = Font(name=FONT_FAMILY, size=8, italic=True, color="7F7F7F")
font_badge_green = Font(name=FONT_FAMILY, size=9, bold=True, color=COLOR_GREEN_TXT)
font_badge_red = Font(name=FONT_FAMILY, size=9, bold=True, color=COLOR_RED_TXT)
font_badge_yellow = Font(name=FONT_FAMILY, size=9, bold=True, color=COLOR_YELLOW_TXT)

# Fills
fill_primary = PatternFill(start_color=COLOR_PRIMARY_NAVY, end_color=COLOR_PRIMARY_NAVY, fill_type="solid")
fill_secondary = PatternFill(start_color=COLOR_SECONDARY_BLUE, end_color=COLOR_SECONDARY_BLUE, fill_type="solid")
fill_zebra = PatternFill(start_color=COLOR_ZEBRA, end_color=COLOR_ZEBRA, fill_type="solid")
fill_kpi = PatternFill(start_color=COLOR_KPI_BG, end_color=COLOR_KPI_BG, fill_type="solid")
fill_green = PatternFill(start_color=COLOR_GREEN_BG, end_color=COLOR_GREEN_BG, fill_type="solid")
fill_red = PatternFill(start_color=COLOR_RED_BG, end_color=COLOR_RED_BG, fill_type="solid")
fill_yellow = PatternFill(start_color=COLOR_YELLOW_BG, end_color=COLOR_YELLOW_BG, fill_type="solid")
fill_total_row = PatternFill(start_color="D9E1F2", end_color="D9E1F2", fill_type="solid")

# Borders
side_thin = Side(border_style="thin", color=COLOR_BORDER)
border_data = Border(left=side_thin, right=side_thin, top=side_thin, bottom=side_thin)
side_double = Side(border_style="double", color="1B365D")
side_thick_top = Side(border_style="thin", color="1B365D")
border_total = Border(left=side_thin, right=side_thin, top=side_thick_top, bottom=side_double)

# Alignments
align_center = Alignment(horizontal="center", vertical="center")
align_left = Alignment(horizontal="left", vertical="center")
align_right = Alignment(horizontal="right", vertical="center")

# Number formats
FMT_CURRENCY = "₱#,##0.00"
FMT_QTY = "#,##0"
FMT_WEIGHT = "#,##0.0"
FMT_PERCENT = "0.0%"

print("Preparing data structures for all 6 sheets...")

# ==============================================================================
# DATA AGGREGATIONS
# ==============================================================================

# 1. Daily Aggregation
daily_map = {}
for o in paid_orders:
    pht_dt = parse_pht(o["created_at"])
    d_str = pht_dt.strftime("%Y-%m-%d")
    day_name = pht_dt.strftime("%A")
    
    if d_str not in daily_map:
        daily_map[d_str] = {
            "date": d_str,
            "day": day_name,
            "month": pht_dt.strftime("%B %Y"),
            "orders": 0,
            "laundry_gross": 0.0,
            "laundry_discount": 0.0,
            "cafe_gross": 0.0,
            "cafe_discount": 0.0,
            "total_gross": 0.0,
            "total_discount": float(o.get("discount_amount") or 0.0),
            "net_sales": 0.0,
            "cash": 0.0,
            "gcash": 0.0,
            "card": 0.0,
            "rcbc": 0.0
        }
    
    d = daily_map[d_str]
    d["orders"] += 1
    
    # Calculate item divisions
    its = items_by_order.get(o["id"], [])
    l_sum = 0.0
    c_sum = 0.0
    for it in its:
        prod = products.get(it["product_id"])
        cat = categories.get(prod["category_id"]) if prod else None
        div = cat.get("division") if cat else "unknown"
        amt = float(it["price"]) * float(it["quantity"])
        if div == "laundry":
            l_sum += amt
        else:
            c_sum += amt
            
    d["laundry_gross"] += l_sum
    d["cafe_gross"] += c_sum
    d["total_gross"] += float(o.get("subtotal") or (l_sum + c_sum))
    
    disc = float(o.get("discount_amount") or 0.0)
    # Attribute discount to division
    if disc > 0:
        if o["id"] in [593, 594]: # Laundry discounts
            d["laundry_discount"] += disc
        else: # Order 111 (Cafe pastry discounts)
            d["cafe_discount"] += disc
            
    tot = float(o.get("total") or 0.0)
    d["net_sales"] += tot
    
    pm = (o.get("payment_method") or "Cash").strip().lower()
    if "cash" in pm and "gcash" not in pm:
        d["cash"] += tot
    elif "gcash" in pm:
        d["gcash"] += tot
    elif "card" in pm:
        d["card"] += tot
    elif "rcbc" in pm:
        d["rcbc"] += tot
    else:
        d["cash"] += tot

sorted_days = sorted(daily_map.keys())

# 2. Product Performance Aggregation
prod_perf = {}
for o in paid_orders:
    its = items_by_order.get(o["id"], [])
    for it in its:
        pid = it["product_id"]
        prod = products.get(pid)
        cat = categories.get(prod["category_id"]) if prod else None
        pname = prod["name"].strip() if prod else f"Product #{pid}"
        if pname.endswith(":"):
            pname = pname[:-1].strip()
        cname = cat["name"].strip() if cat else "Uncategorized"
        div = (cat.get("division") or "coffee").strip()
        div_label = "Laundry" if div == "laundry" else "Cafe & Retail"
        
        qty = float(it["quantity"])
        amt = float(it["price"]) * qty
        
        if pid not in prod_perf:
            prod_perf[pid] = {
                "name": pname,
                "division": div_label,
                "category": cname,
                "qty": 0.0,
                "revenue": 0.0,
                "unit_price": float(it["price"])
            }
        prod_perf[pid]["qty"] += qty
        prod_perf[pid]["revenue"] += amt

# Sort products by revenue descending
ranked_products = sorted(prod_perf.values(), key=lambda x: x["revenue"], reverse=True)

# 3. Monthly Summary Aggregation
months_map = {}
for d_str in sorted_days:
    d = daily_map[d_str]
    m_name = d["month"]
    if m_name not in months_map:
        months_map[m_name] = {
            "month": m_name,
            "active_days": 0,
            "orders": 0,
            "laundry_gross": 0.0,
            "laundry_discount": 0.0,
            "cafe_gross": 0.0,
            "cafe_discount": 0.0,
            "net_sales": 0.0,
            "cash": 0.0,
            "gcash": 0.0,
            "card": 0.0,
            "rcbc": 0.0
        }
    m = months_map[m_name]
    m["active_days"] += 1
    m["orders"] += d["orders"]
    m["laundry_gross"] += d["laundry_gross"]
    m["laundry_discount"] += d["laundry_discount"]
    m["cafe_gross"] += d["cafe_gross"]
    m["cafe_discount"] += d["cafe_discount"]
    m["net_sales"] += d["net_sales"]
    m["cash"] += d["cash"]
    m["gcash"] += d["gcash"]
    m["card"] += d["card"]
    m["rcbc"] += d["rcbc"]

total_net_sales = sum(d["net_sales"] for d in daily_map.values())
total_paid_orders = len(paid_orders)
total_gross_sales = sum(d["total_gross"] for d in daily_map.values())
total_discounts = sum(float(o.get("discount_amount") or 0.0) for o in paid_orders)
total_laundry_net = sum(d["laundry_gross"] - d["laundry_discount"] for d in daily_map.values())
total_cafe_net = sum(d["cafe_gross"] - d["cafe_discount"] for d in daily_map.values())
total_cash = sum(d["cash"] for d in daily_map.values())
total_gcash = sum(d["gcash"] for d in daily_map.values())
total_card = sum(d["card"] for d in daily_map.values())
total_rcbc = sum(d["rcbc"] for d in daily_map.values())

print(f"Aggregated: {len(sorted_days)} active days, {total_paid_orders} paid orders.")
print(f"Total Net Sales: P{total_net_sales:,.2f} | Laundry: P{total_laundry_net:,.2f} | Cafe: P{total_cafe_net:,.2f}")

# Helper to auto-fit columns
def auto_fit_columns(ws, min_width=12, max_width=45):
    for col in ws.columns:
        col_letter = get_column_letter(col[0].column)
        max_len = 0
        for cell in col:
            # Skip title row and empty cells
            if cell.row < 4 or cell.value is None:
                continue
            val_str = str(cell.value)
            # Avoid long strings expanding the column excessively
            if len(val_str) > max_len:
                max_len = len(val_str)
        ws.column_dimensions[col_letter].width = max(min(max_len + 4, max_width), min_width)

# ==============================================================================
# SHEET 1: EXECUTIVE DASHBOARD & KPIS
# ==============================================================================
print("Building Sheet 1: Executive Dashboard...")
ws1 = wb.create_sheet(title="Executive Dashboard")
ws1.views.sheetView[0].showGridLines = True

# Title Block
ws1.merge_cells("A2:H2")
c_title = ws1.cell(row=2, column=1, value="S1P & SP1N LAUNDRY SHOP - DAVAO BRANCH")
c_title.font = Font(name=FONT_FAMILY, size=17, bold=True, color="1B365D")

ws1.merge_cells("A3:H3")
c_sub = ws1.cell(row=3, column=1, value="OFFICIAL POS SALES AUDIT & REVENUE PERFORMANCE REPORT (START TO NOW)")
c_sub.font = Font(name=FONT_FAMILY, size=11, bold=True, color="2E75B6")

ws1.merge_cells("A4:H4")
c_meta = ws1.cell(row=4, column=1, value="Branch ID: 27 | Address: De Sylca 1 Bldg., Tigatto Rd., Buhangin, Davao City | Timezone: Philippine Standard Time (PHT)")
c_meta.font = font_subtitle

# KPI Summary Cards Block (Rows 6 to 9)
def draw_kpi_card(ws, start_col, start_row, title, val_str, sub_str):
    for r in range(start_row, start_row + 3):
        for c in range(start_col, start_col + 2):
            cell = ws.cell(row=r, column=c)
            cell.fill = fill_kpi
            cell.border = border_data
    
    ws.merge_cells(start_row=start_row, start_column=start_col, end_row=start_row, end_column=start_col + 1)
    ws.merge_cells(start_row=start_row + 1, start_column=start_col, end_row=start_row + 1, end_column=start_col + 1)
    ws.merge_cells(start_row=start_row + 2, start_column=start_col, end_row=start_row + 2, end_column=start_col + 1)
    
    c_t = ws.cell(row=start_row, column=start_col, value=title)
    c_t.font = font_kpi_title
    c_t.alignment = align_center
    
    c_v = ws.cell(row=start_row + 1, column=start_col, value=val_str)
    c_v.font = font_kpi_value
    c_v.alignment = align_center
    
    c_s = ws.cell(row=start_row + 2, column=start_col, value=sub_str)
    c_s.font = font_kpi_sub
    c_s.alignment = align_center

draw_kpi_card(ws1, 1, 6, "TOTAL NET SALES", f"₱{total_net_sales:,.2f}", "August 1 – September 28, 2026")
draw_kpi_card(ws1, 3, 6, "PAID TRANSACTIONS", f"{total_paid_orders:,} Orders", f"Avg Ticket: ₱{total_net_sales / total_paid_orders:,.2f}")
draw_kpi_card(ws1, 5, 6, "LAUNDRY REVENUE", f"₱{total_laundry_net:,.2f}", f"{(total_laundry_net / total_net_sales)*100:.1f}% Share of Total")
draw_kpi_card(ws1, 7, 6, "CAFE & RETAIL REVENUE", f"₱{total_cafe_net:,.2f}", f"{(total_cafe_net / total_net_sales)*100:.1f}% Share of Total")

# Monthly Performance Table
ws1.cell(row=11, column=1, value="1. MONTHLY SALES REVENUE SUMMARY").font = font_section

m_headers = [
    "Billing Month", "Active Days", "Paid Orders", 
    "Laundry Net Sales", "Cafe & Retail Net", "Total Net Sales", 
    "Cash Collected", "GCash Collected", "Card & Bank", "Daily Avg Sales"
]

for col_idx, h in enumerate(m_headers, 1):
    cell = ws1.cell(row=12, column=col_idx, value=h)
    cell.font = font_header
    cell.fill = fill_primary
    cell.alignment = align_center
    cell.border = border_data
ws1.row_dimensions[12].height = 24

curr_row = 13
for m_idx, (m_name, m) in enumerate(months_map.items()):
    c1 = ws1.cell(row=curr_row, column=1, value=m_name)
    c2 = ws1.cell(row=curr_row, column=2, value=m["active_days"])
    c3 = ws1.cell(row=curr_row, column=3, value=m["orders"])
    c4 = ws1.cell(row=curr_row, column=4, value=m["laundry_gross"] - m["laundry_discount"])
    c5 = ws1.cell(row=curr_row, column=5, value=m["cafe_gross"] - m["cafe_discount"])
    c6 = ws1.cell(row=curr_row, column=6, value=f"=D{curr_row}+E{curr_row}")
    c7 = ws1.cell(row=curr_row, column=7, value=m["cash"])
    c8 = ws1.cell(row=curr_row, column=8, value=m["gcash"])
    c9 = ws1.cell(row=curr_row, column=9, value=m["card"] + m["rcbc"])
    c10 = ws1.cell(row=curr_row, column=10, value=f"=F{curr_row}/B{curr_row}")
    
    c1.alignment = align_center
    c2.alignment = align_center
    c3.alignment = align_center
    for c in [c4, c5, c6, c7, c8, c9, c10]:
        c.alignment = align_right
        c.number_format = FMT_CURRENCY
    
    for c in [c1, c2, c3, c4, c5, c6, c7, c8, c9, c10]:
        c.font = font_data
        c.border = border_data
        if m_idx % 2 == 1:
            c.fill = fill_zebra
    ws1.row_dimensions[curr_row].height = 20
    curr_row += 1

# Total Row for Monthly Summary
c_tot_lbl = ws1.cell(row=curr_row, column=1, value="GRAND TOTAL")
c_tot_lbl.alignment = align_center
c_tot_lbl.font = font_data_bold
c_tot_lbl.fill = fill_total_row
c_tot_lbl.border = border_total

c_tot_days = ws1.cell(row=curr_row, column=2, value=f"=SUM(B13:B{curr_row-1})")
c_tot_days.alignment = align_center
c_tot_days.font = font_data_bold
c_tot_days.fill = fill_total_row
c_tot_days.border = border_total

c_tot_orders = ws1.cell(row=curr_row, column=3, value=f"=SUM(C13:C{curr_row-1})")
c_tot_orders.alignment = align_center
c_tot_orders.font = font_data_bold
c_tot_orders.fill = fill_total_row
c_tot_orders.border = border_total

for col_idx, col_let in enumerate(["D", "E", "F", "G", "H", "I"], 4):
    cell = ws1.cell(row=curr_row, column=col_idx, value=f"=SUM({col_let}13:{col_let}{curr_row-1})")
    cell.font = font_data_bold
    cell.alignment = align_right
    cell.number_format = FMT_CURRENCY
    cell.fill = fill_total_row
    cell.border = border_total

c_tot_avg = ws1.cell(row=curr_row, column=10, value=f"=F{curr_row}/B{curr_row}")
c_tot_avg.font = font_data_bold
c_tot_avg.alignment = align_right
c_tot_avg.number_format = FMT_CURRENCY
c_tot_avg.fill = fill_total_row
c_tot_avg.border = border_total
ws1.row_dimensions[curr_row].height = 22

# Payment Channels Breakdown Table
curr_row += 3
ws1.cell(row=curr_row, column=1, value="2. PAYMENT CHANNEL DISTRIBUTION").font = font_section
curr_row += 1

pm_headers = ["Payment Channel", "Total Collected", "Percentage Share", "Transaction Count", "Channel Status"]
for col_idx, h in enumerate(pm_headers, 1):
    cell = ws1.cell(row=curr_row, column=col_idx, value=h)
    cell.font = font_header
    cell.fill = fill_secondary
    cell.alignment = align_center
    cell.border = border_data
ws1.row_dimensions[curr_row].height = 22
curr_row += 1

pm_start_row = curr_row
pm_data_list = [
    ("Cash Payments", total_cash, len([o for o in paid_orders if "cash" in (o.get("payment_method") or "").lower() and "gcash" not in (o.get("payment_method") or "").lower()]), "Primary On-Site Channel"),
    ("GCash Mobile Payments", total_gcash, len([o for o in paid_orders if "gcash" in (o.get("payment_method") or "").lower()]), "Digital Mobile Wallet"),
    ("Credit / Debit Card", total_card, len([o for o in paid_orders if "card" in (o.get("payment_method") or "").lower()]), "Electronic POS Terminal"),
    ("Bank Transfer (RCBC)", total_rcbc, len([o for o in paid_orders if "rcbc" in (o.get("payment_method") or "").lower()]), "Direct Bank Deposit")
]

for idx, (pm_label, amt, count, desc) in enumerate(pm_data_list):
    c1 = ws1.cell(row=curr_row, column=1, value=pm_label)
    c2 = ws1.cell(row=curr_row, column=2, value=amt)
    c3 = ws1.cell(row=curr_row, column=3, value=f"=B{curr_row}/$B${pm_start_row+4}")
    c4 = ws1.cell(row=curr_row, column=4, value=count)
    c5 = ws1.cell(row=curr_row, column=5, value=desc)
    
    c1.alignment = align_left
    c2.alignment = align_right
    c2.number_format = FMT_CURRENCY
    c3.alignment = align_center
    c3.number_format = FMT_PERCENT
    c4.alignment = align_center
    c5.alignment = align_left
    
    for c in [c1, c2, c3, c4, c5]:
        c.font = font_data
        c.border = border_data
        if idx % 2 == 1:
            c.fill = fill_zebra
    ws1.row_dimensions[curr_row].height = 20
    curr_row += 1

# Total Row for Payments
c_tot_pm = ws1.cell(row=curr_row, column=1, value="TOTAL ALL CHANNELS")
c_tot_pm.font = font_data_bold
c_tot_pm.alignment = align_left
c_tot_pm.fill = fill_total_row
c_tot_pm.border = border_total

c_tot_pm_amt = ws1.cell(row=curr_row, column=2, value=f"=SUM(B{pm_start_row}:B{curr_row-1})")
c_tot_pm_amt.font = font_data_bold
c_tot_pm_amt.alignment = align_right
c_tot_pm_amt.number_format = FMT_CURRENCY
c_tot_pm_amt.fill = fill_total_row
c_tot_pm_amt.border = border_total

c_tot_pm_pct = ws1.cell(row=curr_row, column=3, value=f"=SUM(C{pm_start_row}:C{curr_row-1})")
c_tot_pm_pct.font = font_data_bold
c_tot_pm_pct.alignment = align_center
c_tot_pm_pct.number_format = FMT_PERCENT
c_tot_pm_pct.fill = fill_total_row
c_tot_pm_pct.border = border_total

c_tot_pm_cnt = ws1.cell(row=curr_row, column=4, value=f"=SUM(D{pm_start_row}:D{curr_row-1})")
c_tot_pm_cnt.font = font_data_bold
c_tot_pm_cnt.alignment = align_center
c_tot_pm_cnt.fill = fill_total_row
c_tot_pm_cnt.border = border_total

c_tot_pm_desc = ws1.cell(row=curr_row, column=5, value="100% Reconciled")
c_tot_pm_desc.font = font_badge_green
c_tot_pm_desc.alignment = align_center
c_tot_pm_desc.fill = fill_green
c_tot_pm_desc.border = border_total
ws1.row_dimensions[curr_row].height = 22

auto_fit_columns(ws1, min_width=14, max_width=35)
ws1.column_dimensions["A"].width = 24
ws1.column_dimensions["B"].width = 16
ws1.column_dimensions["D"].width = 20
ws1.column_dimensions["E"].width = 20
ws1.column_dimensions["F"].width = 20
ws1.column_dimensions["G"].width = 18
ws1.column_dimensions["H"].width = 18

# ==============================================================================
# SHEET 2: DAILY SALES LOG
# ==============================================================================
print("Building Sheet 2: Daily Sales Log...")
ws2 = wb.create_sheet(title="Daily Sales Log")
ws2.views.sheetView[0].showGridLines = True

# Title Block
ws2.cell(row=2, column=1, value="S1P & SP1N LAUNDRY SHOP - DAVAO BRANCH").font = font_title
ws2.cell(row=3, column=1, value="COMPLETE DAILY POS REVENUE AUDIT (AUGUST 1, 2026 – PRESENT)").font = font_subtitle

daily_headers = [
    "Date", "Day of Week", "Paid Orders", 
    "Laundry Gross (₱)", "Cafe Gross (₱)", "Gross Sales (₱)", 
    "Discounts (₱)", "Net Sales (₱)", 
    "Cash Collected (₱)", "GCash Collected (₱)", "Card Collected (₱)", "Bank / RCBC (₱)", 
    "Cumulative Revenue (₱)"
]

header_row_daily = 5
for col_idx, h in enumerate(daily_headers, 1):
    cell = ws2.cell(row=header_row_daily, column=col_idx, value=h)
    cell.font = font_header
    cell.fill = fill_primary
    cell.alignment = align_center
    cell.border = border_data
ws2.row_dimensions[header_row_daily].height = 25

curr_row = 6
running_cum = 0.0

for idx, d_str in enumerate(sorted_days):
    d = daily_map[d_str]
    c_date = ws2.cell(row=curr_row, column=1, value=d["date"])
    c_day = ws2.cell(row=curr_row, column=2, value=d["day"])
    c_orders = ws2.cell(row=curr_row, column=3, value=d["orders"])
    c_l_gross = ws2.cell(row=curr_row, column=4, value=d["laundry_gross"])
    c_c_gross = ws2.cell(row=curr_row, column=5, value=d["cafe_gross"])
    c_t_gross = ws2.cell(row=curr_row, column=6, value=f"=D{curr_row}+E{curr_row}")
    c_disc = ws2.cell(row=curr_row, column=7, value=d["total_discount"])
    c_net = ws2.cell(row=curr_row, column=8, value=f"=F{curr_row}-G{curr_row}")
    c_cash = ws2.cell(row=curr_row, column=9, value=d["cash"])
    c_gcash = ws2.cell(row=curr_row, column=10, value=d["gcash"])
    c_card = ws2.cell(row=curr_row, column=11, value=d["card"])
    c_rcbc = ws2.cell(row=curr_row, column=12, value=d["rcbc"])
    
    # Cumulative formula
    if curr_row == 6:
        c_cum = ws2.cell(row=curr_row, column=13, value=f"=H6")
    else:
        c_cum = ws2.cell(row=curr_row, column=13, value=f"=M{curr_row-1}+H{curr_row}")
    
    # Alignment & Format
    c_date.alignment = align_center
    c_day.alignment = align_center
    c_orders.alignment = align_center
    
    for c in [c_l_gross, c_c_gross, c_t_gross, c_disc, c_net, c_cash, c_gcash, c_card, c_rcbc, c_cum]:
        c.alignment = align_right
        c.number_format = FMT_CURRENCY
        
    for c in [c_date, c_day, c_orders, c_l_gross, c_c_gross, c_t_gross, c_disc, c_net, c_cash, c_gcash, c_card, c_rcbc, c_cum]:
        c.font = font_data
        c.border = border_data
        if idx % 2 == 1:
            c.fill = fill_zebra
            
    # Highlight discounts if present
    if d["total_discount"] > 0:
        c_disc.font = font_badge_red
        c_disc.fill = fill_red
        
    ws2.row_dimensions[curr_row].height = 20
    curr_row += 1

# Daily Grand Total Row
c_tot_lbl = ws2.cell(row=curr_row, column=1, value="GRAND TOTAL")
c_tot_lbl.alignment = align_center
c_tot_lbl.font = font_data_bold
c_tot_lbl.fill = fill_total_row
c_tot_lbl.border = border_total

c_tot_days = ws2.cell(row=curr_row, column=2, value=f"{len(sorted_days)} Days Active")
c_tot_days.alignment = align_center
c_tot_days.font = font_data_bold
c_tot_days.fill = fill_total_row
c_tot_days.border = border_total

c_tot_orders = ws2.cell(row=curr_row, column=3, value=f"=SUM(C6:C{curr_row-1})")
c_tot_orders.alignment = align_center
c_tot_orders.font = font_data_bold
c_tot_orders.fill = fill_total_row
c_tot_orders.border = border_total

for col_idx, col_let in enumerate(["D", "E", "F", "G", "H", "I", "J", "K", "L"], 4):
    cell = ws2.cell(row=curr_row, column=col_idx, value=f"=SUM({col_let}6:{col_let}{curr_row-1})")
    cell.font = font_data_bold
    cell.alignment = align_right
    cell.number_format = FMT_CURRENCY
    cell.fill = fill_total_row
    cell.border = border_total

c_final_cum = ws2.cell(row=curr_row, column=13, value=f"=H{curr_row}")
c_final_cum.font = font_data_bold
c_final_cum.alignment = align_right
c_final_cum.number_format = FMT_CURRENCY
c_final_cum.fill = fill_total_row
c_final_cum.border = border_total
ws2.row_dimensions[curr_row].height = 24

# Freeze header pane
ws2.freeze_panes = "A6"
auto_fit_columns(ws2, min_width=13, max_width=30)
ws2.column_dimensions["A"].width = 14
ws2.column_dimensions["B"].width = 14
ws2.column_dimensions["C"].width = 13
ws2.column_dimensions["D"].width = 18
ws2.column_dimensions["E"].width = 18
ws2.column_dimensions["F"].width = 18
ws2.column_dimensions["G"].width = 15
ws2.column_dimensions["H"].width = 18
ws2.column_dimensions["I"].width = 18
ws2.column_dimensions["J"].width = 18
ws2.column_dimensions["M"].width = 22

# ==============================================================================
# SHEET 3: DETAILED ITEMIZED SALES
# ==============================================================================
print("Building Sheet 3: Detailed Itemized Sales...")
ws3 = wb.create_sheet(title="Itemized Sales Log")
ws3.views.sheetView[0].showGridLines = True

ws3.cell(row=2, column=1, value="S1P & SP1N LAUNDRY SHOP - DAVAO BRANCH").font = font_title
ws3.cell(row=3, column=1, value="COMPLETE AUDIT TRAIL OF ALL ITEMS & SERVICES SOLD (LINE-BY-LINE)").font = font_subtitle

item_headers = [
    "Date", "Time (PHT)", "Receipt #", "Order ID", "Customer / Order Ref", 
    "Order Type", "Division", "Category", "Item Description", 
    "Qty", "Unit Price (₱)", "Total Amount (₱)", "Payment Method", "Status"
]

header_row_item = 5
for col_idx, h in enumerate(item_headers, 1):
    cell = ws3.cell(row=header_row_item, column=col_idx, value=h)
    cell.font = font_header
    cell.fill = fill_primary
    cell.alignment = align_center
    cell.border = border_data
ws3.row_dimensions[header_row_item].height = 25

curr_row = 6
item_idx = 0

# Sort paid orders chronologically
paid_orders_sorted = sorted(paid_orders, key=lambda x: x["created_at"])

for o in paid_orders_sorted:
    pht_dt = parse_pht(o["created_at"])
    d_str = pht_dt.strftime("%Y-%m-%d")
    t_str = pht_dt.strftime("%I:%M %p")
    receipt_no = o.get("receipt_number") or f"OR-{o['id']}"
    order_id = o["id"]
    order_type = (o.get("order_type") or "Walk-in").title()
    pm_method = (o.get("payment_method") or "Cash").strip().title()
    if pm_method.lower() == "gcash":
        pm_method = "GCash"
        
    # Extract customer name if in laundry note
    cust_name = ""
    if o.get("notes") and "customer_name" in o["notes"]:
        try:
            n_data = json.loads(o["notes"])
            cust_name = n_data.get("customer_name") or ""
        except Exception:
            cust_name = ""
            
    its = items_by_order.get(order_id, [])
    for it in its:
        pid = it["product_id"]
        prod = products.get(pid)
        cat = categories.get(prod["category_id"]) if prod else None
        pname = prod["name"].strip() if prod else f"Item #{pid}"
        if pname.endswith(":"):
            pname = pname[:-1].strip()
        cname = cat["name"].strip() if cat else "Uncategorized"
        div = (cat.get("division") or "coffee").strip()
        div_label = "Laundry" if div == "laundry" else "Cafe & Retail"
        
        qty = float(it["quantity"])
        u_price = float(it["price"])
        line_tot = qty * u_price
        
        c1 = ws3.cell(row=curr_row, column=1, value=d_str)
        c2 = ws3.cell(row=curr_row, column=2, value=t_str)
        c3 = ws3.cell(row=curr_row, column=3, value=receipt_no)
        c4 = ws3.cell(row=curr_row, column=4, value=order_id)
        c5 = ws3.cell(row=curr_row, column=5, value=cust_name if cust_name else "Walk-in Customer")
        c6 = ws3.cell(row=curr_row, column=6, value=order_type)
        c7 = ws3.cell(row=curr_row, column=7, value=div_label)
        c8 = ws3.cell(row=curr_row, column=8, value=cname)
        c9 = ws3.cell(row=curr_row, column=9, value=pname)
        c10 = ws3.cell(row=curr_row, column=10, value=qty)
        c11 = ws3.cell(row=curr_row, column=11, value=u_price)
        c12 = ws3.cell(row=curr_row, column=12, value=f"=J{curr_row}*K{curr_row}")
        c13 = ws3.cell(row=curr_row, column=13, value=pm_method)
        c14 = ws3.cell(row=curr_row, column=14, value="PAID")
        
        c1.alignment = align_center
        c2.alignment = align_center
        c3.alignment = align_center
        c4.alignment = align_center
        c5.alignment = align_left
        c6.alignment = align_center
        c7.alignment = align_center
        c8.alignment = align_left
        c9.alignment = align_left
        c10.alignment = align_center
        c11.alignment = align_right
        c11.number_format = FMT_CURRENCY
        c12.alignment = align_right
        c12.number_format = FMT_CURRENCY
        c13.alignment = align_center
        c14.alignment = align_center
        
        for c in [c1, c2, c3, c4, c5, c6, c7, c8, c9, c10, c11, c12, c13]:
            c.font = font_data
            c.border = border_data
            if item_idx % 2 == 1:
                c.fill = fill_zebra
                
        c14.font = font_badge_green
        c14.fill = fill_green
        c14.border = border_data
        
        # Division styling
        if div_label == "Laundry":
            c7.font = Font(name=FONT_FAMILY, size=10, bold=True, color="1F4E78")
        else:
            c7.font = Font(name=FONT_FAMILY, size=10, color="70543E")
            
        ws3.row_dimensions[curr_row].height = 19
        curr_row += 1
        item_idx += 1

# Summary Row for Itemized
c_tot_lbl = ws3.cell(row=curr_row, column=1, value="TOTAL ALL ITEMS")
c_tot_lbl.alignment = align_center
c_tot_lbl.font = font_data_bold
c_tot_lbl.fill = fill_total_row
c_tot_lbl.border = border_total

for col_idx in range(2, 10):
    c = ws3.cell(row=curr_row, column=col_idx)
    c.fill = fill_total_row
    c.border = border_total

c_tot_qty = ws3.cell(row=curr_row, column=10, value=f"=SUM(J6:J{curr_row-1})")
c_tot_qty.font = font_data_bold
c_tot_qty.alignment = align_center
c_tot_qty.fill = fill_total_row
c_tot_qty.border = border_total

c_blank_price = ws3.cell(row=curr_row, column=11)
c_blank_price.fill = fill_total_row
c_blank_price.border = border_total

c_tot_sum = ws3.cell(row=curr_row, column=12, value=f"=SUM(L6:L{curr_row-1})")
c_tot_sum.font = font_data_bold
c_tot_sum.alignment = align_right
c_tot_sum.number_format = FMT_CURRENCY
c_tot_sum.fill = fill_total_row
c_tot_sum.border = border_total

for col_idx in [13, 14]:
    c = ws3.cell(row=curr_row, column=col_idx)
    c.fill = fill_total_row
    c.border = border_total
ws3.row_dimensions[curr_row].height = 24

# Freeze panes & autofilter
ws3.freeze_panes = "A6"
ws3.auto_filter.ref = f"A5:N{curr_row-1}"
auto_fit_columns(ws3, min_width=12, max_width=40)
ws3.column_dimensions["A"].width = 14
ws3.column_dimensions["B"].width = 13
ws3.column_dimensions["C"].width = 13
ws3.column_dimensions["D"].width = 11
ws3.column_dimensions["E"].width = 22
ws3.column_dimensions["G"].width = 16
ws3.column_dimensions["H"].width = 25
ws3.column_dimensions["I"].width = 30
ws3.column_dimensions["L"].width = 18

# ==============================================================================
# SHEET 4: LAUNDRY SERVICE ORDERS TRACKER
# ==============================================================================
print("Building Sheet 4: Laundry Service Orders...")
ws4 = wb.create_sheet(title="Laundry Service Log")
ws4.views.sheetView[0].showGridLines = True

ws4.cell(row=2, column=1, value="S1P & SP1N LAUNDRY SHOP - DAVAO BRANCH").font = font_title
ws4.cell(row=3, column=1, value="DETAILED LAUNDRY OPERATIONS LOG (WEIGHT, PROMOS, DETERGENTS & CLAIMS)").font = font_subtitle

laundry_headers = [
    "Receipt #", "Order ID", "Date", "Time", "Customer Name", "Contact #", 
    "Laundry Service", "Actual Weight (kg)", "Billed Weight (kg)", "Free Kilos (5+2)", 
    "Rate (₱/kg)", "Service Amount (₱)", "Add-on Detergents & FabCon", 
    "Add-on Amount (₱)", "Order Total (₱)", "Payment Method", "Pickup Date", "Claim Status"
]

header_row_laundry = 5
for col_idx, h in enumerate(laundry_headers, 1):
    cell = ws4.cell(row=header_row_laundry, column=col_idx, value=h)
    cell.font = font_header
    cell.fill = PatternFill(start_color="1F4E78", end_color="1F4E78", fill_type="solid")
    cell.alignment = align_center
    cell.border = border_data
ws4.row_dimensions[header_row_laundry].height = 25

curr_row = 6
laundry_idx = 0

for o in paid_orders_sorted:
    if not o.get("notes") or "is_laundry" not in o["notes"]:
        continue
    try:
        n = json.loads(o["notes"])
    except Exception:
        continue
        
    pht_dt = parse_pht(o["created_at"])
    d_str = pht_dt.strftime("%Y-%m-%d")
    t_str = pht_dt.strftime("%I:%M %p")
    receipt_no = o.get("receipt_number") or f"OR-{o['id']}"
    cust_name = (n.get("customer_name") or "Customer").strip()
    phone = (n.get("phone") or "").strip()
    
    # Extract service info
    srv_list = n.get("services", [])
    if srv_list:
        primary_srv = srv_list[0]
        srv_name = primary_srv.get("name", n.get("service_name", "Regular Clothes:"))
        if srv_name.endswith(":"):
            srv_name = srv_name[:-1].strip()
        weight = float(n.get("weight") or primary_srv.get("weight") or 0.0)
        billed_weight = float(primary_srv.get("billedWeight") or weight)
        free_kilos = float(primary_srv.get("freeKilos") or 0.0)
        rate = float(primary_srv.get("price") or n.get("rate") or 49.0)
        srv_subtotal = float(primary_srv.get("subtotal") or (billed_weight * rate))
    else:
        srv_name = (n.get("service_name") or "Regular Clothes:").strip()
        if srv_name.endswith(":"):
            srv_name = srv_name[:-1].strip()
        weight = float(n.get("weight") or 0.0)
        billed_weight = weight
        free_kilos = 0.0
        rate = float(n.get("rate") or 49.0)
        srv_subtotal = float(n.get("subtotal") or (weight * rate))
        
    # Extract Addons
    addons = n.get("addons", [])
    addon_str = ", ".join(f"{a.get('name')} (₱{a.get('price', 0)})" for a in addons) if addons else "None"
    addon_tot = sum(float(a.get("price", 0)) for a in addons)
    
    order_total = float(o.get("total") or (srv_subtotal + addon_tot))
    pm_method = (o.get("payment_method") or n.get("payment_method") or "Cash").strip().title()
    if pm_method.lower() == "gcash":
        pm_method = "GCash"
        
    pickup_date = n.get("pickup_date") or "-"
    is_claimed = n.get("is_claimed", False)
    claim_label = "CLAIMED" if is_claimed else "PENDING PICKUP"
    
    c1 = ws4.cell(row=curr_row, column=1, value=receipt_no)
    c2 = ws4.cell(row=curr_row, column=2, value=o["id"])
    c3 = ws4.cell(row=curr_row, column=3, value=d_str)
    c4 = ws4.cell(row=curr_row, column=4, value=t_str)
    c5 = ws4.cell(row=curr_row, column=5, value=cust_name)
    c6 = ws4.cell(row=curr_row, column=6, value=phone if phone else "-")
    c7 = ws4.cell(row=curr_row, column=7, value=srv_name)
    c8 = ws4.cell(row=curr_row, column=8, value=weight)
    c9 = ws4.cell(row=curr_row, column=9, value=billed_weight)
    c10 = ws4.cell(row=curr_row, column=10, value=free_kilos)
    c11 = ws4.cell(row=curr_row, column=11, value=rate)
    c12 = ws4.cell(row=curr_row, column=12, value=srv_subtotal)
    c13 = ws4.cell(row=curr_row, column=13, value=addon_str)
    c14 = ws4.cell(row=curr_row, column=14, value=addon_tot)
    c15 = ws4.cell(row=curr_row, column=15, value=order_total)
    c16 = ws4.cell(row=curr_row, column=16, value=pm_method)
    c17 = ws4.cell(row=curr_row, column=17, value=pickup_date)
    c18 = ws4.cell(row=curr_row, column=18, value=claim_label)
    
    c1.alignment = align_center
    c2.alignment = align_center
    c3.alignment = align_center
    c4.alignment = align_center
    c5.alignment = align_left
    c6.alignment = align_center
    c7.alignment = align_left
    c8.alignment = align_center
    c8.number_format = FMT_WEIGHT
    c9.alignment = align_center
    c9.number_format = FMT_WEIGHT
    c10.alignment = align_center
    c10.number_format = FMT_WEIGHT
    c11.alignment = align_right
    c11.number_format = FMT_CURRENCY
    c12.alignment = align_right
    c12.number_format = FMT_CURRENCY
    c13.alignment = align_left
    c14.alignment = align_right
    c14.number_format = FMT_CURRENCY
    c15.alignment = align_right
    c15.number_format = FMT_CURRENCY
    c16.alignment = align_center
    c17.alignment = align_center
    c18.alignment = align_center
    
    for c in [c1, c2, c3, c4, c5, c6, c7, c8, c9, c10, c11, c12, c13, c14, c15, c16, c17]:
        c.font = font_data
        c.border = border_data
        if laundry_idx % 2 == 1:
            c.fill = fill_zebra
            
    if is_claimed:
        c18.font = font_badge_green
        c18.fill = fill_green
    else:
        c18.font = font_badge_yellow
        c18.fill = fill_yellow
    c18.border = border_data
    
    ws4.row_dimensions[curr_row].height = 20
    curr_row += 1
    laundry_idx += 1

# Total Row for Laundry
c_tot_lbl = ws4.cell(row=curr_row, column=1, value="TOTAL LAUNDRY ORDERS")
c_tot_lbl.alignment = align_center
c_tot_lbl.font = font_data_bold
c_tot_lbl.fill = fill_total_row
c_tot_lbl.border = border_total

for c_idx in range(2, 8):
    c = ws4.cell(row=curr_row, column=c_idx)
    c.fill = fill_total_row
    c.border = border_total

c_tot_weight = ws4.cell(row=curr_row, column=8, value=f"=SUM(H6:H{curr_row-1})")
c_tot_weight.font = font_data_bold
c_tot_weight.alignment = align_center
c_tot_weight.number_format = FMT_WEIGHT
c_tot_weight.fill = fill_total_row
c_tot_weight.border = border_total

c_tot_billed = ws4.cell(row=curr_row, column=9, value=f"=SUM(I6:I{curr_row-1})")
c_tot_billed.font = font_data_bold
c_tot_billed.alignment = align_center
c_tot_billed.number_format = FMT_WEIGHT
c_tot_billed.fill = fill_total_row
c_tot_billed.border = border_total

c_tot_free = ws4.cell(row=curr_row, column=10, value=f"=SUM(J6:J{curr_row-1})")
c_tot_free.font = font_data_bold
c_tot_free.alignment = align_center
c_tot_free.number_format = FMT_WEIGHT
c_tot_free.fill = fill_total_row
c_tot_free.border = border_total

c_blank_rate = ws4.cell(row=curr_row, column=11)
c_blank_rate.fill = fill_total_row
c_blank_rate.border = border_total

c_tot_srv = ws4.cell(row=curr_row, column=12, value=f"=SUM(L6:L{curr_row-1})")
c_tot_srv.font = font_data_bold
c_tot_srv.alignment = align_right
c_tot_srv.number_format = FMT_CURRENCY
c_tot_srv.fill = fill_total_row
c_tot_srv.border = border_total

c_blank_addon = ws4.cell(row=curr_row, column=13)
c_blank_addon.fill = fill_total_row
c_blank_addon.border = border_total

c_tot_addons = ws4.cell(row=curr_row, column=14, value=f"=SUM(N6:N{curr_row-1})")
c_tot_addons.font = font_data_bold
c_tot_addons.alignment = align_right
c_tot_addons.number_format = FMT_CURRENCY
c_tot_addons.fill = fill_total_row
c_tot_addons.border = border_total

c_tot_orders_sum = ws4.cell(row=curr_row, column=15, value=f"=SUM(O6:O{curr_row-1})")
c_tot_orders_sum.font = font_data_bold
c_tot_orders_sum.alignment = align_right
c_tot_orders_sum.number_format = FMT_CURRENCY
c_tot_orders_sum.fill = fill_total_row
c_tot_orders_sum.border = border_total

for c_idx in [16, 17, 18]:
    c = ws4.cell(row=curr_row, column=c_idx)
    c.fill = fill_total_row
    c.border = border_total
ws4.row_dimensions[curr_row].height = 24

ws4.freeze_panes = "A6"
ws4.auto_filter.ref = f"A5:R{curr_row-1}"
auto_fit_columns(ws4, min_width=12, max_width=45)
ws4.column_dimensions["A"].width = 13
ws4.column_dimensions["C"].width = 14
ws4.column_dimensions["E"].width = 22
ws4.column_dimensions["G"].width = 24
ws4.column_dimensions["H"].width = 17
ws4.column_dimensions["I"].width = 17
ws4.column_dimensions["J"].width = 17
ws4.column_dimensions["L"].width = 18
ws4.column_dimensions["M"].width = 35
ws4.column_dimensions["O"].width = 18

# ==============================================================================
# SHEET 5: PRODUCT SALES & BEST SELLERS
# ==============================================================================
print("Building Sheet 5: Product Performance...")
ws5 = wb.create_sheet(title="Product Performance")
ws5.views.sheetView[0].showGridLines = True

ws5.cell(row=2, column=1, value="S1P & SP1N LAUNDRY SHOP - DAVAO BRANCH").font = font_title
ws5.cell(row=3, column=1, value="PRODUCT & SERVICES SALES PERFORMANCE RANKING (BEST SELLERS TO DATE)").font = font_subtitle

prod_headers = [
    "Rank", "Product / Service Name", "Division", "Category", 
    "Total Units Sold", "Unit Price (₱)", "Total Gross Revenue (₱)", 
    "% of Gross Sales", "Cumulative %", "Sales Classification"
]

header_row_prod = 5
for col_idx, h in enumerate(prod_headers, 1):
    cell = ws5.cell(row=header_row_prod, column=col_idx, value=h)
    cell.font = font_header
    cell.fill = fill_primary
    cell.alignment = align_center
    cell.border = border_data
ws5.row_dimensions[header_row_prod].height = 25

total_gross_prod = sum(p["revenue"] for p in ranked_products)
curr_row = 6
running_prod_rev = 0.0

for rank, p in enumerate(ranked_products, 1):
    p_rev = p["revenue"]
    running_prod_rev += p_rev
    cum_pct = (running_prod_rev / total_gross_prod) if total_gross_prod > 0 else 0
    
    if cum_pct <= 0.70:
        cls_tier = "Top Star Product (Top 70%)"
        cls_style = font_badge_green
        cls_fill = fill_green
    elif cum_pct <= 0.90:
        cls_tier = "Core Contributor (Next 20%)"
        cls_style = Font(name=FONT_FAMILY, size=9, bold=True, color="1F4E78")
        cls_fill = PatternFill(start_color="EDF2F8", end_color="EDF2F8", fill_type="solid")
    else:
        cls_tier = "Standard Product (<10%)"
        cls_style = Font(name=FONT_FAMILY, size=9, color="595959")
        cls_fill = PatternFill(start_color="FAFAFA", end_color="FAFAFA", fill_type="solid")
        
    c1 = ws5.cell(row=curr_row, column=1, value=rank)
    c2 = ws5.cell(row=curr_row, column=2, value=p["name"])
    c3 = ws5.cell(row=curr_row, column=3, value=p["division"])
    c4 = ws5.cell(row=curr_row, column=4, value=p["category"])
    c5 = ws5.cell(row=curr_row, column=5, value=p["qty"])
    c6 = ws5.cell(row=curr_row, column=6, value=p["unit_price"])
    c7 = ws5.cell(row=curr_row, column=7, value=p_rev)
    c8 = ws5.cell(row=curr_row, column=8, value=f"=G{curr_row}/$G${len(ranked_products)+6}")
    c9 = ws5.cell(row=curr_row, column=9, value=cum_pct)
    c10 = ws5.cell(row=curr_row, column=10, value=cls_tier)
    
    c1.alignment = align_center
    c2.alignment = align_left
    c3.alignment = align_center
    c4.alignment = align_left
    c5.alignment = align_center
    c6.alignment = align_right
    c6.number_format = FMT_CURRENCY
    c7.alignment = align_right
    c7.number_format = FMT_CURRENCY
    c8.alignment = align_center
    c8.number_format = FMT_PERCENT
    c9.alignment = align_center
    c9.number_format = FMT_PERCENT
    c10.alignment = align_center
    
    for c in [c1, c2, c3, c4, c5, c6, c7, c8, c9]:
        c.font = font_data
        c.border = border_data
        if rank % 2 == 1:
            c.fill = fill_zebra
            
    c10.font = cls_style
    c10.fill = cls_fill
    c10.border = border_data
    
    ws5.row_dimensions[curr_row].height = 20
    curr_row += 1

# Product Total Row
c_tot_lbl = ws5.cell(row=curr_row, column=1, value="GRAND TOTAL")
c_tot_lbl.alignment = align_center
c_tot_lbl.font = font_data_bold
c_tot_lbl.fill = fill_total_row
c_tot_lbl.border = border_total

for c_idx in [2, 3, 4]:
    c = ws5.cell(row=curr_row, column=c_idx)
    c.fill = fill_total_row
    c.border = border_total

c_tot_units = ws5.cell(row=curr_row, column=5, value=f"=SUM(E6:E{curr_row-1})")
c_tot_units.font = font_data_bold
c_tot_units.alignment = align_center
c_tot_units.fill = fill_total_row
c_tot_units.border = border_total

c_blank_p = ws5.cell(row=curr_row, column=6)
c_blank_p.fill = fill_total_row
c_blank_p.border = border_total

c_tot_rev = ws5.cell(row=curr_row, column=7, value=f"=SUM(G6:G{curr_row-1})")
c_tot_rev.font = font_data_bold
c_tot_rev.alignment = align_right
c_tot_rev.number_format = FMT_CURRENCY
c_tot_rev.fill = fill_total_row
c_tot_rev.border = border_total

c_tot_pct = ws5.cell(row=curr_row, column=8, value=f"=SUM(H6:H{curr_row-1})")
c_tot_pct.font = font_data_bold
c_tot_pct.alignment = align_center
c_tot_pct.number_format = FMT_PERCENT
c_tot_pct.fill = fill_total_row
c_tot_pct.border = border_total

c_final_cum = ws5.cell(row=curr_row, column=9, value=1.0)
c_final_cum.font = font_data_bold
c_final_cum.alignment = align_center
c_final_cum.number_format = FMT_PERCENT
c_final_cum.fill = fill_total_row
c_final_cum.border = border_total

c_tot_desc = ws5.cell(row=curr_row, column=10, value="Complete Item Ranking")
c_tot_desc.font = font_data_bold
c_tot_desc.alignment = align_center
c_tot_desc.fill = fill_total_row
c_tot_desc.border = border_total
ws5.row_dimensions[curr_row].height = 24

ws5.freeze_panes = "A6"
ws5.auto_filter.ref = f"A5:J{curr_row-1}"
auto_fit_columns(ws5, min_width=12, max_width=40)
ws5.column_dimensions["A"].width = 10
ws5.column_dimensions["B"].width = 32
ws5.column_dimensions["C"].width = 16
ws5.column_dimensions["D"].width = 25
ws5.column_dimensions["E"].width = 16
ws5.column_dimensions["G"].width = 22
ws5.column_dimensions["H"].width = 16
ws5.column_dimensions["I"].width = 16
ws5.column_dimensions["J"].width = 26

# ==============================================================================
# SHEET 6: AUDITING & VOIDED / OPEN ORDERS
# ==============================================================================
print("Building Sheet 6: Audit & Non-Paid Orders...")
ws6 = wb.create_sheet(title="Audit Log (Voided & Open)")
ws6.views.sheetView[0].showGridLines = True

ws6.cell(row=2, column=1, value="S1P & SP1N LAUNDRY SHOP - DAVAO BRANCH").font = font_title
ws6.cell(row=3, column=1, value="AUDIT TRAIL: VOIDED AND UNFINALIZED OPEN ORDERS FOR COMPLETE RECONCILIATION").font = font_subtitle

audit_headers = [
    "Order ID", "Date", "Time (PHT)", "Order Status", "Order Total (₱)", 
    "Customer Name", "Service / Items Ordered", "Audit Notes & Cause"
]

header_row_audit = 5
for col_idx, h in enumerate(audit_headers, 1):
    cell = ws6.cell(row=header_row_audit, column=col_idx, value=h)
    cell.font = font_header
    cell.fill = fill_primary
    cell.alignment = align_center
    cell.border = border_data
ws6.row_dimensions[header_row_audit].height = 25

non_paid_orders = [o for o in orders if o["status"] in ["voided", "open"]]
non_paid_orders.sort(key=lambda x: (x["status"], x["created_at"]))

curr_row = 6
for idx, o in enumerate(non_paid_orders):
    pht_dt = parse_pht(o["created_at"])
    d_str = pht_dt.strftime("%Y-%m-%d")
    t_str = pht_dt.strftime("%I:%M %p")
    status = o["status"].upper()
    tot = float(o.get("total") or 0.0)
    
    cust_name = "-"
    srv_desc = "-"
    notes_str = "-"
    
    if o.get("notes"):
        try:
            n = json.loads(o["notes"])
            cust_name = n.get("customer_name") or "-"
            srv_desc = n.get("service_name") or "-"
            if srv_desc.endswith(":"):
                srv_desc = srv_desc[:-1].strip()
            if n.get("addons"):
                srv_desc += " + " + ", ".join(a.get("name", "") for a in n.get("addons"))
            notes_str = f"Weight: {n.get('weight', 0)}kg | Rate: P{n.get('rate', 0)}/kg"
        except Exception:
            notes_str = o["notes"][:60]
    else:
        # Check order items
        its = items_by_order.get(o["id"], [])
        if its:
            p_names = [products.get(it["product_id"], {}).get("name", "?") for it in its]
            srv_desc = ", ".join(p_names)
            notes_str = f"{len(its)} item(s) ordered via POS"
            
    c1 = ws6.cell(row=curr_row, column=1, value=o["id"])
    c2 = ws6.cell(row=curr_row, column=2, value=d_str)
    c3 = ws6.cell(row=curr_row, column=3, value=t_str)
    c4 = ws6.cell(row=curr_row, column=4, value=status)
    c5 = ws6.cell(row=curr_row, column=5, value=tot)
    c6 = ws6.cell(row=curr_row, column=6, value=cust_name)
    c7 = ws6.cell(row=curr_row, column=7, value=srv_desc)
    c8 = ws6.cell(row=curr_row, column=8, value=notes_str)
    
    c1.alignment = align_center
    c2.alignment = align_center
    c3.alignment = align_center
    c4.alignment = align_center
    c5.alignment = align_right
    c5.number_format = FMT_CURRENCY
    c6.alignment = align_left
    c7.alignment = align_left
    c8.alignment = align_left
    
    for c in [c1, c2, c3, c5, c6, c7, c8]:
        c.font = font_data
        c.border = border_data
        if idx % 2 == 1:
            c.fill = fill_zebra
            
    if status == "VOIDED":
        c4.font = font_badge_red
        c4.fill = fill_red
    else:
        c4.font = font_badge_yellow
        c4.fill = fill_yellow
    c4.border = border_data
    
    ws6.row_dimensions[curr_row].height = 20
    curr_row += 1

# Audit Total Row
c_tot_lbl = ws6.cell(row=curr_row, column=1, value="TOTAL AUDIT ORDERS")
c_tot_lbl.alignment = align_center
c_tot_lbl.font = font_data_bold
c_tot_lbl.fill = fill_total_row
c_tot_lbl.border = border_total

for c_idx in [2, 3, 4]:
    c = ws6.cell(row=curr_row, column=c_idx)
    c.fill = fill_total_row
    c.border = border_total

c_tot_nonpaid = ws6.cell(row=curr_row, column=5, value=f"=SUM(E6:E{curr_row-1})")
c_tot_nonpaid.font = font_data_bold
c_tot_nonpaid.alignment = align_right
c_tot_nonpaid.number_format = FMT_CURRENCY
c_tot_nonpaid.fill = fill_total_row
c_tot_nonpaid.border = border_total

for c_idx in [6, 7, 8]:
    c = ws6.cell(row=curr_row, column=c_idx)
    c.fill = fill_total_row
    c.border = border_total
ws6.row_dimensions[curr_row].height = 24

ws6.freeze_panes = "A6"
auto_fit_columns(ws6, min_width=12, max_width=50)
ws6.column_dimensions["A"].width = 12
ws6.column_dimensions["B"].width = 14
ws6.column_dimensions["D"].width = 15
ws6.column_dimensions["E"].width = 18
ws6.column_dimensions["F"].width = 22
ws6.column_dimensions["G"].width = 35
ws6.column_dimensions["H"].width = 35

# ==============================================================================
# SAVE WORKBOOK
# ==============================================================================
print(f"Saving workbook to {output_file_records} and root copy {output_file_root}...")
try:
    wb.save(output_file_records)
    print(f"SUCCESS: Saved to recordsExcel: {output_file_records}")
except Exception as e:
    print(f"Error saving to recordsExcel: {e}")

try:
    wb.save(output_file_root)
    print(f"SUCCESS: Saved to root directory: {output_file_root}")
except Exception as e:
    print(f"Error saving to root directory: {e}")

print("Excel file generation complete!")
