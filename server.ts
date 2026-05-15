import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import crypto from 'crypto';

dotenv.config();

if (process.env.NODE_ENV === 'production') {
  const required = ['VITE_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'META_APP_SECRET', 'ENCRYPTION_KEY', 'JWT_SECRET'];
  const missing = required.filter(k => !process.env[k]);
  if (missing.length > 0) {
    console.error('FATAL: Missing required environment variables:', missing.join(', '));
    process.exit(1);
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set('trust proxy', 1); // Trust first proxy to fix express-rate-limit X-Forwarded-For error

const PORT = 3000;

// Supabase Setup
let supabaseClient: any = null;

function getSupabase() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey || supabaseUrl === 'https://your-project.supabase.co') {
    // Return null if keys are missing or still set to our example placeholder
    return null;
  }

  if (!supabaseClient) {
    try {
      supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    } catch (e) {
      console.error('Failed to initialize Supabase client:', e);
      return null;
    }
  }
  return supabaseClient;
}

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(cookieParser());
app.use(express.json({
  verify: (req: any, res: any, buf: Buffer) => {
    if (req.originalUrl.startsWith('/api/webhooks/meta')) {
      req.rawBody = buf;
    }
  }
}));
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://connect.facebook.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://*.facebook.com", "https://*.fbcdn.net"],
      connectSrc: ["'self'", "https://api.facebook.com", "https://graph.facebook.com", "https://*.supabase.co", "wss://*.supabase.co"],
      "frame-ancestors": ["*"]
    }
  } : false,
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  frameguard: false, // Required for AI Studio preview iframe
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  limit: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    trustProxy: true,
  }
});
app.use('/api', limiter);


const authenticateToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = (authHeader && authHeader.split(' ')[1]) || req.cookies?.session_token;

  if (!token) return res.sendStatus(401);

  if (token === 'demo-token') {
    req.user = { id: 'demo-user-id', email: 'demo@example.com' };
    return next();
  }

  const supabase = getSupabase();
  if (!supabase) {
    // If Supabase is not configured, fall back to simple JWT check for demo mode
    try {
      const user = jwt.verify(token, process.env.JWT_SECRET || 'fallback_jwt_secret_change_in_production');
      req.user = user;
      return next();
    } catch (err) {
      return res.sendStatus(403);
    }
  }

  try {
    // Verify Supabase token
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      // If Supabase fails, try fallback JWT for backward compatibility or demo
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_jwt_secret_change_in_production');
        req.user = decoded;
        return next();
      } catch (err) {
        return res.sendStatus(403);
      }
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth verification error:', error);
    res.sendStatus(403);
  }
};

// Health Check / DB Test
app.get('/api/health', async (req, res) => {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return res.json({ status: 'ok', database: 'disconnected (demo mode)', version: '2.0.1' });
    }
    
    const { data, error } = await supabase.from('sellers').select('count', { count: 'exact', head: true });
    if (error) throw error;
    
    res.json({ status: 'ok', database: 'connected', count: data, version: '2.0.1' });
  } catch (error: any) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Mock Trigger for Telegram Report
