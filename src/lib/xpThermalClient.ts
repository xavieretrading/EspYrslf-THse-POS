// src/lib/xpThermalClient.ts
// Direct REST Client for XP Thermal Service (http://127.0.0.1:9100)

export interface XpHealth {
  connected: boolean;
  status?: string;
  service?: string;
  port?: number;
  printers?: {
    total: number;
    online: number;
    offline: number;
    error: number;
  };
  warnings?: string[];
}

export interface XpPrintResponse {
  success: boolean;
  jobId?: string;
  status?: string;
  message?: string;
  error?: string;
}

const XP_SERVICE_BASE = 'http://127.0.0.1:9100';

/**
 * Checks if the XP Thermal Service is active and reachable
 */
export async function checkXpServiceHealth(): Promise<XpHealth> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const res = await fetch(`${XP_SERVICE_BASE}/health`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return {
        connected: true,
        status: data.status,
        service: data.service,
        port: data.port,
        printers: data.printers
      };
    }
  } catch (err) { }

  return { connected: false };
}

/**
 * Discovers physical thermal printers connected to this machine
 */
export async function discoverXpPrinters(): Promise<{ printers: any[]; spoolerRunning: boolean }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(`${XP_SERVICE_BASE}/api/printers/discover?all=1`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return {
        printers: data.printers || [],
        spoolerRunning: data.system?.spoolerRunning ?? true
      };
    }
  } catch (err) { }

  return { printers: [], spoolerRunning: false };
}

/**
 * Sets up a printer under a role ('receipt', 'kitchen', 'bar')
 */
