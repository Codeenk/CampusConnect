import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Download, Eye, Mail, Phone, MapPin, Calendar, 
  GraduationCap, Award, Briefcase, Code, User, Shield,
  ExternalLink, CheckCircle, AlertCircle, Clock
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const StudentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  
  const { user } = useAuth();

  useEffect(() => {
    if (id) {
      loadStudent();
    }
  }, [id]);

  const loadStudent = async () => {
    setLoading(true);
    try {
      const studentData = await apiService.getStudentProfile(id);
      setStudent(studentData);
    } catch (error) {
      console.error('Failed to load student:', error);
      if (error.response?.status === 404) {
        navigate('/search');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadResume = async () => {
    if (!student) return;
    
    setDownloadLoading(true);
    try {
      await apiService.downloadStudentResume(student.id);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Download failed. Please try again.');
    } finally {
      setDownloadLoading(false);
    }
  };

  const handlePreviewResume = async () => {
    if (!student) return;
    
    try {
      const url = await apiService.getResumePreviewUrl(student.id);
      setPreviewUrl(url);
      setShowPreview(true);
    } catch (error) {
      console.error('Preview failed:', error);
      alert('Preview not available. Please try downloading the resume.');
    }
  };

  const getVerificationStatus = (student) => {
    if (student.verification_status === 'verified') {
      return {
        icon: <CheckCircle className="w-5 h-5 text-green-500" />,
        text: 'Verified',
        color: 'text-green-700 bg-green-50 border-green-200'
      };
    } else if (student.verification_status === 'pending') {
      return {
        icon: <Clock className="w-5 h-5 text-yellow-500" />,
        text: 'Pending Verification',
        color: 'text-yellow-700 bg-yellow-50 border-yellow-200'
      };
    } else {
      return {
        icon: <AlertCircle className="w-5 h-5 text-gray-500" />,
        text: 'Unverified',
        color: 'text-gray-700 bg-gray-50 border-gray-200'
      };
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Student not found</h3>
        <p className="text-gray-600 mb-4">The student profile you're looking for doesn't exist.</p>
        <button
          onClick={() => navigate('/search')}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Back to Search
        </button>
      </div>
    );
  }

  const verification = getVerificationStatus(student);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Student Profile</h1>
            <p className="text-gray-600">Detailed information and resume</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handlePreviewResume}
            className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Eye className="w-4 h-4" />
            <span>Preview Resume</span>
          </button>
          
          <button
            onClick={handleDownloadResume}
            disabled={downloadLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            {downloadLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            <span>Download Resume</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Profile Card */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start space-x-4">
              <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
                {student.avatar_url ? (
                  <img 
                    src={student.avatar_url} 
                    alt={student.full_name}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-10 h-10 text-primary-600" />
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{student.full_name}</h2>
                    <p className="text-gray-600">{student.student_id}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      {verification.icon}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${verification.color}`}>
                        {verification.text}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {student.email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <a href={`mailto:${student.email}`} className="text-primary-600 hover:underline">
                        {student.email}
                      </a>
                    </div>
                  )}
                  
                  {student.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <a href={`tel:${student.phone}`} className="text-primary-600 hover:underline">
                        {student.phone}
                      </a>
                    </div>
                  )}
                  
                  {student.location && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">{student.location}</span>
                    </div>
                  )}
                  
                  {student.date_of_birth && (
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">{formatDate(student.date_of_birth)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Academic Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <GraduationCap className="w-5 h-5" />
              <span>Academic Information</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">Department</label>
                <p className="text-gray-900">{student.department || 'Not specified'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600">Graduation Year</label>
                <p className="text-gray-900">{student.graduation_year || 'Not specified'}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600">Current Semester</label>
                <p className="text-gray-900">{student.current_semester || 'Not specified'}</p>
              </div>
              
              {student.gpa && (
                <div>
                  <label className="block text-sm font-medium text-gray-600">GPA</label>
                  <p className="text-gray-900">{student.gpa}/10.0</p>
                </div>
              )}
            </div>
          </div>

          {/* Bio */}
          {student.bio && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">About</h3>
              <p className="text-gray-700 leading-relaxed">{student.bio}</p>
            </div>
          )}

          {/* Skills */}
          {student.skills && student.skills.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Code className="w-5 h-5" />
                <span>Skills</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {student.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {student.projects && student.projects.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Briefcase className="w-5 h-5" />
                <span>Projects</span>
              </h3>
              <div className="space-y-4">
                {student.projects.map((project, index) => (
                  <div key={index} className="border-l-4 border-primary-200 pl-4">
                    <h4 className="font-medium text-gray-900">{project.title}</h4>
                    {project.description && (
                      <p className="text-gray-600 mt-1">{project.description}</p>
                    )}
                    {project.technologies && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {project.technologies.map((tech, i) => (
                          <span key={i} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                    {project.url && (
                      <a
                        href={project.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-1 text-primary-600 hover:underline mt-2"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span className="text-sm">View Project</span>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Profile Completeness</span>
                <span className="font-medium">{student.profile_completeness || 0}%</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Skills Count</span>
                <span className="font-medium">{student.skills?.length || 0}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Projects</span>
                <span className="font-medium">{student.projects?.length || 0}</span>
              </div>
              
              {student.last_active && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Active</span>
                  <span className="font-medium text-sm">{formatDate(student.last_active)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Contact Actions */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact</h3>
            <div className="space-y-3">
              {student.email && (
                <a
                  href={`mailto:${student.email}?subject=Regarding Your Profile - TPC`}
                  className="flex items-center space-x-2 w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">Send Email</span>
                </a>
              )}
              
              {student.phone && (
                <a
                  href={`tel:${student.phone}`}
                  className="flex items-center space-x-2 w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">Call</span>
                </a>
              )}
            </div>
          </div>

          {/* Additional Info */}
          {(student.portfolio_url || student.linkedin_url || student.github_url) && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Links</h3>
              <div className="space-y-3">
                {student.portfolio_url && (
                  <a
                    href={student.portfolio_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-primary-600 hover:underline"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span className="text-sm">Portfolio</span>
                  </a>
                )}
                
                {student.linkedin_url && (
                  <a
                    href={student.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-primary-600 hover:underline"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span className="text-sm">LinkedIn</span>
                  </a>
                )}
                
                {student.github_url && (
                  <a
                    href={student.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-primary-600 hover:underline"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span className="text-sm">GitHub</span>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Resume Preview Modal */}
      {showPreview && previewUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full h-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Resume Preview</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">Close</span>
                ×
              </button>
            </div>
            <div className="flex-1 p-4">
              <iframe
                src={previewUrl}
                className="w-full h-full border border-gray-200 rounded"
                title="Resume Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDetail;