// print-bridge/printer.js
// Windows Raw Thermal Printer Dispatcher using rawprint.exe

import { execFile, exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const execFileAsync = promisify(execFile);
const execAsync = promisify(exec);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAW_PRINT_EXE = path.join(__dirname, 'rawprint.exe');

/**
 * Checks if Windows Print Spooler service is running
 */
export async function isSpoolerRunning() {
  try {
    const { stdout } = await execAsync('powershell -NoProfile -Command "(Get-Service Spooler).Status"');
    return stdout.trim().toLowerCase() === 'running';
  } catch (err) {
    return false;
  }
}

/**
 * Lists all installed Windows printer names
 */
export async function listInstalledPrinters() {
  const spoolerOk = await isSpoolerRunning();
  if (!spoolerOk) {
    // Spooler is stopped. Return hint and attempt PNP detection
    const pnpPrinters = await detectPnpThermalPrinters();
    return {
      spoolerRunning: false,
      printers: pnpPrinters,
      message: 'Windows Print Spooler service is stopped. Run setup-printer-service.bat as administrator to start it.'
    };
  }

  try {
    const { stdout } = await execFileAsync(RAW_PRINT_EXE, ['list']);
    const list = stdout
      .split('\r\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith('Error'));

    return {
      spoolerRunning: true,
      printers: list
    };
  } catch (err) {
    // Fallback using PowerShell
    try {
      const { stdout } = await execAsync('powershell -NoProfile -Command "Get-Printer | Select-Object -ExpandProperty Name"');
      const list = stdout.split('\r\n').map(s => s.trim()).filter(Boolean);
      return { spoolerRunning: true, printers: list };
    } catch (e) {
      return { spoolerRunning: false, printers: [], error: err.message };
    }
  }
}

/**
 * Detects thermal printers directly via Windows PNP device registry
 */
export async function detectPnpThermalPrinters() {
  try {
    const { stdout } = await execAsync(
      'powershell -NoProfile -Command "Get-PnpDevice | Where-Object FriendlyName -match \'POS|80|Thermal\' | Select-Object -ExpandProperty FriendlyName"'
    );
    return stdout.split('\r\n').map(s => s.trim()).filter(Boolean);
  } catch (e) {
    return ['POSPrinter POS-80C', 'Printer POS-80'];
  }
}

/**
 * Automatically chooses the best thermal printer if none specified
 */
export async function resolvePrinterName(preferredName) {
  if (preferredName && preferredName.trim().length > 0) {
    return preferredName.trim();
  }

  const { printers } = await listInstalledPrinters();
  if (printers && printers.length > 0) {
    const match = printers.find(p =>
      /pos-80|posprinter|80c|thermal|receipt/i.test(p)
    ) || printers[0];
    return match;
  }

  return 'POSPrinter POS-80C';
}

/**
 * Sends raw ESC/POS Buffer directly to a Windows printer
 */
export async function printRawBuffer(buffer, printerName = null) {
  const targetPrinter = await resolvePrinterName(printerName);

  const spoolerOk = await isSpoolerRunning();
  if (!spoolerOk) {
    throw new Error(
      'Windows Print Spooler is not running. Please run setup-printer-service.bat as administrator once to enable the spooler.'
    );
  }

  // Create temporary file for the binary ESC/POS payload
  const tempFile = path.join(os.tmpdir(), `pos_receipt_${Date.now()}_${Math.random().toString(36).substring(7)}.bin`);
  await fs.promises.writeFile(tempFile, buffer);

  try {
    const { stdout, stderr } = await execFileAsync(RAW_PRINT_EXE, ['print', targetPrinter, tempFile]);

    if (stdout.includes('PRINT_SUCCESS')) {
      return { success: true, printer: targetPrinter };
    } else {
      throw new Error(stderr || stdout || 'Print execution failed');
    }
  } finally {
    // Clean up temporary file
    fs.promises.unlink(tempFile).catch(() => {});
  }
}
