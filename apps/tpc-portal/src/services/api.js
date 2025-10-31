import axios from 'axios';

class ApiService {
  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth token to requests
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('tpc_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle auth errors
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('tpc_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth methods
  async login(email, password) {
    const response = await this.api.post('/auth/login', { email, password });
    const { user, token } = response.data.data;
    
    // Verify TPC role
    if (!['tpc_admin', 'admin'].includes(user.role)) {
      throw new Error('Access denied. TPC admin role required.');
    }
    
    localStorage.setItem('tpc_token', token);
    return { user, token };
  }

  async logout() {
    try {
      await this.api.post('/auth/logout');
    } finally {
      localStorage.removeItem('tpc_token');
    }
  }

  async getCurrentUser() {
    const response = await this.api.get('/auth/me');
    return response.data.data.user;
  }

  // Student search and profile methods
  async searchStudents(filters = {}, page = 1, perPage = 20) {
    const params = new URLSearchParams();
    
    if (filters.query) params.set('query', filters.query);
    if (filters.department) params.set('department', filters.department);
    if (filters.graduation_year) params.set('graduation_year', filters.graduation_year.toString());
    if (filters.skills?.length) {
      params.set('skills', filters.skills.join(','));
      params.set('skills_match', filters.skills_match || 'any');
    }
    if (filters.min_gpa) params.set('min_gpa', filters.min_gpa.toString());
    if (filters.verified_only) params.set('verified_only', 'true');
    if (filters.has_projects) params.set('has_projects', 'true');
    if (filters.has_experience) params.set('has_experience', 'true');
    
    params.set('page', page.toString());
    params.set('per_page', perPage.toString());

    const response = await this.api.get(`/tpc/search?${params}`);
    return response.data.data;
  }

  async getStudentProfile(studentId) {
    const response = await this.api.get(`/tpc/profile/${studentId}`);
    return response.data.data.student;
  }

  // Export methods
  async exportSingleResume(studentId, template = 'standard', format = 'pdf', verifiedOnly = false) {
    const response = await this.api.post(`/tpc/export/single`, {
      studentId,
      template,
      format,
      verifiedOnly
    }, {
      responseType: 'blob'
    });
    return response.data;
  }

  async exportBatchResumes(filters, template = 'standard', format = 'pdf', verifiedOnly = false) {
    const response = await this.api.post(`/tpc/export/batch`, {
      filters,
      template,
      format,
      verifiedOnly
    });
    return response.data.data;
  }

  async getExportJob(jobId) {
    const response = await this.api.get(`/tpc/export/jobs/${jobId}`);
    return response.data.data.job;
  }

  async getExportHistory() {
    const response = await this.api.get(`/tpc/export/history`);
    return response.data.data.jobs;
  }

  // Compatibility methods expected by UI
  async getExportJobs() {
    const response = await this.api.get('/tpc/export/jobs');
    // backend may return plain array or a wrapped object
    if (response && response.data) {
      // If backend returns { success: true, data: { jobs: [...] } }
      if (response.data.data && response.data.data.jobs) return response.data.data.jobs;
      // If backend returns { jobs: [...] } or plain array
      if (Array.isArray(response.data)) return response.data;
      if (response.data.jobs) return response.data.jobs;
      // Fallback to nested data
      return response.data.data || response.data;
    }
    return [];
  }

  async deleteExportJob(jobId) {
    const response = await this.api.delete(`/tpc/export/jobs/${jobId}`);
    return response.data;
  }

  async downloadExport(jobId) {
    // Use a navigation to the download endpoint so server can redirect to the storage URL
    // This avoids trying to handle cross-origin redirects with axios/blobs.
    const url = `${this.api.defaults.baseURL.replace(/\/\/$/, '')}/tpc/export/${jobId}/download`;
    window.location.href = url;
  }

  // Department and stats methods
  async getDepartments() {
    const response = await this.api.get('/tpc/departments');
    return response.data.data.departments;
  }

  async getSkills() {
    const response = await this.api.get('/tpc/skills');
    return response.data.data.skills;
  }

  async getGraduationYears() {
    const response = await this.api.get('/tpc/graduation-years');
    return response.data.data.years;
  }

  // Additional helper methods for search history
  async getSearchHistory() {
    // Mock implementation - can be replaced with actual API call
    const history = localStorage.getItem('search_history');
    return history ? JSON.parse(history) : [];
  }

  async saveSearchHistory(filters) {
    const history = await this.getSearchHistory();
    history.unshift({ filters, timestamp: Date.now() });
    localStorage.setItem('search_history', JSON.stringify(history.slice(0, 10)));
  }

  // Helper method for downloading resume
  async downloadStudentResume(studentId) {
    const blob = await this.exportSingleResume(studentId);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resume_${studentId}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  // Helper method for resume preview
  async getResumePreviewUrl(studentId) {
    const blob = await this.exportSingleResume(studentId);
    return window.URL.createObjectURL(blob);
  }
}

export const apiService = new ApiService();
export default apiService;