export async function setupXpPrinterRole(role: string, windowsPrinterName: string): Promise<boolean> {
  try {
    const res = await fetch(`${XP_SERVICE_BASE}/api/printers/setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role,
        windowsName: windowsPrinterName,
        test: false
      })
    });
    return res.ok;
  } catch (err) {
    return false;
  }
}

/**
 * Sends a test print to the configured receipt printer
 */
export async function printXpTestTicket(printerId: string = 'receipt'): Promise<XpPrintResponse> {
  try {
    const res = await fetch(`${XP_SERVICE_BASE}/api/printers/${printerId}/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    const data = await res.json();
    if (res.ok && data.success) {
      return {
        success: true,
        jobId: data.jobId,
        message: data.message || 'Test ticket queued successfully.'
      };
    }
    return {
      success: false,
      error: data.error || data.message || 'Test print failed.'
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Could not connect to XP Thermal Service.'
    };
  }
}

/**
 * Prints a POS receipt directly using XP Thermal Service ESC/POS template
 */
export async function printReceiptViaXpThermal(
  receiptData: any,
  options: {
    openDrawer?: boolean;
    branchName?: string;
    address?: string;
    tin?: string;
  } = {}
): Promise<XpPrintResponse> {
  try {
    const subtotal = receiptData.items?.reduce(
      (sum: number, it: any) => sum + (it.is_complimentary ? 0 : ((Number(it.price) || 0) * (Number(it.quantity) || 1))),
      0
    ) || (Number(receiptData.subtotal) || 0);

    const discount = Number(receiptData.discount_amount) || 0;
    const total = Math.max(0, subtotal - discount);

    const formattedItems: Array<{
      name: string;
      quantity: number;
      price: number;
      total: number;
      notes?: string;
    }> = [];

    (receiptData.items || []).forEach((it: any) => {
      let notes = (it.notes || '')
        .replace(/\[DINE-IN\]\s*/gi, '')
        .replace(/\[TAKEOUT\]\s*/gi, '')
        .replace(/\[TAKE-OUT\]\s*/gi, '')
        .replace(/\[COMPLIMENTARY:.*?\]/gi, '')
        .replace(/\[COMPLIMENTARY\]/gi, '')
        .replace(/\(Complimentary Voucher\)\s*/gi, '')
        .replace(/\(Voucher\)\s*/gi, '')
        .replace(/₱/g, 'PHP ')
        .trim();

      // Extract add-on patterns like "+ Espresso 60ml (+₱50)" or "Espresso 60ml (+50)"
      const addonRegex = /(?:(\d+)x\s*)?([^(,•]+?)\s*\(\+?[₱P]?(?:HP)?\s*(\d+(?:\.\d+)?)\)/gi;
      const extractedAddons: Array<{ name: string; quantity: number; price: number }> = [];
      let match;
      let totalAddonUnitExtra = 0;

      while ((match = addonRegex.exec(notes)) !== null) {
        const addonQty = match[1] ? parseInt(match[1], 10) : 1;
        const rawName = match[2].replace(/^\+\s*/, '').trim();
        const addonPrice = parseFloat(match[3]) || 0;
        extractedAddons.push({
          name: `+ ${rawName}`,
          quantity: addonQty,
          price: addonPrice
        });
        totalAddonUnitExtra += (addonPrice * addonQty);
      }

      // Remaining notes without the addon phrases and without redundant laundry service/rate info
      let cleanNotes = notes.replace(addonRegex, '')
                            .replace(/Service:\s*[^|]+(?:\s*\|\s*Weight[\s/]*Qty:[^|,]+)?(?:\s*,?\s*Rate:[^|•]+)?\.?/gi, '')
                            .replace(/Weight[\s/]*Qty:[^|,]+(?:\s*,?\s*Rate:[^|•]+)?\.?/gi, '')
                            .replace(/^\+\s*/, '')
                            .replace(/[•,]\s*$/, '')
                            .replace(/^[•,]\s*/, '')
                            .replace(/\s*•\s*/g, ' • ')
                            .trim();

      if (cleanNotes.toLowerCase().startsWith('service:') || (cleanNotes.toLowerCase().includes('weight') && cleanNotes.toLowerCase().includes('rate'))) {
        cleanNotes = '';
      }

      const itemQty = Number(it.quantity) || 1;
      const origPrice = Number(it.price) || 0;
      // If the parent item price already included the addons, separate the base price:
      const baseUnitPrice = Math.max(0, origPrice - totalAddonUnitExtra);

      formattedItems.push({
        name: (it.product_name || it.name || 'Item').replace(/₱/g, 'PHP '),
        quantity: itemQty,
        price: baseUnitPrice,
        total: baseUnitPrice * itemQty,
        notes: cleanNotes || undefined
      });

      // Display add-ons as their own clean row with qty and amount
      for (const addon of extractedAddons) {
        formattedItems.push({
          name: addon.name,
          quantity: addon.quantity * itemQty,
          price: addon.price,
          total: addon.price * (addon.quantity * itemQty),
          notes: undefined
        });
      }
    });

    const idempotencyKey = `rec-${receiptData.receipt_number || receiptData.id || Date.now()}-${Date.now()}`;

    const payload = {
      idempotencyKey,
      printerId: 'receipt',
      templateType: 'receipt',
      copies: 1,
      priority: 2,
      payload: {
        orderNumber: receiptData.receipt_number 
          ? `INV-${receiptData.receipt_number.toString().padStart(6, '0')}`
          : `#${(receiptData.order_number || receiptData.id || '').toString().padStart(6, '0')}`,
        orderDate: new Date(receiptData.created_at || Date.now()).toLocaleDateString('en-US', {
          month: 'short',
          day: '2-digit',
          year: 'numeric'
        }),
        orderTime: new Date(receiptData.created_at || Date.now()).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }),
        items: formattedItems,
        subtotal: subtotal,
        discount: discount,
        discountName: receiptData.discount_name ? receiptData.discount_name.replace(/₱/g, 'PHP ') : undefined,
        total: total,
        paymentMethod: (receiptData.payment_method || 'CASH').toUpperCase(),
        amountPaid: Number(receiptData.amount_tendered || total),
        change: Number(receiptData.change || 0),
        customerName: receiptData.customer_name || undefined,
        serverName: receiptData.cashier_name || receiptData.user?.name || 'Staff',
        tableName: receiptData.table_name || undefined,
        header: {
          storeName: (() => {
            const isL = (
              options.branchName?.toLowerCase().includes('spin') ||
              options.branchName?.toLowerCase().includes('laundry') ||
              receiptData?.branch_name?.toLowerCase().includes('spin') ||
              receiptData?.branch_name?.toLowerCase().includes('laundry') ||
              (typeof receiptData?.notes === 'string' && receiptData.notes.includes('"is_laundry":true'))
            );
            return (options.branchName || (isL ? 'S1P AND SP1N LAUNDRY SHOP' : 'ESPRESSO YOURSELF & TEA HOUSE')).toUpperCase();
          })(),
          storeAddress: (() => {
            const isL = (
              options.branchName?.toLowerCase().includes('spin') ||
              options.branchName?.toLowerCase().includes('laundry') ||
              receiptData?.branch_name?.toLowerCase().includes('spin') ||
              receiptData?.branch_name?.toLowerCase().includes('laundry') ||
              (typeof receiptData?.notes === 'string' && receiptData.notes.includes('"is_laundry":true'))
            );
            if (isL) {
              if (options.address && !options.address.includes('Crown Bldg') && options.address !== 'Laundry Shop Address') {
                return [options.address];
              }
              return ['De Sylca 1 Building, Tigatto Road', 'Buhangin, Davao City'];
            }
            return options.address ? [options.address] : ['Room 1 Crown Bldg North Road 6', 'North Reclamation Area Mabolo Cebu City'];
          })(),
          taxId: undefined // Removed Tax ID / TIN per branch requirements
        },
        footer: {
          message: ['Thank you for your visit!', 'Please come again!']
        },
        options: {
          template: 'classic',
          paperWidth: 48,
          currency: { symbol: 'PHP ', decimals: 2, position: 'before' },
          fields: {
            logo: false,
            businessName: true,
            address: true,
            taxId: false, // Explicitly false: no Tax ID / TIN
            orderNumber: true,
            dateTime: true,
            table: !!receiptData.table_name,
            server: true, // Label is displayed as Cashier
            customer: !!receiptData.customer_name,
            orderMode: false,
            itemModifiers: true,
            itemNotes: true,
            unitPrice: false, // Disabled redundant "1 x PHP 149" row below items
            taxBreakdown: false,
            discount: discount > 0,
            serviceCharge: false,
            tip: false,
            paymentMethod: true,
            amountPaid: true,
            change: true,
            qrCode: false,
            footerMessage: true,
            thankYou: true,
            poweredBy: false
          }
        }
      },
      metadata: {
        openCashDrawer: options.openDrawer ?? (receiptData.payment_method?.toLowerCase() === 'cash')
      }
    };

    const res = await fetch(`${XP_SERVICE_BASE}/api/print`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Idempotency-Key': idempotencyKey
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (res.ok && (data.success || data.jobId)) {
      return {
        success: true,
        jobId: data.jobId,
        status: data.status,
        message: 'Receipt sent directly to thermal printer.'
      };
    }

    return {
      success: false,
      error: data.message || data.error || 'Failed to print receipt via XP Thermal Service.'
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Could not reach XP Thermal Service on localhost:9100.'
    };
  }
}

/**
 * High-level printing controller:
 * Prioritizes XP Thermal Service (port 9100) -> falls back to QZ Tray -> falls back to Browser Print
 */
export async function printReceiptSmart(
  receiptData: any,
  options: {
    preferredMode?: 'xp' | 'qz' | 'browser';
    openDrawer?: boolean;
    branchName?: string;
    address?: string;
    tin?: string;
    targetPrinter?: string;
    onStatus?: (msg: string) => void;
  } = {}
): Promise<{ success: boolean; method: 'xp' | 'qz' | 'browser'; error?: string }> {
  const mode = options.preferredMode || (localStorage.getItem('printer_engine') as any) || 'xp';

  // 1. If user explicitly wants standard browser dialog
  if (mode === 'browser') {
    return { success: true, method: 'browser' };
  }

  // 2. Try XP Thermal Service first (if preferred or enabled)
  if (mode === 'xp') {
    const health = await checkXpServiceHealth();
    if (health.connected) {
      options.onStatus?.('Printing via XP Thermal Service...');
      const xpResult = await printReceiptViaXpThermal(receiptData, {
        openDrawer: options.openDrawer,
        branchName: options.branchName,
        address: options.address,
        tin: options.tin
      });

      if (xpResult.success) {
        return { success: true, method: 'xp' };
      }
      console.warn('XP Thermal Service job failed, falling back:', xpResult.error);
    } else {
      console.info('XP Thermal Service is offline on port 9100, checking fallbacks...');
    }
  }

  // 3. Fallback to QZ Tray if mode is 'qz' or if XP failed and QZ is configured
  return { success: false, method: 'browser', error: 'No direct printer service connected' };
}


