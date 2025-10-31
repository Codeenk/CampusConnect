import { Search, Filter, Download, Eye, UserCheck, Calendar, MapPin, GraduationCap } from 'lucide-react';
import LoadingSpinner from './LoadingSpinner';

const StudentCard = ({ 
  student, 
  onPreview, 
  onDownload, 
  onSelect, 
  isSelected = false 
}) => {
  const skillsToShow = student.skills?.slice(0, 3) || [];
  const remainingSkills = (student.skills?.length || 0) - skillsToShow.length;
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(student.user_id, e.target.checked)}
            className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
          />
          <div className="flex-shrink-0">
            {student.avatar_url || student.profile_image_url ? (
              <img
                src={student.avatar_url || student.profile_image_url}
                alt={student.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-primary-600 font-medium text-lg">
                  {student.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{student.name}</h3>
            {student.student_id && (
              <p className="text-sm text-gray-500">{student.student_id}</p>
            )}
            {student.is_verified && (
              <div className="flex items-center space-x-1 mt-1">
                <UserCheck className="w-4 h-4 text-green-500" />
                <span className="text-xs text-green-600">Verified</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => onPreview(student)}
            className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            title="Preview Profile"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDownload(student)}
            className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            title="Download Resume"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center space-x-2 text-gray-600">
          <GraduationCap className="w-4 h-4" />
          <span>{student.department} • {student.major}</span>
        </div>
        
        {student.year && (
          <div className="flex items-center space-x-2 text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>Year {student.year} • Graduating {student.graduation_year}</span>
          </div>
        )}
        
        {student.location && (
          <div className="flex items-center space-x-2 text-gray-600">
            <MapPin className="w-4 h-4" />
            <span>{student.location}</span>
          </div>
        )}
        
        {student.gpa && (
          <div className="text-gray-600">
            <span className="font-medium">GPA:</span> {parseFloat(student.gpa).toFixed(2)}
          </div>
        )}
      </div>

      {skillsToShow.length > 0 && (
        <div className="mt-3">
          <div className="flex flex-wrap gap-1">
            {skillsToShow.map((skill, index) => (
              <span
                key={index}
                className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
              >
                {skill}
              </span>
            ))}
            {remainingSkills > 0 && (
              <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                +{remainingSkills} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const StudentsGrid = ({ 
  students, 
  loading, 
  selectedStudents, 
  onPreview, 
  onDownload, 
  onSelect, 
  onSelectAll 
}) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!students || students.length === 0) {
    return (
      <div className="text-center py-12">
        <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
        <p className="text-gray-600">Try adjusting your search criteria</p>
      </div>
    );
  }

  const allSelected = students.every(student => 
    selectedStudents.includes(student.user_id)
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={(e) => onSelectAll(e.target.checked)}
              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700">
              Select all ({students.length})
            </span>
          </label>
        </div>
        
        {selectedStudents.length > 0 && (
          <div className="text-sm text-gray-600">
            {selectedStudents.length} selected
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {students.map((student) => (
          <StudentCard
            key={student.user_id}
            student={student}
            isSelected={selectedStudents.includes(student.user_id)}
            onPreview={onPreview}
            onDownload={onDownload}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
};

export default StudentsGrid;