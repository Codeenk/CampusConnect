import { useState, useEffect, useCallback } from 'react';
import { Download, Users, Filter, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api.js';
import SearchFilters from '../components/SearchFilters';
import StudentsGrid from '../components/StudentsGrid';
import LoadingSpinner from '../components/LoadingSpinner';

const Search = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [filters, setFilters] = useState({});
  const [selectedStudents, setSelectedStudents] = useState(new Set());
  const [exportLoading, setExportLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(true);
  
  const { user } = useAuth();

  // Load initial data
  useEffect(() => {
    loadRecentStudents();
    loadSearchHistory();
  }, []);

  const loadRecentStudents = async () => {
    setLoading(true);
    try {
      const { data, count } = await apiService.searchStudents({
        limit: 20,
        offset: 0
      });
      setStudents(data);
      setTotalCount(count);
    } catch (error) {
      console.error('Failed to load students:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSearchHistory = async () => {
    try {
      const history = await apiService.getSearchHistory();
      setSearchHistory(history.slice(0, 5)); // Show last 5 searches
    } catch (error) {
      console.error('Failed to load search history:', error);
    }
  };

  const handleSearch = useCallback(async (searchFilters = filters, page = 1) => {
    setSearchLoading(true);
    setCurrentPage(page);
    
    try {
      const { data, count } = await apiService.searchStudents({
        ...searchFilters,
        limit: 20,
        offset: (page - 1) * 20
      });
      
      setStudents(data);
      setTotalCount(count);
      
      // Save search to history if it's a new search (not pagination)
      if (page === 1 && Object.keys(searchFilters).length > 0) {
        await apiService.saveSearchHistory(searchFilters);
        loadSearchHistory();
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setSearchLoading(false);
    }
  }, [filters]);

  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setSelectedStudents(new Set()); // Clear selection when filters change
  };

  const handleStudentSelect = (studentId, selected) => {
    const newSelection = new Set(selectedStudents);
    if (selected) {
      newSelection.add(studentId);
    } else {
      newSelection.delete(studentId);
    }
    setSelectedStudents(newSelection);
  };

  const handleSelectAll = (selected) => {
    if (selected) {
      setSelectedStudents(new Set(students.map(s => s.id)));
    } else {
      setSelectedStudents(new Set());
    }
  };

  const handleBulkExport = async () => {
    if (selectedStudents.size === 0) return;
    
    setExportLoading(true);
    try {
      const studentIds = Array.from(selectedStudents);
      await apiService.exportResumes(studentIds);
      
      // Show success message or handle download
      alert(`Export initiated for ${studentIds.length} students. You'll receive an email when ready.`);
      
      // Clear selection
      setSelectedStudents(new Set());
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setExportLoading(false);
    }
  };

  const handleQuickSearch = (searchQuery) => {
    const quickFilters = { query: searchQuery };
    setFilters(quickFilters);
    handleSearch(quickFilters);
  };

  const clearSearch = () => {
    setFilters({});
    setSelectedStudents(new Set());
    loadRecentStudents();
  };

  const totalPages = Math.ceil(totalCount / 20);
  const hasActiveFilters = Object.keys(filters).some(key => 
    filters[key] && (Array.isArray(filters[key]) ? filters[key].length > 0 : true)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Student Search</h1>
          <p className="text-gray-600 mt-1">
            Find and export student profiles and resumes
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Toggle Filters */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Filter className="w-4 h-4" />
            <span>{showFilters ? 'Hide' : 'Show'} Filters</span>
          </button>
          
          {/* Bulk Export */}
          {selectedStudents.size > 0 && (
            <button
              onClick={handleBulkExport}
              disabled={exportLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {exportLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              <span>Export ({selectedStudents.size})</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Search History */}
      {searchHistory.length > 0 && !hasActiveFilters && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Recent Searches</h3>
          <div className="flex flex-wrap gap-2">
            {searchHistory.map((search, index) => (
              <button
                key={index}
                onClick={() => handleQuickSearch(search.query)}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
              >
                {search.query || `${search.department || 'All'} - ${search.graduation_year || 'Any year'}`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search Filters */}
      {showFilters && (
        <SearchFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onSearch={() => handleSearch(filters)}
          loading={searchLoading}
        />
      )}

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="flex items-center space-x-2 bg-primary-50 border border-primary-200 rounded-lg p-3">
          <Filter className="w-4 h-4 text-primary-600" />
          <span className="text-sm text-primary-700">
            Active filters: {Object.entries(filters).filter(([_, value]) => 
              value && (Array.isArray(value) ? value.length > 0 : true)
            ).length}
          </span>
          <button
            onClick={clearSearch}
            className="ml-auto flex items-center space-x-1 text-sm text-primary-600 hover:text-primary-800"
          >
            <X className="w-4 h-4" />
            <span>Clear</span>
          </button>
        </div>
      )}

      {/* Results Header */}
      <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-600">
              {searchLoading ? 'Searching...' : `${totalCount} students found`}
            </span>
          </div>
          
          {selectedStudents.size > 0 && (
            <div className="text-sm text-primary-600">
              {selectedStudents.size} selected
            </div>
          )}
        </div>

        {/* Pagination Info */}
        {totalPages > 1 && (
          <div className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </div>
        )}
      </div>

      {/* Students Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <StudentsGrid
          students={students}
          selectedStudents={selectedStudents}
          onStudentSelect={handleStudentSelect}
          onSelectAll={handleSelectAll}
          loading={searchLoading}
        />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <button
            onClick={() => handleSearch(filters, currentPage - 1)}
            disabled={currentPage === 1 || searchLoading}
            className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          {/* Page Numbers */}
          <div className="flex space-x-1">
            {[...Array(Math.min(5, totalPages))].map((_, i) => {
              const pageNum = Math.max(1, currentPage - 2) + i;
              if (pageNum > totalPages) return null;
              
              return (
                <button
                  key={pageNum}
                  onClick={() => handleSearch(filters, pageNum)}
                  disabled={searchLoading}
                  className={`px-3 py-2 text-sm rounded-lg ${
                    pageNum === currentPage
                      ? 'bg-primary-600 text-white'
                      : 'bg-white border border-gray-300 hover:bg-gray-50'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          
          <button
            onClick={() => handleSearch(filters, currentPage + 1)}
            disabled={currentPage === totalPages || searchLoading}
            className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Search;