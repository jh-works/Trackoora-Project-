-- Trackoora BD Database Schema (PostgreSQL)
-- Version 1.0

-- 1. Sellers Table
CREATE TABLE sellers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    email TEXT UNIQUE,
    phone_hash TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    facebook_page_id TEXT,
    fb_page_access_token_encrypted TEXT,
    meta_ad_account_id TEXT,
    telegram_chat_id TEXT,
    language_preference TEXT DEFAULT 'bn', -- 'en' or 'bn'
    subscription_plan TEXT DEFAULT 'trial', -- 'trial', 'starter', 'growth', 'pro'
    trial_started_at TIMESTAMPTZ DEFAULT NOW(),
    trial_ends_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days',
    subscription_started_at TIMESTAMPTZ,
    subscription_renewal_date TIMESTAMPTZ,
    orders_this_month_count INTEGER DEFAULT 0,
    orders_month_reset_date DATE DEFAULT (DATE_TRUNC('month', NOW()) + INTERVAL '1 month')::DATE,
    setup_complete BOOLEAN DEFAULT FALSE,
    telegram_report_time TIME DEFAULT '09:00:00',
    notification_sound BOOLEAN DEFAULT TRUE,
    notification_browser BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Conversations Table
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID REFERENCES sellers(id) NOT NULL,
    fb_customer_user_id_encrypted TEXT NOT NULL,
    fb_customer_name TEXT,
    ad_id TEXT,
    campaign_id TEXT,
    adset_id TEXT,
    first_touch_ad_id TEXT,
    first_touch_campaign_id TEXT,
    status TEXT DEFAULT 'open', -- 'open', 'ordered', 'not_ordered', 'followup_pending', 'followup_sent'
    followup_delay_days INTEGER,
    followup_message_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Orders Table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID REFERENCES sellers(id) NOT NULL,
    conversation_id UUID REFERENCES conversations(id) NOT NULL,
    product_name TEXT NOT NULL,
    price_bdt INTEGER NOT NULL,
    payment_method TEXT NOT NULL, -- 'bkash', 'nagad', 'cod'
    delivery_address_encrypted TEXT,
    status TEXT DEFAULT 'pending', -- 'pending', 'shipped', 'delivered', 'returned', 'cancelled'
    capi_event_fired BOOLEAN DEFAULT FALSE,
    capi_event_id TEXT,
    confirmation_sent BOOLEAN DEFAULT FALSE,
    return_charge_bdt INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Audit Logs Table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID REFERENCES sellers(id),
    action_type TEXT NOT NULL,
    entity_id UUID,
    metadata_json JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE sellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Sellers can only see their own data
CREATE POLICY "sellers_own_data" ON sellers
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "conversations_own_data" ON conversations
  FOR ALL USING (auth.uid() = seller_id);

CREATE POLICY "orders_own_data" ON orders
  FOR ALL USING (auth.uid() = seller_id);

-- Audit logs: sellers can read their own logs, cannot write directly
CREATE POLICY "audit_logs_read_own" ON audit_logs
  FOR SELECT USING (auth.uid() = seller_id);

-- Service role (backend) bypasses RLS automatically in Supabase
-- No additional policy needed for service role
