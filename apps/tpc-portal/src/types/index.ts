export interface Student {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: 'student';
  department: string;
  major: string;
  minor?: string;
  year: number;
  graduation_year: number;
  student_id: string;
  bio?: string;
  avatar_url?: string;
  profile_image_url?: string;
  headline?: string;
  location?: string;
  hometown?: string;
  gpa?: number;
  skills: string[];
  interests: string[];
  achievements: Achievement[];
  phone_number?: string;
  github_url?: string;
  linkedin_url?: string;
  portfolio_url?: string;
  is_verified: boolean;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface Achievement {
  type: 'experience' | 'project' | 'certification' | 'education' | 'headline' | 'location';
  value: any;
}

export interface Experience {
  id: string;
  position: string;
  company: string;
  location?: string;
  start_date: string;
  end_date?: string;
  is_current: boolean;
  description?: string;
  skills?: string[];
}

export interface Project {
  id: string;
  name: string;
  description: string;
  technologies?: string[];
  start_date?: string;
  end_date?: string;
  github_url?: string;
  live_url?: string;
  image_url?: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  issue_date: string;
  expiry_date?: string;
  credential_id?: string;
  credential_url?: string;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field_of_study: string;
  start_date: string;
  end_date?: string;
  gpa?: number;
  description?: string;
}

export interface Endorsement {
  id: string;
  student_id: string;
  faculty_id: string;
  post_id?: string;
  endorsement_text: string;
  skills_endorsed: string[];
  rating?: number;
  is_public: boolean;
  created_at: string;
  faculty: {
    name: string;
    role: string;
    department: string;
    avatar_url?: string;
  };
}

export interface SearchFilters {
  query?: string;
  department?: string;
  graduation_year?: number;
  skills?: string[];
  skills_match?: 'any' | 'all';
  min_gpa?: number;
  verified_only?: boolean;
  has_projects?: boolean;
  has_experience?: boolean;
}

export interface SearchResult {
  students: Student[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface ExportJob {
  id: string;
  created_by: string;
  filters: SearchFilters;
  template: 'standard';
  format: 'pdf' | 'docx';
  verified_only: boolean;
  total_students: number;
  processed_students: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  artifact_url?: string;
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

export interface ExportArtifact {
  id: string;
  job_id: string;
  filename: string;
  file_size: number;
  download_url: string;
  expires_at: string;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  role: 'tpc_admin' | 'admin';
  name: string;
  department?: string;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface ResumeTemplate {
  id: 'standard';
  name: 'Standard ATS';
  description: 'Clean, single-column layout optimized for ATS systems';
}