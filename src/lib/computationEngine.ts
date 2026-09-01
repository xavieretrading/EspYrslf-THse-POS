/**
 * Centralized Philippine VAT, Discount, and Service Charge Engine
 * Complies with Philippine BIR rules for Senior Citizen/PWD transactions.
 */

export interface ComputeTotalsInput {
  subtotal: number; // Total food amount (gross of non-complimentary items)
  paxCount: number; // Total customers/diners
  discountPaxCount: number; // Senior / PWD count
  discountName?: string | null;
  discountType?: string | null; // 'percentage' | 'fixed'
  discountValue?: number | null; // e.g. 20 for 20%
  serviceChargePercentage: number; // e.g. 10 for 10%
  serviceChargeBasis: 'vat_exclusive' | 'gross';
  items?: any[]; // Pass items for line-level discount processing
  isBirCompliant?: boolean;
}

export interface CalculationResult {
  paxCount: number;
  discountPaxCount: number;
  subtotal: number;
  vatableSales: number;
  vatExemptSales: number;
  vatRelief: number; // VAT Exemption amount
  scDiscount: number; // 20% Senior/PWD discount amount
  discountAmount: number; // Total discount (vatRelief + scDiscount for senior, or regular discount)
  netFoodAmount: number; // subtotal - discountAmount
  vatAmount: number; // 12% VAT on vatable sales
  serviceChargeAmount: number;
  total: number;
  computedItems?: any[]; // Items with their computed discount amounts
}

/**
 * Check if a discount is for Senior Citizens or PWDs (subject to VAT Exemption + 20% Discount)
 */
export function isSeniorPWDDiscount(discountName?: string | null): boolean {
  if (!discountName) return false;
  const lower = discountName.toLowerCase();
  return lower.includes('senior') || 
         lower.includes('pwd') || 
         lower.includes('athlete') || 
         lower.includes('coach') || 
         lower.includes('solo parent') || 
         lower.includes('vat exempt') ||
         lower.includes('valor') ||
         lower.includes('medal');
}

/**
 * Main Centralized Calculation function for POS cart and saved bills
 */