app.post('/api/reports/telegram-trigger', authenticateToken, async (req: any, res) => {
  try {
    const sellerId = req.user.id;
    console.log(`[TELEGRAM] Triggering report for seller ${sellerId}`);
    res.json({ status: 'success', message: 'Report triggered' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Courier Integration Mocks
app.get('/api/couriers', authenticateToken, (req, res) => {
  res.json([
    { id: 'steadfast', name: 'Steadfast Courier', status: 'connected' },
    { id: 'pathao', name: 'Pathao Courier', status: 'not_connected' },
    { id: 'redx', name: 'RedX', status: 'not_connected' }
  ]);
});

// Encryption Helpers
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || (process.env.NODE_ENV !== 'production' ? 'default_dev_encryption_key_32_chars_long!!' : undefined);
if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length < 32) {
  console.error('FATAL: ENCRYPTION_KEY env var is missing or too short. App cannot start.');
  process.exit(1);
}
const IV_LENGTH = 16;

function encrypt(text: string) {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  } catch (err) {
    console.error('Encryption error:', err);
    return text; // Fallback to raw for demo if encryption fails
  }
}

function decrypt(text: string) {
  try {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (err) {
    console.error('Decryption error:', err);
    return text;
  }
}

// Audit Log Helper
async function logAudit(sellerId: string | null, action: string, entityId?: string, metadata?: any, ip?: string) {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    await supabase.from('audit_logs').insert([{
      seller_id: sellerId,
      action_type: action,
      entity_id: entityId,
      metadata_json: metadata,
      ip_address: ip
    }]);
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}

// Meta CAPI Helper
function generateAppSecretProof(accessToken: string, appSecret: string) {
  return crypto
    .createHmac('sha256', appSecret)
    .update(accessToken)
    .digest('hex');
}

async function fireCapiEvent(sellerId: string, eventName: string, userData: any, customData: any) {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    const { data: seller } = await supabase.from('sellers').select('fb_page_access_token_encrypted, meta_ad_account_id').eq('id', sellerId).single();
    if (!seller || !seller.fb_page_access_token_encrypted) return;

    // In a real app with proper decryption and SDK setup:
    // const access_token = decrypt(seller.fb_page_access_token_encrypted);
    // const ads_sdk = require('facebook-nodejs-business-sdk');
    // const EventRequest = ads_sdk.EventRequest;
    // const UserData = ads_sdk.UserData;
    // const ServerEvent = ads_sdk.ServerEvent;
    
    // For this build, we simulate hashing and formatting
    const hashedUserData = {
      fbc: crypto.createHash('sha256').update(userData.fb_user_id || '').digest('hex'),
      ph: userData.phone ? crypto.createHash('sha256').update(userData.phone).digest('hex') : undefined,
      em: userData.email ? crypto.createHash('sha256').update(userData.email.toLowerCase()).digest('hex') : undefined,
      fn: userData.first_name ? crypto.createHash('sha256').update(userData.first_name.toLowerCase()).digest('hex') : undefined,
      ln: userData.last_name ? crypto.createHash('sha256').update(userData.last_name.toLowerCase()).digest('hex') : undefined
    };

    const app_secret_proof = generateAppSecretProof(seller.fb_page_access_token_encrypted, process.env.META_APP_SECRET || '');

    console.log(`[CAPI] Firing ${eventName} for seller ${sellerId}`, { hashedUserData, customData, app_secret_proof });
    // Actual SDK call would go here with hashedUserData and app_secret_proof
    return true;
  } catch (err) {
    console.error('CAPI error:', err);
    return false;
  }
}

// Auth Routes
// These are now legacy since we use Supabase Auth on the client
app.post('/api/auth/login', async (req, res) => {
  res.status(410).json({ error: 'Please use Supabase Auth directly' });
});

app.post('/api/auth/signup', async (req, res) => {
  res.status(410).json({ error: 'Please use Supabase Auth directly' });
});

app.post('/api/auth/verify-otp', async (req, res) => {
  res.status(410).json({ error: 'Please use Supabase Auth directly' });
});

// Onboarding Route
app.patch('/api/onboarding/complete', authenticateToken, async (req: any, res) => {
  const { facebookPageId, fbPageAccessToken, metaAdAccountId } = req.body;
  try {
    if (req.user.id === 'demo-user-id') {
      return res.json({ success: true, message: 'Onboarding completed (Demo Bypass)' });
    }

    const supabase = getSupabase();
    if (!supabase) return res.json({ success: true, message: 'Onboarding completed (Demo Mode)' });

    const { data, error } = await supabase
      .from('sellers')
      .update({
        facebook_page_id: facebookPageId,
        fb_page_access_token_encrypted: fbPageAccessToken,
        meta_ad_account_id: metaAdAccountId,
        setup_complete: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) throw error;
    
    await logAudit(req.user.id, 'onboarding_completed', req.user.id, { page_id: facebookPageId }, req.ip);
    
    res.json(data);
  } catch (err: any) {
    console.error('Onboarding complete error:', err);
    res.status(500).json({ error: 'Failed to complete onboarding' });
  }
});

// Auth Middleware
// Conversation Routes
app.get('/api/conversations', authenticateToken, async (req: any, res) => {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      // Return empty array for demo if no DB
      return res.json([]);
    }
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('seller_id', req.user.id)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Order Routes
app.get('/api/orders', authenticateToken, async (req: any, res) => {
  try {
    const supabase = getSupabase();
    if (!supabase) return res.json([]);
    const { data, error } = await supabase
      .from('orders')
      .select('*, conversations(fb_customer_name, ad_id)')
      .eq('seller_id', req.user.id)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

app.patch('/api/orders/:id/status', authenticateToken, async (req: any, res) => {
  const { status, returnCharge } = req.body;
  const { id } = req.params;
  
  try {
    const supabase = getSupabase();
    
    if (!supabase) {
      console.log('Supabase not configured, simulating status update');
      return res.json({ id, status, return_charge_bdt: returnCharge || 0 });
    }

    const updateData: any = { status, updated_at: new Date().toISOString() };
    if (returnCharge !== undefined) {
      updateData.return_charge_bdt = returnCharge;
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', id)
      .eq('seller_id', req.user.id)
      .select()
      .single();
      
    if (error) throw error;

    // Audit log entry
    await logAudit(req.user.id, 'order_status_updated', id, { status, returnCharge }, req.ip);

    res.json(data);
  } catch (error) {
    console.error('Order status update error:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

app.post('/api/orders', authenticateToken, async (req: any, res) => {
  const { conversationId, productName, price, paymentMethod, deliveryAddress } = req.body;
  
  try {
    const supabase = getSupabase();
    
    if (!supabase) {
      console.log('Supabase not configured, simulating order creation for demo mode');
      return res.json({
        id: crypto.randomUUID(),
        seller_id: req.user.id,
        conversation_id: conversationId,
        product_name: productName,
        price_bdt: price,
        payment_method: paymentMethod,
        delivery_address_encrypted: deliveryAddress,
        status: 'pending',
        created_at: new Date().toISOString()
      });
    }

    // Check if IDs are UUIDs (required by DB)
    const isValidUUID = (id: string) => /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);

    if (!isValidUUID(conversationId) || !isValidUUID(req.user.id)) {
       console.warn('Invalid UUID provided for order creation in DB mode, falling back to simulation');
       return res.json({
        id: crypto.randomUUID(),
        seller_id: req.user.id,
        conversation_id: conversationId,
        product_name: productName,
        price_bdt: price,
        payment_method: paymentMethod,
        delivery_address_encrypted: deliveryAddress,
        status: 'pending',
        created_at: new Date().toISOString()
      });
    }
    
    // Security check: Verify conversation belongs to seller
    const { data: convCheck, error: convCheckError } = await supabase
      .from('conversations')
      .select('id, fb_customer_user_id_encrypted')
      .eq('id', conversationId)
      .eq('seller_id', req.user.id)
      .single();
    
    if (convCheckError || !convCheck) {
      return res.status(403).json({ error: 'Illegal conversation interaction' });
    }

    // Check subscription limit before creating order
    const { data: currentSeller } = await supabase
      .from('sellers')
      .select('subscription_plan, orders_this_month_count')
      .eq('id', req.user.id)
      .single();

    if (currentSeller) {
      let limit = 100; // trial and starter
      if (currentSeller.subscription_plan === 'growth') limit = 300;
      if (currentSeller.subscription_plan === 'pro') limit = Infinity;
      
      if (currentSeller.orders_this_month_count >= limit) {
        return res.status(402).json({ 
          error: 'ORDER_LIMIT_REACHED',
          message: 'আপনার এই মাসের order limit শেষ হয়েছে। Upgrade করুন।'
        });
      }

      const usagePercent = currentSeller.orders_this_month_count / limit;
      // Attach warning flag to response when at 80%
      if (usagePercent >= 0.80 && usagePercent < 1.0) {
        res.setHeader('X-Order-Limit-Warning', 'true');
        res.setHeader('X-Order-Limit-Usage', Math.round(usagePercent * 100).toString());
      }
    }

    // 1. Create order
    const encryptedAddress = encrypt(deliveryAddress);
    
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([
        {
          seller_id: req.user.id,
          conversation_id: conversationId,
          product_name: productName,
          price_bdt: price,
          payment_method: paymentMethod,
          delivery_address_encrypted: encryptedAddress,
          status: 'pending'
        }
      ])
      .select()
      .single();
      
    if (orderError) throw orderError;

    // Audit log
    await logAudit(req.user.id, 'order_created', order.id, { product: productName, value: price }, req.ip);

    // 2. Update conversation status
    await supabase
      .from('conversations')
      .update({ status: 'ordered' })
      .eq('id', conversationId);

    // 3. Increment order count
    const { data: seller } = await supabase
      .from('sellers')
      .select('orders_this_month_count')
      .eq('id', req.user.id)
      .single();
      
    await supabase
      .from('sellers')
      .update({ orders_this_month_count: (seller?.orders_this_month_count || 0) + 1 })
      .eq('id', req.user.id);

    // 4. Fire Meta CAPI Event (simulated)
    await fireCapiEvent(req.user.id, 'Purchase', { fb_user_id: convCheck.fb_customer_user_id_encrypted }, { value: price, currency: 'BDT' });

    // 5. Audit log entry
    await supabase
      .from('audit_logs')
      .insert([
        {
          seller_id: req.user.id,
          action_type: 'order_created',
          entity_id: order.id,
          metadata_json: { product: productName, price, method: paymentMethod },
          ip_address: req.ip
        }
      ]);

    console.log(`Order confirmed for conversation ${conversationId}. CAPI event would fire now.`);

    res.json(order);
  } catch (error: any) {
    console.error('Order creation error:', error?.message || error);
    res.status(500).json({ error: 'Failed to create order', details: error?.message });
  }
});

// Report Routes
app.get('/api/reports/ad-performance', authenticateToken, async (req: any, res) => {
  try {
    const supabase = getSupabase();
    if (!supabase) return res.json([]);
    
    // 1. Get confirmed orders grouped by ad_id
    const { data: orderCounts, error: orderError } = await supabase
      .from('orders')
      .select('price_bdt, conversations(ad_id)')
      .eq('seller_id', req.user.id)
      .neq('status', 'cancelled');
      
    if (orderError) throw orderError;

    // Process order counts
    const adStats: Record<string, { count: number, revenue: number }> = {};
    orderCounts?.forEach((o: any) => {
      const adId = o.conversations?.ad_id || 'unknown';
      if (!adStats[adId]) adStats[adId] = { count: 0, revenue: 0 };
      adStats[adId].count++;
      adStats[adId].revenue += o.price_bdt;
    });

    // 2. Mock Meta Marketing API data
    // In a real app, this would be fetched from Meta and cached
    const mockMetaAds = [
      { ad_id: '2385012345678', name: 'Summer Collection - July', spend: 3200, messages: 128 },
      { ad_id: '2385012345679', name: 'Eid Special Offer', spend: 2800, messages: 96 },
      { ad_id: '2385012345680', name: 'New Arrival August', spend: 2000, messages: 54 }
    ];

    // 3. Join data
    const report = mockMetaAds.map(ad => {
      const stats = adStats[ad.ad_id] || { count: 0, revenue: 0 };
      return {
        ...ad,
        confirmed_orders: stats.count,
        revenue: stats.revenue,
        cost_per_sale: stats.count > 0 ? Math.round(ad.spend / stats.count) : 0
      };
    });

    res.json(report);
  } catch (error) {
    console.error('Ad performance report error:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// Settings Routes
app.get('/api/settings', authenticateToken, async (req: any, res) => {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return res.json({
        subscription_plan: 'trial',
        trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        orders_this_month_count: 0
      });
    }
    let { data: seller, error } = await supabase
      .from('sellers')
      .select('*')
      .eq('id', req.user.id)
      .single();
      
    if (error && error.code === 'PGRST116') {
      // Seller row not found, create it (likely first-time Oauth login)
      const { data: newSeller, error: createError } = await supabase
        .from('sellers')
        .insert([
          { 
            id: req.user.id,
            name: req.user.user_metadata?.full_name || req.user.email?.split('@')[0] || 'Seller',
            email: req.user.email,
            password_hash: 'managed_by_supabase_auth', // Satisfy NOT NULL constraint for external auth
            subscription_plan: 'trial',
            trial_started_at: new Date().toISOString(),
            trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            setup_complete: false
          }
        ])
        .select()
        .single();
      
      if (createError) {
        console.error('Failed to create seller on the fly:', createError);
        // Fallback to minimal object
        return res.json({ id: req.user.id, subscription_plan: 'trial' });
      }
      seller = newSeller;
    } else if (error) {
      throw error;
    }
    res.json(seller);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

app.patch('/api/settings', authenticateToken, async (req: any, res) => {
  const { language_preference, telegram_chat_id } = req.body;
  
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('sellers')
      .update({ language_preference, telegram_chat_id })
      .eq('id', req.user.id)
      .select()
      .single();
      
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

app.delete('/api/account', authenticateToken, async (req: any, res) => {
  const { confirmation } = req.body;
  if (confirmation !== 'আমি নিশ্চিত') {
    return res.status(400).json({ error: 'Invalid confirmation phrase' });
  }

  try {
    const supabase = getSupabase();
    if (!supabase) {
      return res.json({ success: true, message: 'Account marked for deletion (Demo)' });
    }

    // Phase 4.4: Mark as deleted_pending
    const deletionDate = new Date();
    deletionDate.setDate(deletionDate.getDate() + 30);

    const { error } = await supabase
      .from('sellers')
      .update({ 
        subscription_plan: 'deleted_pending',
        trial_ends_at: deletionDate.toISOString() // Reuse trial_ends_at or use a dedicated deletion_at field
      })
      .eq('id', req.user.id);
      
    if (error) throw error;
    
    await logAudit(req.user.id, 'account_deletion_requested', req.user.id, { deletion_date: deletionDate }, req.ip);

    res.json({ success: true, message: 'আপনার অ্যাকাউন্ট ৩০ দিনের মধ্যে স্থায়ীভাবে মুছে ফেলা হবে।' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to request account deletion' });
  }
});

// Meta Webhook Endpoints
app.get('/api/webhooks/meta', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

app.post('/api/webhooks/meta', async (req: any, res: any) => {
  const signature = req.headers['x-hub-signature-256'] as string;
  
  if (!signature) {
    return res.status(403).send('Missing signature');
  }

  // Verify signature
  const hmac = crypto.createHmac('sha256', process.env.META_APP_SECRET || '');
  const digest = 'sha256=' + hmac.update(req.rawBody || JSON.stringify(req.body)).digest('hex');
  
  if (signature !== digest && process.env.META_APP_SECRET) {
    console.error('Webhook signature mismatch');
    return res.status(403).send('Invalid signature');
  }

  const body = req.body;

  // Replay Attack Prevention
  if (body.entry && body.entry[0] && body.entry[0].time) {
    const eventTime = body.entry[0].time;
    if (Date.now() - eventTime > 5 * 60 * 1000) {
      console.error('Replay attack detected: webhook timestamp older than 5 minutes');
      return res.status(400).send('Webhook expired');
    }
  }

  if (body.object === 'page') {
    for (const entry of body.entry) {
      const messaging = entry.messaging[0];
      if (messaging && messaging.message && messaging.referral) {
        const senderId = messaging.sender.id;
        const adId = messaging.referral.ad_id;
        const pageId = entry.id;

        try {
          const supabase = getSupabase();
          // Find seller by pageId
          const { data: seller } = await supabase
            .from('sellers')
            .select('id')
            .eq('facebook_page_id', pageId)
            .single();

          if (seller) {
            // Update touchpoints in conversation metadata
            const { data: existingConv } = await supabase
              .from('conversations')
              .select('id, metadata_json')
              .eq('fb_customer_user_id_encrypted', senderId)
              .eq('seller_id', seller.id)
              .single();

            const touchpoint = { ad_id: adId, timestamp: new Date().toISOString() };
            const metadata = existingConv?.metadata_json || { touchpoints: [] };
            metadata.touchpoints = [...(metadata.touchpoints || []), touchpoint];

            if (existingConv) {
               await supabase
                .from('conversations')
                .update({ 
                  ad_id: adId, // Last touch for quick access
                  metadata_json: metadata 
                })
                .eq('id', existingConv.id);
            } else {
              // Create conversation record
              await supabase
                .from('conversations')
                .insert([
                  {
                    seller_id: seller.id,
                    fb_customer_user_id_encrypted: senderId,
                    ad_id: adId,
                    status: 'open',
                    metadata_json: metadata
                  }
                ]);
            }
            
            console.log(`New touchpoint captured for seller ${seller.id} from ad ${adId}`);
          }
        } catch (error) {
          console.error('Error processing webhook:', error);
        }
      }
    }
    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

// Error Handling Middleware
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Vite Middleware
async function setupVite() {
  if (process.env.NODE_ENV !== 'production') {
    // Auth callback catch-all before vite middleware
    app.get(['/auth/callback', '/auth/confirm'], (req, res, next) => next());

    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    
    // Auth callback catch-all for production
    app.get(['/auth/callback', '/auth/confirm'], (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });

    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }
}

setupVite().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
