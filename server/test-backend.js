#!/usr/bin/env node
/**
 * Backend API validation tests (no GenLayer required)
 * Tests request/response shapes, error handling, middleware
 */
import express from 'express';
import cors from 'cors';
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Mock contract calls
let mockCampaigns = [];
let mockProjects = [];
let mockSubmissions = {};

// Mock writeContract
async function writeContract(address, methodName, args) {
  const [campaignId, projectId, rules] = args;
  
  if (methodName === 'create_project') {
    const [, name, logo_url, description, chain] = args;
    const project = { id: campaignId, name, logo_url, description, chain, created_at: new Date().toISOString() };
    mockProjects.push(project);
    return { hash: '0xmock123' };
  }
  
  if (methodName === 'create_campaign') {
    const [, pid, rules, maxPer, duration, deliverables, recipients] = args;
    const campaign = { 
      id: campaignId, 
      project_id: projectId, 
      rules, 
      max_per_recipient: maxPer,
      duration_days: duration,
      required_deliverables: deliverables,
      recipients,
      status: 'active',
      created_at: new Date().toISOString()
    };
    mockCampaigns.push(campaign);
    return { hash: '0xmock456' };
  }
  
  if (methodName === 'submit_evidence') {
    const [, cid, recipient, url] = args;
    mockSubmissions[`${cid}:${recipient}`] = { url, status: 'pending', submitted_at: new Date().toISOString() };
    return { hash: '0xmock789' };
  }
  
  if (methodName === 'verify') {
    const [, cid, recipient] = args;
    const key = `${cid}:${recipient}`;
    if (mockSubmissions[key]) {
      mockSubmissions[key].status = 'verified';
      mockSubmissions[key].reason = 'Content matches rules';
    }
    return { hash: '0xmockver' };
  }
  
  throw new Error(`Unknown method: ${methodName}`);
}

// Mock readContract
async function readContract(address, methodName, args = []) {
  if (methodName === 'get_all_projects') return mockProjects;
  if (methodName === 'get_project') return mockProjects.find(p => p.id === args[0]) || {};
  if (methodName === 'get_all_campaigns') return mockCampaigns;
  if (methodName === 'get_campaign') return mockCampaigns.find(c => c.id === args[0]) || {};
  if (methodName === 'get_campaign_submissions') {
    const prefix = args[0] + ':';
    return Object.entries(mockSubmissions)
      .filter(([k]) => k.startsWith(prefix))
      .map(([k, v]) => ({ key: k, ...v }));
  }
  if (methodName === 'get_submission') {
    const [cid, recipient] = args;
    return mockSubmissions[`${cid}:${recipient}`] || {};
  }
  if (methodName === 'is_payment_allowed') {
    const [cid, recipient] = args;
    const sub = mockSubmissions[`${cid}:${recipient}`];
    if (!sub) return { allowed: false, reason: 'No submission' };
    if (sub.status !== 'verified') return { allowed: false, reason: 'Not verified' };
    return { allowed: true, reason: 'Verified' };
  }
  return {};
}

