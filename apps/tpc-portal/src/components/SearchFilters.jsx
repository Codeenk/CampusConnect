import { useState, useEffect } from 'react';
import { Search, Filter, X, ChevronDown } from 'lucide-react';
import apiService from '../services/api';

const SearchFilters = ({ filters, onFiltersChange, onSearch, loading }) => {
  const [departments, setDepartments] = useState([]);
  const [skills, setSkills] = useState([]);
  const [graduationYears, setGraduationYears] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    loadFilterOptions();
  }, []);

  const loadFilterOptions = async () => {
    try {
      const [depts, skillsList, years] = await Promise.all([
        apiService.getDepartments(),
        apiService.getSkills(),
        apiService.getGraduationYears()
      ]);
      setDepartments(depts);
      setSkills(skillsList);
      setGraduationYears(years);
    } catch (error) {
      console.error('Failed to load filter options:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const addSkill = (skill) => {
    if (skill && !filters.skills?.includes(skill)) {
      const newSkills = [...(filters.skills || []), skill];
      handleFilterChange('skills', newSkills);
    }
    setSkillInput('');
  };

  const removeSkill = (skillToRemove) => {
    const newSkills = filters.skills?.filter(skill => skill !== skillToRemove) || [];
    handleFilterChange('skills', newSkills);
  };

  const clearFilters = () => {
    onFiltersChange({});
    setSkillInput('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch();
  };

  const hasActiveFilters = Object.keys(filters).some(key => 
    filters[key] && (Array.isArray(filters[key]) ? filters[key].length > 0 : true)
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Search Query */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by name, student ID, or keywords..."
            value={filters.query || ''}
            onChange={(e) => handleFilterChange('query', e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Quick Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Department
            </label>
            <select
              value={filters.department || ''}
              onChange={(e) => handleFilterChange('department', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Graduation Year
            </label>
            <select
              value={filters.graduation_year || ''}
              onChange={(e) => handleFilterChange('graduation_year', e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Any Year</option>
              {graduationYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Filter className="w-4 h-4" />
              <span>Advanced</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="border-t pt-4 space-y-4">
            {/* Skills */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Skills
              </label>
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Add skill..."
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addSkill(skillInput.trim());
                      }
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => addSkill(skillInput.trim())}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Add
                  </button>
                </div>
                
                {/* Selected Skills */}
                {filters.skills && filters.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {filters.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center space-x-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
                      >
                        <span>{skill}</span>
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="text-primary-500 hover:text-primary-700"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Skills Match Type */}
                {filters.skills && filters.skills.length > 1 && (
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="skills_match"
                        value="any"
                        checked={filters.skills_match !== 'all'}
                        onChange={(e) => handleFilterChange('skills_match', e.target.value)}
                        className="mr-2"
                      />
                      Match any skill
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="skills_match"
                        value="all"
                        checked={filters.skills_match === 'all'}
                        onChange={(e) => handleFilterChange('skills_match', e.target.value)}
                        className="mr-2"
                      />
                      Match all skills
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* GPA and Other Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum GPA
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  placeholder="e.g., 3.5"
                  value={filters.min_gpa || ''}
                  onChange={(e) => handleFilterChange('min_gpa', e.target.value ? parseFloat(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.verified_only || false}
                    onChange={(e) => handleFilterChange('verified_only', e.target.checked)}
                    className="mr-2 w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Verified profiles only</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.has_projects || false}
                    onChange={(e) => handleFilterChange('has_projects', e.target.checked)}
                    className="mr-2 w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Has projects</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.has_experience || false}
                    onChange={(e) => handleFilterChange('has_experience', e.target.checked)}
                    className="mr-2 w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">Has work experience</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center space-x-2">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm text-gray-600 hover:text-gray-900 underline"
              >
                Clear all filters
              </button>
            )}
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {loading && <LoadingSpinner size="sm" />}
            <Search className="w-4 h-4" />
            <span>Search Students</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default SearchFilters;