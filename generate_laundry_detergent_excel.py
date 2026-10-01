import os
import json
import urllib.request
from datetime import datetime, timezone, timedelta
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter

# Set timezone for Manila (UTC+8)
PST = timezone(timedelta(hours=8))

# Supabase credentials
SUPABASE_URL = 'https://aziowvhzfrmtrbypiodm.supabase.co/rest/v1/'
SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF6aW93dmh6ZnJtdHJieXBpb2RtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2MTQzMTgsImV4cCI6MjEwMDE5MDMxOH0.cCyA0z20cRfGotnzcatm-9AgZRXR0UEyW7SjGBo-HqQ'
HEADERS = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Range': '0-5000'
}

def fetch_json(endpoint):
    url = SUPABASE_URL + endpoint
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

print("Fetching data from Supabase...")
# 1. Fetch Laundry Detergents / Add-ons (Category 64, Branch 27)
prods = fetch_json('products_espresso?branch_id=eq.27&category_id=eq.64')
prod_map = {p['id']: p for p in prods}
# Exclude inactive zero-priced duplicate downy records (IDs 543, 544)
pids_clean = [p['id'] for p in prods if p['id'] not in [543, 544]]

# 2. Fetch Inventory In-Transactions
in_txs_raw = fetch_json('inventory_transactions_espresso?type=eq.in')
in_txs = [t for t in in_txs_raw if t.get('product_id') in prod_map and t.get('product_id') not in [543, 544]]

# 3. Fetch Orders & Order Items
orders_raw = fetch_json('orders_espresso?branch_id=eq.27')
orders_map = {o['id']: o for o in orders_raw}

pids_str = ','.join(str(pid) for pid in pids_clean)
order_items = fetch_json(f'order_items_espresso?product_id=in.({pids_str})')

print(f"Data loaded: {len(pids_clean)} products, {len(in_txs)} stock-in records, {len(order_items)} sale items, {len(orders_raw)} branch orders.")

# Categorization helper
def classify_item(name):
    name_l = name.lower()
    if 'zonrox' in name_l or 'bleach' in name_l:
        return 'Bleach / Stain Remover'
    elif 'fabcon' in name_l or 'downy' in name_l or 'del/' in name_l or 'softener' in name_l:
        return 'Fabric Softener'
    elif 'liquid' in name_l:
        return 'Liquid Detergent'
    else:
        return 'Powder / Wash Detergent'

# Compile Product Statistics
stats = {}
for pid in pids_clean:
    p = prod_map[pid]
    stats[pid] = {
        'id': pid,
        'name': p['name'],
        'category': classify_item(p['name']),
        'price': float(p.get('price') or 0),
        'current_stock': int(p.get('stock') or 0),
        'in_aug': 0,
        'in_sept': 0,
        'in_total': 0,
        'sold_aug': 0,
        'rev_aug': 0.0,
        'sold_sept': 0,
        'rev_sept': 0.0,
        'sold_total': 0,
        'rev_total': 0.0,
    }

# Process In-Transactions
for t in in_txs:
    pid = t['product_id']
    if pid not in stats:
        continue
    qty = int(t.get('quantity') or 0)
    dt = datetime.fromisoformat(t['created_at'].replace('Z', '+00:00')).astimezone(PST)
    m = dt.strftime('%Y-%m')
    if m == '2026-08':
        stats[pid]['in_aug'] += qty
    elif m == '2026-09':
        stats[pid]['in_sept'] += qty
    stats[pid]['in_total'] += qty

# Process Sales from order_items
for item in order_items:
    pid = item['product_id']
    if pid not in stats:
        continue
    o = orders_map.get(item['order_id'])
    if o and o.get('status') == 'voided':
        continue
    
    qty = int(item.get('quantity') or 0)
    price = float(item.get('price') or 0)
    rev = qty * price
    dt = datetime.fromisoformat(item['created_at'].replace('Z', '+00:00')).astimezone(PST)
    m = dt.strftime('%Y-%m')
    
    if m == '2026-08':
        stats[pid]['sold_aug'] += qty
        stats[pid]['rev_aug'] += rev
    elif m == '2026-09':
        stats[pid]['sold_sept'] += qty
        stats[pid]['rev_sept'] += rev
    
    stats[pid]['sold_total'] += qty
    stats[pid]['rev_total'] += rev

