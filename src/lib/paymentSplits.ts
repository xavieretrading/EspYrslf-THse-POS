/**
 * Split payment helpers (e.g. ₱50 cash + ₱50 GCash on one order).
 * Shared by server.ts and the frontend so reports/shift cash agree.
 *
 * Storage: orders_espresso.payment_method = 'split' and
 *          orders_espresso.payment_splits = [{ method, amount, reference? }]
 * Fallback (column not yet migrated): reference_number = 'SPLIT:' + JSON.stringify(splits)
 */

export interface PaymentSplit {
  method: string; // 'cash' | 'gcash' | 'rcbc' | ...
  amount: number; // portion of the order total paid with this method
  reference?: string | null;
}

export const SPLIT_REF_PREFIX = 'SPLIT:';

export function isSplitPayment(order: any): boolean {
  return (order?.payment_method || '').toLowerCase() === 'split';
}

export function getPaymentSplits(order: any): PaymentSplit[] {
  if (!order) return [];
  if (isSplitPayment(order)) {
    let raw: any = order.payment_splits;
    if (!raw && typeof order.reference_number === 'string' && order.reference_number.startsWith(SPLIT_REF_PREFIX)) {
      raw = order.reference_number.slice(SPLIT_REF_PREFIX.length);
    }
    if (typeof raw === 'string') {
      try { raw = JSON.parse(raw); } catch { raw = null; }
    }
    if (Array.isArray(raw) && raw.length > 0) {
      return raw.map((s: any) => ({
        method: String(s.method || 'cash').toLowerCase(),
        amount: Number(s.amount) || 0,
        reference: s.reference || null
      }));
    }
  }
  return [{ method: (order.payment_method || 'cash').toLowerCase(), amount: Number(order.total) || 0 }];
}

/** Amount of an order paid in cash (goes into the cash drawer). */
export function getCashPortion(order: any): number {
  return getPaymentSplits(order)
    .filter(s => s.method === 'cash')
    .reduce((sum, s) => sum + s.amount, 0);
}

/** Human-readable label, e.g. "CASH ₱50.00 + GCASH ₱50.00". */
export function formatPaymentLabel(order: any, currency = '₱'): string {
  if (!isSplitPayment(order)) return (order?.payment_method || 'CASH').toUpperCase();
  return getPaymentSplits(order)
    .map(s => `${s.method.toUpperCase()} ${currency}${s.amount.toFixed(2)}`)
    .join(' + ');
}

/** Reference number to print (hides the SPLIT: fallback encoding). */
export function getDisplayReference(order: any): string | null {
  if (isSplitPayment(order)) {
    const refs = getPaymentSplits(order).map(s => s.reference).filter(Boolean);
    return refs.length > 0 ? refs.join(', ') : null;
  }
  return order?.reference_number || null;
}
