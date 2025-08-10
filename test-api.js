const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

// Test data
let testTokens = {
  student: null,
  faculty: null,
  admin: null
};

let testUsers = {
  student: null,
  faculty: null,
  admin: null
};

let testPost = null;

// Helper function to make API calls
const apiCall = async (method, endpoint, data = null, token = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {}
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (data) {
      config.data = data;
      config.headers['Content-Type'] = 'application/json';
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data || error.message,
      status: error.response?.status || 500
    };
  }
};

// Test functions
const testHealthCheck = async () => {
  console.log('\n🔍 Testing Health Check...');
  const result = await apiCall('GET', '/health');
  
  if (result.success) {
    console.log('✅ Health check passed');
    return true;
  } else {
    console.log('❌ Health check failed:', result.error);
    return false;
  }
};

const testUserRegistration = async () => {
  console.log('\n🔍 Testing User Registration...');
  
  const users = [
    {
      name: 'Test Student',
      email: 'student@test.com',
      password: 'password123',
      role: 'student',
      department: 'Computer Science',
      year: 3
    },
    {
      name: 'Test Faculty',
      email: 'faculty@test.com',
      password: 'password123',
      role: 'faculty',
      department: 'Computer Science'
    },
    {
      name: 'Test Admin',
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin',
      department: 'Administration'
    }
  ];

  for (const user of users) {
    const result = await apiCall('POST', '/auth/register', user);
    
    if (result.success) {
      console.log(`✅ ${user.role} registration successful`);
      testUsers[user.role] = result.data.data.user;
      testTokens[user.role] = result.data.data.token;
    } else {
      console.log(`❌ ${user.role} registration failed:`, result.error);
      return false;
    }
  }
  
  return true;
};

const testUserLogin = async () => {
  console.log('\n🔍 Testing User Login...');
  
  const loginData = {
    email: 'student@test.com',
    password: 'password123'
  };

  const result = await apiCall('POST', '/auth/login', loginData);
  
  if (result.success) {
    console.log('✅ Login successful');
    testTokens.student = result.data.data.token;
    return true;
  } else {
    console.log('❌ Login failed:', result.error);
    return false;
  }
};

const testProfileOperations = async () => {
  console.log('\n🔍 Testing Profile Operations...');
  
  // Test get profile
  const getResult = await apiCall('GET', '/profile/me', null, testTokens.student);
  
  if (!getResult.success) {
    console.log('❌ Get profile failed:', getResult.error);
    return false;
  }
  
  console.log('✅ Get profile successful');
  
  // Test update profile
  const updateData = {
    bio: 'Updated bio for testing',
    skills: ['JavaScript', 'Node.js', 'React'],
    github_url: 'https://github.com/testuser'
  };
  
  const updateResult = await apiCall('PUT', '/profile/update', updateData, testTokens.student);
  
  if (updateResult.success) {
    console.log('✅ Update profile successful');
    return true;
  } else {
    console.log('❌ Update profile failed:', updateResult.error);
    return false;
  }
};

const testPostOperations = async () => {
  console.log('\n🔍 Testing Post Operations...');
  
  // Test create post
  const postData = {
    title: 'Test Project',
    description: 'This is a test project for the API testing',
    tags: ['test', 'api', 'nodejs']
  };
  
  const createResult = await apiCall('POST', '/posts/create', postData, testTokens.student);
  
  if (!createResult.success) {
    console.log('❌ Create post failed:', createResult.error);
    return false;
  }
  
  console.log('✅ Create post successful');
  testPost = createResult.data.data.post;
  
  // Test get feed
  const feedResult = await apiCall('GET', '/posts/feed', null, testTokens.student);
  
  if (!feedResult.success) {
    console.log('❌ Get feed failed:', feedResult.error);
    return false;
  }
  
  console.log('✅ Get feed successful');
  
  // Test like post
  const likeResult = await apiCall('POST', `/posts/${testPost.id}/like`, {}, testTokens.faculty);
  
  if (!likeResult.success) {
    console.log('❌ Like post failed:', likeResult.error);
    return false;
  }
  
  console.log('✅ Like post successful');
  
  // Test comment on post
  const commentData = { comment: 'Great project!' };
  const commentResult = await apiCall('POST', `/posts/${testPost.id}/comment`, commentData, testTokens.faculty);
  
  if (commentResult.success) {
    console.log('✅ Comment on post successful');
    return true;
  } else {
    console.log('❌ Comment on post failed:', commentResult.error);
    return false;
  }
};