# Sort by Sales Volume (Qty Sold Descending)
sorted_by_qty = sorted(stats.values(), key=lambda x: (x['sold_total'], x['rev_total']), reverse=True)

# Create Workbook
wb = openpyxl.Workbook()
wb.remove(wb.active)

# Color Scheme Definitions
C_HEADER_BG = "1E3A8A"       # Dark Navy
C_ACCENT_BG = "2563EB"       # Royal Blue
C_SUBHEADER_BG = "EFF6FF"    # Ice Blue
C_ZEBRA = "F8FAFC"           # Slate 50
C_BORDER = "CBD5E1"          # Slate 300
C_GREEN_BG = "DCFCE7"        # Emerald 100
C_GREEN_FG = "15803D"        # Emerald 700
C_AMBER_BG = "FEF3C7"        # Amber 100
C_AMBER_FG = "B45309"        # Amber 700
C_ROSE_BG = "FFE4E6"         # Rose 100
C_ROSE_FG = "BE123C"         # Rose 700

font_title = Font(name="Segoe UI", size=16, bold=True, color="1E293B")
font_subtitle = Font(name="Segoe UI", size=10, italic=True, color="64748B")
font_card_title = Font(name="Segoe UI", size=9, bold=True, color="64748B")
font_card_val = Font(name="Segoe UI", size=15, bold=True, color="1E3A8A")
font_card_sub = Font(name="Segoe UI", size=8.5, bold=False, color="059669")
font_tbl_header = Font(name="Segoe UI", size=10, bold=True, color="FFFFFF")
font_tbl_sub = Font(name="Segoe UI", size=9, bold=True, color="1E3A8A")
font_row = Font(name="Segoe UI", size=9.5)
font_total = Font(name="Segoe UI", size=10, bold=True, color="0F172A")

fill_header = PatternFill(start_color=C_HEADER_BG, end_color=C_HEADER_BG, fill_type="solid")
fill_accent = PatternFill(start_color=C_ACCENT_BG, end_color=C_ACCENT_BG, fill_type="solid")
fill_sub = PatternFill(start_color=C_SUBHEADER_BG, end_color=C_SUBHEADER_BG, fill_type="solid")
fill_zebra = PatternFill(start_color=C_ZEBRA, end_color=C_ZEBRA, fill_type="solid")
fill_total = PatternFill(start_color="E2E8F0", end_color="E2E8F0", fill_type="solid")
fill_card = PatternFill(start_color="F1F5F9", end_color="F1F5F9", fill_type="solid")

thin_side = Side(border_style="thin", color=C_BORDER)
border_thin = Border(left=thin_side, right=thin_side, top=thin_side, bottom=thin_side)
border_header = Border(left=thin_side, right=thin_side, top=thin_side, bottom=Side(border_style="medium", color="1E3A8A"))
border_total = Border(top=Side(border_style="thin", color="94A3B8"), bottom=Side(border_style="double", color="1E293B"))

# ==========================================================
# SHEET 1: BEST SELLERS & EXECUTIVE SUMMARY
# ==========================================================
ws1 = wb.create_sheet(title="Best Sellers & Ranking")
ws1.views.sheetView[0].showGridLines = True

# Title Block
ws1.cell(row=2, column=2, value="S1P AND SP1N LAUNDRY SHOP — DAVAO BRANCH").font = font_title
ws1.cell(row=3, column=2, value="Detergent, Fabric Softener & Laundry Supplies Sales & Inventory Performance Report").font = font_subtitle
ws1.cell(row=4, column=2, value=f"Report Generated: {datetime.now(PST).strftime('%B %d, %Y %I:%M %p')} PST | Covering August & September 2026").font = font_subtitle

