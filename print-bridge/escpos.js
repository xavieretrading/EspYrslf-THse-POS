// print-bridge/escpos.js
// ESC/POS Command Generator for 80mm Thermal Receipt Printers (POS-80 / POS-80C)

const ESC = 0x1B;
const GS = 0x1D;

export class EscPosBuilder {
  constructor(charWidth = 48) {
    this.charWidth = charWidth; // 48 chars standard for 80mm (Font A)
    this.buffer = [];
  }

  // Initialize printer
  init() {
    this.buffer.push(ESC, 0x40);
    return this;
  }

  // Set alignment: 'left' (0), 'center' (1), 'right' (2)
  align(alignment = 'left') {
    let mode = 0;
    if (alignment === 'center') mode = 1;
    if (alignment === 'right') mode = 2;
    this.buffer.push(ESC, 0x61, mode);
    return this;
  }

  // Bold text
  bold(enable = true) {
    this.buffer.push(ESC, 0x45, enable ? 1 : 0);
    return this;
  }

  // Text size: 'normal', 'double', 'large', 'tall', 'wide'
  size(mode = 'normal') {
    let val = 0x00;
    if (mode === 'large' || mode === 'double') {
      val = 0x11; // 2x width, 2x height
    } else if (mode === 'tall') {
      val = 0x01; // 1x width, 2x height
    } else if (mode === 'wide') {
      val = 0x10; // 2x width, 1x height
    }
    this.buffer.push(GS, 0x21, val);
    return this;
  }

  // Invert colors (white on black)
  invert(enable = true) {
    this.buffer.push(GS, 0x42, enable ? 1 : 0);
    return this;
  }

  // Underline
  underline(enable = true) {
    this.buffer.push(ESC, 0x2D, enable ? 1 : 0);
    return this;
  }

  // Append raw string
  text(str = '') {
    // Encode to ascii / win1252 bytes
    const cleanStr = String(str).replace(/₱/g, 'P');
    const bytes = Buffer.from(cleanStr, 'latin1');
    for (const b of bytes) {
      this.buffer.push(b);
    }
    return this;
  }

  // Line feed
  feed(lines = 1) {
    for (let i = 0; i < lines; i++) {
      this.buffer.push(0x0A);
    }
    return this;
  }

  // Line of text followed by newline
  line(str = '') {
    this.text(str);
    this.buffer.push(0x0A);
    return this;
  }

  // Full-width divider line
  divider(char = '-') {
    this.line(char.repeat(this.charWidth));
    return this;
  }

  // Two columns: Left-aligned and Right-aligned on a single line
  row(left = '', right = '', customWidth = null) {
    const width = customWidth || this.charWidth;
    const cleanLeft = String(left).replace(/₱/g, 'P');
    const cleanRight = String(right).replace(/₱/g, 'P');

    const totalLen = cleanLeft.length + cleanRight.length;
    if (totalLen >= width) {
      // If combined length is too long, print left then right on next line
      this.line(cleanLeft);
      this.line(' '.repeat(Math.max(0, width - cleanRight.length)) + cleanRight);
    } else {
      const spaces = ' '.repeat(width - totalLen);
      this.line(cleanLeft + spaces + cleanRight);
    }
    return this;
  }

  // Item row for 80mm receipts: Qty | Description | Amount
  itemRow(qty, name, amount) {
    const qtyStr = `${qty}x`.padEnd(4, ' ');
    const amtStr = String(amount).replace(/₱/g, 'P').padStart(10, ' ');
    const maxNameWidth = this.charWidth - qtyStr.length - amtStr.length;

    const cleanName = String(name).replace(/₱/g, 'P');

    if (cleanName.length <= maxNameWidth) {
      const paddedName = cleanName.padEnd(maxNameWidth, ' ');
      this.line(`${qtyStr}${paddedName}${amtStr}`);
    } else {
      // Wrap name onto multiple lines
      const firstChunk = cleanName.substring(0, maxNameWidth);
      this.line(`${qtyStr}${firstChunk}${amtStr}`);

      let remaining = cleanName.substring(maxNameWidth).trim();
      while (remaining.length > 0) {
        const nextChunk = remaining.substring(0, maxNameWidth);
        this.line(`    ${nextChunk}`);
        remaining = remaining.substring(maxNameWidth).trim();
      }
    }
    return this;
  }

