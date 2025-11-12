#!/bin/bash

##############################################################################
# Security Penetration Testing Script
# FocusOnIt Task Manager - Production Security Validation
#
# Usage:
#   chmod +x scripts/security-penetration-test.sh
#   ./scripts/security-penetration-test.sh https://focusonit.ycm360.com
#
# Requirements:
#   - curl
#   - jq (optional, for JSON formatting)
##############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Target URL (default: production)
TARGET="${1:-https://focusonit.ycm360.com}"

echo "═══════════════════════════════════════════════════════════════"
echo "  FocusOnIt Security Penetration Test"
echo "═══════════════════════════════════════════════════════════════"
echo "Target: $TARGET"
echo "Date: $(date)"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Track results
TESTS_PASSED=0
TESTS_FAILED=0
CRITICAL_ISSUES=0

##############################################################################
# Helper Functions
##############################################################################

pass() {
  echo -e "${GREEN}✓ PASS${NC} - $1"
  TESTS_PASSED=$((TESTS_PASSED + 1))
}

fail() {
  echo -e "${RED}✗ FAIL${NC} - $1"
  TESTS_FAILED=$((TESTS_FAILED + 1))
}

critical() {
  echo -e "${RED}🚨 CRITICAL${NC} - $1"
  CRITICAL_ISSUES=$((CRITICAL_ISSUES + 1))
  TESTS_FAILED=$((TESTS_FAILED + 1))
}

info() {
  echo -e "${BLUE}ℹ INFO${NC} - $1"
}

warn() {
  echo -e "${YELLOW}⚠ WARN${NC} - $1"
}

##############################################################################
# Test 1: HTTPS Enforcement
##############################################################################
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "TEST 1: HTTPS Enforcement"
echo "═══════════════════════════════════════════════════════════════"

HTTP_URL=$(echo $TARGET | sed 's/https:/http:/')
HTTP_REDIRECT=$(curl -s -o /dev/null -w "%{http_code}" -L "$HTTP_URL" | head -n1)