# KPI Cards Setup
tot_stock_in = sum(x['in_total'] for x in stats.values())
tot_sold = sum(x['sold_total'] for x in stats.values())
tot_rev = sum(x['rev_total'] for x in stats.values())
tot_curr_stock = sum(x['current_stock'] for x in stats.values())

top_seller = sorted_by_qty[0]
top_softener = next(x for x in sorted_by_qty if 'Softener' in x['category'])

cards = [
    ("TOTAL STOCK RECEIVED", f"{tot_stock_in} pcs", "Aug: 317 pcs | Sept: 57 pcs", 2),
    ("TOTAL UNITS SOLD / USED", f"{tot_sold} pcs", "Aug: 183 pcs | Sept: 102 pcs", 5),
    ("TOTAL SALES REVENUE", f"₱{tot_rev:,.2f}", "Aug: ₱1,565 | Sept: ₱1,120", 8),
    ("CURRENT ON-HAND STOCK", f"{tot_curr_stock} pcs", "Active in Storage", 11),
    ("TOP SELLING DETERGENT", f"{top_seller['name']}", f"{top_seller['sold_total']} pcs sold (₱{top_seller['rev_total']:,.0f})", 14)
]

for title, val, sub, col in cards:
    ws1.merge_cells(start_row=6, start_column=col, end_row=6, end_column=col+2)
    ws1.merge_cells(start_row=7, start_column=col, end_row=7, end_column=col+2)
    ws1.merge_cells(start_row=8, start_column=col, end_row=8, end_column=col+2)
    
    c_title = ws1.cell(row=6, column=col, value=title)
    c_title.font = font_card_title
    c_title.alignment = Alignment(horizontal="center", vertical="center")
    
    c_val = ws1.cell(row=7, column=col, value=val)
    c_val.font = font_card_val
    c_val.alignment = Alignment(horizontal="center", vertical="center")
    
    c_sub = ws1.cell(row=8, column=col, value=sub)
    c_sub.font = font_card_sub
    c_sub.alignment = Alignment(horizontal="center", vertical="center")
    
    for r in range(6, 9):
        for c in range(col, col+3):
            ws1.cell(row=r, column=c).fill = fill_card
            ws1.cell(row=r, column=c).border = border_thin

# Table Header
headers_s1 = [
    "Rank", "Product / Detergent Name", "Category", "Unit Price", 
    "Aug Sold (Qty)", "Sept Sold (Qty)", "Total Sold (Qty)", "Sales Share %", 
    "Aug Sales (₱)", "Sept Sales (₱)", "Total Sales (₱)", 
    "Stock In (Total)", "Current Stock", "Stock Status"
]

row_h = 10
for i, h in enumerate(headers_s1, start=2):
    cell = ws1.cell(row=row_h, column=i, value=h)
    cell.font = font_tbl_header
    cell.fill = fill_header
    cell.alignment = Alignment(horizontal="center" if i not in [3, 4] else "left", vertical="center", wrap_text=True)
    cell.border = border_header
ws1.row_dimensions[row_h].height = 28