  // Paper cut
  cut(full = false) {
    this.feed(3);
    this.buffer.push(GS, 0x56, full ? 0 : 1); // 0 = Full cut, 1 = Partial cut
    return this;
  }

  // Kick cash drawer
  cashDrawer() {
    this.buffer.push(ESC, 0x70, 0, 25, 250);
    return this;
  }

  // Return generated binary Buffer
  toBuffer() {
    return Buffer.from(this.buffer);
  }
}

/**
 * Builds a complete 80mm ESC/POS receipt Buffer from an order object
 */
export function buildReceiptEscPos(orderData, branchInfo = {}) {
  const b = new EscPosBuilder(48);

  b.init();

  // Header
  b.align('center');
  b.bold(true).size('tall');
  b.line(branchInfo.name || orderData.branch_name || 'Espresso Yourself & Tea House');
  b.size('normal').bold(false);

  const isLaundry = (branchInfo.name || orderData.branch_name || '').toLowerCase().includes('spin') ||
                    (branchInfo.name || orderData.branch_name || '').toLowerCase().includes('laundry') ||
                    (typeof orderData.notes === 'string' && orderData.notes.includes('"is_laundry":true'));
  const address = branchInfo.address || orderData.branch_address || (isLaundry ? 'De Sylca 1 Building, Tigatto Road, Buhangin, Davao City' : 'Room 1 Crown Bldg North Road 6, Cebu City');
  b.line(address);
  b.feed(1);

  // Title
  b.bold(true);
  if (orderData.status === 'voided') {
    b.size('large').line('*** VOIDED INVOICE ***').size('normal');
  } else if (orderData.status === 'refunded') {
    b.size('large').line('*** REFUNDED INVOICE ***').size('normal');
  } else if (orderData.is_reprint) {
    b.line('SALES INVOICE');
    b.line('- REPRINT -');
  } else {
    b.line('SALES INVOICE');
  }
  b.bold(false);

  b.divider('-');

  // Metadata (2 columns, 2 rows)
  b.align('left');
  const dateStr = orderData.created_at
    ? new Date(orderData.created_at).toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      timeZone: 'Asia/Manila'
    })
    : new Date().toLocaleDateString();

  const timeStr = orderData.created_at
    ? new Date(orderData.created_at).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Manila'
    })
    : new Date().toLocaleTimeString();

  const orderNum = `#${String(orderData.order_number || orderData.id || '').padStart(6, '0')}`;
  b.row(`Order: ${orderNum}`, `Date: ${dateStr}`);
  b.row(`Time: ${timeStr}`, `Cashier: ${orderData.cashier_name || 'Staff'}`);

  b.divider('-');

  // Items Header
  b.bold(true);
  b.row('Qty  Item', 'Amount');
  b.bold(false);
  b.divider('-');

  // Items List
  if (Array.isArray(orderData.items)) {
    for (const item of orderData.items) {
      const name = (item.product_name || item.name || 'Item') + (item.is_complimentary ? ' (COMP)' : '');
      const itemTotal = `P${((item.price || 0) * (item.quantity || 1)).toFixed(2)}`;
      b.itemRow(item.quantity || 1, name, itemTotal);

      // Print clean notes if any
      if (item.notes) {
        const cleanNotes = item.notes
          .replace(/\[DINE-IN\]\s*/g, '')
          .replace(/\(Complimentary Voucher\)\s*/g, '')
          .replace('(Voucher) ', '')
          .replace(/\[COMPLIMENTARY:.*?\]/g, '')
          .replace(/\[COMPLIMENTARY\]/g, '')
          .replace(/Service:\s*[^|]+(?:\s*\|\s*Weight[\s/]*Qty:[^|,]+)?(?:\s*,?\s*Rate:[^|•]+)?\.?/gi, '')
          .replace(/Weight[\s/]*Qty:[^|,]+(?:\s*,?\s*Rate:[^|•]+)?\.?/gi, '')
          .trim();
        if (cleanNotes && !cleanNotes.startsWith('{') && !cleanNotes.toLowerCase().startsWith('service:') && !(cleanNotes.toLowerCase().includes('weight') && cleanNotes.toLowerCase().includes('rate'))) {
          b.line(`    * ${cleanNotes}`);
        }
      }
    }
  }

  b.divider('-');

  // Calculations
  const subtotal = orderData.subtotal || 0;
  b.row('Subtotal:', `P${subtotal.toFixed(2)}`);

  if (orderData.discount_amount > 0) {
    b.row(`Less: ${orderData.discount_name || 'Discount'}`, `-P${orderData.discount_amount.toFixed(2)}`);
  }
  if (orderData.discount_customer_name) {
    b.line(`  Customer/Senior: ${orderData.discount_customer_name}`);
  }
  if (orderData.service_charge > 0) {
    b.row('Service Charge:', `P${orderData.service_charge.toFixed(2)}`);
  }
  if (orderData.tax_amount > 0) {
    b.row('VAT (12%):', `P${orderData.tax_amount.toFixed(2)}`);
  }

  b.feed(1);

  // Total
  b.bold(true).size('tall');
  const total = orderData.total || 0;
  b.row('TOTAL', `P${total.toFixed(2)}`);
  b.size('normal').bold(false);

  // Payment
  if (orderData.payment_method) {
    b.row('Payment Method:', String(orderData.payment_method).toUpperCase());
  }
  if (orderData.reference_number) {
    b.row('Ref No:', String(orderData.reference_number));
  }
  if (orderData.amount_tendered !== undefined && orderData.amount_tendered !== null) {
    b.row('Cash Tendered:', `P${Number(orderData.amount_tendered).toFixed(2)}`);
    b.bold(true);
    b.row('Change:', `P${Number(orderData.change || 0).toFixed(2)}`);
    b.bold(false);
  }

  b.divider('-');

  // Order Summary Info
  b.align('center');
  const totalItems = Array.isArray(orderData.items)
    ? orderData.items.reduce((acc, it) => acc + (it.quantity || 1), 0)
    : 0;
  b.line(`${orderData.table_name || 'Dine In'} * Guests: ${orderData.pax_count || 1} * Items: ${totalItems}`);

  b.feed(1);
  b.bold(true);
  b.line('Thank you for your visit!');
  b.line('Enjoy!');
  b.bold(false);
  b.line('This serves as your Sales Invoice.');

  b.cut();

  return b.toBuffer();
}

/**
 * Builds a test print receipt Buffer
 */
export function buildTestPrintEscPos(printerName = 'POS-80C') {
  const b = new EscPosBuilder(48);

  b.init();
  b.align('center');
  b.bold(true).size('large');
  b.line('TEST PRINT');
  b.size('normal').bold(false);
  b.line('Local Print Service (POS Bridge)');
  b.divider('=');

  b.bold(true);
  b.line('Printer Communication: SUCCESS');
  b.bold(false);
  b.line(`Target: ${printerName}`);
  b.line(`Date: ${new Date().toLocaleString()}`);
  b.divider('-');

  b.align('left');
  b.line('Font Test: Normal Font 48 Columns OK');
  b.bold(true).line('Font Test: Bold Font OK').bold(false);
  b.size('tall').line('Font Test: Double Height OK').size('normal');
  b.align('center');
  b.divider('=');
  b.line('1-Click Direct Printing Active!');
  b.line('No print dialogs required.');

  b.cut();

  return b.toBuffer();
}