export function computeOrderTotals(input: ComputeTotalsInput): CalculationResult {
  const {
    subtotal: rawSubtotal,
    paxCount: rawPaxCount,
    discountPaxCount: rawDiscountPaxCount,
    discountName,
    discountType,
    discountValue,
    serviceChargePercentage,
    serviceChargeBasis = 'vat_exclusive',
  } = input;

  const subtotal = Math.max(0, rawSubtotal);
  const paxCount = Math.max(1, rawPaxCount);
  const discountPaxCount = Math.max(0, Math.min(rawDiscountPaxCount, paxCount));

  let vatableSales = 0;
  let vatExemptSales = 0;
  let vatRelief = 0;
  let scDiscount = 0;
  let discountAmount = 0;
  let vatAmount = 0;

  const isSeniorPWD = isSeniorPWDDiscount(discountName);

  const computedItems = input.items ? [...input.items] : [];

  if (input.isBirCompliant && computedItems.length > 0) {
    // STRICT BIR COMPLIANCE: Process per-item discounts
    let computedSubtotal = 0;
    
    for (const item of computedItems) {
      if (item.is_complimentary || item.isComplimentary) continue;
      
      const itemPrice = item.price || item.unit_price || 0;
      const itemGross = itemPrice * (item.quantity || 1);
      computedSubtotal += itemGross;
      
      const itemDisc = item.itemDiscount;
      const isItemSeniorPWD = itemDisc ? isSeniorPWDDiscount(itemDisc.name) : isSeniorPWD;

      if (isItemSeniorPWD) {
        const f = itemDisc ? 1 : (paxCount > 0 ? discountPaxCount / paxCount : 1);
        const scPortionGross = itemGross * f;
        const seniorVatExclusive = scPortionGross / 1.12;
        
        vatExemptSales += seniorVatExclusive;
        vatRelief += (scPortionGross - seniorVatExclusive);
        
        const dVal = itemDisc ? parseFloat(itemDisc.value as any) : discountValue;
        const discountPercent = typeof dVal === 'number' ? (dVal > 1 ? dVal / 100 : dVal) : 0.20;
        
        const itemScDiscount = seniorVatExclusive * discountPercent;
        scDiscount += itemScDiscount;
        
        item.computedDiscountAmount = (scPortionGross - seniorVatExclusive) + itemScDiscount;
        item.isVatExempt = true;
        
        const nonSeniorGross = itemGross * (1 - f);
        if (nonSeniorGross > 0) {
          vatableSales += nonSeniorGross / 1.12;
          vatAmount += (nonSeniorGross - (nonSeniorGross / 1.12));
        }
      } else if (itemDisc) {
        // Regular per-item discount
        const dVal = parseFloat(itemDisc.value as any) || 0;
        let itemDiscAmount = 0;
        if (itemDisc.type === 'percentage') {
          itemDiscAmount = itemGross * (dVal > 1 ? dVal / 100 : dVal);
        } else {
          itemDiscAmount = Math.min(itemGross, dVal);
        }
        discountAmount += itemDiscAmount;
        item.computedDiscountAmount = itemDiscAmount;
        item.isVatExempt = false;
        
        const netFood = itemGross - itemDiscAmount;
        if (netFood > 0) {
          vatableSales += netFood / 1.12;
          vatAmount += (netFood - (netFood / 1.12));
        }
      } else {
        // No discount on this item
        item.computedDiscountAmount = 0;
        item.isVatExempt = false;
        vatableSales += itemGross / 1.12;
        vatAmount += (itemGross - (itemGross / 1.12));
      }
    }
    
    // Set total discount amount
    discountAmount += (vatRelief + scDiscount);
    
  } else {
    // LEGACY CALCULATION: Order-level discount
    if (isSeniorPWD && subtotal > 0) {
      // STEP 1 - DETERMINE ELIGIBLE SHARE
      const f = discountPaxCount / paxCount;
      const scPortionGross = subtotal * f;

      // STEP 2 - REMOVE VAT FIRST
      const seniorVatExclusive = scPortionGross / 1.12;
      vatExemptSales = seniorVatExclusive;
      vatRelief = scPortionGross - seniorVatExclusive;

      // STEP 3 - APPLY 20% DISCOUNT
      const discountPercent = typeof discountValue === 'number' ? discountValue / 100 : 0.20;
      scDiscount = seniorVatExclusive * discountPercent;

      discountAmount = vatRelief + scDiscount;

      // STEP 5 - NON-SENIOR SHARE
      const nonSeniorGross = subtotal * (1 - f);
      if (nonSeniorGross > 0) {
        vatableSales = nonSeniorGross / 1.12;
        vatAmount = nonSeniorGross - vatableSales;
      }
    } else if (subtotal > 0) {
      // Regular Discount or no discount
      const discVal = typeof discountValue === 'number' ? discountValue : 0;
      if (discVal > 0) {
        if (discountType === 'percentage') {
          discountAmount = subtotal * (discVal / 100);
        } else {
          discountAmount = Math.min(subtotal, discVal);
        }
      }

      const netFood = subtotal - discountAmount;
      if (netFood > 0) {
        vatableSales = netFood / 1.12;
        vatAmount = netFood - vatableSales;
      }
    }
  }

  const netFoodAmount = Math.max(0, subtotal - discountAmount);

  // Service charge is disabled globally
  const serviceChargeAmount = 0;
  const total = Math.max(0, netFoodAmount);

  return {
    paxCount,
    discountPaxCount,
    subtotal,
    vatableSales,
    vatExemptSales,
    vatRelief,
    scDiscount,
    discountAmount,
    netFoodAmount,
    vatAmount,
    serviceChargeAmount,
    total,
    computedItems
  };
}