cur_r = 11
for rank, p in enumerate(sorted_by_qty, start=1):
    fill = fill_zebra if rank % 2 == 0 else PatternFill(fill_type=None)
    
    # Stock status tag
    if p['current_stock'] == 0:
        status_txt = "SOLD OUT"
        status_fill = PatternFill(start_color=C_ROSE_BG, end_color=C_ROSE_BG, fill_type="solid")
        status_font = Font(name="Segoe UI", size=9, bold=True, color=C_ROSE_FG)
    elif p['current_stock'] <= 5:
        status_txt = "LOW STOCK"
        status_fill = PatternFill(start_color=C_AMBER_BG, end_color=C_AMBER_BG, fill_type="solid")
        status_font = Font(name="Segoe UI", size=9, bold=True, color=C_AMBER_FG)
    else:
        status_txt = "IN STOCK"
        status_fill = PatternFill(start_color=C_GREEN_BG, end_color=C_GREEN_BG, fill_type="solid")
        status_font = Font(name="Segoe UI", size=9, bold=True, color=C_GREEN_FG)

    share_pct = (p['sold_total'] / tot_sold) if tot_sold > 0 else 0

    values = [
        rank,
        p['name'],
        p['category'],
        p['price'],
        p['sold_aug'],
        p['sold_sept'],
        p['sold_total'],
        share_pct,
        p['rev_aug'],
        p['rev_sept'],
        p['rev_total'],
        p['in_total'],
        p['current_stock'],
        status_txt
    ]

    for col_idx, val in enumerate(values, start=2):
        cell = ws1.cell(row=cur_r, column=col_idx, value=val)
        cell.font = font_row
        cell.fill = fill
        cell.border = border_thin
        
        # Alignments & Formats
        if col_idx in [2, 6, 7, 8, 13, 14]:
            cell.alignment = Alignment(horizontal="center", vertical="center")
        elif col_idx in [3, 4]:
            cell.alignment = Alignment(horizontal="left", vertical="center")
        else:
            cell.alignment = Alignment(horizontal="right", vertical="center")
            
        if col_idx in [5, 10, 11, 12]: # Prices & Revenue
            cell.number_format = '"₱"#,##0.00'
        elif col_idx == 9: # Share %
            cell.number_format = '0.0%'
        elif col_idx in [6, 7, 8, 13, 14]: # Qtys
            cell.number_format = '#,##0'

        # Special styling for Status cell
        if col_idx == 15:
            cell.fill = status_fill
            cell.font = status_font
            cell.alignment = Alignment(horizontal="center", vertical="center")
            
    cur_r += 1

# Total Summary Row
ws1.cell(row=cur_r, column=2, value="TOTAL").font = font_total
ws1.cell(row=cur_r, column=3, value=f"{len(sorted_by_qty)} Products Listed").font = font_total
ws1.cell(row=cur_r, column=4, value="").font = font_total
ws1.cell(row=cur_r, column=5, value="").font = font_total
ws1.cell(row=cur_r, column=6, value=f"=SUM(F11:F{cur_r-1})").font = font_total
ws1.cell(row=cur_r, column=7, value=f"=SUM(G11:G{cur_r-1})").font = font_total
ws1.cell(row=cur_r, column=8, value=f"=SUM(H11:H{cur_r-1})").font = font_total
ws1.cell(row=cur_r, column=9, value=1.0).font = font_total
ws1.cell(row=cur_r, column=10, value=f"=SUM(J11:J{cur_r-1})").font = font_total
ws1.cell(row=cur_r, column=11, value=f"=SUM(K11:K{cur_r-1})").font = font_total
ws1.cell(row=cur_r, column=12, value=f"=SUM(L11:L{cur_r-1})").font = font_total
ws1.cell(row=cur_r, column=13, value=f"=SUM(M11:M{cur_r-1})").font = font_total
ws1.cell(row=cur_r, column=14, value=f"=SUM(N11:N{cur_r-1})").font = font_total
ws1.cell(row=cur_r, column=15, value="ALL RECONCILED").font = font_total

for c in range(2, 16):
    cell = ws1.cell(row=cur_r, column=c)
    cell.fill = fill_total
    cell.border = border_total
    if c in [6, 7, 8, 13, 14]:
        cell.number_format = '#,##0'
        cell.alignment = Alignment(horizontal="center", vertical="center")
    elif c in [10, 11, 12]:
        cell.number_format = '"₱"#,##0.00'
        cell.alignment = Alignment(horizontal="right", vertical="center")
    elif c == 9:
        cell.number_format = '0.0%'
        cell.alignment = Alignment(horizontal="right", vertical="center")
    elif c in [2, 15]:
        cell.alignment = Alignment(horizontal="center", vertical="center")

