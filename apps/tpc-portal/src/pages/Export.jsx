import { useState, useEffect } from 'react';
import { Download, Clock, CheckCircle, XCircle, RefreshCw, Trash2, FileText, Archive } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const Export = () => {
  const [exportJobs, setExportJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, pending, completed, failed
  
  const { user } = useAuth();

  useEffect(() => {
    loadExportJobs();
    
    // Auto-refresh every 30 seconds for pending jobs
    const interval = setInterval(() => {
      if (hasActivePendingJobs()) {
        refreshJobs();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadExportJobs = async () => {
    setLoading(true);
    try {
      const jobs = await apiService.getExportJobs();
      setExportJobs(jobs);
    } catch (error) {
      console.error('Failed to load export jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshJobs = async () => {
    setRefreshing(true);
    try {
      const jobs = await apiService.getExportJobs();
      setExportJobs(jobs);
    } catch (error) {
      console.error('Failed to refresh jobs:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const hasActivePendingJobs = () => {
    return exportJobs.some(job => job.status === 'pending' || job.status === 'processing');
  };

  const deleteJob = async (jobId) => {
    if (!confirm('Are you sure you want to delete this export job?')) return;
    
    try {
      await apiService.deleteExportJob(jobId);
      setExportJobs(jobs => jobs.filter(job => job.id !== jobId));
    } catch (error) {
      console.error('Failed to delete job:', error);
      alert('Failed to delete job. Please try again.');
    }
  };

  const downloadExport = async (jobId) => {
    try {
      await apiService.downloadExport(jobId);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. Please try again.');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
      case 'processing':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Queued';
      case 'processing':
        return 'Processing';
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      default:
        return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const filteredJobs = exportJobs.filter(job => {
    if (filter === 'all') return true;
    if (filter === 'pending') return job.status === 'pending' || job.status === 'processing';
    return job.status === filter;
  });

  const stats = {
    total: exportJobs.length,
    pending: exportJobs.filter(job => job.status === 'pending' || job.status === 'processing').length,
    completed: exportJobs.filter(job => job.status === 'completed').length,
    failed: exportJobs.filter(job => job.status === 'failed').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Export Jobs</h1>
          <p className="text-gray-600 mt-1">
            Monitor and download resume exports
          </p>
        </div>
        
        <button
          onClick={refreshJobs}
          disabled={refreshing}
          className="flex items-center space-x-2 px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Jobs</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Archive className="w-8 h-8 text-gray-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Failed</p>
              <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex space-x-2">
          {[
            { key: 'all', label: 'All Jobs' },
            { key: 'pending', label: 'Active' },
            { key: 'completed', label: 'Completed' },
            { key: 'failed', label: 'Failed' }
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === key
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Jobs List */}
      <div className="bg-white rounded-lg border border-gray-200">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-12">
            <Archive className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No export jobs found</h3>
            <p className="text-gray-600">
              {filter === 'all' 
                ? 'Start by searching and exporting student resumes'
                : `No ${filter} export jobs at the moment`
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredJobs.map((job) => (
              <div key={job.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      {getStatusIcon(job.status)}
                      <h3 className="text-lg font-medium text-gray-900">
                        Export Job #{job.id.slice(-8)}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                        {getStatusText(job.status)}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Students:</span> {job.student_count || 0}
                      </div>
                      <div>
                        <span className="font-medium">Created:</span> {formatDate(job.created_at)}
                      </div>
                      {job.completed_at && (
                        <div>
                          <span className="font-medium">Completed:</span> {formatDate(job.completed_at)}
                        </div>
                      )}
                    </div>

                    {job.filters && Object.keys(job.filters).length > 0 && (
                      <div className="mt-2">
                        <span className="text-sm font-medium text-gray-700">Filters: </span>
                        <span className="text-sm text-gray-600">
                          {Object.entries(job.filters)
                            .filter(([_, value]) => value && (Array.isArray(value) ? value.length > 0 : true))
                            .map(([key, value]) => {
                              if (Array.isArray(value)) {
                                return `${key}: ${value.join(', ')}`;
                              }
                              return `${key}: ${value}`;
                            })
                            .join(' • ')
                          }
                        </span>
                      </div>
                    )}

                    {job.error_message && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                        <span className="font-medium">Error:</span> {job.error_message}
                      </div>
                    )}

                    {job.status === 'completed' && job.download_url && (
                      <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <FileText className="w-4 h-4" />
                          <span>ZIP Archive</span>
                        </div>
                        {job.file_size && (
                          <div>
                            <span className="font-medium">Size:</span> {formatFileSize(job.file_size)}
                          </div>
                        )}
                        <div>
                          <span className="font-medium">Expires:</span> {formatDate(job.expires_at)}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    {job.status === 'completed' && job.download_url && (
                      <button
                        onClick={() => downloadExport(job.id)}
                        className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download</span>
                      </button>
                    )}
                    
                    <button
                      onClick={() => deleteJob(job.id)}
                      className="flex items-center space-x-2 px-4 py-2 text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>

                {(job.status === 'processing' || job.status === 'pending') && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{job.progress || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${job.progress || 0}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Export;