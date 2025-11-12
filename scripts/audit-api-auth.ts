/**
 * API Route Authentication Audit Script
 *
 * This script scans all API routes and checks for authentication.
 *
 * Usage:
 *   npx ts-node scripts/audit-api-auth.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface RouteAudit {
  path: string;
  hasAuth: boolean;
  authMethod: string;
  publicEndpoint: boolean;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  notes: string;
}

const apiDir = path.join(process.cwd(), 'app', 'api');
const results: RouteAudit[] = [];

// Known public endpoints that intentionally don't require auth
const PUBLIC_ENDPOINTS = [
  'app/api/calendar/webhook/route.ts', // Webhook from Google Calendar (external)
  'app/api/calendar/oauth/callback/route.ts', // OAuth callback (handles auth itself)
  'app/api/auth/callback/route.ts', // Supabase auth callback
];

// Auth patterns to look for
const AUTH_PATTERNS = [
  /await\s+supabase\.auth\.getUser\(\)/,
  /const\s+{\s*data:\s*{\s*user\s*}/,
  /if\s*\(\s*authError\s*\|\|\s*!user\s*\)/,
  /if\s*\(\s*error\s*\|\|\s*!user\s*\)/,
  /return.*Unauthorized.*401/,
];

function findRouteFiles(dir: string): string[] {
  let results: string[] = [];

  if (!fs.existsSync(dir)) {
    return results;
  }

  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      results = results.concat(findRouteFiles(filePath));
    } else if (file === 'route.ts') {
      results.push(filePath);
    }
  }

  return results;
}

function checkAuthInFile(filePath: string): { hasAuth: boolean; method: string } {
  const content = fs.readFileSync(filePath, 'utf8');

  // Check for auth patterns
  let authFound = false;
  let method = '';

  for (const pattern of AUTH_PATTERNS) {
    if (pattern.test(content)) {
      authFound = true;
      method = 'Supabase Auth (getUser)';
      break;
    }
  }

  // Check for API key authentication
  if (content.includes('x-api-key') || content.includes('Authorization')) {
    authFound = true;
    method = method ? `${method}, API Key` : 'API Key';
  }

  // Check for webhook secret
  if (content.includes('N8N_WEBHOOK_SECRET') || content.includes('WEBHOOK_SECRET')) {
    authFound = true;
    method = method ? `${method}, Webhook Secret` : 'Webhook Secret';
  }

  return { hasAuth: authFound, method: method || 'None' };
}

function auditRoutes() {
  console.log('🔍 Scanning API routes for authentication...\n');

  const routeFiles = findRouteFiles(apiDir);

  console.log(`Found ${routeFiles.length} API route(s)\n`);

  for (const routeFile of routeFiles) {
    const relativePath = path.relative(process.cwd(), routeFile);
    const { hasAuth, method } = checkAuthInFile(routeFile);
    const isPublic = PUBLIC_ENDPOINTS.some(endpoint => relativePath.includes(endpoint.replace(/\//g, path.sep)));

    let severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO' = 'INFO';
    let notes = '';

    if (!hasAuth && !isPublic) {
      severity = 'CRITICAL';
      notes = 'Missing authentication! Anyone can access this endpoint.';
    } else if (!hasAuth && isPublic) {
      severity = 'INFO';
      notes = 'Public endpoint (intentional)';
    } else {
      severity = 'LOW';
      notes = 'Authentication present';
    }

    results.push({
      path: relativePath,
      hasAuth,
      authMethod: method,
      publicEndpoint: isPublic,
      severity,
      notes,
    });
  }
}

function printResults() {
  console.log('═'.repeat(80));
  console.log('API AUTHENTICATION AUDIT REPORT');
  console.log('═'.repeat(80));
  console.log('');

  // Group by severity
  const critical = results.filter(r => r.severity === 'CRITICAL');
  const high = results.filter(r => r.severity === 'HIGH');
  const medium = results.filter(r => r.severity === 'MEDIUM');
  const low = results.filter(r => r.severity === 'LOW');
  const info = results.filter(r => r.severity === 'INFO');

  if (critical.length > 0) {
    console.log('🚨 CRITICAL - Missing Authentication');
    console.log('─'.repeat(80));
    critical.forEach(r => {
      console.log(`❌ ${r.path}`);
      console.log(`   ${r.notes}`);
      console.log('');
    });
  }

  if (high.length > 0) {
    console.log('⚠️  HIGH - Authentication Issues');
    console.log('─'.repeat(80));
    high.forEach(r => {
      console.log(`⚠️  ${r.path}`);
      console.log(`   Auth: ${r.authMethod}`);
      console.log(`   ${r.notes}`);
      console.log('');
    });
  }

  if (medium.length > 0) {
    console.log('⚠️  MEDIUM - Review Recommended');
    console.log('─'.repeat(80));
    medium.forEach(r => {
      console.log(`⚠️  ${r.path}`);
      console.log(`   Auth: ${r.authMethod}`);
      console.log(`   ${r.notes}`);
      console.log('');
    });
  }

  if (info.length > 0) {
    console.log('ℹ️  INFO - Public Endpoints');
    console.log('─'.repeat(80));
    info.forEach(r => {
      console.log(`ℹ️  ${r.path}`);
      console.log(`   ${r.notes}`);
      console.log('');
    });
  }

  if (low.length > 0) {
    console.log('✅ SECURE - Protected Endpoints');
    console.log('─'.repeat(80));
    low.forEach(r => {
      console.log(`✅ ${r.path}`);
      console.log(`   Auth: ${r.authMethod}`);
      console.log('');
    });
  }

  console.log('═'.repeat(80));
  console.log('SUMMARY');
  console.log('═'.repeat(80));
  console.log(`Total Routes: ${results.length}`);
  console.log(`Protected: ${results.filter(r => r.hasAuth).length}`);
  console.log(`Unprotected: ${results.filter(r => !r.hasAuth && !r.publicEndpoint).length}`);
  console.log(`Public (Intentional): ${results.filter(r => r.publicEndpoint).length}`);
  console.log('');

  if (critical.length > 0) {
    console.log('❌ AUDIT FAILED - Fix critical issues before production!');
    process.exit(1);
  } else {
    console.log('✅ AUDIT PASSED - All endpoints properly secured');
    process.exit(0);
  }
}

// Run audit
auditRoutes();
printResults();