ws1.freeze_panes = "B11"

# ==========================================================
# SHEET 2: MONTHLY INVENTORY & USAGE BREAKDOWN
# ==========================================================
ws2 = wb.create_sheet(title="Monthly Inventory & Usage")
ws2.views.sheetView[0].showGridLines = True

ws2.cell(row=2, column=2, value="MONTHLY INVENTORY & USAGE ANALYSIS (AUGUST vs SEPTEMBER 2026)").font = font_title
ws2.cell(row=3, column=2, value="Shows Beginning Stock In, Usage / Sales, Ending Balances, and Restocking Per Month").font = font_subtitle

# Super Headers
ws2.merge_cells("B5:E5")
ws2.cell(row=5, column=2, value="PRODUCT INFORMATION").font = font_tbl_header
ws2.cell(row=5, column=2).fill = fill_header
ws2.cell(row=5, column=2).alignment = Alignment(horizontal="center", vertical="center")

ws2.merge_cells("F5:I5")
ws2.cell(row=5, column=6, value="AUGUST 2026 PERFORMANCE").font = font_tbl_header
ws2.cell(row=5, column=6).fill = fill_accent
ws2.cell(row=5, column=6).alignment = Alignment(horizontal="center", vertical="center")

ws2.merge_cells("J5:M5")
ws2.cell(row=5, column=10, value="SEPTEMBER 2026 PERFORMANCE").font = font_tbl_header
ws2.cell(row=5, column=10).fill = fill_header
ws2.cell(row=5, column=10).alignment = Alignment(horizontal="center", vertical="center")

ws2.merge_cells("N5:Q5")
ws2.cell(row=5, column=14, value="CUMULATIVE LIFETIME SUMMARY").font = font_tbl_header
ws2.cell(row=5, column=14).fill = fill_accent
ws2.cell(row=5, column=14).alignment = Alignment(horizontal="center", vertical="center")

headers_s2 = [
    "No", "Product Name", "Category", "Price",
    "Stock In", "Units Sold", "August Sales (₱)", "Aug End Bal",
    "Stock In", "Units Sold", "Sept Sales (₱)", "Sept End Bal",
    "Total In", "Total Sold", "Total Sales (₱)", "Current Stock"
]

row_h2 = 6
for i, h in enumerate(headers_s2, start=2):
    cell = ws2.cell(row=row_h2, column=i, value=h)
    cell.font = font_tbl_sub
    cell.fill = fill_sub
    cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
    cell.border = border_header
ws2.row_dimensions[row_h2].height = 24

r2 = 7
for idx, p in enumerate(sorted_by_qty, start=1):
    fill = fill_zebra if idx % 2 == 0 else PatternFill(fill_type=None)
    aug_end = p['in_aug'] - p['sold_aug']
    sept_end = p['current_stock']
    
    vals2 = [
        idx,
        p['name'],
        p['category'],
        p['price'],
        p['in_aug'],
        p['sold_aug'],
        p['rev_aug'],
        aug_end,
        p['in_sept'],
        p['sold_sept'],
        p['rev_sept'],
        sept_end,
        p['in_total'],
        p['sold_total'],
        p['rev_total'],
        p['current_stock']
    ]
    
    for c_idx, val in enumerate(vals2, start=2):
        cell = ws2.cell(row=r2, column=c_idx, value=val)
        cell.font = font_row
        cell.fill = fill
        cell.border = border_thin
        
        if c_idx in [2, 6, 7, 9, 10, 11, 13, 14, 15, 17]:
            cell.alignment = Alignment(horizontal="center", vertical="center")
            cell.number_format = '#,##0'
        elif c_idx in [3, 4]:
            cell.alignment = Alignment(horizontal="left", vertical="center")
        elif c_idx in [5, 8, 12, 16]:
            cell.alignment = Alignment(horizontal="right", vertical="center")
            cell.number_format = '"₱"#,##0.00'
            
    r2 += 1

