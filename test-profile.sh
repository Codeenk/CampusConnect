#!/bin/bash

# Profile Testing Script
# This script helps test the profile functionality

echo "🚀 Starting CampusConnect Profile Test"
echo "======================================"

echo "📋 Testing Profile API Endpoints..."

# Start the server in the background
echo "Starting server..."
cd "/home/grim/Documents/Campus Connect/CampusConnect"
npm start &
SERVER_PID=$!

# Wait for server to start
sleep 5

echo "✅ Server started (PID: $SERVER_PID)"

echo "🔍 Open your browser and:"
echo "1. Go to http://localhost:5173"
echo "2. Login with a user account"
echo "3. Edit your profile and fill out all fields"
echo "4. Search for another user and view their profile"
echo "5. Check the browser console for debug information"

echo ""
echo "📊 Look for the following in browser console:"
echo "- 'PROFILE FIELD DEBUGGER' logs"
echo "- Profile data keys and values"
echo "- Missing fields information"

echo ""
echo "⚠️  Press Ctrl+C to stop the server when done testing"

# Wait for user to stop
wait $SERVER_PID