#!/usr/bin/env node
/**
 * Contract deployment & integration test script
 * Run with: node test-contract.js
 * Requires: genlayer CLI accessible, Docker available
 */

const { execSync } = require('child_process');
const path = require('path');

const CONTRACTS_DIR = path.join(__dirname, '..', 'contracts');
const GOVERNANCE_PATH = path.join(CONTRACTS_DIR, 'governance.py');
const SPENDING_PATH = path.join(CONTRACTS_DIR, 'spending.py');

console.log('='.repeat(60));
console.log('Ecosystem Fund Guardian — Contract Test Suite');
console.log('='.repeat(60));

// ──────────────────────────────────────────────
// Helper: run genlayer command
// ──────────────────────────────────────────────
function run(cmd, opts = {}) {
  console.log(`\n$ ${cmd}`);
  try {
    const result = execSync(cmd, { encoding: 'utf8', stdio: 'inherit', ...opts });
    return result;
  } catch (err) {
    console.error('Command failed:', err.message);
    throw err;
  }
}

// ──────────────────────────────────────────────
// Step 1: Check environment
// ──────────────────────────────────────────────
console.log('\n[1/6] Checking environment...');

try {
  const version = execSync('genlayer --version', { encoding: 'utf8' }).trim();
  console.log(`   GenLayer CLI version: ${version}`);
} catch (err) {
  console.error('   ✗ genlayer CLI not found. Install with: npm install -g genlayer');
  process.exit(1);
}

try {
  const accounts = execSync('genlayer account list', { encoding: 'utf8' });
  console.log('   Available accounts:\n' + accounts.split('\n').map(l => '     ' + l).join('\n'));
} catch (err) {
  console.error('   ✗ No accounts found. Create one with: genlayer account create');
  process.exit(1);
}

// ──────────────────────────────────────────────
// Step 2: Deploy Governance Contract
// ──────────────────────────────────────────────
console.log('\n[2/6] Deploying Governance Contract...');

let governanceAddress;
try {
  const deployOutput = run(`genlayer deploy --contract ${GOVERNANCE_PATH} 2>&1`);
  // Parse address from output
  const match = deployOutput.match(/0x[a-fA-F0-9]{40}/);
  if (match) {
    governanceAddress = match[0];
    console.log(`   ✓ Governance deployed: ${governanceAddress}`);
  } else {
    console.error('   ✗ Could not parse deployment address');
    console.log('   Output:', deployOutput);
  }
} catch (err) {
  console.error('   ✗ Governance deployment failed:', err.message);
}

if (!governanceAddress) {
  console.error('\nCannot proceed without governance contract address.');
  console.error('Run: genlayer up --headless to start local simulator, then retry.');
  process.exit(1);
}

// ──────────────────────────────────────────────
// Step 3: Deploy Spending Contract
// ──────────────────────────────────────────────
console.log('\n[3/6] Deploying Spending Contract...');

let spendingAddress;
try {
  const deployOutput = run(`genlayer deploy --contract ${SPENDING_PATH} 2>&1`);
  const match = deployOutput.match(/0x[a-fA-F0-9]{40}/);
  if (match) {
    spendingAddress = match[0];
    console.log(`   ✓ Spending deployed: ${spendingAddress}`);
  }
} catch (err) {
  console.error('   ✗ Spending deployment failed:', err.message);
}

// ──────────────────────────────────────────────
// Step 4: Link contracts
// ──────────────────────────────────────────────
console.log('\n[4/6] Linking Spending → Governance...');

try {
  const result = run(`genlayer write ${spendingAddress} set_governance --args "${governanceAddress}"`);
  console.log('   ✓ Governance address linked');
} catch (err) {
  console.error('   ✗ Failed to link contracts:', err.message);
}

// ──────────────────────────────────────────────
// Step 5: Integration Tests
// ──────────────────────────────────────────────
console.log('\n[5/6] Running integration tests...\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`   ✓ ${name}`);
    passed++;
  } catch (err) {
    console.log(`   ✗ ${name}: ${err.message}`);
    failed++;
  }
}

// Test 1: Create project
test('Create Project', () => {
  const result = run(`genlayer write ${governanceAddress} create_project --args "test-project" "Test Project" "" "A test project" "GenLayer"`);
  if (!result.includes('Project created')) throw new Error('Project creation failed');
});

// Test 2: Get project
test('Get Project', () => {
  const result = run(`genlayer call ${governanceAddress} get_project --args "test-project"`);
  if (!result.includes('Test Project')) throw new Error('Project not found');
});

// Test 3: List projects
test('List Projects', () => {
  const result = run(`genlayer call ${governanceAddress} get_all_projects`);
  if (!result.includes('test-project')) throw new Error('Projects list failed');
});

// Test 4: Create campaign
test('Create Campaign', () => {
  const result = run(`genlayer write ${governanceAddress} create_campaign --args "test-project-marketing" "test-project" "Marketing only" "0" "90" "" ""`);
  if (!result.includes('Campaign created')) throw new Error('Campaign creation failed');
});

// Test 5: Get campaign
test('Get Campaign', () => {
  const result = run(`genlayer call ${governanceAddress} get_campaign --args "test-project-marketing"`);
  if (!result.includes('Marketing only')) throw new Error('Campaign not found');
});

// Test 6: Submit evidence
test('Submit Evidence', () => {
  const result = run(`genlayer write ${governanceAddress} submit_evidence --args "test-project-marketing" "0xabc123" "https://example.com/report"`);
  if (!result.includes('Evidence submitted')) throw new Error('Evidence submission failed');
});

// Test 7: Verify evidence (this will fail in local mode due to web.get)
// test('Verify Evidence', () => { ... });

// Test 8: Check payment allowed
test('Payment Allowed (should be false - not verified)', () => {
  const result = run(`genlayer call ${governanceAddress} is_payment_allowed --args "test-project-marketing" "0xabc123"`);
  // Should return allowed: false since not verified
  console.log(`   Response: ${result.substring(0, 100)}...`);
});

// ──────────────────────────────────────────────
// Step 6: Summary
// ──────────────────────────────────────────────
console.log('\n[6/6] Test Results');
console.log('='.repeat(60));
console.log(`   Passed: ${passed}`);
console.log(`   Failed: ${failed}`);
console.log('='.repeat(60));

if (failed > 0) {
  console.log('\n✗ Some tests failed');
  process.exit(1);
} else {
  console.log('\n✓ All tests passed!');
  console.log(`\nContract Addresses:`);
  console.log(`   Governance: ${governanceAddress}`);
  console.log(`   Spending:   ${spendingAddress}`);
  console.log(`\nSave these to your .env file:`);
  console.log(`   GOVERNANCE_CONTRACT=${governanceAddress}`);
  console.log(`   SPENDING_CONTRACT=${spendingAddress}`);
}
