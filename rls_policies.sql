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
