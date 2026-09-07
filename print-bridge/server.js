// print-bridge/server.js
// Silent Background HTTP & HTTPS Local Print Service for POS-80C Thermal Printer

import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildReceiptEscPos, buildTestPrintEscPos } from './escpos.js';
import { printRawBuffer, listInstalledPrinters, resolvePrinterName, isSpoolerRunning } from './printer.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load configuration
let config = {
  port: 9100,
  httpsPort: 9101,
  defaultPrinter: 'POSPrinter POS-80C',
  authToken: 'pos-direct-print-token-2026',
  allowedOrigins: [
    'https://lr-groupofcompanies-pos-system-794666981380.europe-west1.run.app',
    'http://localhost:8080',
    'http://localhost:5173',
    'http://127.0.0.1:8080',
    'http://127.0.0.1:5173'
  ]
};

try {
  const configFile = path.join(__dirname, 'config.json');
  if (fs.existsSync(configFile)) {
    const raw = fs.readFileSync(configFile, 'utf-8');
    config = { ...config, ...JSON.parse(raw) };
  }
} catch (e) {
  console.warn('Using default config:', e.message);
}

// Request Handler
async function handleRequest(req, res) {
  const origin = req.headers['origin'] || req.headers['referer'] || '';
  
  // Set CORS headers
  const isAllowedOrigin = config.allowedOrigins.some(allowed => 
    origin.startsWith(allowed) || allowed === '*'
  ) || origin.includes('localhost') || origin.includes('127.0.0.1');

  if (isAllowedOrigin && origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-POS-Print-Token, Access-Control-Allow-Private-Network');
  res.setHeader('Access-Control-Allow-Private-Network', 'true');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  // 1. Health Check endpoint
  if (req.method === 'GET' && (pathname === '/health' || pathname === '/')) {
    const spoolerOk = await isSpoolerRunning();
    const activePrinter = await resolvePrinterName(config.defaultPrinter);
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'ok',
      service: 'POS Print Bridge',
      version: '1.0.0',
      spoolerRunning: spoolerOk,
      activePrinter: activePrinter,
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // 2. Printers List endpoint
  if (req.method === 'GET' && pathname === '/printers') {
    const result = await listInstalledPrinters();
    res.writeHead(200);
    res.end(JSON.stringify({
      success: true,
      spoolerRunning: result.spoolerRunning,
      printers: result.printers,
      default: config.defaultPrinter,
      message: result.message
    }));
    return;
  }

  // Helper to read JSON body
  const readBody = () => new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });

  // Security Token Validation (only for print/test endpoints)
  const incomingToken = req.headers['x-pos-print-token'];
  if (config.authToken && incomingToken && incomingToken !== config.authToken) {
    res.writeHead(401);
    res.end(JSON.stringify({ success: false, error: 'Unauthorized: Invalid print token' }));
    return;
  }

  // 3. Test Print endpoint
  if (req.method === 'POST' && pathname === '/test') {
    try {
      const body = await readBody();
      const targetPrinter = body.printerName || config.defaultPrinter;
      const buffer = buildTestPrintEscPos(targetPrinter);
      
      const printResult = await printRawBuffer(buffer, targetPrinter);
      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        message: `Test receipt printed successfully to ${printResult.printer}.`,
        printer: printResult.printer
      }));
    } catch (err) {
      console.error('Test print error:', err);
      res.writeHead(500);
      res.end(JSON.stringify({
        success: false,
        error: err.message || 'Printer unavailable. Please check the printer connection.'
      }));
    }
    return;
  }

  // 4. Print Order Receipt endpoint
  if (req.method === 'POST' && pathname === '/print') {
    try {
      const body = await readBody();
      const targetPrinter = body.printerName || config.defaultPrinter;

      let buffer;
      if (body.raw) {
        // Base64 encoded raw buffer
        buffer = Buffer.from(body.raw, 'base64');
      } else if (body.order) {
        // Structured order receipt
        buffer = buildReceiptEscPos(body.order, body.branch || {});
      } else {
        throw new Error('No receipt order data or raw buffer provided.');
      }

      const printResult = await printRawBuffer(buffer, targetPrinter);
      res.writeHead(200);
      res.end(JSON.stringify({
        success: true,
        message: 'Receipt printed successfully.',
        printer: printResult.printer
      }));
    } catch (err) {
      console.error('Print receipt error:', err);
      res.writeHead(500);
      res.end(JSON.stringify({
        success: false,
        error: err.message || 'Printer unavailable. Please check the printer connection.'
      }));
    }
    return;
  }

  // 404
  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Endpoint not found' }));
}

// Start HTTP Server
const httpServer = http.createServer(handleRequest);
httpServer.listen(config.port, '0.0.0.0', () => {
  console.log(`[POS Print Bridge] HTTP listening silently on http://localhost:${config.port}`);
});

// Optionally start HTTPS Server if certs are present
const certDir = path.join(__dirname, 'certs');
const keyFile = path.join(certDir, 'localhost.key');
const certFile = path.join(certDir, 'localhost.crt');

if (fs.existsSync(keyFile) && fs.existsSync(certFile)) {
  try {
    const httpsOptions = {
      key: fs.readFileSync(keyFile),
      cert: fs.readFileSync(certFile)
    };
    const httpsServer = https.createServer(httpsOptions, handleRequest);
    httpsServer.listen(config.httpsPort, '0.0.0.0', () => {
      console.log(`[POS Print Bridge] HTTPS listening on https://localhost:${config.httpsPort}`);
    });
  } catch (err) {
    console.warn('[POS Print Bridge] Could not start HTTPS listener:', err.message);
  }
}
