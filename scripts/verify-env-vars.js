#!/usr/bin/env node

/**
 * Environment Variables Verification Script
 *
 * Verifies that required environment variables are configured correctly
 * for deployment to Vercel (or other platforms).
 *
 * Usage:
 *   node scripts/verify-env-vars.js
 *
 * This script checks:
 * 1. All required variables are present
 * 2. Variables have reasonable values (not placeholders)
 * 3. URLs are properly formatted
 *
 * NOTE: This script cannot verify if variables are Plaintext vs Encrypted
 * in Vercel - that must be checked manually in Vercel Dashboard.
 */

const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim();
          process.env[key.trim()] = value;
        }
      }
    });
  }
}

// Load .env.local before checking
loadEnvFile();

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.local');

  if (!fs.existsSync(envPath)) {
    log('❌ .env.local file not found', 'red');
    log('   Create it from .env.example: cp .env.example .env.local', 'yellow');
    return false;
  }

  log('✅ .env.local file exists', 'green');
  return true;
}

function checkRequiredVars() {
  log('\n🔍 Checking required environment variables...', 'cyan');

  const requiredVars = {
    // Edge Runtime - MUST be Plaintext in Vercel
    'NEXT_PUBLIC_SUPABASE_URL': {
      required: true,
      runtime: 'Edge Runtime',
      vercelType: 'Plaintext',
      validator: (val) => val?.startsWith('http'),
      example: 'https://xxx.supabase.co or https://api.yourdomain.com'
    },
    'NEXT_PUBLIC_SUPABASE_ANON_KEY': {
      required: true,
      runtime: 'Edge Runtime',
      vercelType: 'Plaintext',
      validator: (val) => val?.startsWith('eyJ'),
      example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    },
    'NEXT_PUBLIC_APP_URL': {
      required: false,
      runtime: 'Edge Runtime',
      vercelType: 'Plaintext',
      validator: (val) => !val || val.startsWith('http'),
      example: 'https://your-app-domain.com'
    },

    // Node.js Runtime - SHOULD be Encrypted in Vercel
    'SUPABASE_SERVICE_ROLE_KEY': {
      required: true,
      runtime: 'Node.js Runtime',
      vercelType: 'Encrypted',
      validator: (val) => val?.startsWith('eyJ'),
      example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    },
    'GOOGLE_CLIENT_ID': {
      required: false,
      runtime: 'Node.js Runtime',
      vercelType: 'Plaintext',
      validator: (val) => !val || val.includes('.apps.googleusercontent.com'),
      example: 'xxx.apps.googleusercontent.com'
    },
    'GOOGLE_CLIENT_SECRET': {
      required: false,
      runtime: 'Node.js Runtime',
      vercelType: 'Encrypted',
      validator: (val) => !val || val.startsWith('GOCSPX-'),
      example: 'GOCSPX-xxx'
    },
  };

  let allValid = true;
  let hasWarnings = false;

  for (const [varName, config] of Object.entries(requiredVars)) {
    const value = process.env[varName];
    const hasValue = !!value;
    const isValid = config.validator(value);

    if (config.required && !hasValue) {
      log(`❌ ${varName}`, 'red');
      log(`   MISSING (required for ${config.runtime})`, 'red');
      log(`   Example: ${config.example}`, 'yellow');
      allValid = false;
    } else if (config.required && !isValid) {
      log(`❌ ${varName}`, 'red');
      log(`   INVALID format`, 'red');
      log(`   Example: ${config.example}`, 'yellow');
      allValid = false;
    } else if (!config.required && !hasValue) {
      log(`⚠️  ${varName}`, 'yellow');
      log(`   Optional - not set (needed for ${config.runtime})`, 'yellow');
      hasWarnings = true;
    } else if (!config.required && !isValid) {
      log(`⚠️  ${varName}`, 'yellow');
      log(`   Set but invalid format`, 'yellow');
      log(`   Example: ${config.example}`, 'yellow');
      hasWarnings = true;
    } else {
      log(`✅ ${varName}`, 'green');
      if (config.vercelType) {
        log(`   Runtime: ${config.runtime} | Vercel Type: ${config.vercelType}`, 'blue');
      }
    }
  }

  return { allValid, hasWarnings };
}

function checkPlaceholders() {
  log('\n🔍 Checking for placeholder values...', 'cyan');

  const placeholders = [
    'tu-supabase-url',
    'tu-anon-key',
    'tu-service-role-key',
    'your-supabase',
    'xxx.supabase.co',
    'your-client-id',
    'your-client-secret',
  ];

  const envVars = Object.entries(process.env).filter(([key]) =>
    key.startsWith('NEXT_PUBLIC_') ||
    key.includes('SUPABASE') ||
    key.includes('GOOGLE')
  );

  let hasPlaceholders = false;

  for (const [key, value] of envVars) {
    for (const placeholder of placeholders) {
      if (value?.includes(placeholder)) {
        log(`⚠️  ${key} contains placeholder: "${placeholder}"`, 'yellow');
        hasPlaceholders = true;
      }
    }
  }

  if (!hasPlaceholders) {
    log('✅ No placeholder values detected', 'green');
  }

  return !hasPlaceholders;
}

function printVercelInstructions() {
  log('\n📋 Vercel Deployment Checklist:', 'cyan');
  log('');
  log('When deploying to Vercel, configure these variables:', 'blue');
  log('');
  log('CRITICAL - Must be Plaintext (for Edge Runtime):', 'yellow');
  log('  • NEXT_PUBLIC_SUPABASE_URL', 'yellow');
  log('  • NEXT_PUBLIC_SUPABASE_ANON_KEY', 'yellow');
  log('  • NEXT_PUBLIC_APP_URL', 'yellow');
  log('');
  log('Must be Encrypted (sensitive keys):', 'yellow');
  log('  • SUPABASE_SERVICE_ROLE_KEY', 'yellow');
  log('  • GOOGLE_CLIENT_SECRET', 'yellow');
  log('');
  log('Why? Middleware runs on Edge Runtime which cannot access encrypted vars.', 'blue');
  log('See docs/deployment/VERCEL_ENV_VARS.md for details.', 'blue');
  log('');
}

function main() {
  log('╔════════════════════════════════════════════════════════╗', 'cyan');
  log('║   FocusOnIt - Environment Variables Verification      ║', 'cyan');
  log('╚════════════════════════════════════════════════════════╝', 'cyan');

  // Check .env.local exists
  if (!checkEnvFile()) {
    process.exit(1);
  }

  // Check required variables
  const { allValid, hasWarnings } = checkRequiredVars();

  // Check for placeholders
  const noPlaceholders = checkPlaceholders();

  // Print Vercel instructions
  printVercelInstructions();

  // Summary
  log('\n' + '═'.repeat(60), 'cyan');
  if (allValid && noPlaceholders) {
    log('✅ All checks passed! Ready for deployment.', 'green');
    log('   Remember to configure variable types in Vercel Dashboard.', 'blue');
    process.exit(0);
  } else if (allValid && !noPlaceholders) {
    log('⚠️  Environment configured but contains placeholders.', 'yellow');
    log('   Update with real values before deploying.', 'yellow');
    process.exit(1);
  } else {
    log('❌ Environment validation failed.', 'red');
    log('   Fix the issues above before deploying.', 'red');
    if (hasWarnings) {
      log('   Some optional features may not work without all variables.', 'yellow');
    }
    process.exit(1);
  }
}

main();
