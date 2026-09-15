"""
Generate a beautiful, responsive, printable HTML count sheet for Espresso Yourself.
"""

import os
import json
import sys
from datetime import datetime

# Import CATEGORIES_DATA from generate_espresso_inventory_excel
sys.path.append(r"c:\Users\Philippines Freight\MainSystems\POS\recordsExcel")
from generate_espresso_inventory_excel import CATEGORIES_DATA

html_output_path = r"c:\Users\Philippines Freight\MainSystems\POS\recordsExcel\Espresso_Inventory_Count_Sheet_Printable.html"
workspace_copy_path = r"c:\Users\Philippines Freight\MainSystems\POS\Espresso_Inventory_Sheet_Printable.html"

# Pre-calculate counts
total_items = sum(len(c["items"]) for c in CATEGORIES_DATA)
total_categories = len(CATEGORIES_DATA)

# Generate HTML
html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Espresso Yourself - Physical Inventory Count Sheet</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {{
      --primary: #2B1704;
      --primary-light: #4A2E18;
      --accent: #C68B59;
      --accent-hover: #B57948;
      --bg-cream: #FAF7F2;
      --card-bg: #FFFFFF;
      --border-color: #E6DFD5;
      --text-main: #231F20;
      --text-muted: #6E6259;
      --highlight-input: #FFFDE7;
      --success-bg: #E6F4EA;
      --success-text: #137333;
      --danger-bg: #FCE8E6;
      --danger-text: #C5221F;
      --info-bg: #E8F0FE;
      --info-text: #1967D2;
    }}

    * {{
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }}

    body {{
      font-family: 'Plus Jakarta Sans', sans-serif;
      background-color: var(--bg-cream);
      color: var(--text-main);
      line-height: 1.4;
      padding: 24px;
    }}

    .container {{
      max-width: 1400px;
      margin: 0 auto;
      background: #FFFFFF;
      border-radius: 16px;
      box-shadow: 0 10px 30px rgba(43, 23, 4, 0.08);
      padding: 32px;
      border: 1px solid var(--border-color);
    }}

    /* Header Banner */
    .header-banner {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 24px;
      border-bottom: 2px solid var(--border-color);
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;
    }}

    .brand-title {{
      display: flex;
      align-items: center;
      gap: 14px;
    }}

    .brand-icon {{
      font-size: 36px;
      background: #F4ECE1;
      width: 60px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 14px;
      border: 1px solid var(--accent);
    }}

    .brand-title h1 {{
      font-family: 'Outfit', sans-serif;
      font-size: 26px;
      font-weight: 800;
      color: var(--primary);
      letter-spacing: -0.5px;
    }}

    .brand-title p {{
      color: var(--text-muted);
      font-size: 13px;
      font-weight: 500;
    }}

    .action-bar {{
      display: flex;
      gap: 12px;
    }}

    .btn {{
      padding: 10px 18px;
      border-radius: 10px;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s ease;
      text-decoration: none;
      border: none;
    }}

    .btn-primary {{
      background: var(--primary);
      color: #FFFFFF;
    }}

    .btn-primary:hover {{
      background: var(--primary-light);
      transform: translateY(-1px);
    }}

    .btn-accent {{
      background: var(--accent);
      color: #FFFFFF;
    }}

    .btn-accent:hover {{
      background: var(--accent-hover);
      transform: translateY(-1px);
    }}

    .btn-outline {{
      background: #FFFFFF;
      border: 1px solid var(--border-color);
      color: var(--text-main);
    }}

    .btn-outline:hover {{
      background: #F8F5F0;
    }}

    /* Meta Info Grid */
    .meta-grid {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 14px;
      background: #FAF7F2;
      padding: 18px;
      border-radius: 12px;
      border: 1px solid var(--border-color);
      margin-bottom: 24px;
    }}

    .meta-item {{
      display: flex;
      flex-direction: column;
    }}

    .meta-label {{
      font-size: 11px;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }}

    .meta-value {{
      font-size: 14px;
      font-weight: 600;
      color: var(--text-main);
    }}

    .meta-input {{
      border: 1px solid #D5CCC0;
      border-radius: 6px;
      padding: 6px 10px;
      font-size: 13px;
      font-family: inherit;
      background: #FFFFFF;
      width: 100%;
    }}

    /* KPI Summary Cards */
    .kpi-row {{
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 14px;
      margin-bottom: 28px;
    }}

    .kpi-card {{
      background: #FFFFFF;
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 16px 18px;
      display: flex;
      align-items: center;
      gap: 14px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.02);
    }}

    .kpi-card.blue {{ border-left: 4px solid #1967D2; background: #F8FAFD; }}
    .kpi-card.green {{ border-left: 4px solid #137333; background: #F8FCF9; }}
    .kpi-card.amber {{ border-left: 4px solid #D48806; background: #FEFAF2; }}
    .kpi-card.purple {{ border-left: 4px solid #684E3A; background: #FAF7F5; }}

    .kpi-icon {{
      font-size: 24px;
    }}

    .kpi-content h4 {{
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--text-muted);
      font-weight: 700;
    }}

    .kpi-content .kpi-num {{
      font-family: 'Outfit', sans-serif;
      font-size: 22px;
      font-weight: 700;
      color: var(--primary);
      margin-top: 2px;
    }}

    /* Category Navigation Pills */
    .cat-nav {{
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 24px;
    }}

    .cat-pill {{
      background: #F4EFEA;
      color: var(--text-main);
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s ease;
      border: 1px solid var(--border-color);
    }}

    .cat-pill:hover {{
      background: var(--primary);
      color: #FFFFFF;
      border-color: var(--primary);
    }}

    /* Table Styles */
    .table-section {{
      margin-bottom: 36px;
    }}

    .section-header {{
      background: var(--primary);
      color: #FFFFFF;
      padding: 12px 18px;
      border-radius: 10px 10px 0 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-family: 'Outfit', sans-serif;
      font-weight: 700;
      font-size: 15px;
      letter-spacing: 0.3px;
    }}

    .section-count {{
      font-size: 12px;
      background: rgba(255,255,255,0.2);
      padding: 3px 10px;
      border-radius: 12px;
      font-weight: 500;
    }}

    .inventory-table {{
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      border: 1px solid var(--border-color);
      border-top: none;
      background: #FFFFFF;
    }}

    .inventory-table th {{
      background: #2E1C11;
      color: #FFFFFF;
      font-weight: 700;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 10px 12px;
      text-align: left;
      border: 1px solid #432E22;
    }}

    .inventory-table th.center, .inventory-table td.center {{
      text-align: center;
    }}

    .inventory-table th.right, .inventory-table td.right {{
      text-align: right;
    }}

    .inventory-table th.input-th {{
      background: #D48806;
      color: #FFFFFF;
      text-align: center;
      border-color: #B57404;
    }}

    .inventory-table td {{
      padding: 9px 12px;
      border: 1px solid var(--border-color);
      vertical-align: middle;
    }}

    .inventory-table tr:nth-child(even) {{
      background-color: #FCFBF9;
    }}

    .inventory-table tr:hover {{
      background-color: #F8F4EE;
    }}

    .sku-code {{
      font-family: monospace;
      font-size: 11px;
      color: #777;
      font-weight: 600;
    }}

    .item-name {{
      font-weight: 600;
      color: var(--primary);
    }}

    .item-notes {{
      font-size: 11px;
      color: var(--text-muted);
      margin-top: 2px;
      font-style: italic;
    }}

    .uom-badge {{
      background: #F0EAE1;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
      color: #554433;
    }}

    .input-cell {{
      background-color: var(--highlight-input) !important;
      text-align: center;
      padding: 4px 6px;
      border: 2px solid #E0B070 !important;
    }}

    .count-input {{
      width: 100%;
      padding: 6px 8px;
      border: 1px solid #D4A373;
      border-radius: 6px;
      text-align: center;
      font-weight: 700;
      font-size: 14px;
      color: #7A3E00;
      background: #FFFFFF;
      outline: none;
      font-family: inherit;
    }}

    .count-input:focus {{
      border-color: #D48806;
      box-shadow: 0 0 0 3px rgba(212, 136, 6, 0.2);
    }}

    .status-badge {{
      display: inline-block;
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 700;
    }}

    .status-pending {{
      background: #F0EDE8;
      color: #776C63;
    }}

    .status-match {{
      background: var(--success-bg);
      color: var(--success-text);
    }}

    .status-shortage {{
      background: var(--danger-bg);
      color: var(--danger-text);
    }}

    .status-surplus {{
      background: var(--info-bg);
      color: var(--info-text);
    }}

    .variance-val {{
      font-weight: 700;
    }}

    .variance-neg {{
      color: var(--danger-text);
    }}

    .variance-pos {{
      color: var(--info-text);
    }}

    .variance-zero {{
      color: var(--success-text);
    }}

    /* Subtotal Row */
    .subtotal-row td {{
      background: #F5EFE9 !important;
      font-weight: 700;
      color: var(--primary);
      border-top: 2px solid #C68B59;
      border-bottom: 2px solid #C68B59;
    }}

    /* Sign-off section */
    .signoff-section {{
      margin-top: 40px;
      padding-top: 24px;
      border-top: 2px solid var(--border-color);
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 24px;
    }}

    .sign-box {{
      border: 1px dashed #C68B59;
      border-radius: 10px;
      padding: 16px;
      background: #FAF7F2;
    }}

    .sign-box h5 {{
      font-size: 12px;
      color: var(--primary);
      text-transform: uppercase;
      font-weight: 700;
      margin-bottom: 12px;
    }}

    .sign-line {{
      border-bottom: 1px solid #B0A294;
      margin-top: 36px;
      margin-bottom: 6px;
    }}

    .sign-desc {{
      font-size: 11px;
      color: var(--text-muted);
      display: flex;
      justify-content: space-between;
    }}

    /* PRINT RULES */
    @media print {{
      body {{
        background: #FFFFFF;
        padding: 0;
      }}
      .container {{
        box-shadow: none;
        border: none;
        padding: 0;
        max-width: 100%;
      }}
      .action-bar, .cat-nav, .no-print {{
        display: none !important;
      }}
      .table-section {{
        page-break-inside: avoid;
        margin-bottom: 20px;
      }}
      .inventory-table th {{
        background: #333 !important;
        color: #fff !important;
        -webkit-print-color-adjust: exact;
      }}
      .section-header {{
        background: #444 !important;
        color: #fff !important;
        -webkit-print-color-adjust: exact;
      }}
      .count-input {{
        border: 1px solid #999;
        height: 24px;
      }}
    }}
  </style>
</head>
<body>

<div class="container">
  <!-- Header Banner -->
  <div class="header-banner">
    <div class="brand-title">
      <div class="brand-icon">☕</div>
      <div>
        <h1>ESPRESSO YOURSELF & TEA HOUSE</h1>
        <p>Physical Inventory Audit Sheet & Count Template &bull; Branch #30 (Cebu City)</p>
      </div>
    </div>
    <div class="action-bar no-print">
      <button class="btn btn-outline" onclick="window.location.reload()">🔄 Reset</button>
      <button class="btn btn-accent" onclick="exportData()">💾 Export to CSV</button>
      <button class="btn btn-primary" onclick="window.print()">🖨️ Print Count Sheet</button>
    </div>
  </div>

  <!-- Metadata Grid -->
  <div class="meta-grid">
    <div class="meta-item">
      <span class="meta-label">Audit Date</span>
      <input type="text" class="meta-input" id="auditDate" value="{datetime.now().strftime('%B %d, %Y')}">
    </div>
    <div class="meta-item">
      <span class="meta-label">Audit Shift</span>
      <select class="meta-input" id="auditShift">
        <option value="Morning Shift (Opening)">Morning Shift (Opening)</option>
        <option value="Mid-Day Shift">Mid-Day Shift</option>
        <option value="Closing Shift (Full Day)" selected>Closing Shift (Full Day)</option>
      </select>
    </div>
    <div class="meta-item">
      <span class="meta-label">Counted By (Barista)</span>
      <input type="text" class="meta-input" id="countedBy" placeholder="Enter Barista Name">
    </div>
    <div class="meta-item">
      <span class="meta-label">Verified By (Manager)</span>
      <input type="text" class="meta-input" id="verifiedBy" placeholder="Supervisor / Manager Name">
    </div>
  </div>

  <!-- KPI Cards -->
  <div class="kpi-row">
    <div class="kpi-card blue">
      <div class="kpi-icon">📦</div>
      <div class="kpi-content">
        <h4>Total SKUs to Count</h4>
        <div class="kpi-num" id="totalSkuCount">{total_items}</div>
      </div>
    </div>
    <div class="kpi-card green">
      <div class="kpi-icon">✍️</div>
      <div class="kpi-content">
        <h4>Items Counted</h4>
        <div class="kpi-num" id="itemsCounted">0 / {total_items}</div>
      </div>
    </div>
    <div class="kpi-card amber">
      <div class="kpi-icon">⚠️</div>
      <div class="kpi-content">
        <h4>Discrepancies Flagged</h4>
        <div class="kpi-num" id="discrepancyCount">0</div>
      </div>
    </div>
    <div class="kpi-card purple">
      <div class="kpi-icon">💰</div>
      <div class="kpi-content">
        <h4>Audited Stock Value</h4>
        <div class="kpi-num" id="totalAuditedValue">₱0.00</div>
      </div>
    </div>
  </div>

  <!-- Category Nav Pills -->
  <div class="cat-nav no-print">
"""

for cat in CATEGORIES_DATA:
    cat_id = cat["cat_id"]
    cat_name = cat["cat_name"]
    icon = cat.get("icon", "📂")
    html_content += f'    <a href="#cat-{cat_id}" class="cat-pill">{icon} {cat_name.split(". ")[-1]}</a>\n'

html_content += """  </div>

  <!-- INVENTORY TABLES BY CATEGORY -->
  <div id="inventoryContainer">
"""

item_row_counter = 0

for cat in CATEGORIES_DATA:
    cat_id = cat["cat_id"]
    cat_name = cat["cat_name"]
    icon = cat.get("icon", "📂")
    color = cat.get("header_fill", "2B1704")
    items = cat["items"]

    html_content += f"""
    <!-- Category {cat_id} -->
    <div class="table-section" id="cat-{cat_id}">
      <div class="section-header" style="background: #{color};">
        <span>{icon} {cat_name.upper()}</span>
        <span class="section-count">{len(items)} Items</span>
      </div>
      <table class="inventory-table">
        <thead>
          <tr>
            <th style="width: 100px;">SKU</th>
            <th>Item Description & Specifications</th>
            <th class="center" style="width: 110px;">UOM</th>
            <th class="right" style="width: 110px;">Unit Cost</th>
            <th class="right" style="width: 110px;">Sys Stock</th>
            <th class="input-th" style="width: 140px;">★ PHYSICAL COUNT ★</th>
            <th class="right" style="width: 110px;">Variance</th>
            <th class="right" style="width: 120px;">Var. Value (₱)</th>
            <th class="center" style="width: 120px;">Status</th>
            <th style="width: 200px;">Remarks / Notes</th>
          </tr>
        </thead>
        <tbody>
"""

    for item in items:
        item_row_counter += 1
        sku = item["sku"]
        name = item["name"]
        unit = item["unit"]
        cost = item["cost"]
        stock = item["stock"]
        notes = item.get("notes", "")

        html_content += f"""
          <tr id="row-{item_row_counter}" data-cost="{cost}" data-stock="{stock}" data-sku="{sku}" data-name="{name}">
            <td><span class="sku-code">{sku}</span></td>
            <td>
              <div class="item-name">{name}</div>
              <div class="item-notes">{notes}</div>
            </td>
            <td class="center"><span class="uom-badge">{unit}</span></td>
            <td class="right">₱{cost:,.2f}</td>
            <td class="right" id="stock-{item_row_counter}">{stock:,.2f}</td>
            <td class="input-cell">
              <input type="number" step="any" min="0" class="count-input" id="input-{item_row_counter}" 
                     placeholder="Enter Qty" oninput="calculateRow({item_row_counter})">
            </td>
            <td class="right variance-val" id="variance-{item_row_counter}">—</td>
            <td class="right variance-val" id="varval-{item_row_counter}">—</td>
            <td class="center" id="status-{item_row_counter}">
              <span class="status-badge status-pending">⏳ Pending</span>
            </td>
            <td>
              <input type="text" class="meta-input" id="remark-{item_row_counter}" placeholder="Notes/Expiry...">
            </td>
          </tr>
"""

    html_content += f"""
        </tbody>
      </table>
    </div>
"""

html_content += f"""
  </div>

  <!-- Sign-off Section -->
  <div class="signoff-section">
    <div class="sign-box">
      <h5>1. Performed By (Barista)</h5>
      <p style="font-size: 12px; color: #555;">I certify that all physical inventory counts listed above were accurately counted on the store floor.</p>
      <div class="sign-line"></div>
      <div class="sign-desc">
        <span>Barista Signature</span>
        <span>Date & Time</span>
      </div>
    </div>
    <div class="sign-box">
      <h5>2. Audited & Verified By (Store Supervisor)</h5>
      <p style="font-size: 12px; color: #555;">I have reviewed any variance shortages/surpluses and verified the high-value ingredients.</p>
      <div class="sign-line"></div>
      <div class="sign-desc">
        <span>Supervisor Signature</span>
        <span>Date & Time</span>
      </div>
    </div>
    <div class="sign-box">
      <h5>3. Final Management Acceptance</h5>
      <p style="font-size: 12px; color: #555;">Inventory count accepted for reconciliation in POS & stock ledger.</p>
      <div class="sign-line"></div>
      <div class="sign-desc">
        <span>Manager / Owner Signature</span>
        <span>Approval Date</span>
      </div>
    </div>
  </div>

</div>

<!-- Interactive JavaScript -->
<script>
  const totalRows = {item_row_counter};

  function calculateRow(rowId) {{
    const tr = document.getElementById('row-' + rowId);
    const cost = parseFloat(tr.getAttribute('data-cost')) || 0;
    const stock = parseFloat(tr.getAttribute('data-stock')) || 0;
    const inputEl = document.getElementById('input-' + rowId);
    const varEl = document.getElementById('variance-' + rowId);
    const varValEl = document.getElementById('varval-' + rowId);
    const statusEl = document.getElementById('status-' + rowId);

    const valStr = inputEl.value.trim();

    if (valStr === '') {{
      varEl.innerText = '—';
      varEl.className = 'right variance-val';
      varValEl.innerText = '—';
      varValEl.className = 'right variance-val';
      statusEl.innerHTML = '<span class="status-badge status-pending">⏳ Pending</span>';
    }} else {{
      const actual = parseFloat(valStr);
      const diff = actual - stock;
      const diffVal = diff * cost;

      if (Math.abs(diff) < 0.001) {{
        varEl.innerText = '0.00';
        varEl.className = 'right variance-val variance-zero';
        varValEl.innerText = '₱0.00';
        varValEl.className = 'right variance-val variance-zero';
        statusEl.innerHTML = '<span class="status-badge status-match">✅ Match</span>';
      }} else if (diff < 0) {{
        varEl.innerText = diff.toFixed(2);
        varEl.className = 'right variance-val variance-neg';
        varValEl.innerText = '-₱' + Math.abs(diffVal).toLocaleString('en-US', {{ minimumFractionDigits: 2, maximumFractionDigits: 2 }});
        varValEl.className = 'right variance-val variance-neg';
        statusEl.innerHTML = '<span class="status-badge status-shortage">⚠️ Shortage</span>';
      }} else {{
        varEl.innerText = '+' + diff.toFixed(2);
        varEl.className = 'right variance-val variance-pos';
        varValEl.innerText = '+₱' + diffVal.toLocaleString('en-US', {{ minimumFractionDigits: 2, maximumFractionDigits: 2 }});
        varValEl.className = 'right variance-val variance-pos';
        statusEl.innerHTML = '<span class="status-badge status-surplus">🔺 Surplus</span>';
      }}
    }}

    updateSummaryKPIs();
  }}

  function updateSummaryKPIs() {{
    let counted = 0;
    let discrepancies = 0;
    let totalAuditedVal = 0;

    for (let i = 1; i <= totalRows; i++) {{
      const tr = document.getElementById('row-' + i);
      const cost = parseFloat(tr.getAttribute('data-cost')) || 0;
      const stock = parseFloat(tr.getAttribute('data-stock')) || 0;
      const inputEl = document.getElementById('input-' + i);
      const valStr = inputEl.value.trim();

      if (valStr !== '') {{
        counted++;
        const actual = parseFloat(valStr);
        totalAuditedVal += (actual * cost);
        if (Math.abs(actual - stock) >= 0.001) {{
          discrepancies++;
        }}
      }}
    }}

    document.getElementById('itemsCounted').innerText = `${{counted}} / ${{totalRows}}`;
    document.getElementById('discrepancyCount').innerText = discrepancies;
    document.getElementById('totalAuditedValue').innerText = '₱' + totalAuditedVal.toLocaleString('en-US', {{ minimumFractionDigits: 2, maximumFractionDigits: 2 }});
  }}

  function exportData() {{
    let csv = "SKU,Item Description,Unit Cost,System Stock,Physical Count,Variance Qty,Variance Value,Status,Remarks\\n";
    for (let i = 1; i <= totalRows; i++) {{
      const tr = document.getElementById('row-' + i);
      const sku = tr.getAttribute('data-sku');
      const name = '"' + tr.getAttribute('data-name') + '"';
      const cost = tr.getAttribute('data-cost');
      const stock = tr.getAttribute('data-stock');
      const count = document.getElementById('input-' + i).value;
      const diffText = document.getElementById('variance-' + i).innerText;
      const diffValText = document.getElementById('varval-' + i).innerText;
      const statusText = document.getElementById('status-' + i).innerText.trim();
      const remark = '"' + (document.getElementById('remark-' + i).value || '') + '"';

      csv += `${{sku}},${{name}},${{cost}},${{stock}},${{count}},${{diffText}},${{diffValText}},${{statusText}},${{remark}}\\n`;
    }}

    const blob = new Blob([csv], {{ type: 'text/csv;charset=utf-8;' }});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Espresso_Inventory_Count_${{new Date().toISOString().slice(0,10)}}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }}
</script>

</body>
</html>
"""

# Write HTML file
with open(html_output_path, "w", encoding="utf-8") as f:
    f.write(html_content)
print(f"[SUCCESS] Saved HTML sheet to: {html_output_path}")

with open(workspace_copy_path, "w", encoding="utf-8") as f:
    f.write(html_content)
print(f"[SUCCESS] Saved workspace HTML copy to: {workspace_copy_path}")
