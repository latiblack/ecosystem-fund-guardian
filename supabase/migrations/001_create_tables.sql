CREATE TABLE IF NOT EXISTS projects (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  logo_url TEXT,
  creator_address VARCHAR(255) NOT NULL,
  chain_id INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS campaigns (
  id VARCHAR(255) PRIMARY KEY,
  project_id VARCHAR(255) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  category VARCHAR(50) NOT NULL,
  creator_address VARCHAR(255) NOT NULL,
  signature TEXT,
  rules TEXT NOT NULL,
  max_per_recipient DECIMAL(20, 8) DEFAULT 0,
  duration_days INTEGER DEFAULT 90,
  recipients TEXT,
  token_address VARCHAR(255),
  token_symbol VARCHAR(20),
  chain_id INTEGER,
  total_locked DECIMAL(20, 8) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS evidence_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id VARCHAR(255) NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  recipient_address VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  verdict TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view projects" ON projects FOR SELECT USING (true);
CREATE POLICY "Creators can insert projects" ON projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view campaigns" ON campaigns FOR SELECT USING (true);
CREATE POLICY "Anyone can insert campaigns" ON campaigns FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view evidence" ON evidence_submissions FOR SELECT USING (true);
CREATE POLICY "Anyone can insert evidence" ON evidence_submissions FOR INSERT WITH CHECK (true);
