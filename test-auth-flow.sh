#!/bin/bash

# Test script for Campus Connect signup and login flow
echo "🧪 Testing Campus Connect Authentication Flow..."

API_BASE="http://localhost:3001/api"
TEST_EMAIL="test.user$(date +%s)@example.com"
TEST_PASSWORD="TestPass123"

echo
echo "1️⃣ Testing Registration..."
REGISTER_RESPONSE=$(curl -s -X POST "${API_BASE}/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"fullName\": \"Test User\",
    \"email\": \"${TEST_EMAIL}\",
    \"password\": \"${TEST_PASSWORD}\",
    \"confirmPassword\": \"${TEST_PASSWORD}\",
    \"role\": \"student\",
    \"major\": \"Computer Science\",
    \"graduationYear\": \"2026\"
  }")

echo "Registration Response:"
echo "$REGISTER_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$REGISTER_RESPONSE"

echo
echo "2️⃣ Testing Login..."
LOGIN_RESPONSE=$(curl -s -X POST "${API_BASE}/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${TEST_EMAIL}\",
    \"password\": \"${TEST_PASSWORD}\"
  }")

echo "Login Response:"
echo "$LOGIN_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$LOGIN_RESPONSE"

echo
echo "3️⃣ Testing Login with Existing User (sarveshmalandkar-inft@atharvacoe.ac.in)..."
EXISTING_LOGIN=$(curl -s -X POST "${API_BASE}/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"sarveshmalandkar-inft@atharvacoe.ac.in\",
    \"password\": \"Sarvesh@213\"
  }")

echo "Existing User Login Response:"
echo "$EXISTING_LOGIN" | python3 -m json.tool 2>/dev/null || echo "$EXISTING_LOGIN"

echo
echo "4️⃣ Testing Duplicate Registration..."
DUPLICATE_REGISTER=$(curl -s -X POST "${API_BASE}/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"fullName\": \"Test User Duplicate\",
    \"email\": \"${TEST_EMAIL}\",
    \"password\": \"${TEST_PASSWORD}\",
    \"confirmPassword\": \"${TEST_PASSWORD}\",
    \"role\": \"student\",
    \"major\": \"Computer Science\",
    \"graduationYear\": \"2026\"
  }")

echo "Duplicate Registration Response:"
echo "$DUPLICATE_REGISTER" | python3 -m json.tool 2>/dev/null || echo "$DUPLICATE_REGISTER"

echo
echo "✅ Authentication Flow Test Complete!"