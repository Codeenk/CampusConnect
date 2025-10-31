import axios, { AxiosInstance } from 'axios';
import { SearchFilters, SearchResult, Student, ExportJob, User } from '../types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
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
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const response = await this.api.post('/auth/login', { email, password });
    const { user, token } = response.data.data;
    
    // Verify TPC role
    if (!['tpc_admin', 'admin'].includes(user.role)) {
      throw new Error('Access denied. TPC admin role required.');
    }
    
    localStorage.setItem('tpc_token', token);
    return { user, token };
  }

  async logout(): Promise<void> {
    try {
      await this.api.post('/auth/logout');
    } finally {
      localStorage.removeItem('tpc_token');
    }
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.api.get('/auth/me');
    return response.data.data.user;
  }

  // Student search and profile methods
  async searchStudents(filters: SearchFilters, page = 1, perPage = 20): Promise<SearchResult> {
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

  async getStudentProfile(studentId: string): Promise<Student> {
    const response = await this.api.get(`/tpc/profile/${studentId}`);
    return response.data.data.student;
  }

  // Export methods
  async exportSingleResume(
    studentId: string, 
    template = 'standard', 
    format: 'pdf' | 'docx' = 'pdf',
    verifiedOnly = false
  ): Promise<Blob> {
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

  async exportBatchResumes(
    filters: SearchFilters,
    template = 'standard',
    format: 'pdf' | 'docx' = 'pdf',
    verifiedOnly = false
  ): Promise<{ jobId?: string; downloadUrl?: string }> {
    const response = await this.api.post(`/tpc/export/batch`, {
      filters,
      template,
      format,
      verifiedOnly
    });
    return response.data.data;
  }

  async getExportJob(jobId: string): Promise<ExportJob> {
    const response = await this.api.get(`/tpc/export/jobs/${jobId}`);
    return response.data.data.job;
  }

  async getExportHistory(): Promise<ExportJob[]> {
    const response = await this.api.get(`/tpc/export/history`);
    return response.data.data.jobs;
  }

  // Department and stats methods
  async getDepartments(): Promise<string[]> {
    const response = await this.api.get('/tpc/departments');
    return response.data.data.departments;
  }

  async getSkills(): Promise<string[]> {
    const response = await this.api.get('/tpc/skills');
    return response.data.data.skills;
  }

  async getGraduationYears(): Promise<number[]> {
    const response = await this.api.get('/tpc/graduation-years');
    return response.data.data.years;
  }
}

export const apiService = new ApiService();
export default apiService;