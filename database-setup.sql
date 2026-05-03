-- ============================================
-- PART 1: CREATE NEW FEATURE TABLES ONLY
-- (Run this FIRST)
-- ============================================

-- 1. SHU DISTRIBUTIONS TABLE (for SHU Distribution Feature)
CREATE TABLE IF NOT EXISTS public.shu_distributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id text NOT NULL,
  member_name text NOT NULL,
  period text NOT NULL,
  share_amount numeric DEFAULT 0,
  distribution_rate integer DEFAULT 100,
  notes text,
  created_by text,
  created_at timestamp DEFAULT NOW(),
  updated_at timestamp DEFAULT NOW()
);

-- 2. LOAN PAYMENTS TABLE (for Loan Payment History Feature)
CREATE TABLE IF NOT EXISTS public.loan_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id text NOT NULL,
  member_id text NOT NULL,
  member_name text,
  amount numeric NOT NULL DEFAULT 0,
  payment_date date,
  payment_method text,
  notes text,
  status text DEFAULT 'success',
  created_by text,
  created_at timestamp DEFAULT NOW(),
  updated_at timestamp DEFAULT NOW()
);

-- ============================================
-- PART 2: CREATE INDEXES FOR NEW TABLES
-- (Run this AFTER part 1 creates tables)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_shu_distributions_member_id ON shu_distributions(member_id);
CREATE INDEX IF NOT EXISTS idx_shu_distributions_period ON shu_distributions(period);
CREATE INDEX IF NOT EXISTS idx_loan_payments_loan_id ON loan_payments(loan_id);
CREATE INDEX IF NOT EXISTS idx_loan_payments_member_id ON loan_payments(member_id);
CREATE INDEX IF NOT EXISTS idx_loan_payments_created_at ON loan_payments(created_at);

-- ============================================
-- PART 3: INSERT SAMPLE DATA
-- (Run this AFTER parts 1 & 2)
-- ============================================

-- Sample SHU Distribution Data
INSERT INTO public.shu_distributions (member_id, member_name, period, share_amount, distribution_rate, created_by)
VALUES 
('member-1', 'Budi Suryanto', '2024-01', 500000, 100, 'admin'),
('member-2', 'Siti Aminah', '2024-01', 450000, 100, 'admin'),
('member-3', 'Ahmad Wijaya', '2024-01', 550000, 100, 'admin'),
('member-4', 'Eka Putri', '2024-02', 520000, 100, 'admin'),
('member-5', 'Rudi Hermawan', '2024-02', 480000, 100, 'admin')
ON CONFLICT DO NOTHING;

-- Sample Loan Payments Data
INSERT INTO public.loan_payments (loan_id, member_id, member_name, amount, payment_date, payment_method, status, created_by)
VALUES 
('loan-1', 'member-1', 'Budi Suryanto', 2000000, '2024-04-01', 'Transfer', 'success', 'admin'),
('loan-1', 'member-1', 'Budi Suryanto', 2000000, '2024-05-01', 'Transfer', 'success', 'admin'),
('loan-2', 'member-2', 'Siti Aminah', 1500000, '2024-04-05', 'Cash', 'success', 'admin'),
('loan-3', 'member-3', 'Ahmad Wijaya', 3000000, '2024-04-10', 'Transfer', 'success', 'admin')
ON CONFLICT DO NOTHING;