const testEndorsementOperations = async () => {
  console.log('\n🔍 Testing Endorsement Operations...');
  
  if (!testPost || !testUsers.student) {
    console.log('❌ Missing test data for endorsement');
    return false;
  }
  
  const endorsementData = {
    studentId: testUsers.student.id,
    projectId: testPost.id,
    endorsementText: 'Excellent work on this project!'
  };
  
  const result = await apiCall('POST', '/endorse', endorsementData, testTokens.faculty);
  
  if (result.success) {
    console.log('✅ Create endorsement successful');
    return true;
  } else {
    console.log('❌ Create endorsement failed:', result.error);
    return false;
  }
};

const testMessageOperations = async () => {
  console.log('\n🔍 Testing Message Operations...');
  
  if (!testUsers.faculty || !testUsers.student) {
    console.log('❌ Missing test users for messaging');
    return false;
  }
  
  const messageData = {
    receiverId: testUsers.faculty.id,
    message: 'Hello, this is a test message!'
  };
  
  const sendResult = await apiCall('POST', '/messages/send', messageData, testTokens.student);
  
  if (!sendResult.success) {
    console.log('❌ Send message failed:', sendResult.error);
    return false;
  }
  
  console.log('✅ Send message successful');
  
  // Test get conversations
  const conversationsResult = await apiCall('GET', '/messages/conversations', null, testTokens.student);
  
  if (conversationsResult.success) {
    console.log('✅ Get conversations successful');
    return true;
  } else {
    console.log('❌ Get conversations failed:', conversationsResult.error);
    return false;
  }
};

const testAdminOperations = async () => {
  console.log('\n🔍 Testing Admin Operations...');
  
  // Test get all users
  const usersResult = await apiCall('GET', '/admin/users', null, testTokens.admin);
  
  if (!usersResult.success) {
    console.log('❌ Get all users failed:', usersResult.error);
    return false;
  }
  
  console.log('✅ Get all users successful');
  
  // Test get statistics
  const statsResult = await apiCall('GET', '/admin/statistics', null, testTokens.admin);
  
  if (statsResult.success) {
    console.log('✅ Get statistics successful');
    return true;
  } else {
    console.log('❌ Get statistics failed:', statsResult.error);
    return false;
  }
};

// Main test runner
const runAllTests = async () => {
  console.log('🚀 Starting Campus Connect Backend API Tests...\n');
  
  const tests = [
    { name: 'Health Check', fn: testHealthCheck },
    { name: 'User Registration', fn: testUserRegistration },
    { name: 'User Login', fn: testUserLogin },
    { name: 'Profile Operations', fn: testProfileOperations },
    { name: 'Post Operations', fn: testPostOperations },
    { name: 'Endorsement Operations', fn: testEndorsementOperations },
    { name: 'Message Operations', fn: testMessageOperations },
    { name: 'Admin Operations', fn: testAdminOperations }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name} crashed:`, error.message);
      failed++;
    }
    
    // Wait a bit between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n📊 Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Backend is fully functional.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the logs above for details.');
  }
};

// Check if server is running
const checkServer = async () => {
  try {
    await axios.get('http://localhost:3001/api/health');
    return true;
  } catch (error) {
    return false;
  }
};

// Start testing
const main = async () => {
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    console.log('❌ Server is not running on http://localhost:3001');
    console.log('Please start the server with: npm run dev');
    process.exit(1);
  }
  
  await runAllTests();
};

main().catch(console.error);