// Debug script to check profile field visibility issues
// This will help identify which fields are missing when viewing profiles

console.log('🔍 Profile Field Debugging Script');

// All expected profile fields that should be visible
const expectedFields = [
  // Basic Info
  'name', 'email', 'role', 'bio', 'avatar_url', 'headline', 'location',
  
  // Academic Info  
  'department', 'major', 'minor', 'year', 'graduation_year', 'gpa', 'student_id', 'hometown',
  
  // Contact Info
  'phone_number', 'github_url', 'linkedin_url', 'portfolio_url',
  
  // Arrays
  'skills', 'interests', 'achievements', 'experience', 'projects', 'certifications', 'education'
];

// Function to analyze profile data
function analyzeProfileData(profileData) {
  console.log('📊 Profile Data Analysis:');
  console.log('='.repeat(50));
  
  const missingFields = [];
  const emptyFields = [];
  const populatedFields = [];
  
  expectedFields.forEach(field => {
    if (!profileData.hasOwnProperty(field)) {
      missingFields.push(field);
    } else {
      const value = profileData[field];
      if (!value || 
          (typeof value === 'string' && value.trim() === '') ||
          (Array.isArray(value) && value.length === 0) ||
          value === null || 
          value === undefined) {
        emptyFields.push(field);
      } else {
        populatedFields.push(field);
      }
    }
  });
  
  console.log('✅ Populated Fields:', populatedFields.length);
  populatedFields.forEach(field => {
    console.log(`  • ${field}: ${JSON.stringify(profileData[field]).slice(0, 50)}...`);
  });
  
  console.log('\n⚠️  Empty Fields:', emptyFields.length);
  emptyFields.forEach(field => {
    console.log(`  • ${field}: ${profileData[field]}`);
  });
  
  console.log('\n❌ Missing Fields:', missingFields.length);
  missingFields.forEach(field => {
    console.log(`  • ${field}`);
  });
  
  console.log('\n📈 Summary:');
  console.log(`  Total Expected: ${expectedFields.length}`);
  console.log(`  Populated: ${populatedFields.length}`);
  console.log(`  Empty: ${emptyFields.length}`);
  console.log(`  Missing: ${missingFields.length}`);
  console.log(`  Completion: ${((populatedFields.length / expectedFields.length) * 100).toFixed(1)}%`);
  
  return {
    populated: populatedFields,
    empty: emptyFields,
    missing: missingFields,
    completionPercentage: ((populatedFields.length / expectedFields.length) * 100).toFixed(1)
  };
}

// Function to check EditableField rendering issues
function debugEditableFieldRendering() {
  console.log('\n🎨 EditableField Rendering Check:');
  console.log('='.repeat(50));
  
  const testCases = [
    { value: null, label: 'Null Value' },
    { value: undefined, label: 'Undefined Value' },
    { value: '', label: 'Empty String' },
    { value: '   ', label: 'Whitespace String' },
    { value: 'Valid Data', label: 'Valid Value' },
    { value: 0, label: 'Zero Number' },
    { value: false, label: 'Boolean False' }
  ];
  
  testCases.forEach(testCase => {
    const hasContent = testCase.value && String(testCase.value).trim();
    const displayValue = hasContent ? testCase.value : 'Not provided';
    console.log(`${testCase.label}: "${testCase.value}" → "${displayValue}" (${hasContent ? '✅' : '❌'})`);
  });
}

// Export functions for browser console use
if (typeof window !== 'undefined') {
  window.analyzeProfileData = analyzeProfileData;
  window.debugEditableFieldRendering = debugEditableFieldRendering;
  window.expectedProfileFields = expectedFields;
  
  console.log('🚀 Debug functions loaded! Use in browser console:');
  console.log('  • analyzeProfileData(profileData)');
  console.log('  • debugEditableFieldRendering()');
  console.log('  • expectedProfileFields');
}

debugEditableFieldRendering();