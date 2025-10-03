// Profile Field Debugging Script
// This file helps identify which fields are missing when viewing other users' profiles

import React from 'react';

const ProfileFieldDebugger = ({ profile, canEdit }) => {
  const allFields = [
    'name', 'email', 'bio', 'headline', 'location', 'hometown',
    'department', 'major', 'minor', 'year', 'graduation_year', 'gpa', 'student_id',
    'phone_number', 'github_url', 'linkedin_url', 'portfolio_url',
    'skills', 'interests', 'achievements', 'experience', 'projects', 'certifications', 'education'
  ];

  React.useEffect(() => {
    console.log('=== PROFILE FIELD DEBUGGER ===');
    console.log('Profile Object:', profile);
    console.log('Can Edit:', canEdit);
    console.log('Profile Keys:', Object.keys(profile || {}));
    
    allFields.forEach(field => {
      const value = profile?.[field];
      const hasValue = value !== null && value !== undefined && value !== '' && 
                      (Array.isArray(value) ? value.length > 0 : true);
      
      console.log(`${field}:`, {
        value: value,
        hasValue: hasValue,
        type: typeof value,
        isArray: Array.isArray(value),
        length: Array.isArray(value) ? value.length : (typeof value === 'string' ? value.length : 'N/A')
      });
    });
    
    console.log('=== END PROFILE DEBUG ===');
  }, [profile]);

  return (
    <div className="bg-yellow-100 border border-yellow-400 rounded-md p-4 mb-4">
      <h3 className="font-bold text-yellow-800 mb-2">🐛 Profile Debug Info</h3>
      <div className="text-sm text-yellow-700">
        <p><strong>Can Edit:</strong> {canEdit ? 'Yes' : 'No'}</p>
        <p><strong>Profile Fields:</strong> {Object.keys(profile || {}).length}</p>
        <p><strong>Missing Fields:</strong> {allFields.filter(field => !profile?.[field] || (Array.isArray(profile[field]) && profile[field].length === 0)).join(', ')}</p>
      </div>
    </div>
  );
};

export default ProfileFieldDebugger;