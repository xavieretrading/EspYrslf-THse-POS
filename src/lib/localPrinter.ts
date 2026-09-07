// src/lib/localPrinter.ts
// Direct Local Thermal Printing Client (POS-80C Silent Bridge)

export interface PrinterStatus {
  connected: boolean;
  service?: string;
  version?: string;
  spoolerRunning?: boolean;
  activePrinter?: string;
  error?: string;
}

export interface PrintResponse {
  success: boolean;
  message?: string;
  error?: string;
  printer?: string;
}

const DEFAULT_AUTH_TOKEN = 'pos-direct-print-token-2026';

/**
 * Returns the candidate local bridge URLs.
 * Tries HTTPS first (for Cloud Run), then falls back to HTTP.
 */
function getCandidateUrls(): string[] {
  const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
  if (isHttps) {
    return [
      'https://localhost:9101',
      'http://localhost:9100',
      'http://127.0.0.1:9100'
    ];
  }
  return [
    'http://localhost:9100',
    'http://127.0.0.1:9100',
    'https://localhost:9101'
  ];
}

export function getPrintToken(): string {
  if (typeof window === 'undefined') return DEFAULT_AUTH_TOKEN;
  return localStorage.getItem('pos_print_token') || DEFAULT_AUTH_TOKEN;
}

export function setPrintToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('pos_print_token', token);
  }
}

export function getPreferredPrinterName(): string {
  if (typeof window === 'undefined') return 'POSPrinter POS-80C';
  return localStorage.getItem('pos_printer_name') || 'POSPrinter POS-80C';
}

export function setPreferredPrinterName(name: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('pos_printer_name', name);
  }
}

/**
 * Checks if the Local Print Service is running on the computer
 */
export async function checkLocalPrinterStatus(): Promise<PrinterStatus> {
  const candidateUrls = getCandidateUrls();

  for (const baseUrl of candidateUrls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const res = await fetch(`${baseUrl}/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json'
        }
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        return {
          connected: true,
          service: data.service,
          version: data.version,
          spoolerRunning: data.spoolerRunning,
          activePrinter: data.activePrinter || getPreferredPrinterName()
        };
      }
    } catch (err: any) {
      // Continue trying next candidate url
    }
  }

  return {
    connected: false,
    error: 'Local Print Service is not reachable on localhost:9100.'
  };
}

/**
 * Lists installed printers from the local print bridge
 */
export async function getLocalPrinters(): Promise<{ printers: string[]; spoolerRunning: boolean }> {
  const candidateUrls = getCandidateUrls();

  for (const baseUrl of candidateUrls) {
    try {
      const res = await fetch(`${baseUrl}/printers`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-POS-Print-Token': getPrintToken()
        }
      });
      if (res.ok) {
        const data = await res.json();
        return {
          printers: data.printers || [],
          spoolerRunning: data.spoolerRunning ?? true
        };
      }
    } catch (err) { }
  }

  return { printers: ['POSPrinter POS-80C', 'Printer POS-80'], spoolerRunning: false };
}

/**
 * Prints an order directly to the POS-80C thermal printer in 1 click
 */
export async function printOrderDirect(orderData: any, branchInfo: any = {}): Promise<PrintResponse> {
  const candidateUrls = getCandidateUrls();
  const token = getPrintToken();
  const printerName = getPreferredPrinterName();

  const payload = {
    order: orderData,
    branch: branchInfo,
    printerName: printerName
  };

  let lastError = '';

  for (const baseUrl of candidateUrls) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(`${baseUrl}/print`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-POS-Print-Token': token
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const data = await res.json();
      if (res.ok && data.success) {
        return {
          success: true,
          message: data.message || 'Receipt printed successfully.',
          printer: data.printer
        };
      } else {
        lastError = data.error || 'Print request failed';
      }
    } catch (err: any) {
      lastError = err.message || 'Connection to print bridge timed out';
    }
  }

  return {
    success: false,
    error: lastError.includes('Spooler')
      ? 'Windows Print Spooler is stopped. Please run setup-printer-service.bat as admin.'
      : 'Printer unavailable. Please check the printer connection.'
  };
}

/**
 * Sends a test receipt directly to the thermal printer
 */
export async function printTestReceiptDirect(printerName?: string): Promise<PrintResponse> {
  const candidateUrls = getCandidateUrls();
  const token = getPrintToken();
  const targetPrinter = printerName || getPreferredPrinterName();

  for (const baseUrl of candidateUrls) {
    try {
      const res = await fetch(`${baseUrl}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-POS-Print-Token': token
        },
        body: JSON.stringify({ printerName: targetPrinter })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        return {
          success: true,
          message: data.message || `Test receipt printed successfully to ${targetPrinter}.`
        };
      } else {
        return {
          success: false,
          error: data.error || 'Failed to print test receipt.'
        };
      }
    } catch (err: any) { }
  }

  return {
    success: false,
    error: 'Printer unavailable. Please ensure POS Print Bridge is running on localhost:9100.'
  };
}