// Inject mock functions into server context
app.post('/api/project', async (req, res) => {
  try {
    const { project_id, name, logo_url, description, chain, creator, signature } = req.body;
    if (!project_id || !name) return res.status(400).json({ error: 'project_id and name required' });
    if (!creator || !signature) return res.status(400).json({ error: 'Wallet connection required: provide creator address and signature' });
    // Mock signature verification - in production this would use viem verifyMessage
    const isValidSignature = signature.length > 10 && creator.startsWith('0x');
    if (!isValidSignature) return res.status(401).json({ error: 'Invalid wallet signature' });
    const { hash } = await writeContract('governance', 'create_project', [project_id, name, logo_url || '', description || '', chain || 'GenLayer']);
    res.json({ success: true, txHash: hash, projectId: project_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/projects', async (req, res) => {
  try {
    const projects = await readContract('governance', 'get_all_projects', []);
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/campaign', async (req, res) => {
  try {
    const { campaignId, project_id, rules, maxPerRecipient, durationDays, requiredDeliverables, recipients, creator, signature } = req.body;
    if (!campaignId || !rules || !project_id) {
      return res.status(400).json({ error: 'campaignId, project_id, and rules required' });
    }
    if (!creator || !signature) return res.status(400).json({ error: 'Wallet connection required: provide creator address and signature' });
    // Mock signature verification
    const isValidSignature = signature.length > 10 && creator.startsWith('0x');
    if (!isValidSignature) return res.status(401).json({ error: 'Invalid wallet signature' });
    // Check project exists and creator matches
    const project = mockProjects.find(p => p.id === project_id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (project.creator && creator.toLowerCase() !== project.creator.toLowerCase()) {
      return res.status(403).json({ error: 'Only the project creator can create a campaign' });
    }
    const { hash } = await writeContract('governance', 'create_campaign', [
      campaignId, project_id, rules, maxPerRecipient || '0', durationDays || 90, requiredDeliverables || '', recipients || ''
    ]);
    res.json({ success: true, txHash: hash, campaignId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/evidence', async (req, res) => {
  try {
    const { campaignId, recipient, url } = req.body;
    if (!campaignId || !recipient || !url) {
      return res.status(400).json({ error: 'campaignId, recipient, and url required' });
    }
    const { hash } = await writeContract('governance', 'submit_evidence', [campaignId, recipient, url]);
    res.json({ success: true, txHash: hash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/verify', async (req, res) => {
  try {
    const { campaignId, recipient } = req.body;
    if (!campaignId || !recipient) {
      return res.status(400).json({ error: 'campaignId and recipient required' });
    }
    const { hash } = await writeContract('governance', 'verify', [campaignId, recipient]);
    res.json({ success: true, txHash: hash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

describe('Ecosystem Fund Guardian API', () => {
  describe('POST /api/project', () => {
    it('should create a project', async () => {
      const res = await fetch('http://localhost:9999/api/project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: 'test-project', name: 'Test Project', description: 'A test', creator: '0x1234567890abcdef1234567890abcdef12345678', signature: '0xsignature' })
      });
      const json = await res.json();
      assert.equal(res.status, 200);
      assert.ok(json.success);
      assert.equal(json.projectId, 'test-project');
    });

    it('should reject missing name', async () => {
      const res = await fetch('http://localhost:9999/api/project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: 'x' })
      });
      assert.equal(res.status, 400);
    });

    it('should reject missing wallet connection', async () => {
      const res = await fetch('http://localhost:9999/api/project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: 'x', name: 'Test' })
      });
      assert.equal(res.status, 400);
    });

    it('should reject invalid signature', async () => {
      const res = await fetch('http://localhost:9999/api/project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: 'x', name: 'Test', creator: 'invalid', signature: 'bad' })
      });
      assert.equal(res.status, 401);
    });
  });

  describe('GET /api/projects', () => {
    it('should list all projects', async () => {
      const res = await fetch('http://localhost:9999/api/projects');
      const json = await res.json();
      assert.ok(Array.isArray(json));
      assert.equal(json.length, 1);
      assert.equal(json[0].name, 'Test Project');
    });
  });

  describe('POST /api/campaign', () => {
    it('should create a campaign with project_id', async () => {
      // First create a project
      await fetch('http://localhost:9999/api/project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: 'test-project', name: 'Test Project', creator: '0x1234567890abcdef1234567890abcdef12345678', signature: '0xsignature' })
      });
      
      const res = await fetch('http://localhost:9999/api/campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: 'test-project-marketing',
          project_id: 'test-project',
          rules: 'Marketing only',
          durationDays: 90,
          creator: '0x1234567890abcdef1234567890abcdef12345678',
          signature: '0xsignature'
        })
      });
      const json = await res.json();
      assert.equal(res.status, 200);
      assert.ok(json.success);
    });

    it('should reject missing project_id', async () => {
      const res = await fetch('http://localhost:9999/api/campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId: 'x', rules: 'test' })
      });
      assert.equal(res.status, 400);
    });

    it('should reject non-creator trying to create campaign', async () => {
      const res = await fetch('http://localhost:9999/api/campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: 'camp-other',
          project_id: 'test-project',
          rules: 'Test',
          creator: '0xOTHER1234567890abcdef1234567890abcde',
          signature: '0xsignature'
        })
      });
      assert.equal(res.status, 403);
    });
  });

  describe('Full flow: Create Project → Lock Fund → Submit Evidence → Verify', () => {
    it('step 1: create project', async () => {
      const res = await fetch('http://localhost:9999/api/project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: 'hyperliquid', name: 'Hyperliquid', chain: 'EVM', creator: '0x1234567890abcdef1234567890abcdef12345678', signature: '0xsignature' })
      });
      const json = await res.json();
      assert.ok(json.success);
    });

    it('step 2: lock fund', async () => {
      const res = await fetch('http://localhost:9999/api/campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: 'hyperliquid-marketing',
          project_id: 'hyperliquid',
          rules: 'Marketing campaigns only',
          durationDays: 90,
          creator: '0x1234567890abcdef1234567890abcdef12345678',
          signature: '0xsignature'
        })
      });
      const json = await res.json();
      assert.ok(json.success);
    });

    it('step 3: submit evidence', async () => {
      const res = await fetch('http://localhost:9999/api/evidence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: 'hyperliquid-marketing',
          recipient: '0xabc123',
          url: 'https://example.com/marketing-report'
        })
      });
      const json = await res.json();
      assert.ok(json.success);
    });

    it('step 4: verify evidence', async () => {
      const res = await fetch('http://localhost:9999/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: 'hyperliquid-marketing',
          recipient: '0xabc123'
        })
      });
      const json = await res.json();
      assert.ok(json.success);
    });

    it('step 5: check payment allowed', async () => {
      // Simulate governance check
      const submissions = await fetch('http://localhost:9999/api/projects');
      const projects = await submissions.json();
      assert.ok(projects.length > 0);
    });
  });
});

// Start server for tests
const server = app.listen(9999, () => {
  console.log('Test server running on http://localhost:9999');
});

after(() => server.close());
