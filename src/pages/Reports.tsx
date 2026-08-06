import React, { useEffect, useState } from 'react';
import { FileText, Download, Calendar, Activity, ChevronRight, ChevronDown, Tag, Users, User, Medal, Ticket, Gift, Clock, Printer, Trash2, TableIcon } from 'lucide-react';
import { format, subDays, startOfMonth, startOfDay, startOfWeek } from 'date-fns';
import { useBranch } from '../BranchContext';
import { useSettings } from '../SettingsContext';
import clsx from 'clsx';
import * as XLSX from 'xlsx';

import { logActivity } from '../lib/audit';
import { swalAlert } from '../lib/swal';

type ReportType = 'Z' | 'Y' | 'X' | 'BIR_SALES_SUMMARY' | 'SENIOR_CITIZEN' | 'PWD' | 'NATIONAL_ATHLETES' | 'SOLO_PARENT' | 'MEDAL_OF_VALOR' | 'REGULAR_DISCOUNT' | 'EJOURNAL' | 'VOUCHER_PAYMENTS' | 'VOUCHER_REDEMPTIONS' | 'COMPLIMENTARY' | 'VOIDED';

const REPORT_CATEGORIES: { id: ReportType; label: string; icon: any }[] = [
  { id: 'X', label: 'X-Reading (Interim Snapshot)', icon: FileText },
  { id: 'Z', label: 'Z-Reading (Daily)', icon: Activity },
  { id: 'Y', label: 'Y-Reading (Period)', icon: Calendar },
  { id: 'VOIDED', label: 'Voided Transactions Report', icon: Trash2 },
  { id: 'BIR_SALES_SUMMARY', label: 'BIR Sales Summary Report', icon: FileText },
  { id: 'COMPLIMENTARY', label: 'Complimentary Report', icon: Gift },
  { id: 'VOUCHER_REDEMPTIONS', label: 'Voucher Redemptions Report', icon: Ticket },
  { id: 'VOUCHER_PAYMENTS', label: 'Voucher Payments Report', icon: Tag },
  { id: 'SENIOR_CITIZEN', label: 'Senior Citizen Sales (Annex E-2)', icon: Users },
  { id: 'PWD', label: 'PWD Sales (Annex E-3)', icon: User },
  { id: 'SOLO_PARENT', label: 'Solo Parent Sales (Annex E-4)', icon: Users },
  { id: 'NATIONAL_ATHLETES', label: 'National Athletes and Coaches Sales (Annex E-5)', icon: Medal },
  { id: 'MEDAL_OF_VALOR', label: 'Medal of Valor Awardees Sales (Annex E-6)', icon: Medal },
  { id: 'REGULAR_DISCOUNT', label: 'Regular Discount Sales', icon: Tag },
  { id: 'EJOURNAL', label: 'E-Journal (Electronic Copy)', icon: FileText },
];