if [ "$HTTP_REDIRECT" = "301" ] || [ "$HTTP_REDIRECT" = "308" ] || [ "$HTTP_REDIRECT" = "200" ]; then
  # Check if final location is HTTPS
  FINAL_URL=$(curl -s -o /dev/null -w "%{url_effective}" -L "$HTTP_URL")
  if [[ $FINAL_URL == https://* ]]; then
    pass "HTTP redirects to HTTPS (Status: $HTTP_REDIRECT)"
  else
    critical "HTTP does not redirect to HTTPS! Final URL: $FINAL_URL"
  fi
else
  fail "Unexpected HTTP response: $HTTP_REDIRECT"
fi

##############################################################################
# Test 2: Security Headers
##############################################################################
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "TEST 2: Security Headers"
echo "═══════════════════════════════════════════════════════════════"

HEADERS=$(curl -s -I "$TARGET")

# X-Frame-Options
if echo "$HEADERS" | grep -i "x-frame-options:" | grep -i "DENY\|SAMEORIGIN" > /dev/null; then
  pass "X-Frame-Options header present (protects against clickjacking)"
else
  critical "X-Frame-Options header MISSING (vulnerable to clickjacking)"
fi

# X-Content-Type-Options
if echo "$HEADERS" | grep -i "x-content-type-options:" | grep -i "nosniff" > /dev/null; then
  pass "X-Content-Type-Options: nosniff present"
else
  fail "X-Content-Type-Options header missing (MIME sniffing possible)"
fi

# Strict-Transport-Security
if echo "$HEADERS" | grep -i "strict-transport-security:" > /dev/null; then
  pass "Strict-Transport-Security (HSTS) header present"
else
  warn "HSTS header missing (consider adding for better security)"
fi

# Content-Security-Policy
if echo "$HEADERS" | grep -i "content-security-policy:" > /dev/null; then
  pass "Content-Security-Policy (CSP) header present"
else
  warn "CSP header missing (XSS protection could be improved)"
fi

# Referrer-Policy
if echo "$HEADERS" | grep -i "referrer-policy:" > /dev/null; then
  pass "Referrer-Policy header present"
else
  info "Referrer-Policy header missing (optional)"
fi

# X-Powered-By (should NOT be present)
if echo "$HEADERS" | grep -i "x-powered-by:" > /dev/null; then
  warn "X-Powered-By header exposes technology stack"
else
  pass "X-Powered-By header hidden (good practice)"
fi

##############################################################################
# Test 3: SQL Injection (via API)
##############################################################################
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "TEST 3: SQL Injection Protection"
echo "═══════════════════════════════════════════════════════════════"

# Test SQL injection in unauthenticated endpoint
SQL_PAYLOAD='{"title": "Test\"; DROP TABLE tasks; --", "due_date": "2025-11-20"}'
SQL_RESPONSE=$(curl -s -X POST "$TARGET/api/voice-to-task" \
  -H "Content-Type: application/json" \
  -d '{"transcript": "Test'"'"'; DROP TABLE tasks; --"}' \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "$SQL_RESPONSE" | tail -n1)

if [ "$HTTP_CODE" = "401" ]; then
  pass "API requires authentication (SQL injection not testable without auth)"
elif [ "$HTTP_CODE" = "500" ] && echo "$SQL_RESPONSE" | grep -i "syntax error\|postgresql\|database" > /dev/null; then
  critical "Database error exposed - possible SQL injection vulnerability!"
else
  info "SQL injection test returned: $HTTP_CODE (inconclusive)"
fi

##############################################################################
# Test 4: XSS Protection
##############################################################################
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "TEST 4: XSS Protection"
echo "═══════════════════════════════════════════════════════════════"

# Test XSS payload
XSS_PAYLOAD='<script>alert("XSS")</script>'
XSS_RESPONSE=$(curl -s -X POST "$TARGET/api/voice-to-task" \
  -H "Content-Type: application/json" \
  -d "{\"transcript\": \"$XSS_PAYLOAD\"}" \
  -w "\n%{http_code}")

XSS_HTTP_CODE=$(echo "$XSS_RESPONSE" | tail -n1)

if [ "$XSS_HTTP_CODE" = "401" ]; then
  pass "API requires authentication (XSS not testable without auth)"
else
  info "XSS test returned: $XSS_HTTP_CODE (React escaping should prevent XSS)"
fi

##############################################################################
# Test 5: Unauthorized API Access
##############################################################################
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "TEST 5: Unauthorized API Access"
echo "═══════════════════════════════════════════════════════════════"

# Test endpoints without authentication
ENDPOINTS=(
  "/api/calendar/status"
  "/api/calendar/import"
  "/api/calendar/sync"
  "/api/voice-to-task"
  "/api/voice-edit-task"
)

for endpoint in "${ENDPOINTS[@]}"; do
  UNAUTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$TARGET$endpoint" \
    -H "Content-Type: application/json" \
    -d '{}')

  if [ "$UNAUTH_RESPONSE" = "401" ]; then
    pass "$endpoint requires authentication"
  elif [ "$UNAUTH_RESPONSE" = "400" ]; then
    warn "$endpoint returns 400 (may accept requests without auth)"
  elif [ "$UNAUTH_RESPONSE" = "200" ]; then
    critical "$endpoint accepts unauthenticated requests!"
  else
    info "$endpoint returned: $UNAUTH_RESPONSE"
  fi
done

##############################################################################
# Test 6: CORS Configuration
##############################################################################
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "TEST 6: CORS Configuration"
echo "═══════════════════════════════════════════════════════════════"

CORS_RESPONSE=$(curl -s -I "$TARGET" \
  -H "Origin: https://evil.com" \
  -H "Access-Control-Request-Method: POST")

if echo "$CORS_RESPONSE" | grep -i "access-control-allow-origin: \*" > /dev/null; then
  critical "CORS allows all origins (*) - potential security risk!"
elif echo "$CORS_RESPONSE" | grep -i "access-control-allow-origin:" > /dev/null; then
  ALLOWED_ORIGIN=$(echo "$CORS_RESPONSE" | grep -i "access-control-allow-origin:" | awk '{print $2}')
  pass "CORS restricted to: $ALLOWED_ORIGIN"
else
  pass "CORS not configured (defaults to same-origin)"
fi

##############################################################################
# Test 7: Rate Limiting
##############################################################################
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "TEST 7: Rate Limiting"
echo "═══════════════════════════════════════════════════════════════"

info "Sending 20 rapid requests to test rate limiting..."

RATE_LIMIT_DETECTED=false
for i in {1..20}; do
  RATE_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$TARGET/api/calendar/status")
  if [ "$RATE_RESPONSE" = "429" ]; then
    RATE_LIMIT_DETECTED=true
    break
  fi
  sleep 0.1
done

if [ "$RATE_LIMIT_DETECTED" = true ]; then
  pass "Rate limiting detected (429 Too Many Requests)"
else
  warn "No rate limiting detected (consider implementing to prevent abuse)"
fi

##############################################################################
# Test 8: Sensitive Data Exposure
##############################################################################
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "TEST 8: Sensitive Data Exposure"
echo "═══════════════════════════════════════════════════════════════"

# Check if sensitive files are exposed
SENSITIVE_FILES=(
  "/.env"
  "/.env.local"
  "/.git/config"
  "/api/debug"
  "/package.json"
)

for file in "${SENSITIVE_FILES[@]}"; do
  FILE_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$TARGET$file")

  if [ "$FILE_RESPONSE" = "200" ]; then
    critical "Sensitive file exposed: $file"
  else
    pass "$file not accessible (Status: $FILE_RESPONSE)"
  fi
done

##############################################################################
# SUMMARY
##############################################################################
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  TEST SUMMARY"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Total Tests Run: $((TESTS_PASSED + TESTS_FAILED))"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo -e "${RED}Critical Issues: $CRITICAL_ISSUES${NC}"
echo ""

if [ $CRITICAL_ISSUES -gt 0 ]; then
  echo -e "${RED}❌ CRITICAL ISSUES FOUND - DO NOT DEPLOY TO PRODUCTION!${NC}"
  exit 1
elif [ $TESTS_FAILED -gt 0 ]; then
  echo -e "${YELLOW}⚠️  Some tests failed - Review and fix before production${NC}"
  exit 1
else
  echo -e "${GREEN}✅ All security tests passed!${NC}"
  exit 0
fi
