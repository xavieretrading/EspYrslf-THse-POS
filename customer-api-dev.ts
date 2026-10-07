/**
 * Runs ONLY the laundry customer API (no POS screens, no POS startup jobs) for testing the mobile app.
 *   npx tsx customer-api-dev.ts      → http://localhost:8090/api/customer
 * Uses the dev SMS code 123456. In production the routes are served by server.ts instead.
 */
import express from 'express';
import { supabase } from './supabaseClient';
import { createCustomerRouter } from './customer-api';
import { createLaundryStaffRouter } from './laundry-staff-api';

process.env.TZ = 'Asia/Manila';
process.env.CUSTOMER_DEV_OTP = process.env.CUSTOMER_DEV_OTP ?? '1';

const app = express();
app.use(express.json({ limit: '10mb' })); // same as server.ts (photo uploads)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});
app.use('/api/customer', createCustomerRouter(supabase));
app.use('/api/laundry-staff', createLaundryStaffRouter(supabase));

const PORT = Number(process.env.CUSTOMER_API_PORT || 8090);
app.listen(PORT, '0.0.0.0', () => console.log(`[customer-api-dev] http://localhost:${PORT}/api/customer (dev SMS code 123456)`));
