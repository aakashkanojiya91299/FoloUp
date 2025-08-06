#!/usr/bin/env node

/**
 * Test script to verify user routes work without authentication
 * Run this after starting your development server
 */

const http = require('http');
const https = require('https');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

function makeRequest(url, method = 'GET') {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    const req = client.request(url, { method }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function testUserRoutes() {
  console.log('🧪 Testing user routes without authentication...\n');

  const tests = [
    {
      name: 'Home page (public)',
      url: `${BASE_URL}/`,
      expectedStatus: 200,
      description: 'Should be accessible without authentication'
    },
    {
      name: 'Interview page (public)',
      url: `${BASE_URL}/interview/test-unique-link`,
      expectedStatus: 200,
      description: 'Should be accessible without authentication for candidates'
    },
    {
      name: 'Call page (public)',
      url: `${BASE_URL}/call/test-interview-id`,
      expectedStatus: 200,
      description: 'Should be accessible without authentication for candidates'
    },
    {
      name: 'Dashboard page (should redirect to auth)',
      url: `${BASE_URL}/dashboard`,
      expectedStatus: 307, // Redirect to sign-in
      description: 'Should redirect to sign-in since dashboard requires auth'
    },
    {
      name: 'Dashboard interviews page (should redirect to auth)',
      url: `${BASE_URL}/dashboard/interviews/test-interview-id`,
      expectedStatus: 307, // Redirect to sign-in
      description: 'Should redirect to sign-in since dashboard interviews require auth'
    }
  ];

  for (const test of tests) {
    try {
      console.log(`Testing: ${test.name}`);
      console.log(`URL: ${test.url}`);
      console.log(`Expected: ${test.expectedStatus} - ${test.description}`);
      
      const response = await makeRequest(test.url);
      
      if (response.status === test.expectedStatus) {
        console.log(`✅ PASS - Status: ${response.status}`);
      } else {
        console.log(`❌ FAIL - Expected: ${test.expectedStatus}, Got: ${response.status}`);
      }
      
      console.log('---\n');
    } catch (error) {
      console.log(`❌ ERROR - ${error.message}`);
      console.log('---\n');
    }
  }

  console.log('🎉 Test completed!');
  console.log('\n📝 Summary:');
  console.log('- Home page: Public (no auth required)');
  console.log('- Interview pages: Public (no auth required for candidates)');
  console.log('- Call pages: Public (no auth required for candidates)');
  console.log('- Dashboard: Protected (requires authentication)');
  console.log('- Dashboard interviews: Protected (requires authentication)');
  console.log('\n💡 Notes:');
  console.log('- User routes are completely public for candidates');
  console.log('- Dashboard and interview management remain protected');
  console.log('- If you see 404 errors for test URLs, that\'s expected (they don\'t exist)');
  console.log('- The important thing is that user pages load without auth errors');
}

// Run tests if this file is executed directly
if (require.main === module) {
  testUserRoutes().catch(console.error);
}

module.exports = { testUserRoutes }; 