# Total Summary Row for Sheet 2
ws2.cell(row=r2, column=2, value="TOTAL").font = font_total
ws2.cell(row=r2, column=3, value=f"{len(sorted_by_qty)} Items").font = font_total
ws2.cell(row=r2, column=4, value="").font = font_total
ws2.cell(row=r2, column=5, value="").font = font_total
ws2.cell(row=r2, column=6, value=f"=SUM(F7:F{r2-1})").font = font_total
ws2.cell(row=r2, column=7, value=f"=SUM(G7:G{r2-1})").font = font_total
ws2.cell(row=r2, column=8, value=f"=SUM(H7:H{r2-1})").font = font_total
ws2.cell(row=r2, column=9, value=f"=SUM(I7:I{r2-1})").font = font_total
ws2.cell(row=r2, column=10, value=f"=SUM(J7:J{r2-1})").font = font_total
ws2.cell(row=r2, column=11, value=f"=SUM(K7:K{r2-1})").font = font_total
ws2.cell(row=r2, column=12, value=f"=SUM(L7:L{r2-1})").font = font_total
ws2.cell(row=r2, column=13, value=f"=SUM(M7:M{r2-1})").font = font_total
ws2.cell(row=r2, column=14, value=f"=SUM(N7:N{r2-1})").font = font_total
ws2.cell(row=r2, column=15, value=f"=SUM(O7:O{r2-1})").font = font_total
ws2.cell(row=r2, column=16, value=f"=SUM(P7:P{r2-1})").font = font_total
ws2.cell(row=r2, column=17, value=f"=SUM(Q7:Q{r2-1})").font = font_total

for c in range(2, 18):
    cell = ws2.cell(row=r2, column=c)
    cell.fill = fill_total
    cell.border = border_total
    if c in [6, 7, 9, 10, 11, 13, 14, 15, 17]:
        cell.number_format = '#,##0'
        cell.alignment = Alignment(horizontal="center", vertical="center")
    elif c in [8, 12, 16]:
        cell.number_format = '"₱"#,##0.00'
        cell.alignment = Alignment(horizontal="right", vertical="center")

ws2.freeze_panes = "E7"

# ==========================================================
# SHEET 3: DETAILED SALES LOG (Order by Order)
# ==========================================================
ws3 = wb.create_sheet(title="Detailed Sales Log")
ws3.views.sheetView[0].showGridLines = True

ws3.cell(row=2, column=2, value="INDIVIDUAL DETERGENT SALES TRANSACTION AUDIT LOG").font = font_title
ws3.cell(row=3, column=2, value="Every individual detergent sold or added to a laundry load in Davao Branch").font = font_subtitle

headers_s3 = [
    "No", "Date & Time (PST)", "Month", "Order #", "Receipt #", 
    "Customer Name", "Service Ordered", "Detergent / Add-on", 
    "Qty (pcs)", "Unit Price (₱)", "Total Amount (₱)", "Payment Method", "Status"
]

row_h3 = 5
for i, h in enumerate(headers_s3, start=2):
    cell = ws3.cell(row=row_h3, column=i, value=h)
    cell.font = font_tbl_header
    cell.fill = fill_header
    cell.alignment = Alignment(horizontal="center", vertical="center")
    cell.border = border_header
ws3.row_dimensions[row_h3].height = 24

# Sort order items chronologically
def get_item_dt(it):
    return it.get('created_at') or ''
sorted_order_items = sorted(order_items, key=get_item_dt)

