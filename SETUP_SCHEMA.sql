-- Run this SQL in Supabase SQL Editor: https://supabase.com/dashboard/project/ervkqbncvboqsgvwjnpq/sql/new

-- Create users table for wallet authentication
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  logo_url TEXT,
  creator_address VARCHAR(255) NOT NULL,
  chain_id INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create campaigns table
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create evidence submissions table
CREATE TABLE IF NOT EXISTS evidence_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id VARCHAR(255) NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  recipient_address VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  verdict TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_creator ON projects(creator_address);
CREATE INDEX IF NOT EXISTS idx_campaigns_project ON campaigns(project_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_creator ON campaigns(creator_address);
CREATE INDEX IF NOT EXISTS idx_evidence_campaign ON evidence_submissions(campaign_id);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence_submissions ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can read all data
CREATE POLICY "Anyone can view users" ON users FOR SELECT USING (true);
CREATE POLICY "Anyone can view projects" ON projects FOR SELECT USING (true);
CREATE POLICY "Anyone can view campaigns" ON campaigns FOR SELECT USING (true);
CREATE POLICY "Anyone can view evidence" ON evidence_submissions FOR SELECT USING (true);

-- Only creators can insert projects
CREATE POLICY "Creators can insert projects" ON projects FOR INSERT WITH CHECK (true);

-- Only creators can update their projects
CREATE POLICY "Creators can update projects" ON projects FOR UPDATE USING (auth.jwt() ->> 'wallet_address' = creator_address);

-- Only campaign creators can insert campaigns
CREATE POLICY "Campaign creators can insert campaigns" ON campaigns FOR INSERT WITH CHECK (true);

-- Anyone can insert evidence (for community verification)
CREATE POLICY "Anyone can insert evidence" ON evidence_submissions FOR INSERT WITH CHECK (true);
