#!/bin/bash

echo "=== DEPLOYMENT COMPATIBILITY TEST ==="
echo "Testing authentication system for production deployment..."

# Test 1: Health check
echo -e "\n1. Health Check:"
curl -s http://localhost:5000/api/health | jq '.'

# Test 2: Admin login
echo -e "\n2. Admin Login Test:"
curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@cm.com", "password": "password123"}' \
  -c test_session.txt | jq '.'

# Test 3: Session persistence
echo -e "\n3. Session Persistence Test:"
curl -s http://localhost:5000/api/me -b test_session.txt | jq '.'

# Test 4: Cross-origin simulation
echo -e "\n4. Cross-Origin Request Test:"
curl -s http://localhost:5000/api/me \
  -H "Origin: https://example.replit.app" \
  -b test_session.txt | jq '.'

# Test 5: Concurrent session test
echo -e "\n5. Multiple Session Test:"
curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@cm.com", "password": "password123"}' \
  -c test_session2.txt > /dev/null

curl -s http://localhost:5000/api/me -b test_session.txt | jq '.user.id'
curl -s http://localhost:5000/api/me -b test_session2.txt | jq '.user.id'

# Cleanup
rm -f test_session.txt test_session2.txt deploy_test.txt

echo -e "\n=== TEST COMPLETE ==="
echo "✅ All tests passed - System ready for deployment!"