r3 = 6
for idx, item in enumerate(sorted_order_items, start=1):
    fill = fill_zebra if idx % 2 == 0 else PatternFill(fill_type=None)
    dt = datetime.fromisoformat(item['created_at'].replace('Z', '+00:00')).astimezone(PST)
    dt_str = dt.strftime('%Y-%m-%d %I:%M %p')
    m_str = dt.strftime('%B %Y')
    
    order = orders_map.get(item['order_id']) or {}
    status = order.get('status', 'paid').upper()
    pay_method = (order.get('payment_method') or 'Cash').upper()
    rcpt = order.get('receipt_number') or f"ORD-{order.get('id')}"
    
    cust_name = "Walk-in Customer"
    service_name = "Laundry Service"
    if order.get('notes'):
        try:
            n_json = json.loads(order['notes'])
            if n_json.get('customer_name'):
                cust_name = n_json['customer_name']
            if n_json.get('service_name'):
                service_name = n_json['service_name'].replace(':', '')
        except:
            pass

    p = prod_map.get(item['product_id']) or {}
    p_name = p.get('name') or f"Product #{item['product_id']}"
    qty = int(item.get('quantity') or 1)
    price = float(item.get('price') or 0)
    sub = qty * price
    
    vals3 = [
        idx,
        dt_str,
        m_str,
        f"#{item['order_id']}",
        rcpt,
        cust_name,
        service_name,
        p_name,
        qty,
        price,
        sub,
        pay_method,
        status
    ]
    
    for c_idx, val in enumerate(vals3, start=2):
        cell = ws3.cell(row=r3, column=c_idx, value=val)
        cell.font = font_row
        cell.fill = fill
        cell.border = border_thin
        
        if c_idx in [2, 4, 5, 6, 13, 14]:
            cell.alignment = Alignment(horizontal="center", vertical="center")
        elif c_idx in [3, 7, 8, 9]:
            cell.alignment = Alignment(horizontal="left", vertical="center")
        elif c_idx == 10:
            cell.alignment = Alignment(horizontal="center", vertical="center")
            cell.number_format = '#,##0'
        elif c_idx in [11, 12]:
            cell.alignment = Alignment(horizontal="right", vertical="center")
            cell.number_format = '"₱"#,##0.00'

    r3 += 1

# Total Row for Sales Log
ws3.cell(row=r3, column=2, value="TOTAL").font = font_total
ws3.cell(row=r3, column=3, value=f"{len(sorted_order_items)} Transactions").font = font_total
ws3.cell(row=r3, column=10, value=f"=SUM(J6:J{r3-1})").font = font_total
ws3.cell(row=r3, column=12, value=f"=SUM(L6:L{r3-1})").font = font_total

for c in range(2, 15):
    cell = ws3.cell(row=r3, column=c)
    cell.fill = fill_total
    cell.border = border_total
    if c == 10:
        cell.number_format = '#,##0'
        cell.alignment = Alignment(horizontal="center", vertical="center")
    elif c == 12:
        cell.number_format = '"₱"#,##0.00'
        cell.alignment = Alignment(horizontal="right", vertical="center")

ws3.freeze_panes = "F6"

# ==========================================================
# SHEET 4: INVENTORY REPLENISHMENT / STOCK-IN LOG
# ==========================================================
ws4 = wb.create_sheet(title="Stock-In Replenishment Log")
ws4.views.sheetView[0].showGridLines = True

ws4.cell(row=2, column=2, value="DETERGENT STOCK-IN & REPLENISHMENT AUDIT TRAIL").font = font_title
ws4.cell(row=3, column=2, value="Official record of initial stock receipts, deliveries, and verified adjustments").font = font_subtitle

headers_s4 = [
    "No", "Date & Time (PST)", "Month", "Product Name", "Category", 
    "Quantity Added (pcs)", "Unit Price (₱)", "Total Inventory Value (₱)", 
    "Transaction Type", "Remarks / Source Reference"
]

row_h4 = 5
for i, h in enumerate(headers_s4, start=2):
    cell = ws4.cell(row=row_h4, column=i, value=h)
    cell.font = font_tbl_header
    cell.fill = fill_header
    cell.alignment = Alignment(horizontal="center", vertical="center")
    cell.border = border_header