export default function Reports() {
  const { activeBranch } = useBranch();
  const { settings } = useSettings();
  const isLaundryBranch = activeBranch?.name?.toLowerCase().includes('laundry') || activeBranch?.name?.toLowerCase().includes('s1p') || activeBranch?.name?.toLowerCase().includes('spin');
  const [reportType, setReportType] = useState<ReportType>('Z');
  const getManilaDate = () => {
    return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }));
  };

  const [dateRange, setDateRange] = useState({
    start: format(getManilaDate(), 'yyyy-MM-dd'),
    end: format(getManilaDate(), 'yyyy-MM-dd')
  });

  const [timeRange, setTimeRange] = useState({
    start: '',
    end: ''
  });

  const [expandedShiftId, setExpandedShiftId] = useState<number | null>(null);
  const [singleShiftToPrint, setSingleShiftToPrint] = useState<any>(null);

  const [data, setData] = useState({
    summary: {} as any,
    discounts: [] as any[],
    payments: [] as any[],
    accumulated_grand_total: 0,
    z_counter: 0
  });

  const [voucherRedemptions, setVoucherRedemptions] = useState<any[]>([]);
  const [complimentaryData, setComplimentaryData] = useState<any[]>([]);
  const [eJournalData, setEJournalData] = useState<any[]>([]);
  const [shiftData, setShiftData] = useState<any[]>([]);
  const [voidedTransactions, setVoidedTransactions] = useState<any[]>([]);
  const [discountOrders, setDiscountOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [complimentarySearch, setComplimentarySearch] = useState('');
  const [printSize, setPrintSize] = useState<'80mm' | 'A4' | 'legal'>('80mm');

  const fetchReports = () => {
    if (!activeBranch) return;

    let timeParams = '';
    if (timeRange.start) timeParams += `&start_time=${timeRange.start}`;
    if (timeRange.end) timeParams += `&end_time=${timeRange.end}`;

    const userParam = selectedUserId && (reportType === 'SHIFT_SALES' || reportType === 'Y' || reportType === 'X' || reportType === 'Z') ? `&user_id=${selectedUserId}` : '';

    fetch(`/api/reports/sales?branch_id=${activeBranch.id}&start_date=${dateRange.start}&end_date=${dateRange.end}${timeParams}${userParam}`)
      .then(res => res.json())
      .then(resData => {
        setData(resData);
      });

    if (reportType === 'EJOURNAL') {
      fetch(`/api/reports/ejournal?branch_id=${activeBranch.id}&start_date=${dateRange.start}&end_date=${dateRange.end}${timeParams}`)
        .then(res => res.json())
        .then(resData => {
          setEJournalData(resData);
        });
    }

    if (reportType === 'VOUCHER_REDEMPTIONS') {
      fetch(`/api/reports/vouchers?branch_id=${activeBranch.id}&start_date=${dateRange.start}&end_date=${dateRange.end}${timeParams}`)
        .then(res => res.json())
        .then(resData => {
          setVoucherRedemptions(Array.isArray(resData) ? resData : []);
        })
        .catch(() => setVoucherRedemptions([]));
    }

    if (reportType === 'COMPLIMENTARY') {
      fetch(`/api/reports/complimentary?branch_id=${activeBranch.id}&start_date=${dateRange.start}&end_date=${dateRange.end}${timeParams}`)
        .then(res => res.json())
        .then(resData => {
          setComplimentaryData(Array.isArray(resData) ? resData : []);
        })
        .catch(() => setComplimentaryData([]));
    }

    if (reportType === 'VOIDED') {
      fetch(`/api/reports/voided?branch_id=${activeBranch.id}&start_date=${dateRange.start}&end_date=${dateRange.end}${timeParams}`)
        .then(res => res.json())
        .then(resData => {
          setVoidedTransactions(Array.isArray(resData) ? resData : []);
        })
        .catch(() => setVoidedTransactions([]));
    }

    if (reportType === 'SHIFT_SALES' || reportType === 'Z' || reportType === 'Y' || reportType === 'X') {
      let url = `/api/shifts/report?branch_id=${activeBranch.id}&start_date=${dateRange.start}&end_date=${dateRange.end}${timeParams}`;
      if (selectedUserId && (reportType === 'SHIFT_SALES' || reportType === 'Y' || reportType === 'X' || reportType === 'Z')) url += `&user_id=${selectedUserId}`;
      fetch(url)
        .then(res => res.json())
        .then(resData => {
          setShiftData(Array.isArray(resData) ? resData : []);
        })
        .catch(() => setShiftData([]));
    }

    // BIR Annexes E-2 to E-5: fetch per-transaction discount orders
    const discountTypeMap: Partial<Record<ReportType, string>> = {
      SENIOR_CITIZEN: 'senior',
      PWD: 'pwd',
      NATIONAL_ATHLETES: 'athlete',
      SOLO_PARENT: 'solo',
      MEDAL_OF_VALOR: 'valor',
      REGULAR_DISCOUNT: 'regular',
    };
    const discountType = discountTypeMap[reportType];
    if (discountType) {
      fetch(`/api/reports/discount-orders?branch_id=${activeBranch.id}&discount_type=${discountType}&start_date=${dateRange.start}&end_date=${dateRange.end}${timeParams}`)
        .then(res => res.json())
        .then(resData => setDiscountOrders(Array.isArray(resData) ? resData : []))
        .catch(() => setDiscountOrders([]));
    } else {
      setDiscountOrders([]);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [dateRange, timeRange, activeBranch, reportType, selectedUserId]);

  useEffect(() => {
    fetch('/api/users')
      .then(res => res.json())
      .then(resData => setUsers(Array.isArray(resData) ? resData : []))
      .catch(() => setUsers([]));
  }, []);

  useEffect(() => {
    if (reportType === 'Z' || reportType === 'X') {
      setDateRange({
        start: format(getManilaDate(), 'yyyy-MM-dd'),
        end: format(getManilaDate(), 'yyyy-MM-dd')
      });
    } else {
      setDateRange(prev => ({
        ...prev,
        start: format(startOfMonth(getManilaDate()), 'yyyy-MM-dd')
      }));
    }
  }, [reportType]);

  const handlePrint = () => {
    const user = JSON.parse(localStorage.getItem('resto_active_user') || '{}');
    logActivity(user.full_name || user.username || 'Staff', 'Print Report', `Printed ${REPORT_CATEGORIES.find(c => c.id === reportType)?.label} for ${dateRange.start} to ${dateRange.end}`);
    window.print();
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // EXPORT ALL BIR ANNEXES TO EXCEL (E-1 to E-5 as separate sheets)
  // ─────────────────────────────────────────────────────────────────────────────
  const handleExportAllAnnexes = async () => {
    if (!activeBranch) return;

    const user = JSON.parse(localStorage.getItem('resto_active_user') || '{}');
    const timeParams = `${timeRange.start ? '&start_time=' + timeRange.start : ''}${timeRange.end ? '&end_time=' + timeRange.end : ''}`;
    const baseParams = `branch_id=${activeBranch.id}&start_date=${dateRange.start}&end_date=${dateRange.end}${timeParams}`;

    // Fetch all discount types in parallel
    const [scOrders, pwdOrders, athleteOrders, soloOrders, valorOrders] = await Promise.all([
      fetch(`/api/reports/discount-orders?${baseParams}&discount_type=senior`).then(r => r.json()).catch(() => []),
      fetch(`/api/reports/discount-orders?${baseParams}&discount_type=pwd`).then(r => r.json()).catch(() => []),
      fetch(`/api/reports/discount-orders?${baseParams}&discount_type=athlete`).then(r => r.json()).catch(() => []),
      fetch(`/api/reports/discount-orders?${baseParams}&discount_type=solo`).then(r => r.json()).catch(() => []),
      fetch(`/api/reports/discount-orders?${baseParams}&discount_type=valor`).then(r => r.json()).catch(() => []),
    ]);

    const wb = XLSX.utils.book_new();
    const now = format(getManilaDate(), 'MM/dd/yyyy HH:mm:ss');
    const period = `${dateRange.start} to ${dateRange.end}`;
    const taxpayer = settings?.company_name || activeBranch?.name || '';
    const address = activeBranch?.address || '';
    const tin = settings?.tin || '';
    const posSerial = settings?.pos_sn || '';
    const machineId = settings?.min || '';
    const userId = user?.username || user?.full_name || '';

    // Helper: build the common BIR header rows (rows 1-11)
    const makeBIRHeader = (annexTitle: string) => [
      ['', '', '', '', taxpayer, '', '', '', '', '', `ANNEX "${annexTitle}"`],
      ['', '', '', '', address, '', '', '', '', '', ''],
      ['', '', '', '', tin, '', '', '', '', '', ''],
      [],
      [`Software Name and Version No.: POS v1.0.0`],
      [`Date and Time Generated: ${now}`],
      [`UserID: ${userId}`],
      [],
    ];

    // ── ANNEX E-1 ──────────────────────────────────────────────────────────────
    const scDisc = discounts?.find((d: any) => d.name.toLowerCase().includes('senior') || d.name.toLowerCase().includes('sc'));
    const pwdDisc = discounts?.find((d: any) => d.name.toLowerCase().includes('pwd') || d.name.toLowerCase().includes('disab'));
    const naacDisc = discounts?.find((d: any) => d.name.toLowerCase().includes('athlete') || d.name.toLowerCase().includes('naac') || d.name.toLowerCase().includes('coach'));
    const soloDisc = discounts?.find((d: any) => d.name.toLowerCase().includes('solo'));
    const otherDiscs = (discounts || []).filter((d: any) => {
      const n = d.name.toLowerCase();
      return !n.includes('senior') && !n.includes('sc') && !n.includes('pwd') && !n.includes('disab') &&
        !n.includes('athlete') && !n.includes('naac') && !n.includes('coach') && !n.includes('solo');
    });
    const scAmt = scDisc?.amount || 0;
    const pwdAmt = pwdDisc?.amount || 0;
    const naacAmt = naacDisc?.amount || 0;
    const soloAmt = soloDisc?.amount || 0;
    const otherAmt = otherDiscs.reduce((s: number, d: any) => s + d.amount, 0);
    const totalDeductions = scAmt + pwdAmt + naacAmt + soloAmt + otherAmt + (summary?.total_voided_amount || 0);
    const scVatAdj = scAmt > 0 ? +(scAmt / 1.20 * 0.12).toFixed(2) : 0;
    const pwdVatAdj = pwdAmt > 0 ? +(pwdAmt / 1.20 * 0.12).toFixed(2) : 0;
    const totalVatAdj = scVatAdj + pwdVatAdj;
    const vatPayable = (summary?.total_vat || 0) - totalVatAdj;
    const netSales = (summary?.gross_sales || 0) - totalDeductions;

    const e1Rows = [
      ...makeBIRHeader('E-1'),
      ['BIR SALES SUMMARY REPORT'],
      [],
      // Header row 1
      ['Date', 'Gross Sales for the Day', 'VATable Sales', 'VAT Amount', 'VAT-Exempt Sales', 'Zero-Rated Sales',
        'Discount-SC', 'Discount-PWD', 'Discount-NAAC', 'Discount-Solo Parent', 'Discount-Others',
        'Returns', 'Voids', 'Total Deductions',
        'VAT Adj-SC', 'VAT Adj-PWD', 'VAT Adj-Others', 'VAT on Returns', 'Others', 'Total VAT Adjustment',
        'VAT Payable', 'Net Sales', 'Sales Overrun/Overflow', 'Total Income', 'Reset Counter', 'Z-Counter', 'Remarks'],
      // Data rows (one per day in dailySales, or single row if not available)
      ...(data.dailySales && data.dailySales.length > 0 ? data.dailySales : [{ date: dateRange.start, total: summary?.total_sales || 0 }]).map((row: any) => [
        row.date || dateRange.start,
        +(row.total || 0).toFixed(2),
        +(summary?.vatable_sales || 0).toFixed(2),
        +(summary?.total_vat || 0).toFixed(2),
        +(summary?.vat_exempt_sales || 0).toFixed(2),
        0,
        +scAmt.toFixed(2), +pwdAmt.toFixed(2), +naacAmt.toFixed(2), +soloAmt.toFixed(2), +otherAmt.toFixed(2),
        0,
        +(summary?.total_voided_amount || 0).toFixed(2),
        +totalDeductions.toFixed(2),
        +scVatAdj.toFixed(2), +pwdVatAdj.toFixed(2), 0, 0, 0,
        +totalVatAdj.toFixed(2),
        +vatPayable.toFixed(2),
        +netSales.toFixed(2),
        0, +netSales.toFixed(2), 0, data.z_counter || 1, ''
      ]),
      // Totals row
      ['TOTAL',
        +(summary?.gross_sales || 0).toFixed(2),
        +(summary?.vatable_sales || 0).toFixed(2),
        +(summary?.total_vat || 0).toFixed(2),
        +(summary?.vat_exempt_sales || 0).toFixed(2),
        0,
        +scAmt.toFixed(2), +pwdAmt.toFixed(2), +naacAmt.toFixed(2), +soloAmt.toFixed(2), +otherAmt.toFixed(2),
        0,
        +(summary?.total_voided_amount || 0).toFixed(2),
        +totalDeductions.toFixed(2),
        +scVatAdj.toFixed(2), +pwdVatAdj.toFixed(2), 0, 0, 0,
        +totalVatAdj.toFixed(2),
        +vatPayable.toFixed(2),
        +netSales.toFixed(2),
        0, +netSales.toFixed(2), 0, data.z_counter || 1, '']
    ];
    const wsE1 = XLSX.utils.aoa_to_sheet(e1Rows);
    XLSX.utils.book_append_sheet(wb, wsE1, 'Annex E-1 Sales Summary');

    // ── ANNEX E-2 ──────────────────────────────────────────────────────────────
    const e2Rows = [
      ...makeBIRHeader('E-2'),
      ['Senior Citizen Sales Book/Report'],
      [],
      ['Date', 'Name of Senior Citizen (SC)', 'OSCA ID No. / SC ID No.', 'SC TIN', 'SI/OR Number',
        'Sales (incl. VAT)', 'VAT Amount', 'VAT Exempt Sales', 'Discount 5%', 'Discount 20%', 'Net Sales'],
      ...(Array.isArray(scOrders) ? scOrders : []).map((o: any) => [
        o.date ? format(new Date(o.date), 'MM/dd/yyyy') : '',
        o.customer_name || '',
        o.customer_id_no || '',
        o.customer_tin || '',
        o.receipt_number ? o.receipt_number.toString().padStart(8, '0') : '',
        +(o.subtotal || 0).toFixed(2),
        +(o.tax_amount || 0).toFixed(2),
        +(o.vat_exempt_sales || 0).toFixed(2),
        +(o.discount_5 || 0).toFixed(2),
        +(o.discount_20 || 0).toFixed(2),
        +(o.net_sales || 0).toFixed(2),
      ]),
      // Totals
      Array.isArray(scOrders) ? [
        'TOTAL', '', '', '', '',
        +scOrders.reduce((s: number, o: any) => s + (o.subtotal || 0), 0).toFixed(2),
        +scOrders.reduce((s: number, o: any) => s + (o.tax_amount || 0), 0).toFixed(2),
        +scOrders.reduce((s: number, o: any) => s + (o.vat_exempt_sales || 0), 0).toFixed(2),
        +scOrders.reduce((s: number, o: any) => s + (o.discount_5 || 0), 0).toFixed(2),
        +scOrders.reduce((s: number, o: any) => s + (o.discount_20 || 0), 0).toFixed(2),
        +scOrders.reduce((s: number, o: any) => s + (o.net_sales || 0), 0).toFixed(2),
      ] : [],
    ];
    const wsE2 = XLSX.utils.aoa_to_sheet(e2Rows);
    XLSX.utils.book_append_sheet(wb, wsE2, 'Annex E-2 Senior Citizen');

    // ── ANNEX E-3 ──────────────────────────────────────────────────────────────
    const e3Rows = [
      ...makeBIRHeader('E-3'),
      ['Persons with Disability Sales Book/Report'],
      [],
      ['Date', 'Name of Person with Disability (PWD)', 'PWD ID No.', 'PWD TIN', 'SI / OR Number',
        'Sales (incl. VAT)', 'VAT Amount', 'VAT Exempt Sales', 'Discount 5%', 'Discount 20%', 'Net Sales'],
      ...(Array.isArray(pwdOrders) ? pwdOrders : []).map((o: any) => [
        o.date ? format(new Date(o.date), 'MM/dd/yyyy') : '',
        o.customer_name || '',
        o.customer_id_no || '',
        o.customer_tin || '',
        o.receipt_number ? o.receipt_number.toString().padStart(8, '0') : '',
        +(o.subtotal || 0).toFixed(2),
        +(o.tax_amount || 0).toFixed(2),
        +(o.vat_exempt_sales || 0).toFixed(2),
        +(o.discount_5 || 0).toFixed(2),
        +(o.discount_20 || 0).toFixed(2),
        +(o.net_sales || 0).toFixed(2),
      ]),
      Array.isArray(pwdOrders) ? [
        'TOTAL', '', '', '', '',
        +pwdOrders.reduce((s: number, o: any) => s + (o.subtotal || 0), 0).toFixed(2),
        +pwdOrders.reduce((s: number, o: any) => s + (o.tax_amount || 0), 0).toFixed(2),
        +pwdOrders.reduce((s: number, o: any) => s + (o.vat_exempt_sales || 0), 0).toFixed(2),
        +pwdOrders.reduce((s: number, o: any) => s + (o.discount_5 || 0), 0).toFixed(2),
        +pwdOrders.reduce((s: number, o: any) => s + (o.discount_20 || 0), 0).toFixed(2),
        +pwdOrders.reduce((s: number, o: any) => s + (o.net_sales || 0), 0).toFixed(2),
      ] : [],
    ];
    const wsE3 = XLSX.utils.aoa_to_sheet(e3Rows);
    XLSX.utils.book_append_sheet(wb, wsE3, 'Annex E-3 PWD');

    // ── ANNEX E-4 ──────────────────────────────────────────────────────────────
    const e4Rows = [
      ...makeBIRHeader('E-4'),
      ['Solo Parent Sales Book/Report'],
      [],
      ['Date', 'Name of Solo Parent', 'SPIC No.', 'Name of Child', 'Birth Date of Child', 'Age of Child',
        'SI / OR Number', 'Gross Sales', 'Discount', 'Net Sales'],
      ...(Array.isArray(soloOrders) ? soloOrders : []).map((o: any) => [
        o.date ? format(new Date(o.date), 'MM/dd/yyyy') : '',
        o.customer_name || '',
        o.customer_id_no || '',
        o.child_name || '',
        o.child_birthdate || '',
        o.child_age || '',
        o.receipt_number ? o.receipt_number.toString().padStart(8, '0') : '',
        +(o.subtotal || 0).toFixed(2),
        +(o.discount_amount || 0).toFixed(2),
        +(o.net_sales || 0).toFixed(2),
      ]),
      Array.isArray(soloOrders) ? [
        'TOTAL', '', '', '', '', '', '',
        +soloOrders.reduce((s: number, o: any) => s + (o.subtotal || 0), 0).toFixed(2),
        +soloOrders.reduce((s: number, o: any) => s + (o.discount_amount || 0), 0).toFixed(2),
        +soloOrders.reduce((s: number, o: any) => s + (o.net_sales || 0), 0).toFixed(2),
      ] : [],
    ];
    const wsE4 = XLSX.utils.aoa_to_sheet(e4Rows);
    XLSX.utils.book_append_sheet(wb, wsE4, 'Annex E-4 Solo Parent');

    // ── ANNEX E-5 ──────────────────────────────────────────────────────────────
    const e5Rows = [
      ...makeBIRHeader('E-5'),
      ['National Athletes and Coaches Sales Book/Report'],
      [],
      ['Date', 'Name of National Athlete / Coach', 'PNSTM ID No.', 'SI / OR Number',
        'Gross Sales / Receipts', 'Sales Discount', 'Net Sales'],
      ...(Array.isArray(athleteOrders) ? athleteOrders : []).map((o: any) => [
        o.date ? format(new Date(o.date), 'MM/dd/yyyy') : '',
        o.customer_name || '',
        o.customer_id_no || '',
        o.receipt_number ? o.receipt_number.toString().padStart(8, '0') : '',
        +(o.subtotal || 0).toFixed(2),
        +(o.discount_amount || 0).toFixed(2),
        +(o.net_sales || 0).toFixed(2),
      ]),
      Array.isArray(athleteOrders) ? [
        'TOTAL', '', '', '',
        +athleteOrders.reduce((s: number, o: any) => s + (o.subtotal || 0), 0).toFixed(2),
        +athleteOrders.reduce((s: number, o: any) => s + (o.discount_amount || 0), 0).toFixed(2),
        +athleteOrders.reduce((s: number, o: any) => s + (o.net_sales || 0), 0).toFixed(2),
      ] : [],
    ];
    const wsE5 = XLSX.utils.aoa_to_sheet(e5Rows);
    XLSX.utils.book_append_sheet(wb, wsE5, 'Annex E-5 Athletes');

    // ── ANNEX E-6 ──────────────────────────────────────────────────────────────
    const e6Rows = [
      ...makeBIRHeader('E-6'),
      ['Medal of Valor Awardees Sales Book/Report'],
      [],
      ['Date', 'Name of Medal of Valor Awardee', 'Valor ID No.', 'TIN', 'SI / OR Number',
        'Gross Sales / Receipts', 'Sales Discount', 'Net Sales'],
      ...(Array.isArray(valorOrders) ? valorOrders : []).map((o: any) => [
        o.date ? format(new Date(o.date), 'MM/dd/yyyy') : '',
        o.customer_name || '',
        o.customer_id_no || '',
        o.customer_tin || '',
        o.receipt_number ? o.receipt_number.toString().padStart(8, '0') : '',
        +(o.subtotal || 0).toFixed(2),
        +(o.discount_amount || 0).toFixed(2),
        +(o.net_sales || 0).toFixed(2),
      ]),
      Array.isArray(valorOrders) ? [
        'TOTAL', '', '', '', '',
        +valorOrders.reduce((s: number, o: any) => s + (o.subtotal || 0), 0).toFixed(2),
        +valorOrders.reduce((s: number, o: any) => s + (o.discount_amount || 0), 0).toFixed(2),
        +valorOrders.reduce((s: number, o: any) => s + (o.net_sales || 0), 0).toFixed(2),
      ] : [],
    ];
    const wsE6 = XLSX.utils.aoa_to_sheet(e6Rows);
    XLSX.utils.book_append_sheet(wb, wsE6, 'Annex E-6 Medal of Valor');

    // Set column widths for all sheets
    const setColWidths = (ws: XLSX.WorkSheet, widths: number[]) => {
      ws['!cols'] = widths.map(w => ({ wch: w }));
    };
    setColWidths(wsE1, [14, 18, 14, 12, 16, 14, 12, 12, 12, 14, 12, 10, 10, 16, 12, 12, 12, 14, 10, 18, 12, 12, 16, 12, 12, 12, 12]);
    setColWidths(wsE2, [14, 28, 20, 16, 14, 16, 12, 16, 12, 12, 12]);
    setColWidths(wsE3, [14, 28, 16, 14, 14, 16, 12, 16, 12, 12, 12]);
    setColWidths(wsE4, [14, 24, 16, 20, 16, 12, 14, 14, 12, 12]);
    setColWidths(wsE5, [14, 28, 16, 14, 18, 14, 12]);
    setColWidths(wsE6, [14, 28, 16, 14, 14, 18, 14, 12]);

    // Download
    const filename = `BIR_Annexes_E1-E6_${dateRange.start}_to_${dateRange.end}.xlsx`;
    XLSX.writeFile(wb, filename);

    logActivity(user.full_name || user.username || 'Staff', 'Export BIR Annexes', `Exported BIR Annexes E-1 to E-6 as Excel for ${period}`);
  };

  const handleSelectPreset = (preset: 'today' | 'week' | 'month') => {
    const now = getManilaDate();
    if (preset === 'today') {
      setDateRange({
        start: format(now, 'yyyy-MM-dd'),
        end: format(now, 'yyyy-MM-dd')
      });
    } else if (preset === 'week') {
      setDateRange({
        start: format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
        end: format(now, 'yyyy-MM-dd')
      });
    } else if (preset === 'month') {
      setDateRange({
        start: format(startOfMonth(now), 'yyyy-MM-dd'),
        end: format(now, 'yyyy-MM-dd')
      });
    }
  };

  const handleExportSalesReportExcel = () => {
    if (!activeBranch) return;
    const user = JSON.parse(localStorage.getItem('resto_active_user') || '{}');
    const period = `${dateRange.start} to ${dateRange.end}`;
    const companyName = settings?.company_name || activeBranch?.name || 'AllSet POS';
    const branchName = activeBranch?.name || '';
    const reportLabel = REPORT_CATEGORIES.find(c => c.id === reportType)?.label || 'Sales Report';
    const nowStr = format(getManilaDate(), 'MM/dd/yyyy HH:mm:ss');
    const grossSales = summary?.gross_sales || 0;
    const totalDiscounts = summary?.total_discounts || 0;
    const netSales = grossSales - totalDiscounts;

    const htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8" />
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>${reportLabel.replace(/[^a-zA-Z0-9 ]/g, '')}</x:Name>
                <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 12px; color: #1e293b; }
          table { border-collapse: collapse; margin-bottom: 20px; width: 100%; }
          th, td { border: 1px solid #cbd5e1; padding: 8px 12px; }
          .main-header { background-color: #0f172a; color: #ffffff; font-size: 16px; font-weight: bold; text-align: center; padding: 12px; }
          .section-header { background-color: #1e293b; color: #ffffff; font-size: 13px; font-weight: bold; text-align: left; }
          .sub-header { background-color: #334155; color: #ffffff; font-weight: bold; text-align: center; }
          .accent-header { background-color: #4f46e5; color: #ffffff; font-weight: bold; }
          .label { font-weight: 600; color: #475569; }
          .num { text-align: right; font-family: monospace; font-size: 13px; }
          .total-row { background-color: #ecfdf5; color: #047857; font-weight: bold; font-size: 14px; }
          .short-row { color: #dc2626; font-weight: bold; }
          .over-row { color: #059669; font-weight: bold; }
          .meta-box { background-color: #f8fafc; padding: 10px; border: 1px solid #e2e8f0; font-size: 11px; margin-bottom: 15px; }
        </style>
      </head>
      <body>
        <table>
          <tr>
            <th colSpan="4" class="main-header">${companyName.toUpperCase()} - ${branchName.toUpperCase()}</th>
          </tr>
          <tr>
            <th colSpan="4" style="background-color: #0284c7; color: white; font-size: 14px; text-align: center;">
              ${reportLabel.toUpperCase()}
            </th>
          </tr>
        </table>

        <div class="meta-box">
          <b>Date Range / Period:</b> ${period} &nbsp;|&nbsp; 
          <b>Generated On:</b> ${nowStr} &nbsp;|&nbsp; 
          <b>User:</b> ${user.full_name || user.username || 'Staff'} &nbsp;|&nbsp;
          <b>Z-Counter:</b> ${z_counter || 1}
        </div>

        <h3>1. DAILY SALES BREAKDOWN (DAY-BY-DAY)</h3>
        <table>
          <thead>
            <tr class="section-header">
              <th style="width: 150px;">DATE</th>
              <th style="width: 120px; text-align: center;">TRANSACTIONS</th>
              <th style="width: 160px; text-align: right;">GROSS SUBTOTAL (₱)</th>
              <th style="width: 160px; text-align: right;">DISCOUNTS (₱)</th>
              <th style="width: 160px; text-align: right;">NET SALES (₱)</th>
            </tr>
          </thead>
          <tbody>
            ${data?.dailySales && data.dailySales.length > 0 ? data.dailySales.map((d: any) => `
              <tr>
                <td style="font-weight: 600; font-family: monospace;">${d.date}</td>
                <td style="text-align: center;">${d.count || 1}</td>
                <td class="num">₱${(d.gross || d.total || 0).toFixed(2)}</td>
                <td class="num" style="color: #dc2626;">-₱${(d.discounts || 0).toFixed(2)}</td>
                <td class="num" style="color: #047857; font-weight: bold;">₱${(d.net || d.total || 0).toFixed(2)}</td>
              </tr>
            `).join('') : '<tr><td colSpan="5" style="text-align: center; color: #94a3b8;">No daily sales recorded</td></tr>'}
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td>TOTALS</td>
              <td style="text-align: center;">${summary?.total_transactions || 0}</td>
              <td class="num">₱${grossSales.toFixed(2)}</td>
              <td class="num" style="color: #dc2626;">-₱${totalDiscounts.toFixed(2)}</td>
              <td class="num"><b>₱${netSales.toFixed(2)}</b></td>
            </tr>
          </tfoot>
        </table>

        <h3>2. SALES SUMMARY</h3>
        <table>
          <thead>
            <tr class="section-header">
              <th style="width: 300px;">DESCRIPTION</th>
              <th style="width: 200px; text-align: right;">AMOUNT (₱)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="label">Gross Sales</td>
              <td class="num">₱${grossSales.toFixed(2)}</td>
            </tr>
            ${isLaundryBranch ? `
            <tr>
              <td style="padding-left: 25px; color: #64748b;">☕ Coffee Shop Sales Gross</td>
              <td class="num">₱${(summary?.coffee_sales_total || 0).toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding-left: 25px; color: #64748b;">🧺 Laundry Services Gross</td>
              <td class="num">₱${(summary?.laundry_sales_total || 0).toFixed(2)}</td>
            </tr>
            ` : ''}
            <tr>
              <td class="label" style="color: #dc2626;">- Total Discounts Applied</td>
              <td class="num" style="color: #dc2626;">-(₱${totalDiscounts.toFixed(2)})</td>
            </tr>
            <tr class="total-row">
              <td>NET SALES</td>
              <td class="num"><b>₱${netSales.toFixed(2)}</b></td>
            </tr>
          </tbody>
        </table>

        <h3>2. PAYMENT METHOD BREAKDOWN</h3>
        <table>
          <thead>
            <tr class="section-header">
              <th style="width: 250px;">PAYMENT METHOD</th>
              <th style="width: 150px; text-align: center;">TRANSACTION COUNT</th>
              <th style="width: 200px; text-align: right;">TOTAL AMOUNT (₱)</th>
            </tr>
          </thead>
          <tbody>
            ${payments && payments.length > 0 ? payments.map((p: any) => `
              <tr>
                <td style="font-weight: 600;">${p.method === 'credit_card' ? 'CARD' : p.method.toUpperCase()}</td>
                <td style="text-align: center;">${p.count}</td>
                <td class="num">₱${(p.amount || 0).toFixed(2)}</td>
              </tr>
            `).join('') : '<tr><td colSpan="3" style="text-align: center; color: #94a3b8;">No payment transactions recorded</td></tr>'}
          </tbody>
        </table>

        <h3>3. VAT BREAKDOWN</h3>
        <table>
          <thead>
            <tr class="section-header">
              <th style="width: 300px;">VAT CATEGORY</th>
              <th style="width: 200px; text-align: right;">AMOUNT (₱)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="label">VATable Sales</td>
              <td class="num">₱${(summary?.vatable_sales || 0).toFixed(2)}</td>
            </tr>
            <tr>
              <td class="label">VAT Exempt Sales</td>
              <td class="num">₱${(summary?.vat_exempt_sales || 0).toFixed(2)}</td>
            </tr>
            <tr>
              <td class="label">Zero Rated Sales</td>
              <td class="num">₱0.00</td>
            </tr>
            <tr class="total-row">
              <td>TOTAL VAT AMOUNT (12%)</td>
              <td class="num"><b>₱${(summary?.total_vat || 0).toFixed(2)}</b></td>
            </tr>
          </tbody>
        </table>

        ${shiftData && shiftData.length > 0 ? `
        <h3>4. CASHIER SHIFT SUMMARY</h3>
        <table>
          <thead>
            <tr class="section-header">
              <th>CASHIER NAME / SHIFT NO</th>
              <th>TIME IN</th>
              <th>TIME OUT</th>
              <th style="text-align: right;">SHIFT SALES</th>
              <th style="text-align: right;">START CASH</th>
              <th style="text-align: right;">EXPECTED CASH</th>
              <th style="text-align: right;">END CASH</th>
              <th style="text-align: right;">OVER / SHORT</th>
            </tr>
          </thead>
          <tbody>
            ${shiftData.map((s: any) => {
              const cashierName = s.users?.full_name || s.users?.username || 'Cashier';
              let shiftCash = 0;
              if (s.orders) {
                s.orders.forEach((o: any) => {
                  if ((o.payment_method || 'CASH').toUpperCase() === 'CASH') shiftCash += (o.total || 0);
                });
              }
              const expectedCash = (s.cash_in || 0) + shiftCash;
              const diff = s.cash_out !== null && s.cash_out !== undefined ? s.cash_out - expectedCash : null;
              const diffText = diff !== null ? (diff >= 0 ? `+₱${diff.toFixed(2)} (Over)` : `-₱${Math.abs(diff).toFixed(2)} (Short)`) : 'Active Shift';
              const diffClass = diff !== null ? (diff >= 0 ? 'over-row' : 'short-row') : '';
              return `
                <tr>
                  <td style="font-weight: bold;">${cashierName} (Shift #${s.id})</td>
                  <td>${s.time_in ? format(new Date(s.time_in), 'MM/dd/yyyy hh:mm a') : ''}</td>
                  <td>${s.time_out ? format(new Date(s.time_out), 'MM/dd/yyyy hh:mm a') : 'Active'}</td>
                  <td class="num">₱${(s.total_sales || 0).toFixed(2)}</td>
                  <td class="num">₱${(s.cash_in || 0).toFixed(2)}</td>
                  <td class="num">₱${expectedCash.toFixed(2)}</td>
                  <td class="num">${s.cash_out !== null && s.cash_out !== undefined ? `₱${s.cash_out.toFixed(2)}` : 'Active'}</td>
                  <td class="num ${diffClass}">${diffText}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        ` : ''}

        ${voidedTransactions && voidedTransactions.length > 0 ? `
        <h3>5. VOIDED TRANSACTIONS</h3>
        <table>
          <thead>
            <tr class="section-header">
              <th>ORDER NO</th>
              <th>INVOICE NO</th>
              <th>CASHIER / STAFF</th>
              <th>TIMESTAMP</th>
              <th style="text-align: right;">AMOUNT (₱)</th>
            </tr>
          </thead>
          <tbody>
            ${voidedTransactions.map((v: any) => `
              <tr>
                <td>#${v.id ? v.id.toString().padStart(6, '0') : ''}</td>
                <td>${v.receipt_number !== undefined && v.receipt_number !== null ? '#' + v.receipt_number.toString().padStart(6, '0') : 'N/A'}</td>
                <td>${v.users?.full_name || v.users?.username || 'Staff'}</td>
                <td>${v.updated_at || v.created_at ? format(new Date(v.updated_at || v.created_at), 'MM/dd/yyyy hh:mm a') : ''}</td>
                <td class="num" style="color: #dc2626; font-weight: bold;">₱${(v.total || 0).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ` : ''}
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Sales_Report_${reportType}_${dateRange.start}_to_${dateRange.end}.xls`;
    a.click();
    window.URL.revokeObjectURL(url);

    logActivity(user.full_name || user.username || 'Staff', 'Export Sales Report Excel', `Exported ${reportLabel} to Excel for ${period}`);
  };



  const printSingleShiftReport = (shift: any) => {
    setSingleShiftToPrint(shift);
    const user = JSON.parse(localStorage.getItem('resto_active_user') || '{}');
    logActivity(
      user.full_name || user.username || 'Staff',
      'Print Single Shift Report',
      `Printed Shift Report for cashier ${shift.users?.full_name || shift.users?.username} on ${format(new Date(shift.time_in), 'MM/dd/yyyy')}`
    );

    setTimeout(() => {
      window.print();
      setSingleShiftToPrint(null);
    }, 150);
  };

  const safeDate = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00');
  };

  const handleDownloadTxt = () => {
    if (!eJournalData.length) return;
    const user = JSON.parse(localStorage.getItem('resto_active_user') || '{}');
    logActivity(user.full_name || user.username || 'Staff', 'Download E-Journal', `Downloaded E-Journal as TXT for ${dateRange.start} to ${dateRange.end}`);

    let content = `E-JOURNAL REPORT\n`;
    content += `Generated On: ${format(getManilaDate(), 'MM/dd/yyyy HH:mm:ss')}\n`;
    content += `Date Range: ${format(safeDate(dateRange.start), 'MM/dd/yyyy')} to ${format(safeDate(dateRange.end), 'MM/dd/yyyy')}\n`;
    content += `====================================\n\n`;

    eJournalData.forEach((order: any) => {
      content += `Order No  : ${order.id.toString().padStart(8, '0')}\n`;
      content += `Invoice No: ${order.receipt_number !== undefined && order.receipt_number !== null ? order.receipt_number.toString().padStart(8, '0') : 'PENDING'}\n`;
      content += `Date/Time : ${format(new Date(new Date(order.updated_at || order.created_at).toLocaleString("en-US", { timeZone: "Asia/Manila" })), 'MM/dd/yyyy HH:mm:ss')}\n`;
      content += `Status    : ${order.status.toUpperCase()}\n`;
      content += `------------------------------------\n`;
      if (order.items) {
        order.items.forEach((item: any) => {
          const compTag = item.is_complimentary ? ' [COMP]' : '';
          const displayPrice = item.is_complimentary ? '0.00' : (item.price * item.quantity).toFixed(2);
          content += `${item.quantity.toString().padEnd(4)} ${((item.name || item.product_name || '') + compTag).padEnd(20)} ${displayPrice.padStart(8)}\n`;
        });
      }
      content += `------------------------------------\n`;
      content += `Subtotal  : ${order.subtotal?.toFixed(2).padStart(24)}\n`;
      if (order.discount_amount > 0) {
        const dName = (order.discounts?.name || 'Discount').padEnd(10);
        content += `${dName}: -${order.discount_amount?.toFixed(2).padStart(23)}\n`;
      }
      content += `Total     : ${order.total?.toFixed(2).padStart(24)}\n`;
      content += `Total VAT : ${order.tax_amount?.toFixed(2).padStart(24)}\n`;
      content += `====================================\n\n`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ejournal_${dateRange.start}_${dateRange.end}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const { summary, discounts, payments, accumulated_grand_total, z_counter } = data;

  const renderZYReport = () => {
    const dailyList = data?.dailySales || [];
    const totalDailyGross = dailyList.reduce((s: number, d: any) => s + (d.gross || d.total || 0), 0);
    const totalDailyDisc = dailyList.reduce((s: number, d: any) => s + (d.discounts || 0), 0);
    const totalDailyNet = dailyList.reduce((s: number, d: any) => s + (d.net || d.total || 0), 0);
    const totalDailyTxns = dailyList.reduce((s: number, d: any) => s + (d.count || 0), 0);

    return (
      <div className="w-full bg-white p-2 sm:p-4 rounded-2xl border border-slate-200 shadow-xs font-sans text-slate-800">
        
        {/* Excel Header Banner */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-t-2xl shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-700 pb-3 mb-3">
            <div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight uppercase">
                {settings?.company_name || activeBranch?.name || 'ESPRESSO YOURSELF & TEA HOUSE'}
              </h2>
              <p className="text-xs text-slate-300 font-medium">{activeBranch?.address || 'Branch Address'}</p>
            </div>
            <div className="bg-emerald-500 text-slate-950 font-black px-4 py-1.5 rounded-xl text-xs sm:text-sm uppercase tracking-wider self-start md:self-center shadow-xs">
              {reportType === 'Z' ? 'Z-READING REPORT (DAILY EXCEL VIEW)' : reportType === 'Y' ? 'Y-READING REPORT (PERIOD EXCEL VIEW)' : 'X-READING REPORT (INTERIM EXCEL VIEW)'}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-semibold text-slate-300">
            <div>
              <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Report Period</span>
              <span className="text-white font-bold">
                {reportType === 'Z'
                  ? format(safeDate(dateRange.start), 'MM/dd/yyyy')
                  : `${format(safeDate(dateRange.start), 'MM/dd/yyyy')} - ${format(safeDate(dateRange.end), 'MM/dd/yyyy')}`
                }
              </span>
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Generated Date/Time</span>
              <span className="text-white font-bold">{format(getManilaDate(), 'MM/dd/yyyy HH:mm:ss')}</span>
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Counter Ref</span>
              <span className="text-white font-bold">{reportType === 'Z' ? 'Z-Counter' : 'Y-Counter'} #{z_counter.toString().padStart(6, '0')}</span>
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Branch</span>
              <span className="text-white font-bold">{activeBranch?.name}</span>
            </div>
          </div>
        </div>

        {/* Excel Spreadsheet View Tables Container */}
        <div className="p-3 sm:p-4 bg-slate-50 border-x border-b border-slate-200 rounded-b-2xl space-y-5">

          {/* TABLE 1: DAILY SALES BREAKDOWN TABLE (DAY-BY-DAY EXCEL SPREADSHEET GRID) */}
          <div className="bg-white rounded-xl border border-slate-300 overflow-hidden shadow-xs">
            <div className="bg-slate-800 text-white px-4 py-2.5 flex items-center justify-between font-black text-xs uppercase tracking-wider">
              <span className="flex items-center gap-2">
                <TableIcon size={14} className="text-emerald-400" />
                1. Daily Sales Breakdown (Day-By-Day Spreadsheet)
              </span>
              <span className="text-[10px] bg-slate-700 px-2.5 py-0.5 rounded-full text-slate-200 font-bold">{dailyList.length} Days Recorded</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-medium border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 text-[10px] font-black uppercase tracking-wider">
                    <th className="py-2.5 px-4 border-r border-slate-300">Date</th>
                    <th className="py-2.5 px-4 border-r border-slate-300 text-center">Transactions</th>
                    <th className="py-2.5 px-4 border-r border-slate-300 text-right">Gross Subtotal (₱)</th>
                    <th className="py-2.5 px-4 border-r border-slate-300 text-right">Discounts (₱)</th>
                    <th className="py-2.5 px-4 text-right">Net Sales (₱)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {dailyList.length > 0 ? dailyList.map((d: any, idx: number) => {
                    const gross = d.gross || d.total || 0;
                    const disc = d.discounts || 0;
                    const net = d.net || d.total || 0;
                    return (
                      <tr key={d.date || idx} className="hover:bg-slate-50 transition-colors odd:bg-white even:bg-slate-50/50">
                        <td className="py-2 px-4 border-r border-slate-200 font-mono font-bold text-slate-800">{d.date}</td>
                        <td className="py-2 px-4 border-r border-slate-200 text-center font-bold text-slate-700">{d.count || 1}</td>
                        <td className="py-2 px-4 border-r border-slate-200 text-right font-mono text-slate-800">₱{gross.toFixed(2)}</td>
                        <td className="py-2 px-4 border-r border-slate-200 text-right font-mono text-rose-600 font-semibold">{disc > 0 ? `-₱${disc.toFixed(2)}` : '₱0.00'}</td>
                        <td className="py-2 px-4 text-right font-mono font-bold text-emerald-700">₱{net.toFixed(2)}</td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400 italic">No daily sales transactions recorded for this period.</td>
                    </tr>
                  )}
                </tbody>
                {dailyList.length > 0 && (
                  <tfoot>
                    <tr className="bg-emerald-50 text-emerald-950 border-t-2 border-slate-400 font-black text-xs">
                      <td className="py-3 px-4 border-r border-emerald-200 uppercase tracking-wider">PERIOD TOTALS</td>
                      <td className="py-3 px-4 border-r border-emerald-200 text-center">{totalDailyTxns || summary?.total_transactions || 0}</td>
                      <td className="py-3 px-4 border-r border-emerald-200 text-right font-mono">₱{(summary?.gross_sales || totalDailyGross).toFixed(2)}</td>
                      <td className="py-3 px-4 border-r border-emerald-200 text-right font-mono text-rose-700">-₱{(summary?.total_discounts || totalDailyDisc).toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-700 text-sm">₱{((summary?.gross_sales || totalDailyGross) - (summary?.total_discounts || totalDailyDisc)).toFixed(2)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* TABLE 2: SALES & FINANCIAL SUMMARY TABLE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl border border-slate-300 overflow-hidden shadow-xs">
              <div className="bg-slate-800 text-white px-4 py-2 flex items-center justify-between font-black text-xs uppercase tracking-wider">
                <span>2. Financial Revenue Summary</span>
              </div>
              <table className="w-full text-xs font-medium border-collapse">
                <tbody className="divide-y divide-slate-200">
                  <tr className="bg-white">
                    <td className="py-2.5 px-4 font-bold text-slate-700 border-r border-slate-200">Gross Sales</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">₱{(summary?.gross_sales || 0).toFixed(2)}</td>
                  </tr>
                  {isLaundryBranch && (
                    <>
                      <tr className="bg-slate-50/50">
                        <td className="py-2 px-4 text-slate-600 pl-6 border-r border-slate-200">☕ Coffee Shop Sales Gross</td>
                        <td className="py-2 px-4 text-right font-mono text-slate-700">₱{(summary?.coffee_sales_total || 0).toFixed(2)}</td>
                      </tr>
                      <tr className="bg-slate-50/50">
                        <td className="py-2 px-4 text-slate-600 pl-6 border-r border-slate-200">🧺 Laundry Services Gross</td>
                        <td className="py-2 px-4 text-right font-mono text-slate-700">₱{(summary?.laundry_sales_total || 0).toFixed(2)}</td>
                      </tr>
                    </>
                  )}
                  <tr className="bg-rose-50/30">
                    <td className="py-2.5 px-4 font-bold text-rose-700 border-r border-slate-200">- Total Discounts Applied</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-rose-700">-(₱{(summary?.total_discounts || 0).toFixed(2)})</td>
                  </tr>
                  <tr className="bg-emerald-50 text-emerald-950 font-black text-sm border-t-2 border-slate-300">
                    <td className="py-3 px-4 border-r border-emerald-200 uppercase tracking-wider">NET SALES REVENUE</td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-700">₱{((summary?.gross_sales || 0) - (summary?.total_discounts || 0)).toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* TABLE 3: PAYMENT METHOD BREAKDOWN */}
            <div className="bg-white rounded-xl border border-slate-300 overflow-hidden shadow-xs">
              <div className="bg-slate-800 text-white px-4 py-2 flex items-center justify-between font-black text-xs uppercase tracking-wider">
                <span>3. Payment Method Breakdown</span>
              </div>
              <table className="w-full text-xs font-medium border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 text-[10px] font-black uppercase tracking-wider">
                    <th className="py-2 px-4 border-r border-slate-300">Payment Method</th>
                    <th className="py-2 px-4 border-r border-slate-300 text-center">Txn Count</th>
                    <th className="py-2 px-4 text-right">Total Amount (₱)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {payments?.length > 0 ? payments.map((p: any, idx: number) => {
                    let label = p.method === 'credit_card' ? 'CARD' : p.method.toUpperCase();
                    return (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2 px-4 border-r border-slate-200 font-bold text-slate-800">{label}</td>
                        <td className="py-2 px-4 border-r border-slate-200 text-center font-semibold text-slate-600">{p.count}</td>
                        <td className="py-2 px-4 text-right font-mono font-bold text-slate-900">₱{(p.amount || 0).toFixed(2)}</td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan={3} className="py-6 text-center text-slate-400 italic">No payments recorded</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* TABLE 4 & 5: DISCOUNTS & VOIDED TRANSACTIONS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl border border-slate-300 overflow-hidden shadow-xs">
              <div className="bg-slate-800 text-white px-4 py-2 flex items-center justify-between font-black text-xs uppercase tracking-wider">
                <span>4. Discounts Applied Breakdown</span>
              </div>
              <table className="w-full text-xs font-medium border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 text-[10px] font-black uppercase tracking-wider">
                    <th className="py-2 px-4 border-r border-slate-300">Discount Type</th>
                    <th className="py-2 px-4 border-r border-slate-300 text-center">Count</th>
                    <th className="py-2 px-4 text-right">Discount Amount (₱)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {discounts?.length > 0 ? discounts.map((d: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2 px-4 border-r border-slate-200 font-bold text-slate-800">{d.name}</td>
                      <td className="py-2 px-4 border-r border-slate-200 text-center font-semibold text-slate-600">{d.count}</td>
                      <td className="py-2 px-4 text-right font-mono font-bold text-rose-600">₱{(d.amount || 0).toFixed(2)}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={3} className="py-6 text-center text-slate-400 italic">No discounts applied</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="bg-white rounded-xl border border-slate-300 overflow-hidden shadow-xs">
              <div className="bg-slate-800 text-white px-4 py-2 flex items-center justify-between font-black text-xs uppercase tracking-wider">
                <span>5. Voided Transactions Summary</span>
              </div>
              <table className="w-full text-xs font-medium border-collapse">
                <tbody className="divide-y divide-slate-200">
                  <tr className="bg-white">
                    <td className="py-2.5 px-4 font-bold text-slate-700 border-r border-slate-200">Voided Transactions Count</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">{summary?.total_voided_transactions || 0}</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="py-2.5 px-4 font-bold text-slate-700 border-r border-slate-200">Total Voided Amount</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-rose-600">₱{(summary?.total_voided_amount || 0).toFixed(2)}</td>
                  </tr>
                  <tr className="bg-white">
                    <td className="py-2.5 px-4 font-bold text-slate-700 border-r border-slate-200">Accumulated Grand Total</td>
                    <td className="py-2.5 px-4 text-right font-mono font-black text-slate-900 text-sm">₱{(accumulated_grand_total || 0).toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // SHARED BIR HEADER BLOCK (all annexes E-1 to E-5)
  // ─────────────────────────────────────────────────────────────────────────────
  const renderBIRHeader = (annexLabel: string) => {
    const activeUser = (() => { try { return JSON.parse(localStorage.getItem('resto_active_user') || '{}'); } catch { return {}; } })();
    return (
      <div className="mb-4 text-[11px] leading-relaxed print:text-[9px] print:mb-2">
        <div className="grid grid-cols-2 items-start">
          <div className="space-y-0.5">
            <p><span className="font-semibold">Name of Taxpayer:</span> {settings?.company_name || activeBranch?.name || 'ESPRESSO YOURSELF & TEA HOUSE'}</p>
            <p><span className="font-semibold">Address of Taxpayer:</span> {settings?.address || activeBranch?.address || 'Room 1 Crown Bldg North road 6, North Reclamation Area Mabolo Cebu City'}</p>
            <p><span className="font-semibold">TIN:</span> {settings?.tin || '899-352-898-00000'}</p>
            <p className="mt-2"><span className="font-semibold">Software Name and Version No.:</span> POS v1.0.0</p>
            <p><span className="font-semibold">Date and Time Generated:</span> {format(getManilaDate(), 'MM/dd/yyyy HH:mm:ss')}</p>
            <p><span className="font-semibold">UserID:</span> {activeUser?.username || activeUser?.full_name || ''}</p>
          </div>
          <div className="text-right font-black text-xl border-2 border-black self-start ml-auto px-4 py-2 print:text-[14px]">
            ANNEX "{annexLabel}"
          </div>
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // ANNEX E-1: BIR Sales Summary Report
  // ─────────────────────────────────────────────────────────────────────────────
  const renderBIRSalesSummaryAnnexE1 = () => {
    const scDisc = discounts?.find(d => d.name.toLowerCase().includes('senior') || d.name.toLowerCase().includes('sc'));
    const pwdDisc = discounts?.find(d => d.name.toLowerCase().includes('pwd') || d.name.toLowerCase().includes('disab'));
    const naacDisc = discounts?.find(d => d.name.toLowerCase().includes('athlete') || d.name.toLowerCase().includes('naac') || d.name.toLowerCase().includes('coach'));
    const soloDisc = discounts?.find(d => d.name.toLowerCase().includes('solo'));
    const otherDiscounts = discounts?.filter(d => {
      const n = d.name.toLowerCase();
      return !n.includes('senior') && !n.includes('sc') && !n.includes('pwd') && !n.includes('disab') &&
        !n.includes('athlete') && !n.includes('naac') && !n.includes('coach') && !n.includes('solo');
    });
    const otherDiscTotal = otherDiscounts?.reduce((s: number, d: any) => s + d.amount, 0) || 0;

    const scAmt = scDisc?.amount || 0;
    const pwdAmt = pwdDisc?.amount || 0;
    const naacAmt = naacDisc?.amount || 0;
    const soloAmt = soloDisc?.amount || 0;
    const totalDeductions = scAmt + pwdAmt + naacAmt + soloAmt + otherDiscTotal + (summary?.total_voided_amount || 0);

    // VAT adjustments: 5% relief = VAT amount removed for exempt transactions
    const scVatAdj = scAmt > 0 ? +(scAmt / 1.20 * 0.12).toFixed(2) : 0;
    const pwdVatAdj = pwdAmt > 0 ? +(pwdAmt / 1.20 * 0.12).toFixed(2) : 0;
    const otherVatAdj = 0;
    const vatOnReturns = 0;
    const totalVatAdj = scVatAdj + pwdVatAdj + otherVatAdj + vatOnReturns;
    const vatPayable = (summary?.total_vat || 0) - totalVatAdj;
    const netSales = (summary?.gross_sales || 0) - totalDeductions;

    // dailySales rows
    const rows = data.dailySales && data.dailySales.length > 0 ? data.dailySales : [
      { date: dateRange.start, total: summary?.total_sales || 0 }
    ];

    const tdCls = "border border-black px-1 py-0.5 text-center text-[7px] print:text-[6px] whitespace-nowrap";
    const thCls = "border border-black px-1 py-0.5 text-center text-[7px] print:text-[6px] font-bold bg-yellow-300 print:bg-yellow-100 whitespace-nowrap";

    return (
      <div className="print:p-0">
        {renderBIRHeader('E-1')}
        <h3 className="text-center font-black text-sm border border-black py-1 mb-2 print:text-[10px]">
          BIR SALES SUMMARY REPORT
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-black text-[7px] print:text-[6px]">
            <thead>
              <tr>
                <th rowSpan={3} className={thCls} style={{ minWidth: '36px' }}>OR / Date</th>
                <th rowSpan={3} className={thCls}>Gross Sales for the Day</th>
                <th rowSpan={3} className={thCls}>VATable Sales</th>
                <th rowSpan={3} className={thCls}>VAT Amount</th>
                <th rowSpan={3} className={thCls}>VAT-Exempt Sales</th>
                <th rowSpan={3} className={thCls}>Zero-Rated Sales</th>
                <th colSpan={8} className={thCls}>Deductions</th>
                <th colSpan={6} className="border border-black px-1 py-0.5 text-center text-[7px] font-bold bg-green-200 print:bg-green-100">Adjustment on VAT</th>
                <th rowSpan={3} className={thCls}>VAT Payable</th>
                <th rowSpan={3} className={thCls}>Net Sales</th>
                <th rowSpan={3} className={thCls}>Sales Overrun / Overflow</th>
                <th rowSpan={3} className={thCls}>Total Income</th>
                <th rowSpan={3} className={thCls}>Reset Counter</th>
                <th rowSpan={3} className={thCls}>Z-Counter</th>
                <th rowSpan={3} className={thCls}>Remarks</th>
              </tr>
              <tr>
                <th colSpan={5} className={thCls}>Discount</th>
                <th rowSpan={2} className={thCls}>Returns</th>
                <th rowSpan={2} className={thCls}>Voids</th>
                <th rowSpan={2} className={thCls}>Total Deductions</th>
                <th colSpan={3} className="border border-black px-1 py-0.5 text-center text-[7px] font-bold bg-green-200 print:bg-green-100">Discount</th>
                <th rowSpan={2} className="border border-black px-1 py-0.5 text-center text-[7px] font-bold bg-green-200 print:bg-green-100">VAT on Returns</th>
                <th rowSpan={2} className="border border-black px-1 py-0.5 text-center text-[7px] font-bold bg-green-200 print:bg-green-100">Others</th>
                <th rowSpan={2} className="border border-black px-1 py-0.5 text-center text-[7px] font-bold bg-green-200 print:bg-green-100">Total VAT Adjustment</th>
              </tr>
              <tr>
                <th className={thCls}>SC</th>
                <th className={thCls}>PWD</th>
                <th className={thCls}>NAAC</th>
                <th className={thCls}>Solo Parent</th>
                <th className={thCls}>Others</th>
                <th className="border border-black px-1 py-0.5 text-center text-[7px] font-bold bg-green-200 print:bg-green-100">SC</th>
                <th className="border border-black px-1 py-0.5 text-center text-[7px] font-bold bg-green-200 print:bg-green-100">PWD</th>
                <th className="border border-black px-1 py-0.5 text-center text-[7px] font-bold bg-green-200 print:bg-green-100">Others</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row: any, i: number) => {
                const rowGross = row.total || 0;
                return (
                  <tr key={i} className="hover:bg-yellow-50">
                    <td className={tdCls}>{row.date ? format(safeDate(row.date), 'MM/dd/yyyy') : ''}</td>
                    <td className={tdCls}>{rowGross.toFixed(2)}</td>
                    <td className={tdCls}>{(summary?.vatable_sales || 0).toFixed(2)}</td>
                    <td className={tdCls}>{(summary?.total_vat || 0).toFixed(2)}</td>
                    <td className={tdCls}>{(summary?.vat_exempt_sales || 0).toFixed(2)}</td>
                    <td className={tdCls}>0.00</td>
                    <td className={tdCls}>{scAmt.toFixed(2)}</td>
                    <td className={tdCls}>{pwdAmt.toFixed(2)}</td>
                    <td className={tdCls}>{naacAmt.toFixed(2)}</td>
                    <td className={tdCls}>{soloAmt.toFixed(2)}</td>
                    <td className={tdCls}>{otherDiscTotal.toFixed(2)}</td>
                    <td className={tdCls}>0.00</td>
                    <td className={tdCls}>{(summary?.total_voided_amount || 0).toFixed(2)}</td>
                    <td className={tdCls + ' font-bold'}>{totalDeductions.toFixed(2)}</td>
                    <td className={tdCls}>{scVatAdj.toFixed(2)}</td>
                    <td className={tdCls}>{pwdVatAdj.toFixed(2)}</td>
                    <td className={tdCls}>{otherVatAdj.toFixed(2)}</td>
                    <td className={tdCls}>{vatOnReturns.toFixed(2)}</td>
                    <td className={tdCls}>0.00</td>
                    <td className={tdCls + ' font-bold'}>{totalVatAdj.toFixed(2)}</td>
                    <td className={tdCls + ' font-bold'}>{vatPayable.toFixed(2)}</td>
                    <td className={tdCls + ' font-bold'}>{netSales.toFixed(2)}</td>
                    <td className={tdCls}>0.00</td>
                    <td className={tdCls}>{netSales.toFixed(2)}</td>
                    <td className={tdCls}>0</td>
                    <td className={tdCls}>{data.z_counter || 1}</td>
                    <td className={tdCls}></td>
                  </tr>
                );
              })}
              {/* Totals row */}
              <tr className="font-bold bg-yellow-50">
                <td className={tdCls + ' font-black'}>TOTAL</td>
                <td className={tdCls}>{(summary?.gross_sales || 0).toFixed(2)}</td>
                <td className={tdCls}>{(summary?.vatable_sales || 0).toFixed(2)}</td>
                <td className={tdCls}>{(summary?.total_vat || 0).toFixed(2)}</td>
                <td className={tdCls}>{(summary?.vat_exempt_sales || 0).toFixed(2)}</td>
                <td className={tdCls}>0.00</td>
                <td className={tdCls}>{scAmt.toFixed(2)}</td>
                <td className={tdCls}>{pwdAmt.toFixed(2)}</td>
                <td className={tdCls}>{naacAmt.toFixed(2)}</td>
                <td className={tdCls}>{soloAmt.toFixed(2)}</td>
                <td className={tdCls}>{otherDiscTotal.toFixed(2)}</td>
                <td className={tdCls}>0.00</td>
                <td className={tdCls}>{(summary?.total_voided_amount || 0).toFixed(2)}</td>
                <td className={tdCls}>{totalDeductions.toFixed(2)}</td>
                <td className={tdCls}>{scVatAdj.toFixed(2)}</td>
                <td className={tdCls}>{pwdVatAdj.toFixed(2)}</td>
                <td className={tdCls}>{otherVatAdj.toFixed(2)}</td>
                <td className={tdCls}>{vatOnReturns.toFixed(2)}</td>
                <td className={tdCls}>0.00</td>
                <td className={tdCls}>{totalVatAdj.toFixed(2)}</td>
                <td className={tdCls}>{vatPayable.toFixed(2)}</td>
                <td className={tdCls}>{netSales.toFixed(2)}</td>
                <td className={tdCls}>0.00</td>
                <td className={tdCls}>{netSales.toFixed(2)}</td>
                <td className={tdCls}>0</td>
                <td className={tdCls}>{data.z_counter || 1}</td>
                <td className={tdCls}></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // ANNEX E-2: Senior Citizen Sales Book/Report
  // ─────────────────────────────────────────────────────────────────────────────
  const renderBIRAnnexE2SC = () => {
    const tdCls = "border border-black px-1.5 py-1 text-[9px] print:text-[8px]";
    const thCls = "border border-black px-1.5 py-1 text-center text-[9px] print:text-[8px] font-bold";
    const totalGross = discountOrders.reduce((s, o) => s + (o.subtotal || 0), 0);
    const totalVat = discountOrders.reduce((s, o) => s + (o.tax_amount || 0), 0);
    const totalExempt = discountOrders.reduce((s, o) => s + (o.vat_exempt_sales || 0), 0);
    const totalD5 = discountOrders.reduce((s, o) => s + (o.discount_5 || 0), 0);
    const totalD20 = discountOrders.reduce((s, o) => s + (o.discount_20 || 0), 0);
    const totalNet = discountOrders.reduce((s, o) => s + (o.net_sales || 0), 0);
    return (
      <div className="print:p-0">
        {renderBIRHeader('E-2')}
        <h3 className="text-center font-black text-sm border border-black py-1 mb-2 print:text-[10px]">
          Senior Citizen Sales Book/Report
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-black">
            <thead>
              <tr>
                <th className={thCls} style={{ background: '#9e9e9e', color: 'white' }}>Date</th>
                <th className={thCls} style={{ background: '#4fc3f7' }}>Name of Senior Citizen (SC)</th>
                <th className={thCls} style={{ background: '#ffd54f' }}>OSCA ID No. / SC ID No.</th>
                <th className={thCls} style={{ background: '#ce93d8' }}>SC TIN</th>
                <th className={thCls} style={{ background: '#ffd54f' }}>SI/OR Number</th>
                <th className={thCls} style={{ background: '#a5d6a7' }}>Sales (inclusive of VAT)</th>
                <th className={thCls} style={{ background: '#ef9a9a' }}>VAT Amount</th>
                <th className={thCls} style={{ background: '#80cbc4' }}>VAT Exempt Sales</th>
                <th className={thCls} style={{ background: '#ffd54f' }}>Discount 5%</th>
                <th className={thCls} style={{ background: '#ff7043', color: 'white' }}>Discount 20%</th>
                <th className={thCls} style={{ background: '#ce93d8' }}>Net Sales</th>
              </tr>
            </thead>
            <tbody>
              {discountOrders.length === 0 && (
                <tr><td colSpan={11} className={tdCls + ' text-center italic text-slate-400'}>No senior citizen transactions found for this period.</td></tr>
              )}
              {discountOrders.map((o, i) => (
                <tr key={i} className="hover:bg-blue-50">
                  <td className={tdCls}>{o.date ? format(new Date(o.date), 'MM/dd/yyyy') : ''}</td>
                  <td className={tdCls}>{o.customer_name || ''}</td>
                  <td className={tdCls}>{o.customer_id_no || ''}</td>
                  <td className={tdCls}>{o.customer_tin || ''}</td>
                  <td className={tdCls + ' text-center'}>{o.receipt_number?.toString().padStart(8, '0') || ''}</td>
                  <td className={tdCls + ' text-right'}>{(o.subtotal || 0).toFixed(2)}</td>
                  <td className={tdCls + ' text-right'}>{(o.tax_amount || 0).toFixed(2)}</td>
                  <td className={tdCls + ' text-right'}>{(o.vat_exempt_sales || 0).toFixed(2)}</td>
                  <td className={tdCls + ' text-right'}>{(o.discount_5 || 0).toFixed(2)}</td>
                  <td className={tdCls + ' text-right'}>{(o.discount_20 || 0).toFixed(2)}</td>
                  <td className={tdCls + ' text-right font-bold'}>{(o.net_sales || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-bold bg-yellow-50">
                <td colSpan={5} className={tdCls + ' text-right font-black'}>TOTAL</td>
                <td className={tdCls + ' text-right'}>{totalGross.toFixed(2)}</td>
                <td className={tdCls + ' text-right'}>{totalVat.toFixed(2)}</td>
                <td className={tdCls + ' text-right'}>{totalExempt.toFixed(2)}</td>
                <td className={tdCls + ' text-right'}>{totalD5.toFixed(2)}</td>
                <td className={tdCls + ' text-right'}>{totalD20.toFixed(2)}</td>
                <td className={tdCls + ' text-right font-black'}>{totalNet.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <p className="text-[8px] italic text-slate-500 mt-2 print:text-[7px] print:text-black">
          * Customer name, ID No., and TIN must be recorded at point of sale per BIR RMO 24-2023.
        </p>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // ANNEX E-3: Persons with Disability Sales Book/Report
  // ─────────────────────────────────────────────────────────────────────────────
  const renderBIRAnnexE3PWD = () => {
    const tdCls = "border border-black px-1.5 py-1 text-[9px] print:text-[8px]";
    const thCls = "border border-black px-1.5 py-1 text-center text-[9px] print:text-[8px] font-bold";
    const totalGross = discountOrders.reduce((s, o) => s + (o.subtotal || 0), 0);
    const totalVat = discountOrders.reduce((s, o) => s + (o.tax_amount || 0), 0);
    const totalExempt = discountOrders.reduce((s, o) => s + (o.vat_exempt_sales || 0), 0);
    const totalD5 = discountOrders.reduce((s, o) => s + (o.discount_5 || 0), 0);
    const totalD20 = discountOrders.reduce((s, o) => s + (o.discount_20 || 0), 0);
    const totalNet = discountOrders.reduce((s, o) => s + (o.net_sales || 0), 0);
    return (
      <div className="print:p-0">
        {renderBIRHeader('E-3')}
        <h3 className="text-center font-black text-sm border border-black py-1 mb-2 print:text-[10px]">
          Persons with Disability Sales Book/Report
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-black">
            <thead>
              <tr>
                <th className={thCls} style={{ background: '#9e9e9e', color: 'white' }}>Date</th>
                <th className={thCls} style={{ background: '#4fc3f7' }}>Name of Person with Disability (PWD)</th>
                <th className={thCls} style={{ background: '#ffd54f' }}>PWD ID No.</th>
                <th className={thCls} style={{ background: '#ce93d8' }}>PWD TIN</th>
                <th className={thCls} style={{ background: '#ffd54f' }}>SI / OR Number</th>
                <th className={thCls} style={{ background: '#a5d6a7' }}>Sales (inclusive of VAT)</th>
                <th className={thCls} style={{ background: '#ef9a9a' }}>VAT Amount</th>
                <th className={thCls} style={{ background: '#80cbc4' }}>VAT Exempt Sales</th>
                <th className={thCls} style={{ background: '#ffd54f' }}>Discount 5%</th>
                <th className={thCls} style={{ background: '#ff7043', color: 'white' }}>Discount 20%</th>
                <th className={thCls} style={{ background: '#ce93d8' }}>Net Sales</th>
              </tr>
            </thead>
            <tbody>
              {discountOrders.length === 0 && (
                <tr><td colSpan={11} className={tdCls + ' text-center italic text-slate-400'}>No PWD transactions found for this period.</td></tr>
              )}
              {discountOrders.map((o, i) => (
                <tr key={i} className="hover:bg-blue-50">
                  <td className={tdCls}>{o.date ? format(new Date(o.date), 'MM/dd/yyyy') : ''}</td>
                  <td className={tdCls}>{o.customer_name || ''}</td>
                  <td className={tdCls}>{o.customer_id_no || ''}</td>
                  <td className={tdCls}>{o.customer_tin || ''}</td>
                  <td className={tdCls + ' text-center'}>{o.receipt_number?.toString().padStart(8, '0') || ''}</td>
                  <td className={tdCls + ' text-right'}>{(o.subtotal || 0).toFixed(2)}</td>
                  <td className={tdCls + ' text-right'}>{(o.tax_amount || 0).toFixed(2)}</td>
                  <td className={tdCls + ' text-right'}>{(o.vat_exempt_sales || 0).toFixed(2)}</td>
                  <td className={tdCls + ' text-right'}>{(o.discount_5 || 0).toFixed(2)}</td>
                  <td className={tdCls + ' text-right'}>{(o.discount_20 || 0).toFixed(2)}</td>
                  <td className={tdCls + ' text-right font-bold'}>{(o.net_sales || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-bold bg-yellow-50">
                <td colSpan={5} className={tdCls + ' text-right font-black'}>TOTAL</td>
                <td className={tdCls + ' text-right'}>{totalGross.toFixed(2)}</td>
                <td className={tdCls + ' text-right'}>{totalVat.toFixed(2)}</td>
                <td className={tdCls + ' text-right'}>{totalExempt.toFixed(2)}</td>
                <td className={tdCls + ' text-right'}>{totalD5.toFixed(2)}</td>
                <td className={tdCls + ' text-right'}>{totalD20.toFixed(2)}</td>
                <td className={tdCls + ' text-right font-black'}>{totalNet.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <p className="text-[8px] italic text-slate-500 mt-2 print:text-[7px] print:text-black">
          * Customer name, PWD ID No., and TIN must be recorded at point of sale per BIR RMO 24-2023.
        </p>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // ANNEX E-4: National Athletes and Coaches Sales Book/Report
  // ─────────────────────────────────────────────────────────────────────────────
  const renderBIRAnnexE4Athletes = () => {
    const tdCls = "border border-black px-1.5 py-1 text-[9px] print:text-[8px]";
    const thCls = "border border-black px-1.5 py-1 text-center text-[9px] print:text-[8px] font-bold";
    const totalGross = discountOrders.reduce((s, o) => s + (o.subtotal || 0), 0);
    const totalDisc = discountOrders.reduce((s, o) => s + (o.discount_amount || 0), 0);
    const totalNet = discountOrders.reduce((s, o) => s + (o.net_sales || 0), 0);
    return (
      <div className="print:p-0">
        {renderBIRHeader('E-5')}
        <h3 className="text-center font-black text-sm border border-black py-1 mb-2 print:text-[10px]">
          National Athletes and Coaches Sales Book/Report
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-black">
            <thead>
              <tr>
                <th className={thCls} style={{ background: '#9e9e9e', color: 'white' }}>Date</th>
                <th className={thCls} style={{ background: '#4fc3f7' }}>Name of National Athlete / Coach</th>
                <th className={thCls} style={{ background: '#ffd54f' }}>PNSTM ID No.</th>
                <th className={thCls} style={{ background: '#ffd54f' }}>SI / OR Number</th>
                <th className={thCls} style={{ background: '#a5d6a7' }}>Gross Sales / Receipts</th>
                <th className={thCls} style={{ background: '#9c27b0', color: 'white' }}>Sales Discount</th>
                <th className={thCls} style={{ background: '#757575', color: 'white' }}>Net Sales</th>
              </tr>
            </thead>
            <tbody>
              {discountOrders.length === 0 && (
                <tr><td colSpan={7} className={tdCls + ' text-center italic text-slate-400'}>No national athlete / coach transactions found for this period.</td></tr>
              )}
              {discountOrders.map((o, i) => (
                <tr key={i} className="hover:bg-purple-50">
                  <td className={tdCls}>{o.date ? format(new Date(o.date), 'MM/dd/yyyy') : ''}</td>
                  <td className={tdCls}>{o.customer_name || ''}</td>
                  <td className={tdCls}>{o.customer_id_no || ''}</td>
                  <td className={tdCls + ' text-center'}>{o.receipt_number?.toString().padStart(8, '0') || ''}</td>
                  <td className={tdCls + ' text-right'}>{(o.subtotal || 0).toFixed(2)}</td>
                  <td className={tdCls + ' text-right'}>{(o.discount_amount || 0).toFixed(2)}</td>
                  <td className={tdCls + ' text-right font-bold'}>{(o.net_sales || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-bold bg-yellow-50">
                <td colSpan={4} className={tdCls + ' text-right font-black'}>TOTAL</td>
                <td className={tdCls + ' text-right'}>{totalGross.toFixed(2)}</td>
                <td className={tdCls + ' text-right'}>{totalDisc.toFixed(2)}</td>
                <td className={tdCls + ' text-right font-black'}>{totalNet.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <p className="text-[8px] italic text-slate-500 mt-2 print:text-[7px] print:text-black">
          * Athlete/Coach name and PNSTM ID No. must be recorded at point of sale per BIR RMO 24-2023.
        </p>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // ANNEX E-5: Solo Parent Sales Book/Report
  // ─────────────────────────────────────────────────────────────────────────────
  const renderBIRAnnexE5Solo = () => {
    const tdCls = "border border-black px-1.5 py-1 text-[9px] print:text-[8px]";
    const thCls = "border border-black px-1.5 py-1 text-center text-[9px] print:text-[8px] font-bold";
    const totalGross = discountOrders.reduce((s, o) => s + (o.subtotal || 0), 0);
    const totalDisc = discountOrders.reduce((s, o) => s + (o.discount_amount || 0), 0);
    const totalNet = discountOrders.reduce((s, o) => s + (o.net_sales || 0), 0);
    return (
      <div className="print:p-0">
        {renderBIRHeader('E-4')}
        <h3 className="text-center font-black text-sm border border-black py-1 mb-2 print:text-[10px]">
          Solo Parent Sales Book/Report
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-black">
            <thead>
              <tr>
                <th className={thCls} style={{ background: '#9e9e9e', color: 'white' }}>Date</th>
                <th className={thCls} style={{ background: '#ef6c00', color: 'white' }}>Name of Solo Parent</th>
                <th className={thCls} style={{ background: '#ffd54f' }}>SPIC No.</th>
                <th className={thCls} style={{ background: '#4fc3f7' }}>Name of Child</th>
                <th className={thCls} style={{ background: '#ff7043', color: 'white' }}>Birth Date of Child</th>
                <th className={thCls} style={{ background: '#a5d6a7' }}>Age of Child</th>
                <th className={thCls} style={{ background: '#ffd54f' }}>SI / OR Number</th>
                <th className={thCls} style={{ background: '#a5d6a7' }}>Gross Sales</th>
                <th className={thCls} style={{ background: '#ff7043', color: 'white' }}>Discount</th>
                <th className={thCls} style={{ background: '#ce93d8' }}>Net Sales</th>
              </tr>
            </thead>
            <tbody>
              {discountOrders.length === 0 && (
                <tr><td colSpan={10} className={tdCls + ' text-center italic text-slate-400'}>No solo parent transactions found for this period.</td></tr>
              )}
              {discountOrders.map((o, i) => (
                <tr key={i} className="hover:bg-orange-50">
                  <td className={tdCls}>{o.date ? format(new Date(o.date), 'MM/dd/yyyy') : ''}</td>
                  <td className={tdCls}>{o.customer_name || ''}</td>
                  <td className={tdCls}>{o.customer_id_no || ''}</td>
                  <td className={tdCls}>{o.child_name || ''}</td>
                  <td className={tdCls}>{o.child_birthdate || ''}</td>
                  <td className={tdCls + ' text-center'}>{o.child_age || ''}</td>
                  <td className={tdCls + ' text-center'}>{o.receipt_number?.toString().padStart(8, '0') || ''}</td>
                  <td className={tdCls + ' text-right'}>{(o.subtotal || 0).toFixed(2)}</td>
                  <td className={tdCls + ' text-right'}>{(o.discount_amount || 0).toFixed(2)}</td>
                  <td className={tdCls + ' text-right font-bold'}>{(o.net_sales || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-bold bg-yellow-50">
                <td colSpan={7} className={tdCls + ' text-right font-black'}>TOTAL</td>
                <td className={tdCls + ' text-right'}>{totalGross.toFixed(2)}</td>
                <td className={tdCls + ' text-right'}>{totalDisc.toFixed(2)}</td>
                <td className={tdCls + ' text-right font-black'}>{totalNet.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <p className="text-[8px] italic text-slate-500 mt-2 print:text-[7px] print:text-black">
          * Solo Parent name, SPIC No., and child details must be recorded at point of sale per BIR RMO 24-2023.
        </p>
      </div>
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // ANNEX E-6: Medal of Valor Awardees Sales Book/Report
  // ─────────────────────────────────────────────────────────────────────────────
  const renderBIRAnnexE6Valor = () => {
    const tdCls = "border border-black px-1.5 py-1 text-[9px] print:text-[8px]";
    const thCls = "border border-black px-1.5 py-1 text-center text-[9px] print:text-[8px] font-bold";
    const totalGross = discountOrders.reduce((s, o) => s + (o.subtotal || 0), 0);
    const totalDisc = discountOrders.reduce((s, o) => s + (o.discount_amount || 0), 0);
    const totalNet = discountOrders.reduce((s, o) => s + (o.net_sales || 0), 0);
    return (
      <div className="print:p-0">
        {renderBIRHeader('E-6')}
        <h3 className="text-center font-black text-sm border border-black py-1 mb-2 print:text-[10px]">
          Medal of Valor Awardees Sales Book/Report
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-black">
            <thead>
              <tr>
                <th className={thCls} style={{ background: '#9e9e9e', color: 'white' }}>Date</th>
                <th className={thCls} style={{ background: '#ef6c00', color: 'white' }}>Name of Awardee</th>
                <th className={thCls} style={{ background: '#ffd54f' }}>Valor ID No.</th>
                <th className={thCls} style={{ background: '#4fc3f7' }}>TIN</th>
                <th className={thCls} style={{ background: '#ffd54f' }}>SI / OR Number</th>
                <th className={thCls} style={{ background: '#a5d6a7' }}>Gross Sales</th>
                <th className={thCls} style={{ background: '#ff7043', color: 'white' }}>Discount</th>
                <th className={thCls} style={{ background: '#ce93d8' }}>Net Sales</th>
              </tr>
            </thead>
            <tbody>
              {discountOrders.length === 0 && (
                <tr><td colSpan={8} className={tdCls + ' text-center italic text-slate-400'}>No Medal of Valor awardee transactions found for this period.</td></tr>
              )}
              {discountOrders.map((o, i) => (
                <tr key={i} className="hover:bg-amber-50">
                  <td className={tdCls}>{o.date ? format(new Date(o.date), 'MM/dd/yyyy') : ''}</td>
                  <td className={tdCls}>{o.customer_name || ''}</td>
                  <td className={tdCls}>{o.customer_id_no || ''}</td>
                  <td className={tdCls}>{o.customer_tin || ''}</td>
                  <td className={tdCls + ' text-center'}>{o.receipt_number?.toString().padStart(8, '0') || ''}</td>
                  <td className={tdCls + ' text-right'}>{(o.subtotal || 0).toFixed(2)}</td>
                  <td className={tdCls + ' text-right'}>{(o.discount_amount || 0).toFixed(2)}</td>
                  <td className={tdCls + ' text-right font-bold'}>{(o.net_sales || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-bold bg-yellow-50">
                <td colSpan={5} className={tdCls + ' text-right font-black'}>TOTAL</td>
                <td className={tdCls + ' text-right'}>{totalGross.toFixed(2)}</td>
                <td className={tdCls + ' text-right'}>{totalDisc.toFixed(2)}</td>
                <td className={tdCls + ' text-right font-black'}>{totalNet.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <p className="text-[8px] italic text-slate-500 mt-2 print:text-[7px] print:text-black">
          * Medal of Valor Awardee name, ID number, and TIN must be recorded at point of sale per BIR specifications.
        </p>
      </div>
    );
  };

  const renderDiscountReport = (keyword: string, title: string) => {
    // Legacy fallback (used by REGULAR_DISCOUNT if no specific annex needed)
    const target = discounts?.find(d => d.name.toLowerCase().includes(keyword.toLowerCase()));
    return (
      <div className="print:p-0">
        <div className="text-center mb-8 print:mb-4">
          <h3 className="text-lg font-bold text-slate-900 uppercase tracking-wider bg-slate-100 py-2 inline-block px-4 rounded-md print:bg-transparent print:p-0 print:border-b print:border-black print:w-full print:text-[14px]">
            {title}
          </h3>
          <div className="mt-4 text-left grid grid-cols-2 gap-y-2 print:mt-2 print:gap-y-1">
            <span className="text-slate-600 print:text-black">Generated On:</span>
            <span className="text-slate-900 font-bold text-right print:text-black">{format(getManilaDate(), 'MM/dd/yyyy HH:mm:ss')}</span>
            <span className="text-slate-600 print:text-black">Report Period:</span>
            <span className="text-slate-900 font-bold text-right print:text-black">
              {format(safeDate(dateRange.start), 'MM/dd/yyyy')} - {format(safeDate(dateRange.end), 'MM/dd/yyyy')}
            </span>
          </div>
        </div>
        <div className="space-y-4 text-slate-800 print:space-y-2 print:text-black">
          <div>
            <div className="flex justify-between items-center py-2 font-bold uppercase border-b border-dashed border-slate-300 print:border-black print:py-1">
              <span>Total Transactions</span>
              <span>{target ? target.count : 0}</span>
            </div>
            <div className="flex justify-between items-center py-2 text-lg print:text-[12px] print:py-1">
              <span className="font-bold text-slate-700 print:text-black">Total Discount Granted</span>
              <span className="text-red-600 font-black print:text-black">₱{(target ? target.amount : 0).toFixed(2)}</span>
            </div>
            <div className="mt-8 border-t border-slate-200 pt-4 text-xs text-slate-500 italic text-center print:mt-4 print:pt-2 print:text-[8px] print:text-black">
              * Detailed transaction logs are maintained in the system audit trail.
            </div>
          </div>
        </div>
      </div>
    );
  };


  const renderVoucherReport = () => {
    const target = data.payments?.find(p => p.method === 'voucher');
    return (
      <div className="print:p-0">
        <div className="text-center mb-8 print:mb-4">
          <h3 className="text-lg font-bold text-slate-900 uppercase tracking-wider bg-slate-100 py-2 inline-block px-4 rounded-md print:bg-transparent print:p-0 print:border-b print:border-black print:w-full print:text-[14px]">
            VOUCHER PAYMENTS REPORT
          </h3>
          <div className="mt-4 text-left grid grid-cols-2 gap-y-2 print:mt-2 print:gap-y-1">
            <span className="text-slate-600 print:text-black">Generated On:</span>
            <span className="text-slate-900 font-bold text-right print:text-black">{format(getManilaDate(), 'MM/dd/yyyy HH:mm:ss')}</span>

            <span className="text-slate-600 print:text-black">Report Period:</span>
            <span className="text-slate-900 font-bold text-right print:text-black">
              {format(safeDate(dateRange.start), 'MM/dd/yyyy')} - {format(safeDate(dateRange.end), 'MM/dd/yyyy')}
            </span>
          </div>
        </div>

        <div className="space-y-4 text-slate-800 print:space-y-2 print:text-black">
          <div>
            <div className="flex justify-between items-center py-2 font-bold uppercase border-b border-dashed border-slate-300 print:border-black print:py-1">
              <span>Total Transactions</span>
              <span>{target ? target.count : 0}</span>
            </div>

            <div className="flex justify-between items-center py-2 text-lg print:text-[12px] print:py-1">
              <span className="font-bold text-slate-700 print:text-black">Total Voucher Amount</span>
              <span className="text-emerald-600 font-black print:text-black">₱{(target ? target.amount : 0).toFixed(2)}</span>
            </div>

            <div className="mt-8 border-t border-slate-200 pt-4 text-xs text-slate-500 italic text-center print:mt-4 print:pt-2 print:text-[8px] print:text-black">
              * Detailed transaction logs are maintained in the system audit trail.
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderRedemptionReport = () => {
    return (
      <div className="print:p-0">
        <div className="text-center mb-8 print:mb-4">
          <h3 className="text-lg font-bold text-slate-900 uppercase tracking-wider bg-slate-100 py-2 inline-block px-4 rounded-md print:bg-transparent print:p-0 print:border-b print:border-black print:w-full print:text-[14px]">
            VOUCHER REDEMPTIONS REPORT
          </h3>
          <div className="mt-4 text-left grid grid-cols-2 gap-y-2 print:mt-2 print:gap-y-1">
            <span className="text-slate-600 print:text-black">Generated On:</span>
            <span className="text-slate-900 font-bold text-right print:text-black">{format(getManilaDate(), 'MM/dd/yyyy HH:mm:ss')}</span>

            <span className="text-slate-600 print:text-black">Report Period:</span>
            <span className="text-slate-900 font-bold text-right print:text-black">
              {format(safeDate(dateRange.start), 'MM/dd/yyyy')} - {format(safeDate(dateRange.end), 'MM/dd/yyyy')}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto print:overflow-visible mt-6">
          <table className="w-full text-left text-xs border-collapse border border-slate-200 print:border-black">
            <thead>
              <tr className="bg-slate-50 print:bg-transparent">
                <th className="p-1.5 sm:p-2 border border-slate-200 print:border-black font-bold uppercase text-[10px] sm:text-[11px]">Date</th>
                <th className="p-1.5 sm:p-2 border border-slate-200 print:border-black font-bold uppercase text-[10px] sm:text-[11px]">Ref#</th>
                <th className="p-1.5 sm:p-2 border border-slate-200 print:border-black font-bold uppercase text-[10px] sm:text-[11px]">Item</th>
                <th className="p-1.5 sm:p-2 border border-slate-200 print:border-black font-bold uppercase text-[10px] sm:text-[11px] text-right">Price</th>
                <th className="p-1.5 sm:p-2 border border-slate-200 print:border-black font-bold uppercase text-[10px] sm:text-[11px] text-right">Points</th>
                <th className="p-1.5 sm:p-2 border border-slate-200 print:border-black font-bold uppercase text-[10px] sm:text-[11px] text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {voucherRedemptions.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-400 font-medium italic">No redemptions found for this period.</td></tr>
              ) : voucherRedemptions.map((r, i) => (
                <tr key={i} className="text-[10px] sm:text-xs">
                  <td className="p-1.5 sm:p-2 border border-slate-200 print:border-black">{format(new Date(new Date(r.created_at).toLocaleString("en-US", { timeZone: "Asia/Manila" })), 'MM/dd/yy')}</td>
                  <td className="p-1.5 sm:p-2 border border-slate-200 print:border-black font-mono break-all">{r.reference_number}</td>
                  <td className="p-1.5 sm:p-2 border border-slate-200 print:border-black break-words max-w-[100px]">{r.products?.name}</td>
                  <td className="p-1.5 sm:p-2 border border-slate-200 print:border-black text-right">
                    ₱{(r.price || 0).toFixed(2)}
                  </td>
                  <td className="p-1.5 sm:p-2 border border-slate-200 print:border-black text-right font-bold text-emerald-600 print:text-black">{r.points_used}</td>
                  <td className="p-1.5 sm:p-2 border border-slate-200 print:border-black text-right font-bold">
                    ₱{((r.price || 0) * (r.quantity || 1)).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            {voucherRedemptions.length > 0 && (
              <tfoot>
                <tr className="bg-slate-50 font-bold print:bg-transparent text-[10px] sm:text-xs">
                  <td colSpan={4} className="p-1.5 sm:p-2 border border-slate-200 print:border-black text-right">Totals:</td>
                  <td className="p-1.5 sm:p-2 border border-slate-200 print:border-black text-right text-emerald-600 print:text-black">
                    {voucherRedemptions.reduce((acc, r) => acc + r.points_used, 0)} Pts
                  </td>
                  <td className="p-1.5 sm:p-2 border border-slate-200 print:border-black text-right">
                    ₱{voucherRedemptions.reduce((acc, r) => acc + ((r.price || 0) * (r.quantity || 1)), 0).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    );
  };

  const renderComplimentaryReport = () => {
    const filteredComplimentaryData = complimentaryData.filter(item => {
      if (!complimentarySearch) return true;
      const searchLower = complimentarySearch.toLowerCase();
      const invoiceMatch = item.receipt_number?.toString().includes(searchLower);
      const slipMatch = item.complimentary_slip_number?.toString().toLowerCase().includes(searchLower);
      const recipientMatch = item.complimentary_recipient?.toLowerCase().includes(searchLower);
      const serverMatch = item.complimentary_server?.toLowerCase().includes(searchLower);
      return invoiceMatch || slipMatch || recipientMatch || serverMatch;
    });

    return (
      <div className="print:p-0">
        <div className="text-center mb-8 print:mb-4">
          <h3 className="text-lg font-bold text-slate-900 uppercase tracking-wider bg-slate-100 py-2 inline-block px-4 rounded-md print:bg-transparent print:p-0 print:border-b print:border-black print:w-full print:text-[14px]">
            COMPLIMENTARY ITEMS REPORT
          </h3>
          <div className="mt-4 text-left grid grid-cols-2 gap-y-2 print:mt-2 print:gap-y-1">
            <span className="text-slate-600 print:text-black">Generated On:</span>
            <span className="text-slate-900 font-bold text-right print:text-black">{format(getManilaDate(), 'MM/dd/yyyy HH:mm:ss')}</span>

            <span className="text-slate-600 print:text-black">Report Period:</span>
            <span className="text-slate-900 font-bold text-right print:text-black">
              {format(safeDate(dateRange.start), 'MM/dd/yyyy')} - {format(safeDate(dateRange.end), 'MM/dd/yyyy')}
            </span>
          </div>
        </div>

        <div className="mb-4 print:hidden">
          <input
            type="text"
            placeholder="Search by Invoice No, Slip No, Recipient, or Server..."
            className="w-full max-w-md px-4 py-2 border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            value={complimentarySearch}
            onChange={(e) => setComplimentarySearch(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto print:overflow-visible mt-6">
          <table className="w-full text-left text-xs border-collapse border border-slate-200 print:border-black">
            <thead>
              <tr className="bg-slate-50 print:bg-transparent">
                <th className="p-1.5 sm:p-2 border border-slate-200 print:border-black font-bold uppercase text-[10px] sm:text-[11px]">Date/Time</th>
                <th className="p-1.5 sm:p-2 border border-slate-200 print:border-black font-bold uppercase text-[10px] sm:text-[11px]">Invoice No</th>
                <th className="p-1.5 sm:p-2 border border-slate-200 print:border-black font-bold uppercase text-[10px] sm:text-[11px]">Slip No</th>
                <th className="p-1.5 sm:p-2 border border-slate-200 print:border-black font-bold uppercase text-[10px] sm:text-[11px]">Item</th>
                <th className="p-1.5 sm:p-2 border border-slate-200 print:border-black font-bold uppercase text-[10px] sm:text-[11px]">Recipient</th>
                <th className="p-1.5 sm:p-2 border border-slate-200 print:border-black font-bold uppercase text-[10px] sm:text-[11px]">Auth By</th>
                <th className="p-1.5 sm:p-2 border border-slate-200 print:border-black font-bold uppercase text-[10px] sm:text-[11px] text-right">Value</th>
              </tr>
            </thead>
            <tbody>
              {filteredComplimentaryData.length === 0 ? (
                <tr><td colSpan={8} className="p-8 text-center text-slate-400 font-medium italic">No complimentary items found for this period.</td></tr>
              ) : filteredComplimentaryData.map((item, i) => (
                <tr key={i} className="text-[10px] sm:text-xs">
                  <td className="p-1.5 sm:p-2 border border-slate-200 print:border-black">
                    {item.created_at ? format(new Date(item.created_at), 'MM/dd/yy HH:mm') : 'N/A'}
                  </td>
                  <td className="p-1.5 sm:p-2 border border-slate-200 print:border-black">
                    {item.receipt_number ? item.receipt_number.toString().padStart(8, '0') : 'N/A'}
                  </td>
                  <td className="p-1.5 sm:p-2 border border-slate-200 print:border-black font-mono break-all">
                    {item.complimentary_slip_number || 'N/A'}
                  </td>
                  <td className="p-1.5 sm:p-2 border border-slate-200 print:border-black font-bold break-words max-w-[100px]">
                    {item.product_name} <span className="font-normal text-slate-400">({item.quantity}x)</span>
                  </td>

                  <td className="p-1.5 sm:p-2 border border-slate-200 print:border-black break-words max-w-[80px]">{item.complimentary_recipient}</td>
                  <td className="p-1.5 sm:p-2 border border-slate-200 print:border-black italic font-medium break-words max-w-[80px]">{item.complimentary_authorized_by}</td>
                  <td className="p-1.5 sm:p-2 border border-slate-200 print:border-black text-right font-semibold">
                    ₱{(item.price * item.quantity).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            {filteredComplimentaryData.length > 0 && (
              <tfoot>
                <tr className="bg-slate-50 font-bold print:bg-transparent text-[10px] sm:text-xs">
                  <td colSpan={7} className="p-2 border border-slate-200 print:border-black text-right uppercase">Total Value of Compliments:</td>
                  <td className="p-2 border border-slate-200 print:border-black text-right">
                    ₱{filteredComplimentaryData.reduce((acc, item) => acc + (item.price * item.quantity), 0).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    );
  };

  const renderVoidedReport = () => {
    let totVoidAmount = 0;
    let totVoidPts = 0;

    voidedTransactions.forEach((t: any) => {
      const isVoucher = t.payment_method?.toUpperCase() === 'VOUCHER';
      if (isVoucher) {
        totVoidPts += t.voucher_points_sum || 0;
      } else {
        totVoidAmount += t.total || 0;
      }
    });

    return (
      <div className="print:p-0">
        <div className="text-center mb-8 print:mb-4">
          <h3 className="text-lg font-bold text-slate-900 uppercase tracking-wider bg-slate-100 py-2 inline-block px-4 rounded-md print:bg-transparent print:p-0 print:border-b print:border-black print:w-full print:text-[14px]">
            VOIDED TRANSACTIONS REPORT
          </h3>
          <div className="mt-4 text-left grid grid-cols-2 gap-y-2 print:mt-2 print:gap-y-1">
            <span className="text-slate-600 print:text-black">Generated On:</span>
            <span className="text-slate-900 font-bold text-right print:text-black">{format(getManilaDate(), 'MM/dd/yyyy HH:mm:ss')}</span>

            <span className="text-slate-600 print:text-black">Report Period:</span>
            <span className="text-slate-900 font-bold text-right print:text-black">
              {format(safeDate(dateRange.start), 'MM/dd/yyyy')} - {format(safeDate(dateRange.end), 'MM/dd/yyyy')}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto print:overflow-visible mt-6">
          <table className="w-full text-left text-xs border-collapse border border-slate-200 print:border-black">
            <thead>
              <tr className="bg-slate-50 print:bg-transparent">
                <th className="p-1.5 sm:p-2 border border-slate-200 print:border-black font-bold uppercase text-[10px] sm:text-[11px]">Void Date/Time</th>
                <th className="p-1.5 sm:p-2 border border-slate-200 print:border-black font-bold uppercase text-[10px] sm:text-[11px]">Ref#</th>
                <th className="p-1.5 sm:p-2 border border-slate-200 print:border-black font-bold uppercase text-[10px] sm:text-[11px]">Payment Method</th>
                <th className="p-1.5 sm:p-2 border border-slate-200 print:border-black font-bold uppercase text-[10px] sm:text-[11px]">Items</th>
                <th className="p-1.5 sm:p-2 border border-slate-200 print:border-black font-bold uppercase text-[10px] sm:text-[11px] text-right">Points</th>
                <th className="p-1.5 sm:p-2 border border-slate-200 print:border-black font-bold uppercase text-[10px] sm:text-[11px] text-right">Voided Amount</th>
              </tr>
            </thead>
            <tbody>
              {voidedTransactions.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-400 font-medium italic">No voided transactions found for this period.</td></tr>
              ) : voidedTransactions.map((t, i) => (
                <tr key={i} className="text-[10px] sm:text-xs">
                  <td className="p-1.5 sm:p-2 border border-slate-200 print:border-black">
                    {format(new Date(new Date(t.updated_at).toLocaleString("en-US", { timeZone: "Asia/Manila" })), 'MM/dd/yy HH:mm')}
                  </td>
                  <td className="p-1.5 sm:p-2 border border-slate-200 print:border-black font-mono">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800">ORD #{t.id.toString().padStart(6, '0')}</span>
                      {t.receipt_number !== undefined && t.receipt_number !== null ? (
                        <span className="text-[10px] text-emerald-600 font-bold">INV #{t.receipt_number.toString().padStart(6, '0')}</span>
                      ) : (
                        <span className="text-[10px] text-slate-400">INV: Open</span>
                      )}
                    </div>
                  </td>
                  <td className="p-1.5 sm:p-2 border border-slate-200 print:border-black font-mono break-all font-bold">
                    {t.payment_method?.toUpperCase()}
                  </td>
                  <td className="p-1.5 sm:p-2 border border-slate-200 print:border-black break-words max-w-[120px]">
                    {t.items?.map((item: any, idx: number) => (
                      <div key={idx}>
                        {item.quantity}x {item.name || item.product_name}
                      </div>
                    ))}
                  </td>
                  <td className="p-1.5 sm:p-2 border border-slate-200 print:border-black text-right font-black text-rose-500 print:text-black">
                    {t.payment_method?.toUpperCase() === 'VOUCHER' ? `${t.voucher_points_sum || 0} PTS` : '-'}
                  </td>
                  <td className="p-1.5 sm:p-2 border border-slate-200 print:border-black text-right font-black text-rose-700 print:text-black">
                    {t.payment_method?.toUpperCase() === 'VOUCHER' ? '0.00' : `₱${(t.total || 0).toFixed(2)}`}
                  </td>
                </tr>
              ))}
            </tbody>
            {voidedTransactions.length > 0 && (
              <tfoot>
                <tr className="bg-slate-50 font-bold print:bg-transparent text-[10px] sm:text-xs">
                  <td colSpan={4} className="p-2 border border-slate-200 print:border-black text-right uppercase">Totals:</td>
                  <td className="p-2 border border-slate-200 print:border-black text-right text-rose-500 print:text-black font-black">
                    {totVoidPts} PTS
                  </td>
                  <td className="p-2 border border-slate-200 print:border-black text-right text-rose-700 print:text-black font-black">
                    ₱{totVoidAmount.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    );
  };

  const renderIndividualShiftReport = (s: any) => {
    // Aggregate payment breakdown
    const paymentGroup: Record<string, number> = {};
    if (s.orders) {
      s.orders.forEach((o: any) => {
        const pm = (o.payment_method || 'CASH').toUpperCase();
        let pointsSum = 0;
        if (o.order_items) {
          o.order_items.forEach((item: any) => {
            pointsSum += (item.points_used || 0) * (item.quantity || 1);
          });
        }

        if (pm === 'VOUCHER') {
          paymentGroup[pm] = (paymentGroup[pm] || 0) + (pointsSum || o.total || 0);
        } else {
          paymentGroup[pm] = (paymentGroup[pm] || 0) + (o.total || 0);
        }
      });
    }

    // Aggregate product breakdown
    const productGroup: Record<string, { qty: number; total: number }> = {};
    if (s.orders) {
      s.orders.forEach((o: any) => {
        if (o.order_items) {
          o.order_items.forEach((item: any) => {
            const productObj = item.products || {};
            const name = productObj.name || item.product_name || 'Unknown Product';
            if (!productGroup[name]) {
              productGroup[name] = { qty: 0, total: 0 };
            }
            productGroup[name].qty += item.quantity || 0;

            const isVoucherItem = o.payment_method?.toUpperCase() === 'VOUCHER' || item.notes?.includes('Voucher') || item.notes?.includes('(Voucher)');
            const itemPrice = isVoucherItem ? (item.points_used || item.price) : item.price;
            productGroup[name].total += (itemPrice * item.quantity) || 0;
          });
        }
      });
    }

    const totalSalesCalculated = Object.values(paymentGroup).reduce((sum, amt) => sum + amt, 0);

    return (
      <div className="print:p-0">
        <div className="text-center mb-4 print:mb-2 text-slate-800 print:text-black">
          <h3 className="text-lg font-bold uppercase tracking-wider bg-slate-100 py-1.5 inline-block px-4 rounded-md print:bg-transparent print:p-0 print:border-b print:border-black print:w-full print:text-[13px]">
            INDIVIDUAL SHIFT REPORT
          </h3>
          <div className="mt-3 text-left space-y-1.5 print:mt-2 print:space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-600 print:text-black">Generated On:</span>
              <span className="text-slate-900 font-bold text-right print:text-black">{format(getManilaDate(), 'MM/dd/yyyy HH:mm:ss')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 print:text-black">Cashier:</span>
              <span className="text-slate-900 font-bold text-right print:text-black">{s.users?.full_name || s.users?.username}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 print:text-black">Time In:</span>
              <span className="text-slate-900 text-right print:text-black font-medium">{format(new Date(s.time_in), 'MM/dd/yyyy HH:mm:ss')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 print:text-black">Time Out:</span>
              <span className="text-slate-900 text-right print:text-black font-medium">
                {s.time_out ? format(new Date(s.time_out), 'MM/dd/yyyy HH:mm:ss') : 'OPEN'}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 text-xs font-semibold text-slate-800 print:text-black space-y-2">
          <div className="border-b border-dashed border-slate-300 mb-2 pb-1 font-bold uppercase print:border-black print:mb-1">
            Financials Summary
          </div>
          <div className="flex justify-between py-0.5">
            <span>Amount In (Starting Cash):</span>
            <span>₱{(s.cash_in || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-0.5">
            <span>Amount Out (Ending Cash):</span>
            <span>₱{(s.cash_out || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-0.5 border-t border-slate-100 border-dotted pt-1">
            <span>Total Cash:</span>
            <span>₱{(paymentGroup['CASH'] || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-0.5">
            <span>Total Points on Voucher:</span>
            <span>₱{(paymentGroup['VOUCHER'] || 0).toFixed(2)}</span>
          </div>
          <div className="flex justify-between py-0.5 border-t border-slate-200 border-dashed pt-1 font-bold">
            <span>Total Sales:</span>
            <span className="text-emerald-600 print:text-black text-sm">₱{(totalSalesCalculated || s.total_sales || 0).toFixed(2)}</span>
          </div>
        </div>

        <div className="mt-5 text-xs text-slate-800 print:text-black">
          <div className="border-b border-dashed border-slate-300 mb-2 pb-1 font-bold uppercase print:border-black print:mb-1">
            Payment Breakdown
          </div>
          {Object.keys(paymentGroup).length === 0 ? (
            <div className="text-center text-slate-400 italic py-1">No payments collected</div>
          ) : (
            Object.entries(paymentGroup).map(([pm, amt]) => (
              <div key={pm} className="flex justify-between py-0.5 font-medium">
                <span>{pm}</span>
                <span>₱{amt.toFixed(2)}</span>
              </div>
            ))
          )}
        </div>

        <div className="mt-5 text-xs text-slate-800 print:text-black">
          <div className="border-b border-dashed border-slate-300 mb-2 pb-1 font-bold uppercase print:border-black print:mb-1">
            Itemised Products Sold
          </div>
          {Object.keys(productGroup).length === 0 ? (
            <div className="text-center text-slate-400 italic py-1">No products sold</div>
          ) : (
            Object.entries(productGroup).map(([name, d]) => (
              <div key={name} className="flex justify-between py-0.5 font-medium border-b border-dotted border-slate-100 last:border-b-0">
                <span className="pr-2">{d.qty}x {name}</span>
                <span>₱{d.total.toFixed(2)}</span>
              </div>
            ))
          )}
        </div>

        <div className="mt-5 text-xs text-slate-800 print:text-black">
          <div className="border-b border-dashed border-slate-300 mb-2 pb-1 font-bold uppercase print:border-black print:mb-1">
            Orders List ({s.orders?.length || 0} Transactions)
          </div>
          {s.orders && s.orders.length > 0 ? (
            s.orders.map((o: any) => (
              <div key={o.id} className="flex justify-between items-center py-1 font-medium text-[11px] border-b border-slate-100 last:border-b-0">
                <div className="flex flex-col">
                  <span className="font-bold text-slate-800">ORD #{o.id.toString().padStart(6, '0')}</span>
                  {o.receipt_number !== undefined && o.receipt_number !== null ? (
                    <span className="text-[10px] text-emerald-600 font-bold">INV #{o.receipt_number.toString().padStart(6, '0')}</span>
                  ) : (
                    <span className="text-[10px] text-slate-400">INV: Open</span>
                  )}
                  <span className="text-[9px] text-slate-400">({format(new Date(o.updated_at), 'hh:mm a')})</span>
                </div>
                <div>
                  <span className="text-[9px] bg-slate-100 px-1 py-0.2 rounded font-bold mr-1 print:bg-transparent">{o.payment_method}</span>
                  {o.payment_method?.toUpperCase() === 'VOUCHER' ? (
                    `${o.order_items?.reduce((sum: number, item: any) => sum + (item.points_used || 0) * (item.quantity || 1), 0) || 0} PTS`
                  ) : (
                    `₱${o.total?.toFixed(2)}`
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-slate-400 italic py-1">No transactions</div>
          )}
        </div>
      </div>
    );
  };

  const renderShiftSalesReport = () => {
    return (
      <div className="print:p-0">
        <div className="text-center mb-8 print:mb-4">
          <h3 className="text-lg font-bold text-slate-900 uppercase tracking-wider bg-slate-100 py-2 inline-block px-4 rounded-md print:bg-transparent print:p-0 print:border-b print:border-black print:w-full print:text-[14px]">
            SHIFT SALES REPORT
          </h3>
          <div className="mt-4 text-left space-y-1.5 print:mt-2 print:space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-600 print:text-black">Generated On:</span>
              <span className="text-slate-900 font-bold text-right print:text-black">{format(getManilaDate(), 'MM/dd/yyyy HH:mm:ss')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 print:text-black">Report Period:</span>
              <span className="text-slate-900 font-bold text-right print:text-black">
                {format(safeDate(dateRange.start), 'MM/dd/yyyy')} - {format(safeDate(dateRange.end), 'MM/dd/yyyy')}
              </span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto print:overflow-visible mt-6">
          <table className="w-full text-left text-sm border-collapse border border-slate-200 print:border-black print:text-[10px]">
            <thead>
              <tr className="bg-slate-50 print:bg-transparent">
                <th className="p-3 border border-slate-200 print:border-black font-bold uppercase">Date</th>
                <th className="p-3 border border-slate-200 print:border-black font-bold uppercase">Cashier</th>
                <th className="p-3 border border-slate-200 print:border-black font-bold uppercase">Time In/Out</th>
                <th className="p-3 border border-slate-200 print:border-black font-bold uppercase text-right">Amount In</th>
                <th className="p-3 border border-slate-200 print:border-black font-bold uppercase text-right">Amount Out</th>
                <th className="p-3 border border-slate-200 print:border-black font-bold uppercase text-right">Sales</th>
                <th className="p-3 border border-slate-200 print:border-black font-bold uppercase text-right">Service Charge</th>
                <th className="p-3 border border-slate-200 print:hidden font-bold uppercase text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {shiftData.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-slate-400 font-medium italic">No shift records found for this period.</td></tr>
              ) : shiftData.map((s, i) => {
                const isExpanded = expandedShiftId === s.id;

                // Aggregate payment breakdown
                const paymentGroup: Record<string, number> = {};
                if (s.orders) {
                  s.orders.forEach((o: any) => {
                    const pm = (o.payment_method || 'CASH').toUpperCase();
                    let pointsSum = 0;
                    if (o.order_items) {
                      o.order_items.forEach((item: any) => {
                        pointsSum += (item.points_used || 0) * (item.quantity || 1);
                      });
                    }
                    if (pm === 'VOUCHER') {
                      paymentGroup[pm] = (paymentGroup[pm] || 0) + (pointsSum || o.total || 0);
                    } else {
                      paymentGroup[pm] = (paymentGroup[pm] || 0) + (o.total || 0);
                    }
                  });
                }

                // Aggregate product breakdown
                const productGroup: Record<string, { qty: number; total: number }> = {};
                if (s.orders) {
                  s.orders.forEach((o: any) => {
                    if (o.order_items) {
                      o.order_items.forEach((item: any) => {
                        const productObj = item.products || {};
                        const name = productObj.name || item.product_name || 'Unknown Product';
                        if (!productGroup[name]) {
                          productGroup[name] = { qty: 0, total: 0 };
                        }
                        productGroup[name].qty += item.quantity || 0;
                        const isVoucherItem = o.payment_method?.toUpperCase() === 'VOUCHER' || item.notes?.includes('Voucher') || item.notes?.includes('(Voucher)');
                        const itemPrice = isVoucherItem ? (item.points_used || item.price) : item.price;
                        productGroup[name].total += (itemPrice * item.quantity) || 0;
                      });
                    }
                  });
                }

                return (
                  <React.Fragment key={s.id || i}>
                    <tr
                      className="cursor-pointer hover:bg-slate-50/80 transition-colors select-none group"
                      onClick={() => setExpandedShiftId(isExpanded ? null : s.id)}
                    >
                      <td className="p-3 border border-slate-200 print:border-black font-sans flex items-center gap-1.5 min-w-[125px]">
                        <span className="print:hidden text-slate-400 group-hover:text-slate-600 transition-colors shrink-0">
                          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </span>
                        {format(new Date(s.time_in), 'MM/dd/yyyy')}
                      </td>
                      <td className="p-3 border border-slate-200 print:border-black font-bold font-sans">{s.users?.full_name || s.users?.username}</td>
                      <td className="p-3 border border-slate-200 print:border-black">
                        <div className="text-[10px] whitespace-nowrap font-sans">{format(new Date(s.time_in), 'HH:mm:ss')} - {s.time_out ? format(new Date(s.time_out), 'HH:mm:ss') : 'OPEN'}</div>
                      </td>
                      <td className="p-3 border border-slate-200 print:border-black text-right font-sans">₱{(s.cash_in || 0).toFixed(2)}</td>
                      <td className="p-3 border border-slate-200 print:border-black text-right font-sans">₱{(s.cash_out || 0).toFixed(2)}</td>
                      <td className="p-3 border border-slate-200 print:border-black text-right font-black text-emerald-600 print:text-black font-sans">₱{(s.total_sales || 0).toFixed(2)}</td>
                      <td className="p-3 border border-slate-200 print:border-black text-right font-black text-blue-600 print:text-black font-sans">
                        ₱{(s.orders?.reduce((sum: number, o: any) => sum + (o.service_charge || 0), 0) || 0).toFixed(2)}
                      </td>
                      <td className="p-3 border border-slate-200 print:hidden text-center font-sans">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            printSingleShiftReport(s);
                          }}
                          className="p-1 px-2 text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-600 hover:text-indigo-700 rounded-md transition-colors flex items-center justify-center gap-1 mx-auto font-bold"
                          title="Print Shift Ticket"
                        >
                          <Printer size={12} className="shrink-0" />
                          <span>Print</span>
                        </button>
                      </td>
                    </tr>

                    {isExpanded && (
                      <tr className="bg-slate-50/50 print:hidden font-sans border-b border-slate-200">
                        <td colSpan={8} className="p-4">
                          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                            <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-4">
                              <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">Shift Itemised Details</h4>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    printSingleShiftReport(s);
                                  }}
                                  className="p-1 px-2.5 text-[10px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-600 hover:text-indigo-700 rounded-md transition-colors flex items-center gap-1"
                                >
                                  <Printer size={11} className="shrink-0" />
                                  <span>Print Shift Ticket</span>
                                </button>
                                <span className="text-[10px] text-slate-400 font-bold uppercase">({s.orders?.length || 0} Paid Bills)</span>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                              {/* Payment Breakdown */}
                              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 h-fit">
                                <h5 className="font-bold text-[10px] text-slate-500 uppercase mb-2 tracking-wider">Payment Breakdown</h5>
                                <div className="space-y-1.5">
                                  {Object.keys(paymentGroup).length === 0 ? (
                                    <p className="text-[11px] text-slate-400 italic">No payments collected.</p>
                                  ) : (
                                    Object.entries(paymentGroup).map(([pm, amt]) => (
                                      <div key={pm} className="flex justify-between text-xs font-semibold text-slate-700">
                                        <span>{pm}</span>
                                        <span>₱{amt.toFixed(2)}</span>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>

                              {/* Products Breakdown */}
                              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 h-fit">
                                <h5 className="font-bold text-[10px] text-slate-500 uppercase mb-2 tracking-wider">Itemised Products Sold</h5>
                                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                                  {Object.keys(productGroup).length === 0 ? (
                                    <p className="text-[11px] text-slate-400 italic">No products sold.</p>
                                  ) : (
                                    Object.entries(productGroup).map(([name, d]) => (
                                      <div key={name} className="flex justify-between text-xs font-medium text-slate-700 border-b border-dashed border-slate-200 pb-1 last:border-b-0">
                                        <span className="truncate pr-2">{d.qty}x {name}</span>
                                        <span className="font-semibold text-slate-600 shrink-0">₱{d.total.toFixed(2)}</span>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>

                              {/* Receipts/Orders List */}
                              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 h-fit">
                                <h5 className="font-bold text-[10px] text-slate-500 uppercase mb-2 tracking-wider">Orders List</h5>
                                <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                                  {s.orders && s.orders.length > 0 ? (
                                    s.orders.map((o: any) => (
                                      <div key={o.id} className="flex justify-between items-center text-[11px] font-medium text-slate-700 border-b border-slate-200 pb-1 last:border-b-0 py-1">
                                        <div className="flex flex-col truncate pr-1">
                                          <span className="font-bold text-slate-800">ORD #{o.id.toString().padStart(6, '0')}</span>
                                          {o.receipt_number !== undefined && o.receipt_number !== null ? (
                                            <span className="text-[10px] text-emerald-600 font-bold">INV #{o.receipt_number.toString().padStart(6, '0')}</span>
                                          ) : (
                                            <span className="text-[10px] text-slate-400">INV: Open</span>
                                          )}
                                          <span className="text-[9px] text-slate-400">({format(new Date(o.updated_at), 'hh:mm a')})</span>
                                        </div>
                                        <div className="shrink-0 font-semibold text-slate-600">
                                          <span className="text-[9px] bg-slate-200 text-slate-500 px-1 py-0.2 rounded font-bold mr-1.5 uppercase">{o.payment_method}</span>
                                          {o.payment_method?.toUpperCase() === 'VOUCHER' ? (
                                            `${o.order_items?.reduce((sum: number, item: any) => sum + (item.points_used || 0) * (item.quantity || 1), 0) || 0} PTS`
                                          ) : (
                                            `₱${o.total?.toFixed(2)}`
                                          )}
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <p className="text-[11px] text-slate-400 italic">No transactions.</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
            {shiftData.length > 0 && (
              <tfoot>
                <tr className="bg-slate-50 font-bold print:bg-transparent">
                  <td colSpan={5} className="p-3 border border-slate-200 print:border-black text-right text-xs uppercase font-sans">Total Shift Sales for Period:</td>
                  <td className="p-3 border border-slate-200 print:border-black text-right text-emerald-600 print:text-black font-black font-sans">
                    ₱{shiftData.reduce((acc, s) => acc + (s.total_sales || 0), 0).toFixed(2)}
                  </td>
                  <td className="p-3 border border-slate-200 print:border-black text-right text-blue-600 print:text-black font-black font-sans">
                    ₱{shiftData.reduce((acc, s) => acc + (s.orders?.reduce((sum: number, o: any) => sum + (o.service_charge || 0), 0) || 0), 0).toFixed(2)}
                  </td>
                  <td className="p-3 border border-slate-200 print:hidden text-center bg-slate-50 font-sans"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    );
  };

  const currentReportTitle = REPORT_CATEGORIES.find(r => r.id === reportType)?.label || '';

  return (
    <div className="flex h-full bg-slate-50">
      {/* Sidebar - Report Types */}
      <div className="w-80 border-r border-slate-200 bg-white flex flex-col print:hidden">
        <div className="p-6 border-b border-slate-200">
          <h1 className="text-2xl font-black text-slate-900">Reports</h1>
          <p className="text-sm text-slate-500 mt-1">BIR Accredited Reports</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {REPORT_CATEGORIES.map(category => (
            <button
              key={category.id}
              onClick={() => setReportType(category.id)}
              className={clsx(
                "w-full flex items-center justify-between p-4 rounded-xl transition-all text-left",
                reportType === category.id
                  ? "bg-slate-900 text-white shadow-md scale-[1.02]"
                  : "bg-transparent text-slate-600 hover:bg-slate-100"
              )}
            >
              <div className="flex items-center gap-3">
                <category.icon size={20} className={clsx(reportType === category.id ? "text-emerald-400" : "text-slate-400")} />
                <span className="font-bold text-sm tracking-tight">{category.label}</span>
              </div>
              <ChevronRight size={16} className={clsx("transition-transform", reportType === category.id ? "opacity-100 translate-x-1" : "opacity-0 -translate-x-2")} />
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col p-8 overflow-hidden print:p-0 print:overflow-visible">

        {/* Controls Toolbar */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm print:hidden shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">{currentReportTitle}</h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Quick Period Presets */}
            {reportType !== 'Z' && reportType !== 'X' && (
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => handleSelectPreset('today')}
                  className={clsx(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                    dateRange.start === format(getManilaDate(), 'yyyy-MM-dd') && dateRange.end === format(getManilaDate(), 'yyyy-MM-dd')
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                  )}
                >
                  This Day
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset('week')}
                  className={clsx(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                    dateRange.start === format(startOfWeek(getManilaDate(), { weekStartsOn: 1 }), 'yyyy-MM-dd') && dateRange.end === format(getManilaDate(), 'yyyy-MM-dd')
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                  )}
                >
                  This Week
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPreset('month')}
                  className={clsx(
                    "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                    dateRange.start === format(startOfMonth(getManilaDate()), 'yyyy-MM-dd') && dateRange.end === format(getManilaDate(), 'yyyy-MM-dd')
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                  )}
                >
                  This Month
                </button>
              </div>
            )}

            {/* Date Pickers */}
            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
              <Calendar size={18} className="text-slate-400 ml-1" />
              <input
                type="date"
                value={dateRange.start}
                onChange={e => {
                  const val = e.target.value;
                  setDateRange(prev => ({
                    ...prev,
                    start: val,
                    end: (reportType === 'Z' || reportType === 'X') ? val : prev.end
                  }));
                }}
                className="bg-transparent border-none outline-none text-xs font-semibold text-slate-700 cursor-pointer"
                title="Start Date"
              />
              {(reportType !== 'Z' && reportType !== 'X') && (
                <>
                  <span className="text-slate-400 font-bold text-xs">-</span>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="bg-transparent border-none outline-none text-xs font-semibold text-slate-700 mr-1 cursor-pointer"
                    title="End Date"
                  />
                </>
              )}
            </div>

            {reportType !== 'Z' && (
              <div className="flex items-center gap-1 bg-slate-50 p-2 rounded-xl border border-slate-200">
                <Clock size={16} className="text-slate-400 ml-1" />
                <span className="text-xs font-bold text-slate-400 select-none mr-1">Time:</span>
                <input
                  type="time"
                  value={timeRange.start}
                  onChange={e => setTimeRange(prev => ({ ...prev, start: e.target.value }))}
                  className="bg-transparent border-none outline-none text-xs font-semibold text-slate-700 w-16"
                />
                <span className="text-slate-400 text-xs">-</span>
                <input
                  type="time"
                  value={timeRange.end}
                  onChange={e => setTimeRange(prev => ({ ...prev, end: e.target.value }))}
                  className="bg-transparent border-none outline-none text-xs font-semibold text-slate-700 w-16 mr-1"
                />
              </div>
            )}

            {(reportType === 'SHIFT_SALES' || reportType === 'Y' || reportType === 'X') && (
              <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                <User size={18} className="text-slate-400 ml-1" />
                <select
                  value={selectedUserId}
                  onChange={e => setSelectedUserId(e.target.value)}
                  className="bg-transparent border-none outline-none text-xs font-semibold text-slate-700 pr-1 cursor-pointer"
                >
                  <option value="">All Users</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.full_name || u.username}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Export Sales Excel for Standard Reports */}
            {['Z', 'Y', 'X', 'SHIFT_SALES', 'VOIDED', 'COMPLIMENTARY', 'VOUCHER_REDEMPTIONS', 'VOUCHER_PAYMENTS'].includes(reportType) && (
              <button
                type="button"
                onClick={handleExportSalesReportExcel}
                className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-sm shadow-emerald-600/20 transition-all active:scale-95 cursor-pointer"
                title="Export report into readable styled Excel file (.xls)"
              >
                <TableIcon size={16} />
                Export Sales Excel (.xlsx)
              </button>
            )}

            {reportType === 'EJOURNAL' && (
              <button
                type="button"
                onClick={handleDownloadTxt}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs transition-all active:scale-95 cursor-pointer"
              >
                <Download size={16} />
                Download Soft Copy (.txt)
              </button>
            )}

            {/* Export All BIR Annexes to Excel — shown for any BIR annex report */}
            {['BIR_SALES_SUMMARY', 'SENIOR_CITIZEN', 'PWD', 'NATIONAL_ATHLETES', 'SOLO_PARENT', 'MEDAL_OF_VALOR'].includes(reportType) && (
              <button
                type="button"
                onClick={handleExportAllAnnexes}
                className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-xs shadow-sm shadow-violet-600/20 transition-all active:scale-95 cursor-pointer"
              >
                <Download size={16} />
                Export All Annexes (.xlsx)
              </button>
            )}

            {/* Print Controls */}
            <div className="flex items-center gap-2 border-l border-slate-200 pl-3 ml-1">
              <div className="flex items-center gap-1 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                <Printer size={15} className="text-slate-400 ml-1" />
                <select
                  value={printSize}
                  onChange={e => setPrintSize(e.target.value as '80mm' | 'A4' | 'legal')}
                  className="bg-transparent border-none outline-none text-xs font-semibold text-slate-700 pr-1 cursor-pointer"
                  title="Select paper size for printing"
                >
                  <option value="80mm">80mm (Thermal)</option>
                  <option value="A4">A4 (Short Bond)</option>
                  <option value="legal">Legal (Long Bond)</option>
                </select>
              </div>
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <Printer size={16} />
                Print Report
              </button>
            </div>
          </div>
        </div>

        {/* Printable Report View */}
        <div className="flex-1 bg-white rounded-3xl shadow-sm border border-slate-200 p-12 overflow-auto font-normal text-[18px] print:p-0 print:border-none print:shadow-none print:overflow-visible print:text-[12px]" style={{ fontFamily: 'Verdana, Geneva, sans-serif' }}>
          <style type="text/css" media="print">
            {`
              @page { 
                size: ${['BIR_SALES_SUMMARY', 'SENIOR_CITIZEN', 'PWD', 'NATIONAL_ATHLETES', 'SOLO_PARENT', 'MEDAL_OF_VALOR'].includes(reportType)
                ? 'A4 landscape'
                : printSize === 'A4'
                  ? 'A4 portrait'
                  : printSize === 'legal'
                    ? '216mm 356mm portrait'
                    : '80mm auto'
              }; 
                margin: ${['BIR_SALES_SUMMARY', 'SENIOR_CITIZEN', 'PWD', 'NATIONAL_ATHLETES', 'SOLO_PARENT', 'MEDAL_OF_VALOR'].includes(reportType)
                ? '10mm'
                : printSize === 'A4' || printSize === 'legal'
                  ? '12mm 15mm'
                  : '0'
              }; 
              }
              * {
                box-shadow: none !important;
                text-shadow: none !important;
              }
              
              /* Hide all other application components and print-hidden elements under print query */
              header, nav, footer, .sidebar, .sidebar-container, .toolbar, button, select, input, .print\\:hidden, [class*="print:hidden"], [class*="sidebar"] { 
                display: none !important; 
              }
              
              /* Ensure style, script, link, and meta tags are completely hidden in printed layout */
              style, script, link, meta {
                display: none !important;
              }
              
              /* Reset specific parent layout containers so they seamlessly host the printable area without page offset */
              html, body, #root, #root > div, main, main > div, .flex-1.flex.flex-col, .bg-white.rounded-3xl {
                height: auto !important;
                min-height: 0 !important;
                max-height: none !important;
                overflow: visible !important;
                position: static !important;
                display: block !important;
                transform: none !important;
                filter: none !important;
                -webkit-filter: none !important;
                box-shadow: none !important;
                border: none !important;
                margin: 0 !important;
                padding: 0 !important;
                width: auto !important;
                max-width: none !important;
                background-color: transparent !important;
                background: transparent !important;
              }
              
              /* Force the main white background context for printed page */
              html, body {
                display: block !important;
                background-color: white !important;
                background: white !important;
                color: black !important;
                print-color-adjust: exact !important; 
                -webkit-print-color-adjust: exact !important;
                color-scheme: light !important;
              }
              
              /* Layout and color styling for .printable-area container */
              .printable-area { 
                width: ${printSize === 'A4' ? '190mm' : printSize === 'legal' ? '186mm' : '80mm'} !important; 
                max-width: ${printSize === 'A4' ? '190mm' : printSize === 'legal' ? '186mm' : '80mm'} !important; 
                margin: 0 !important; 
                padding: ${printSize === '80mm' ? '4mm' : '6mm'} !important; 
                border: none !important;
                box-shadow: none !important;
                background-color: white !important;
                background: white !important;
                color: black !important;
                display: block !important;
                overflow: visible !important;
                position: static !important;
              }
              
              /* Apply nested custom fonts and pristine black/white context to everything inside the receipt */
              .printable-area, .printable-area * {
                background-color: white !important;
                background: white !important;
                color: black !important;
                font-size: ${printSize === '80mm' ? '13px' : '11px'} !important;
                line-height: 1.3 !important;
                font-family: Verdana, Arial, Helvetica, sans-serif !important;
                font-weight: 500 !important;
              }
              
              .printable-area h2 { font-size: ${printSize === '80mm' ? '16px' : '14px'} !important; font-weight: 800 !important; }
              .printable-area h3 { font-size: ${printSize === '80mm' ? '14px' : '12px'} !important; font-weight: 700 !important; }
              .print-bold { font-weight: 700 !important; }
              
              /* For A4/legal: allow tables to use full width */
              ${printSize !== '80mm' ? `
              .printable-area table { width: 100% !important; }
              .printable-area td, .printable-area th { font-size: 10px !important; }
              ` : ''}
              
              /* Hide elements explicitly marked to be hidden during print within the printable area */
              .printable-area .print\\:hidden,
              .printable-area .print\\:hidden * {
                display: none !important;
              }
            `}
          </style>
          <div className={`mx-auto border sm:border-2 border-slate-300 p-8 print:border-none print:p-0 bg-white printable-area print:max-w-none ${reportType === 'BIR_SALES_SUMMARY' || reportType === 'SENIOR_CITIZEN' || reportType === 'PWD' || reportType === 'NATIONAL_ATHLETES' || reportType === 'SOLO_PARENT' || reportType === 'MEDAL_OF_VALOR'
            ? 'max-w-none'
            : printSize === 'A4'
              ? 'max-w-3xl'
              : printSize === 'legal'
                ? 'max-w-4xl'
                : 'max-w-xl'
            }`}>
            {/* BIR Annexes don't need the receipt header; they have their own header block */}
            {reportType !== 'BIR_SALES_SUMMARY' && reportType !== 'SENIOR_CITIZEN' && reportType !== 'PWD' && reportType !== 'NATIONAL_ATHLETES' && reportType !== 'SOLO_PARENT' && reportType !== 'MEDAL_OF_VALOR' && (
              <div className="text-center mb-6 pb-6 border-b-2 border-dashed border-slate-300 print:mb-2 print:pb-2 print:border-black">
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-widest leading-tight print:text-[16px] print:tracking-normal">{settings?.company_name || activeBranch?.name || 'ESPRESSO YOURSELF & TEA HOUSE'}</h2>
                <p className="font-black text-slate-800 print:text-black">{settings?.company_name || activeBranch?.name || 'Main Branch'}</p>
                <p className="text-slate-600 print:text-black print:text-[8px]">{settings?.address || activeBranch?.address || 'Room 1 Crown Bldg North road 6, North Reclamation Area Mabolo Cebu City'}</p>
                <p className="text-slate-600 print:text-black print:text-[8px]">VAT REG TIN: 000-123-456-000</p>
                <p className="text-slate-600 mt-2 print:text-black print:text-[8px] print:mt-1">Machine ID: POS-01</p>
              </div>
            )}

            {singleShiftToPrint ? (
              renderIndividualShiftReport(singleShiftToPrint)
            ) : reportType === 'EJOURNAL' ? (
              <div className="whitespace-pre-wrap font-normal text-[16px] max-h-[70vh] overflow-y-auto p-4 border border-slate-100 rounded-lg print:max-h-none print:overflow-visible print:p-0 print:border-none" style={{ fontFamily: 'Verdana, Geneva, sans-serif' }}>
                <div className="text-center font-black mb-4 print:mb-2 print:text-[12px]">E-JOURNAL REPORT</div>
                <div className="mb-2 print:mb-1">Generated On: {format(getManilaDate(), 'MM/dd/yyyy HH:mm:ss')}</div>
                <div className="mb-4 text-center print:mb-2 text-slate-300 print:text-black">====================================</div>
                {eJournalData.map((order: any, idx) => (
                  <div key={idx} className="mb-4 print:mb-3 border-b border-slate-50 pb-4 print:pb-2 print:border-black">
                    <div>Order No : {order.id.toString().padStart(8, '0')}</div>
                    <div>Invoice No: {order.receipt_number !== undefined && order.receipt_number !== null ? order.receipt_number.toString().padStart(8, '0') : 'PENDING'}</div>
                    <div>Date/Time : {format(new Date(new Date(order.updated_at || order.created_at).toLocaleString("en-US", { timeZone: "Asia/Manila" })), 'MM/dd/yyyy HH:mm:ss')}</div>
                    <div>Status    : {order.status.toUpperCase()}</div>
                    <div className="text-center text-slate-300 print:text-black">------------------------------------</div>
                    {order.items?.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between py-0.5">
                        <span className="truncate pr-2">
                          {item.quantity}x {item.name || item.product_name}
                          {item.is_complimentary && <span className="text-[10px] ml-1 bg-slate-100 px-1 rounded">COMP</span>}
                        </span>
                        <span>{item.is_complimentary ? '0.00' : (item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="text-center text-slate-300 print:text-black">------------------------------------</div>
                    <div className="flex justify-between"><span>Subtotal:</span><span>{order.subtotal?.toFixed(2)}</span></div>
                    {order.discount_amount > 0 && <div className="flex justify-between"><span>{order.discounts?.name || 'Discount'}:</span><span>-{order.discount_amount?.toFixed(2)}</span></div>}
                    <div className="flex justify-between font-black"><span>Total:</span><span>{order.total?.toFixed(2)}</span></div>
                    <div className="flex justify-between text-slate-500 print:text-black"><span>VAT:</span><span>{order.tax_amount?.toFixed(2)}</span></div>
                    <div className="text-center mt-2 text-slate-300 print:text-black">====================================</div>
                  </div>
                ))}
              </div>
            ) : reportType === 'Z' || reportType === 'Y' || reportType === 'X' ? (
              renderZYReport()
            ) : reportType === 'BIR_SALES_SUMMARY' ? (
              renderBIRSalesSummaryAnnexE1()
            ) : reportType === 'SENIOR_CITIZEN' ? (
              renderBIRAnnexE2SC()
            ) : reportType === 'PWD' ? (
              renderBIRAnnexE3PWD()
            ) : reportType === 'NATIONAL_ATHLETES' ? (
              renderBIRAnnexE4Athletes()
            ) : reportType === 'SOLO_PARENT' ? (
              renderBIRAnnexE5Solo()
            ) : reportType === 'MEDAL_OF_VALOR' ? (
              renderBIRAnnexE6Valor()
            ) : reportType === 'VOUCHER_REDEMPTIONS' ? (
              renderRedemptionReport()
            ) : reportType === 'COMPLIMENTARY' ? (
              renderComplimentaryReport()
            ) : reportType === 'VOIDED' ? (
              renderVoidedReport()
            ) : reportType === 'SHIFT_SALES' ? (
              renderShiftSalesReport()
            ) : reportType === 'VOUCHER_PAYMENTS' ? (
              renderVoucherReport()
            ) : (
              renderDiscountReport('discount', 'REGULAR DISCOUNT SALES REPORT')
            )}

            <div className="mt-12 pt-8 border-t-2 border-dashed border-slate-300 text-center text-xs text-slate-500 space-y-1 print:mt-4 print:pt-4 print:border-black print:text-[8px] print:text-black">
              <p className="font-bold text-slate-700 print:text-black">THIS DOCUMENT IS NOT VALID FOR CLAIMING INPUT TAXES</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