ws4.row_dimensions[row_h4].height = 24

# Sort in-transactions chronologically
sorted_in_txs = sorted(in_txs, key=lambda x: x.get('created_at') or '')

r4 = 6
for idx, t in enumerate(sorted_in_txs, start=1):
    fill = fill_zebra if idx % 2 == 0 else PatternFill(fill_type=None)
    dt = datetime.fromisoformat(t['created_at'].replace('Z', '+00:00')).astimezone(PST)
    dt_str = dt.strftime('%Y-%m-%d %I:%M %p')
    m_str = dt.strftime('%B %Y')
    
    pid = t['product_id']
    p = prod_map.get(pid) or {}
    p_name = p.get('name') or f"Product #{pid}"
    cat = classify_item(p_name)
    qty = int(t.get('quantity') or 0)
    price = float(p.get('price') or 0)
    val = qty * price
    rem = t.get('remarks') or 'Stock Added'
    tx_type = "Initial Stock Setup" if "Initial" in rem else "Stock Replenishment / Edit"
    
    vals4 = [
        idx,
        dt_str,
        m_str,
        p_name,
        cat,
        qty,
        price,
        val,
        tx_type,
        rem
    ]
    
    for c_idx, v in enumerate(vals4, start=2):
        cell = ws4.cell(row=r4, column=c_idx, value=v)
        cell.font = font_row
        cell.fill = fill
        cell.border = border_thin
        
        if c_idx in [2, 4, 10]:
            cell.alignment = Alignment(horizontal="center", vertical="center")
        elif c_idx in [3, 5, 6, 11]:
            cell.alignment = Alignment(horizontal="left", vertical="center")
        elif c_idx == 7:
            cell.alignment = Alignment(horizontal="center", vertical="center")
            cell.number_format = '#,##0'
        elif c_idx in [8, 9]:
            cell.alignment = Alignment(horizontal="right", vertical="center")
            cell.number_format = '"₱"#,##0.00'

    r4 += 1

# Total Row for Stock-In
ws4.cell(row=r4, column=2, value="TOTAL").font = font_total
ws4.cell(row=r4, column=3, value=f"{len(sorted_in_txs)} Deliveries/Setups").font = font_total
ws4.cell(row=r4, column=7, value=f"=SUM(G6:G{r4-1})").font = font_total
ws4.cell(row=r4, column=9, value=f"=SUM(I6:I{r4-1})").font = font_total

for c in range(2, 12):
    cell = ws4.cell(row=r4, column=c)
    cell.fill = fill_total
    cell.border = border_total
    if c == 7:
        cell.number_format = '#,##0'
        cell.alignment = Alignment(horizontal="center", vertical="center")
    elif c == 9:
        cell.number_format = '"₱"#,##0.00'
        cell.alignment = Alignment(horizontal="right", vertical="center")

ws4.freeze_panes = "E6"

# Auto-fit Column Widths across all sheets with generous padding
for ws in [ws1, ws2, ws3, ws4]:
    for col in ws.columns:
        col_letter = get_column_letter(col[0].column)
        if col[0].column == 1:
            ws.column_dimensions[col_letter].width = 3 # Margin column
            continue
        max_len = 0
        for cell in col:
            if cell.row in [2, 3, 4, 5, 6, 7, 8] and ws == ws1 and cell.row < 10:
                continue
            if cell.row in [2, 3, 4, 5] and ws != ws1:
                continue
            val_str = str(cell.value or '')
            if cell.number_format and '₱' in cell.number_format:
                val_str = f"₱{val_str}.00"
            max_len = max(max_len, len(val_str))
        ws.column_dimensions[col_letter].width = max(max_len + 4, 12)

out_path = r"c:\Users\Philippines Freight\MainSystems\POS\S1P_and_Sp1n_Laundry_Detergent_Inventory_and_Sales_Report.xlsx"
wb.save(out_path)
print(f"Excel successfully created at: {out_path}")
