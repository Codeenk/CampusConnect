import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import { 
  Edit3, 
  MapPin, 
  Calendar, 
  Github, 
  Linkedin,
  Globe,
  Mail,
  Building,
  GraduationCap,
  Plus,
  Save,
  X,
  Camera,
  Briefcase,
  Code2,
  Award,
  User,
  MessageCircle,
  Phone,
  BookOpen,
  Target,
  Star,
  Trophy,
  Zap
} from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'

// Editable Field Component for inline editing
const EditableField = ({ label, value, field, type = 'text', canEdit, onSave, placeholder, options, inputProps = {}, rawValue }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // Use rawValue for editing if provided, otherwise use the display value
    const valueToEdit = rawValue !== undefined ? rawValue : value || ''
    setEditValue(valueToEdit)
  }, [value, rawValue])

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(editValue)
      setIsEditing(false)
    } catch (error) {
      console.error('Save failed:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditValue(value || '')
    setIsEditing(false)
  }

  if (!canEdit) {
    // Read-only mode
    return (
      <div className="space-y-1">
        <span className="text-sm font-medium text-gray-600">{label}</span>
        <div className="px-3 py-2 border border-gray-200 rounded-md bg-gray-50">
          <span className="text-gray-900">{value || 'Not set'}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <span className="text-sm font-medium text-gray-600">{label}</span>
      
      {isEditing ? (
        <div className="space-y-2">
          {type === 'select' ? (
            <select
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full px-3 py-2 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={saving}
            >
              {options?.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={type}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder={placeholder}
              className="w-full px-3 py-2 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={saving}
              {...inputProps}
            />
          )}
          
          <div className="flex space-x-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-1"
            >
              {saving ? <LoadingSpinner /> : <Save className="w-3 h-3" />}
              <span>{saving ? 'Saving...' : 'Save'}</span>
            </button>
            <button
              onClick={handleCancel}
              disabled={saving}
              className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400 disabled:opacity-50 flex items-center space-x-1"
            >
              <X className="w-3 h-3" />
              <span>Cancel</span>
            </button>
          </div>
        </div>
      ) : (
        <div 
          onClick={() => setIsEditing(true)}
          className="px-3 py-2 border border-gray-200 rounded-md hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors group"
        >
          <div className="flex justify-between items-center">
            <span className="text-gray-900">{value || placeholder}</span>
            <Edit3 className="w-3 h-3 text-gray-400 group-hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      )}
    </div>
  )
}

// Editable Experience Item Component
const EditableExperienceItem = ({ experience, canEdit, onSave, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    position: experience?.position || '',
    company: experience?.company || '',
    start_date: experience?.start_date || '',
    end_date: experience?.end_date || '',
    exp_location: experience?.exp_location || '',
    description: experience?.description || ''
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave({ ...experience, ...editData })
      setIsEditing(false)
    } catch (error) {
      console.error('Save failed:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditData({
      position: experience?.position || '',
      company: experience?.company || '',
      start_date: experience?.start_date || '',
      end_date: experience?.end_date || '',
      exp_location: experience?.exp_location || '',
      description: experience?.description || ''
    })
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
            <input
              type="text"
              value={editData.position}
              onChange={(e) => setEditData({...editData, position: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Software Engineer Intern"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
            <input
              type="text"
              value={editData.company}
              onChange={(e) => setEditData({...editData, company: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Google Inc."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="text"
              value={editData.start_date}
              onChange={(e) => setEditData({...editData, start_date: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., June 2023"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="text"
              value={editData.end_date}
              onChange={(e) => setEditData({...editData, end_date: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., August 2023 or Present"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
          <input
            type="text"
            value={editData.exp_location}
            onChange={(e) => setEditData({...editData, exp_location: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., San Francisco, CA"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            rows="3"
            value={editData.description}
            onChange={(e) => setEditData({...editData, description: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="Describe your role, responsibilities, and achievements..."
          />
        </div>
        <div className="flex space-x-2 pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-1"
          >
            {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Save className="w-4 h-4" />}
            <span>Save</span>
          </button>
          <button
            onClick={handleCancel}
            disabled={saving}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 flex items-center space-x-1"
          >
            <X className="w-4 h-4" />
            <span>Cancel</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex space-x-3 group hover:bg-gray-50 p-3 rounded-lg transition-colors">
      <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
        <Briefcase className="w-6 h-6 text-gray-600" />
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <div className="flex-1" onClick={() => canEdit && setIsEditing(true)} style={{ cursor: canEdit ? 'pointer' : 'default' }}>
            <h3 className="font-semibold text-gray-900">{experience?.position || 'Position'}</h3>
            <p className="text-gray-700 font-medium">{experience?.company || 'Company'}</p>
            <p className="text-gray-600 text-sm">
              {experience?.start_date || 'Start Date'} - {experience?.end_date || 'End Date'}
            </p>
            {experience?.exp_location && (
              <p className="text-gray-600 text-sm">{experience.exp_location}</p>
            )}
            {experience?.description && (
              <p className="text-gray-700 mt-2 whitespace-pre-wrap">{experience.description}</p>
            )}
          </div>
          {canEdit && (
            <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setIsEditing(true)}
                className="p-1 text-gray-600 hover:bg-gray-200 rounded"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(experience.id)}
                className="p-1 text-red-600 hover:bg-red-50 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Editable Project Item Component  
const EditableProjectItem = ({ project, canEdit, onSave, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    title: project?.title || '',
    technologies: project?.technologies || '',
    proj_description: project?.proj_description || '',
    github_url: project?.github_url || ''
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave({ ...project, ...editData })
      setIsEditing(false)
    } catch (error) {
      console.error('Save failed:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditData({
      title: project?.title || '',
      technologies: project?.technologies || '',
      proj_description: project?.proj_description || '',
      github_url: project?.github_url || ''
    })
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Title</label>
            <input
              type="text"
              value={editData.title}
              onChange={(e) => setEditData({...editData, title: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., E-commerce Website"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Technologies</label>
            <input
              type="text"
              value={editData.technologies}
              onChange={(e) => setEditData({...editData, technologies: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., React, Node.js, MongoDB"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">GitHub URL</label>
          <input
            type="url"
            value={editData.github_url}
            onChange={(e) => setEditData({...editData, github_url: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="https://github.com/username/project-name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            rows="3"
            value={editData.proj_description}
            onChange={(e) => setEditData({...editData, proj_description: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="Describe your project, its features, and your role..."
          />
        </div>
        <div className="flex space-x-2 pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-1"
          >
            {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Save className="w-4 h-4" />}
            <span>Save</span>
          </button>
          <button
            onClick={handleCancel}
            disabled={saving}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 flex items-center space-x-1"
          >
            <X className="w-4 h-4" />
            <span>Cancel</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex space-x-3 group hover:bg-gray-50 p-3 rounded-lg transition-colors">
      <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
        <Code2 className="w-6 h-6 text-gray-600" />
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <div className="flex-1" onClick={() => canEdit && setIsEditing(true)} style={{ cursor: canEdit ? 'pointer' : 'default' }}>
            <h3 className="font-semibold text-gray-900">{project?.title || 'Project Title'}</h3>
            {project?.technologies && (
              <p className="text-gray-600 text-sm font-medium mb-1">{project.technologies}</p>
            )}
            {project?.proj_description && (
              <p className="text-gray-700 whitespace-pre-wrap">{project.proj_description}</p>
            )}
            {project?.github_url && (
              <a 
                href={project.github_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm mt-2"
                onClick={(e) => e.stopPropagation()}
              >
                <Github className="w-4 h-4 mr-1" />
                View on GitHub
              </a>
            )}
          </div>
          {canEdit && (
            <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setIsEditing(true)}
                className="p-1 text-gray-600 hover:bg-gray-200 rounded"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(project.id)}
                className="p-1 text-red-600 hover:bg-red-50 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Add New Experience Form Component
const AddNewExperienceForm = ({ onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    position: '',
    company: '',
    start_date: '',
    end_date: '',
    exp_location: '',
    description: ''
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(formData)
    } catch (error) {
      console.error('Save failed:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
        <Briefcase className="w-5 h-5 mr-2" />
        Add New Experience
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Position *</label>
          <input
            type="text"
            value={formData.position}
            onChange={(e) => setFormData({...formData, position: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Software Engineer Intern"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Company *</label>
          <input
            type="text"
            value={formData.company}
            onChange={(e) => setFormData({...formData, company: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., Google Inc."
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
          <input
            type="text"
            value={formData.start_date}
            onChange={(e) => setFormData({...formData, start_date: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., June 2023"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input
            type="text"
            value={formData.end_date}
            onChange={(e) => setFormData({...formData, end_date: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., August 2023 or Present"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
        <input
          type="text"
          value={formData.exp_location}
          onChange={(e) => setFormData({...formData, exp_location: e.target.value})}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          placeholder="e.g., San Francisco, CA"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          rows="3"
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          placeholder="Describe your role, responsibilities, and achievements..."
        />
      </div>
      <div className="flex space-x-2 pt-2">
        <button
          onClick={handleSave}
          disabled={saving || !formData.position || !formData.company || !formData.start_date}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
        >
          {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Save className="w-4 h-4" />}
          <span>Save Experience</span>
        </button>
        <button
          onClick={onCancel}
          disabled={saving}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 flex items-center space-x-1"
        >
          <X className="w-4 h-4" />
          <span>Cancel</span>
        </button>
      </div>
    </div>
  )
}

// Add New Project Form Component  
const AddNewProjectForm = ({ onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    technologies: '',
    proj_description: '',
    github_url: ''
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!formData.title?.trim()) {
      alert('Project title is required')
      return
    }
    
    setSaving(true)
    try {
      await onSave(formData)
    } catch (error) {
      console.error('Save failed:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
        <Code2 className="w-5 h-5 mr-2" />
        Add New Project
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Project Title *</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., E-commerce Website"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Technologies</label>
          <input
            type="text"
            value={formData.technologies}
            onChange={(e) => setFormData({...formData, technologies: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., React, Node.js, MongoDB"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">GitHub URL</label>
        <input
          type="url"
          value={formData.github_url}
          onChange={(e) => setFormData({...formData, github_url: e.target.value})}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          placeholder="https://github.com/username/project-name"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          rows="3"
          value={formData.proj_description}
          onChange={(e) => setFormData({...formData, proj_description: e.target.value})}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          placeholder="Describe your project, its features, and your role..."
        />
      </div>
      <div className="flex space-x-2 pt-2">
        <button
          onClick={handleSave}
          disabled={saving || !formData.title?.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
        >
          {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Save className="w-4 h-4" />}
          <span>Save Project</span>
        </button>
        <button
          onClick={onCancel}
          disabled={saving}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 flex items-center space-x-1"
        >
          <X className="w-4 h-4" />
          <span>Cancel</span>
        </button>
      </div>
    </div>
  )
}

// Editable Certification Item Component
const EditableCertificationItem = ({ certification, canEdit, onSave, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    name: certification?.name || '',
    issuer: certification?.issuer || '',
    issue_date: certification?.issue_date || '',
    expiry_date: certification?.expiry_date || '',
    credential_id: certification?.credential_id || '',
    credential_url: certification?.credential_url || '',
    description: certification?.description || ''
  })

  const handleSave = async () => {
    try {
      await onSave({ ...certification, ...editData })
      setIsEditing(false)
    } catch (error) {
      console.error('Save failed:', error)
    }
  }

  const handleCancel = () => {
    setEditData({
      name: certification?.name || '',
      issuer: certification?.issuer || '',
      issue_date: certification?.issue_date || '',
      expiry_date: certification?.expiry_date || '',
      credential_id: certification?.credential_id || '',
      credential_url: certification?.credential_url || '',
      description: certification?.description || ''
    })
    setIsEditing(false)
  }

  if (!canEdit) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{certification?.name || 'Certification'}</h3>
            <p className="text-gray-700 font-medium">{certification?.issuer || 'Issuer'}</p>
            <p className="text-gray-600 text-sm">
              Issued: {certification?.issue_date || 'Issue Date'}
              {certification?.expiry_date && ` • Expires: ${certification.expiry_date}`}
            </p>
            {certification?.credential_id && (
              <p className="text-gray-600 text-sm">ID: {certification.credential_id}</p>
            )}
            {certification?.credential_url && (
              <a href={certification.credential_url} target="_blank" rel="noopener noreferrer" 
                 className="text-blue-600 hover:text-blue-700 text-sm">
                View Credential →
              </a>
            )}
            {certification?.description && (
              <p className="text-gray-700 mt-2 whitespace-pre-wrap">{certification.description}</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
      {isEditing ? (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Certification Name *"
              value={editData.name}
              onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <input
              type="text"
              placeholder="Issuing Organization *"
              value={editData.issuer}
              onChange={(e) => setEditData(prev => ({ ...prev, issuer: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <input
              type="month"
              placeholder="Issue Date"
              value={editData.issue_date}
              onChange={(e) => setEditData(prev => ({ ...prev, issue_date: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="month"
              placeholder="Expiry Date (Optional)"
              value={editData.expiry_date}
              onChange={(e) => setEditData(prev => ({ ...prev, expiry_date: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="text"
              placeholder="Credential ID (Optional)"
              value={editData.credential_id}
              onChange={(e) => setEditData(prev => ({ ...prev, credential_id: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="url"
              placeholder="Credential URL (Optional)"
              value={editData.credential_url}
              onChange={(e) => setEditData(prev => ({ ...prev, credential_url: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <textarea
            placeholder="Description (Optional)"
            value={editData.description}
            onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{certification?.name || 'Certification'}</h3>
            <p className="text-gray-700 font-medium">{certification?.issuer || 'Issuer'}</p>
            <p className="text-gray-600 text-sm">
              Issued: {certification?.issue_date || 'Issue Date'}
              {certification?.expiry_date && ` • Expires: ${certification.expiry_date}`}
            </p>
            {certification?.credential_id && (
              <p className="text-gray-600 text-sm">ID: {certification.credential_id}</p>
            )}
            {certification?.credential_url && (
              <a href={certification.credential_url} target="_blank" rel="noopener noreferrer" 
                 className="text-blue-600 hover:text-blue-700 text-sm">
                View Credential →
              </a>
            )}
            {certification?.description && (
              <p className="text-gray-700 mt-2 whitespace-pre-wrap">{certification.description}</p>
            )}
          </div>
          <div className="flex gap-2 ml-4">
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-md"
              title="Edit certification"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(certification.id)}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md"
              title="Delete certification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Add New Certification Form Component
const AddNewCertificationForm = ({ onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    issuer: '',
    issue_date: '',
    expiry_date: '',
    credential_id: '',
    credential_url: '',
    description: ''
  })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.issuer.trim()) {
      alert('Certification name and issuer are required')
      return
    }

    setSaving(true)
    try {
      await onSave(formData)
      onCancel() // Close the form after successful save
    } catch (error) {
      console.error('Save failed:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <Award className="w-5 h-5" />
        Add New Certification
      </h3>
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="Certification Name *"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
          <input
            type="text"
            placeholder="Issuing Organization *"
            value={formData.issuer}
            onChange={(e) => setFormData(prev => ({ ...prev, issuer: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
          <input
            type="month"
            placeholder="Issue Date"
            value={formData.issue_date}
            onChange={(e) => setFormData(prev => ({ ...prev, issue_date: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <input
            type="month"
            placeholder="Expiry Date (Optional)"
            value={formData.expiry_date}
            onChange={(e) => setFormData(prev => ({ ...prev, expiry_date: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <input
            type="text"
            placeholder="Credential ID (Optional)"
            value={formData.credential_id}
            onChange={(e) => setFormData(prev => ({ ...prev, credential_id: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <input
            type="url"
            placeholder="Credential URL (Optional)"
            value={formData.credential_url}
            onChange={(e) => setFormData(prev => ({ ...prev, credential_url: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <textarea
          placeholder="Description (Optional)"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving || !formData.name.trim() || !formData.issuer.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <Save className="w-4 h-4" />}
            <span>Save Certification</span>
          </button>
          <button
            onClick={onCancel}
            disabled={saving}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 disabled:opacity-50 flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

const Profile = () => {
  const { userId } = useParams()
  const { user: currentUser } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editingSection, setEditingSection] = useState(null)
  const [editingData, setEditingData] = useState({})
  const [inlineEditing, setInlineEditing] = useState({})
  const [addingNewExperience, setAddingNewExperience] = useState(false)
  const [addingNewProject, setAddingNewProject] = useState(false)
  const [addingNewCertification, setAddingNewCertification] = useState(false)

  // Check for read-only mode from URL parameters
  const urlParams = new URLSearchParams(window.location.search)
  const isReadOnlyMode = urlParams.get('view') === 'readonly'
  const isOwnProfile = !userId || userId === currentUser?.id
  const canEdit = isOwnProfile && !isReadOnlyMode

  // Debug logging
  console.log('Profile Debug Info:', {
    userId: userId,
    currentUserId: currentUser?.id,
    isOwnProfile: isOwnProfile,
    isReadOnlyMode: isReadOnlyMode,
    canEdit: canEdit,
    url: window.location.href
  })

  useEffect(() => {
    fetchProfile()
  }, [userId, currentUser?.id])

  // Auto-refresh disabled per user request
  // useEffect(() => {
  //   let intervalId = null
  //   
  //   if (!isOwnProfile && userId) {
  //     // Only auto-refresh when viewing someone else's profile
  //     intervalId = setInterval(() => {
  //       console.log('Auto-refreshing profile for user:', userId)
  //       fetchProfile()
  //     }, 5000) // Refresh every 5 seconds
  //   }
  //   
  //   return () => {
  //     if (intervalId) {
  //       clearInterval(intervalId)
  //     }
  //   }
  // }, [isOwnProfile, userId])

  // Helper functions for direct database column access
  const getExperienceArray = (experienceData) => {
    console.log('Processing experience data:', experienceData)
    if (!Array.isArray(experienceData)) {
      console.log('Experience is not an array:', typeof experienceData, experienceData)
      return []
    }
    
    const experiences = experienceData.map(exp => {
      if (!exp.id) {
        exp.id = Date.now().toString() + Math.random().toString(36).substr(2, 5)
      }
      return exp
    })
    
    console.log('Processed experiences:', experiences)
    return experiences
  }
  
  const getProjectsArray = (projectsData) => {
    console.log('Processing projects data:', projectsData)
    if (!Array.isArray(projectsData)) {
      console.log('Projects is not an array:', typeof projectsData, projectsData)
      return []
    }
    
    const projects = projectsData.map(proj => {
      if (!proj.id) {
        proj.id = Date.now().toString() + Math.random().toString(36).substr(2, 5)
      }
      return proj
    })
    
    console.log('Processed projects:', projects)
    return projects
  }

  const getCertificationsArray = (certificationsData) => {
    console.log('Processing certifications data:', certificationsData)
    if (!Array.isArray(certificationsData)) {
      console.log('Certifications is not an array:', typeof certificationsData, certificationsData)
      return []
    }
    
    const certifications = certificationsData.map(cert => {
      if (!cert.id) {
        cert.id = Date.now().toString() + Math.random().toString(36).substr(2, 5)
      }
      return cert
    })
    
    console.log('Processed certifications:', certifications)
    return certifications
  }

  // Handle individual field save
  const handleFieldSave = async (field, value) => {
    try {
      // Client-side validation
      if (field === 'name' && value && (value.trim().length < 2 || value.trim().length > 100)) {
        alert('Name must be between 2 and 100 characters')
        return
      }
      if (field === 'bio' && value && value.length > 1000) {
        alert('Bio must be less than 1000 characters')
        return
      }
      if (field === 'department' && value && value.length > 100) {
        alert('Department must be less than 100 characters')
        return
      }
      if (field === 'major' && value && value.length > 100) {
        alert('Major must be less than 100 characters')
        return
      }
      if (field === 'headline' && value && value.length > 200) {
        alert('Headline must be less than 200 characters')
        return
      }
      if (field === 'location' && value && value.length > 100) {
        alert('Location must be less than 100 characters')
        return
      }
      if (field === 'hometown' && value && value.length > 100) {
        alert('Hometown must be less than 100 characters')
        return
      }
      if (field === 'minor' && value && value.length > 100) {
        alert('Minor must be less than 100 characters')
        return
      }
      if (field === 'student_id' && value && value.length > 50) {
        alert('Student ID must be less than 50 characters')
        return
      }

      let updateData = {}

      // Handle fields that need to be stored in achievements (compatibility layer)
      if (field === 'headline' || field === 'location') {
        const currentAchievements = profile.achievements || []
        
        // Remove any existing entries for this field type
        const filteredAchievements = currentAchievements.filter(item => {
          if (typeof item === 'string') {
            try {
              const parsed = JSON.parse(item)
              return parsed.type !== field
            } catch (e) {
              return true
            }
          }
          return item.type !== field
        })
        
        // Add the new value if it's not empty
        const updatedAchievements = [...filteredAchievements]
        if (value && value.trim()) {
          updatedAchievements.push({
            type: field,
            value: value.trim()
          })
        }
        
        updateData = { achievements: updatedAchievements }
      } else {
        // Handle regular profile fields
        updateData = { [field]: value }
      }
      
      // Handle special field conversions and validation
      if (field === 'year' && value) {
        const yearNum = parseInt(value)
        if (yearNum < 1 || yearNum > 10) {
          alert('Year must be between 1 and 10')
          return
        }
        updateData[field] = yearNum
      }
      if (field === 'graduation_year' && value) {
        const gradYear = parseInt(value)
        if (gradYear < 2020 || gradYear > 2050) {
          alert('Graduation year must be between 2020 and 2050')
          return
        }
        updateData[field] = gradYear
      }
      if (field === 'gpa' && value) {
        const gpaNum = parseFloat(value)
        if (isNaN(gpaNum) || gpaNum < 0 || gpaNum > 4) {
          alert('GPA must be a number between 0.0 and 4.0')
          return
        }
        updateData[field] = gpaNum
      }
      
      const response = await api.put('/profile/me', updateData)
      
      if (response.data.success) {
        // Update local profile state
        setProfile(prev => ({
          ...prev,
          [field]: value
        }))
        
        // Show success feedback
        // You could add a toast notification here
      }
    } catch (error) {
      console.error('Failed to update field:', error)
      console.error('Error response:', error.response?.data)
      console.error('Field being updated:', field)
      console.error('Value being sent:', value)
      console.error('Update data being sent:', updateData)
      
      // Show detailed error message
      const errorMessage = error.response?.data?.message || 'Failed to update. Please try again.'
      const validationErrors = error.response?.data?.errors
      
      if (validationErrors && validationErrors.length > 0) {
        console.error('Validation errors:', validationErrors)
        alert(`Validation error: ${validationErrors.map(e => e.msg).join(', ')}`)
      } else {
        alert(errorMessage)
      }
    }
  }

  // Handle individual experience item save
  const handleExperienceSave = async (experienceData) => {
    console.log('Saving experience data:', experienceData)
    
    // Validation
    if (!experienceData.position || !experienceData.company) {
      alert('Position and Company are required fields')
      return
    }
    
    try {
      // Get current experience array
      const currentExperience = profile.experience || []
      console.log('Current experience:', currentExperience)
      
      let updatedExperience
      
      if (experienceData.id) {
        // Update existing experience
        console.log('Updating existing experience with ID:', experienceData.id)
        updatedExperience = currentExperience.map(exp => 
          exp.id === experienceData.id ? experienceData : exp
        )
        
        // If no existing item was found, add as new
        const wasUpdated = updatedExperience.some(exp => exp.id === experienceData.id)
        if (!wasUpdated) {
          console.log('Experience not found, adding as new')
          updatedExperience.push(experienceData)
        }
      } else {
        // Add new experience
        const newId = Date.now().toString() + Math.random().toString(36).substr(2, 5)
        experienceData.id = newId
        console.log('Adding new experience with ID:', newId)
        updatedExperience = [...currentExperience, experienceData]
      }
      
      console.log('Updated experience array:', updatedExperience)
      
      // Save to database
      const response = await api.put('/profile/me', {
        experience: updatedExperience
      })
      
      console.log('API response for experience save:', response.data)
      
      // Update local state immediately for better UX
      setProfile(prev => ({
        ...prev,
        experience: updatedExperience,
        updated_at: new Date().toISOString()
      }))
      
      console.log('Experience saved successfully')
    } catch (error) {
      console.error('Failed to save experience:', error)
      console.error('Error response:', error.response?.data)
      alert(`Failed to save experience: ${error.response?.data?.message || error.message}`)
    }
  }

  // Handle individual project item save
  const handleProjectSave = async (projectData) => {
    console.log('Saving project data:', projectData)
    
    // Validation
    if (!projectData.title) {
      alert('Project title is required')
      return
    }
    
    try {
      // Get current projects array
      const currentProjects = profile.projects || []
      console.log('Current projects:', currentProjects)
      
      let updatedProjects
      
      if (projectData.id) {
        // Update existing project
        console.log('Updating existing project with ID:', projectData.id)
        updatedProjects = currentProjects.map(proj => 
          proj.id === projectData.id ? projectData : proj
        )
        
        // If no existing item was found, add as new
        const wasUpdated = updatedProjects.some(proj => proj.id === projectData.id)
        if (!wasUpdated) {
          console.log('Project not found, adding as new')
          updatedProjects.push(projectData)
        }
      } else {
        // Add new project
        const newId = Date.now().toString() + Math.random().toString(36).substr(2, 5)
        projectData.id = newId
        console.log('Adding new project with ID:', newId)
        updatedProjects = [...currentProjects, projectData]
      }
      
      console.log('Updated projects array:', updatedProjects)
      
      // Save to database
      const response = await api.put('/profile/me', {
        projects: updatedProjects
      })
      
      console.log('API response for project save:', response.data)
      
      // Update local state immediately for better UX
      setProfile(prev => ({
        ...prev,
        projects: updatedProjects,
        updated_at: new Date().toISOString()
      }))
      
      console.log('Project saved successfully')
    } catch (error) {
      console.error('Failed to save project:', error)
      console.error('Error response:', error.response?.data)
      alert(`Failed to save project: ${error.response?.data?.message || error.message}`)
    }
  }

  // Add certification save handler
  const handleCertificationSave = async (certificationData) => {
    console.log('Saving certification data:', certificationData)
    
    // Validation
    if (!certificationData.name || !certificationData.issuer) {
      alert('Certification name and issuer are required')
      return
    }
    
    try {
      // Get current certifications array
      const currentCertifications = profile.certifications || []
      console.log('Current certifications:', currentCertifications)
      
      let updatedCertifications
      
      if (certificationData.id) {
        // Update existing certification
        console.log('Updating existing certification with ID:', certificationData.id)
        updatedCertifications = currentCertifications.map(cert => 
          cert.id === certificationData.id ? certificationData : cert
        )
        
        // If no existing item was found, add as new
        const wasUpdated = updatedCertifications.some(cert => cert.id === certificationData.id)
        if (!wasUpdated) {
          console.log('Certification not found, adding as new')
          updatedCertifications.push(certificationData)
        }
      } else {
        // Add new certification
        const newId = Date.now().toString() + Math.random().toString(36).substr(2, 5)
        certificationData.id = newId
        console.log('Adding new certification with ID:', newId)
        updatedCertifications = [...currentCertifications, certificationData]
      }
      
      console.log('Updated certifications array:', updatedCertifications)
      
      // Save to database
      const response = await api.put('/profile/me', {
        certifications: updatedCertifications
      })
      
      console.log('API response for certification save:', response.data)
      
      // Update local state immediately for better UX
      setProfile(prev => ({
        ...prev,
        certifications: updatedCertifications,
        updated_at: new Date().toISOString()
      }))
      
      console.log('Certification saved successfully')
    } catch (error) {
      console.error('Failed to save certification:', error)
      console.error('Error response:', error.response?.data)
      alert(`Failed to save certification: ${error.response?.data?.message || error.message}`)
    }
  }

  // Handle adding new experience
  const handleAddNewExperience = () => {
    setAddingNewExperience(true)
  }

  // Handle adding new project
  const handleAddNewProject = () => {
    setAddingNewProject(true)
  }

  // Handle adding new certification
  const handleAddNewCertification = () => {
    setAddingNewCertification(true)
  }

  // Handle saving new experience
  const handleSaveNewExperience = async (experienceData) => {
    const newExperience = {
      ...experienceData,
      id: Date.now().toString()
    }
    
    await handleExperienceSave(newExperience)
    setAddingNewExperience(false)
  }

  // Handle saving new project
  const handleSaveNewProject = async (projectData) => {
    const newProject = {
      ...projectData,
      id: Date.now().toString()
    }
    
    await handleProjectSave(newProject)
    setAddingNewProject(false)
  }

  // Handle saving new certification
  const handleSaveNewCertification = async (certificationData) => {
    const newCertification = {
      ...certificationData,
      id: Date.now().toString()
    }
    
    await handleCertificationSave(newCertification)
    setAddingNewCertification(false)
  }

  // Handle canceling add new experience/project
  const handleCancelNewExperience = () => {
    setAddingNewExperience(false)
  }

  const handleCancelNewProject = () => {
    setAddingNewProject(false)
  }

  const handleCancelNewCertification = () => {
    setAddingNewCertification(false)
  }

  // Delete handlers using proper database columns
  const deleteExperience = async (experienceId) => {
    console.log('Deleting experience with ID:', experienceId)
    
    try {
      const currentExperience = profile.experience || []
      const updatedExperience = currentExperience.filter(exp => exp.id !== experienceId)
      
      console.log('Updated experience array after delete:', updatedExperience)
      
      // Save to database
      const response = await api.put('/profile/me', {
        experience: updatedExperience
      })
      
      console.log('API response for experience delete:', response.data)
      
      // Update local state immediately
      setProfile(prev => ({
        ...prev,
        experience: updatedExperience,
        updated_at: new Date().toISOString()
      }))
      
      console.log('Experience deleted successfully')
    } catch (error) {
      console.error('Failed to delete experience:', error)
      console.error('Error response:', error.response?.data)
      alert(`Failed to delete experience: ${error.response?.data?.message || error.message}`)
    }
  }

  const deleteProject = async (projectId) => {
    console.log('Deleting project with ID:', projectId)
    
    try {
      const currentProjects = profile.projects || []
      const updatedProjects = currentProjects.filter(proj => proj.id !== projectId)
      
      console.log('Updated projects array after delete:', updatedProjects)
      
      // Save to database
      const response = await api.put('/profile/me', {
        projects: updatedProjects
      })
      
      console.log('API response for project delete:', response.data)
      
      // Update local state immediately
      setProfile(prev => ({
        ...prev,
        projects: updatedProjects,
        updated_at: new Date().toISOString()
      }))
      
      console.log('Project deleted successfully')
    } catch (error) {
      console.error('Failed to delete project:', error)
      console.error('Error response:', error.response?.data)
      alert(`Failed to delete project: ${error.response?.data?.message || error.message}`)
    }
  }

  const deleteCertification = async (certificationId) => {
    console.log('Deleting certification with ID:', certificationId)
    
    try {
      const currentCertifications = profile.certifications || []
      const updatedCertifications = currentCertifications.filter(cert => cert.id !== certificationId)
      
      console.log('Updated certifications array after delete:', updatedCertifications)
      
      // Save to database
      const response = await api.put('/profile/me', {
        certifications: updatedCertifications
      })
      
      console.log('API response for certification delete:', response.data)
      
      // Update local state immediately
      setProfile(prev => ({
        ...prev,
        certifications: updatedCertifications,
        updated_at: new Date().toISOString()
      }))
      
      console.log('Certification deleted successfully')
    } catch (error) {
      console.error('Failed to delete certification:', error)
      console.error('Error response:', error.response?.data)
      alert(`Failed to delete certification: ${error.response?.data?.message || error.message}`)
    }
  }

  const fetchProfile = async () => {
    try {
      setLoading(true)
      let profileResponse
      
      if (isOwnProfile && !isReadOnlyMode) {
        // Fetch own profile with full access
        console.log('Fetching own profile')
        profileResponse = await api.get('/profile/me')
      } else {
        // Fetch other user's profile or own profile in read-only mode
        const targetUserId = userId || currentUser?.id
        console.log('Fetching profile for user:', targetUserId)
        // Add cache-busting parameter to ensure fresh data
        const timestamp = Date.now()
        profileResponse = await api.get(`/profile/${targetUserId}?t=${timestamp}`)
      }
      
      console.log('Profile response:', profileResponse.data)
      
      // Check if response has the expected structure
      if (!profileResponse.data || !profileResponse.data.success) {
        throw new Error('Invalid profile response structure')
      }
      
      const profileData = profileResponse.data.data?.profile
      if (!profileData) {
        throw new Error('No profile data found')
      }
      
      // Extract headline and location from achievements (compatibility layer)
      const achievements = profileData.achievements || []
      let headline = profileData.headline || ''
      let location = profileData.location || ''
      
      // Look for headline and location in achievements
      achievements.forEach(item => {
        let parsedItem = item
        if (typeof item === 'string') {
          try {
            parsedItem = JSON.parse(item)
          } catch (e) {
            return
          }
        }
        
        if (parsedItem && parsedItem.type === 'headline' && parsedItem.value) {
          headline = parsedItem.value
        }
        if (parsedItem && parsedItem.type === 'location' && parsedItem.value) {
          location = parsedItem.value
        }
      })

      // Initialize profile with ALL database fields
      setProfile({
        // Basic Info
        user_id: profileData.user_id,
        name: profileData.name || '',
        email: profileData.email || '',
        role: profileData.role || 'student',
        bio: profileData.bio || '',
        avatar_url: profileData.avatar_url || '',
        headline: headline,
        location: location,
        
        // Academic Info
        department: profileData.department || '',
        major: profileData.major || '',
        minor: profileData.minor || '',
        year: profileData.year || null,
        graduation_year: profileData.graduation_year || null,
        gpa: profileData.gpa || null,
        student_id: profileData.student_id || '',
        hometown: profileData.hometown || '',
        
        // Contact Info
        phone_number: profileData.phone_number || '',
        github_url: profileData.github_url || '',
        linkedin_url: profileData.linkedin_url || '',
        portfolio_url: profileData.portfolio_url || '',
        
        // Arrays (safely handle)
        skills: Array.isArray(profileData.skills) ? profileData.skills : [],
        interests: Array.isArray(profileData.interests) ? profileData.interests : [],
        achievements: Array.isArray(profileData.achievements) ? profileData.achievements : [],
        
        // System fields
        is_verified: profileData.is_verified || false,
        is_active: profileData.is_active !== undefined ? profileData.is_active : true,
        created_at: profileData.created_at,
        updated_at: profileData.updated_at,
        
        // Experience, projects, and certifications are now direct database columns
        
        // UI state
        isReadOnly: !canEdit
      })
      
      // Debug logging
      console.log('Raw achievements:', profileData.achievements)
      console.log('Extracted headline:', headline)
      console.log('Extracted location:', location)
      console.log('Direct experience data:', profileData.experience)
      console.log('Direct projects data:', profileData.projects)
      console.log('Direct certifications data:', profileData.certifications)
    } catch (error) {
      console.error('Error fetching profile:', error)
      // Set a comprehensive fallback profile structure
      setProfile({
        user_id: userId || currentUser?.id || '',
        name: 'Unknown User',
        email: '',
        role: 'student',
        bio: 'Profile not available',
        avatar_url: '',
        headline: '',
        location: '',
        department: '',
        major: '',
        minor: '',
        year: null,
        graduation_year: null,
        gpa: null,
        student_id: '',
        hometown: '',
        phone_number: '',
        github_url: '',
        linkedin_url: '',
        portfolio_url: '',
        skills: [],
        interests: [],
        achievements: [],
        is_verified: false,
        is_active: true,
        experience: [],
        projects: [],
        isReadOnly: true
      })
    } finally {
      setLoading(false)
    }
  }

  const startEditing = (section, data = {}) => {
    setEditingSection(section)
    setEditingData(data)
  }

  const cancelEditing = () => {
    setEditingSection(null)
    setEditingData({})
  }

  const startMessage = () => {
    // Navigate to Messages page with a query parameter to start a conversation
    navigate(`/messages?startChat=${profile.user_id}&name=${encodeURIComponent(profile.name)}`)
  }

  const saveSection = async (section, data) => {
    try {
      let updateData = {}
      
      console.log('Saving section:', section, 'with data:', data)
      
      if (section === 'basic') {
        // Send ALL fields that exist in the database - no more achievements workaround
        updateData = {
          name: data.name || '',
          bio: data.bio || '',
          department: data.department || '',
          major: data.major || '',
          minor: data.minor || '',
          headline: data.headline || '',
          location: data.location || '',
          hometown: data.hometown || '',
          student_id: data.student_id || '',
          avatar_url: data.avatar_url || '',
          profile_image_url: data.profile_image_url || ''
        }
        
        // Only add numeric fields if they have values
        if (data.year && data.year !== '') {
          updateData.year = parseInt(data.year)
        }
        
        if (data.graduation_year && data.graduation_year !== '') {
          updateData.graduation_year = parseInt(data.graduation_year)
        }
        
        if (data.gpa && data.gpa !== '') {
          updateData.gpa = parseFloat(data.gpa)
        }
        
            } else if (section === 'contact') {
        updateData = {
          portfolio_url: data.portfolio_url || '',
          linkedin_url: data.linkedin_url || '',
          github_url: data.github_url || '',
          phone_number: data.phone_number || '',
          phone: data.phone_number || '' // Support both field names for compatibility
        }
      } else if (section === 'skills') {
        updateData = { 
          skills: Array.isArray(data.skills) ? data.skills : [],
          interests: Array.isArray(data.interests) ? data.interests : []
        }
      } else if (section === 'experience') {
        // Store experience in direct database column
        console.log('Saving experience section:', data)
        
        const currentExperience = profile.experience || []
        let updatedExperience = [...currentExperience]
        
        if (data.id) {
          // Update existing
          const index = updatedExperience.findIndex(exp => exp.id === data.id)
          if (index >= 0) {
            updatedExperience[index] = { ...updatedExperience[index], ...data }
          }
        } else {
          // Add new
          updatedExperience.push({ ...data, id: Date.now().toString() + Math.random().toString(36).substr(2, 5) })
        }
        
        console.log('Updated experience array:', updatedExperience)
        updateData = { experience: updatedExperience }
        
      } else if (section === 'projects') {
        // Store projects in direct database column
        console.log('Saving projects section:', data)
        
        const currentProjects = profile.projects || []
        let updatedProjects = [...currentProjects]
        
        if (data.id) {
          // Update existing
          const index = updatedProjects.findIndex(proj => proj.id === data.id)
          if (index >= 0) {
            updatedProjects[index] = { ...updatedProjects[index], ...data }
          }
        } else {
          // Add new
          updatedProjects.push({ ...data, id: Date.now().toString() + Math.random().toString(36).substr(2, 5) })
        }
        
        console.log('Updated projects array:', updatedProjects)
        updateData = { projects: updatedProjects }
        
      } else if (section === 'certifications') {
        // Store certifications in direct database column
        console.log('Saving certifications section:', data)
        
        const currentCertifications = profile.certifications || []
        let updatedCertifications = [...currentCertifications]
        
        if (data.id) {
          // Update existing
          const index = updatedCertifications.findIndex(cert => cert.id === data.id)
          if (index >= 0) {
            updatedCertifications[index] = { ...updatedCertifications[index], ...data }
          }
        } else {
          // Add new
          updatedCertifications.push({ ...data, id: Date.now().toString() + Math.random().toString(36).substr(2, 5) })
        }
        
        console.log('Updated certifications array:', updatedCertifications)
        updateData = { certifications: updatedCertifications }
      }

      console.log('Final update data being sent:', updateData)
      const response = await api.put('/profile/me', updateData)
      
      if (response.data.success) {
        // Fetch fresh profile data to ensure UI is in sync
        await fetchProfile()
        setEditingSection(null)
        setEditingData({})
        
        // Show success message
        alert('Profile updated successfully!')
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      console.error('Error response:', error.response?.data)
      
      // Show user-friendly error message with details
      const errorMessage = error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || 'Failed to save changes'
      alert(`Error: ${errorMessage}`)
    }
  }



  if (loading) {
    return <LoadingSpinner text="Loading profile..." />
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Profile not found</h2>
        <p className="text-gray-600 mt-2">The user you're looking for doesn't exist.</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Read-Only Mode Banner */}
      {isReadOnlyMode && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-blue-900">
              Viewing {profile?.name || 'User'}'s Profile
            </h3>
            <p className="text-sm text-blue-700">
              You're viewing this profile in read-only mode. You can browse their information but cannot make changes.
            </p>
          </div>
        </div>
      )}

      {/* Profile Header Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Cover Photo Area */}
        <div className="h-32 bg-gradient-to-r from-blue-600 to-purple-600"></div>
        
        {/* Profile Info */}
        <div className="px-6 pb-6">
          {/* Avatar */}
          <div className="relative -mt-16 mb-4">
            {profile?.profile_image_url || profile?.avatar_url ? (
              <img
                src={profile?.profile_image_url || profile?.avatar_url}
                alt={profile.name}
                className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
              />
            ) : (
              <div className="w-32 h-32 rounded-full border-4 border-white bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-4xl font-bold text-white shadow-lg">
                {profile.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            )}
            {isOwnProfile && (
              <button 
                onClick={() => {
                  const imageUrl = prompt('Enter profile image URL:')
                  if (imageUrl) {
                    handleFieldSave('profile_image_url', imageUrl)
                  }
                }}
                className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
                title="Update profile picture"
              >
                <Camera className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Basic Info Section */}
          {editingSection === 'basic' ? (
            <div className="space-y-6">
              {/* Personal Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={editingData.name || profile.name || ''}
                      onChange={(e) => setEditingData({...editingData, name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input
                      type="text"
                      value={editingData.location || profile.location || ''}
                      onChange={(e) => setEditingData({...editingData, location: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="City, State, Country"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Professional Headline *</label>
                  <input
                    type="text"
                    value={editingData.headline || profile.headline || ''}
                    onChange={(e) => setEditingData({...editingData, headline: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Computer Science Student | Full Stack Developer | AI Enthusiast"
                  />
                  <p className="text-xs text-gray-500 mt-1">This headline will be shown instead of your generic role description</p>
                </div>
              </div>

              {/* Academic Information */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
                  <GraduationCap className="w-4 h-4 mr-2" />
                  Academic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <input
                      type="text"
                      value={editingData.department || profile.department || ''}
                      onChange={(e) => setEditingData({...editingData, department: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Computer Science, Engineering"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Major/Specialization</label>
                    <input
                      type="text"
                      value={editingData.major || profile.major || ''}
                      onChange={(e) => setEditingData({...editingData, major: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Software Engineering, Data Science"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Year</label>
                    <select
                      value={editingData.year || profile.year || ''}
                      onChange={(e) => setEditingData({...editingData, year: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Year</option>
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                      <option value="5">5th Year (Masters)</option>
                      <option value="6">6th Year (PhD)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expected Graduation</label>
                    <input
                      type="number"
                      value={editingData.graduation_year || profile.graduation_year || ''}
                      onChange={(e) => setEditingData({...editingData, graduation_year: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="2025"
                      min="2020"
                      max="2050"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Minor</label>
                    <input
                      type="text"
                      value={editingData.minor || profile.minor || ''}
                      onChange={(e) => setEditingData({...editingData, minor: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Mathematics, Business"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">GPA</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.00"
                      max="4.00"
                      value={editingData.gpa || profile.gpa || ''}
                      onChange={(e) => setEditingData({...editingData, gpa: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="3.75"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hometown</label>
                    <input
                      type="text"
                      value={editingData.hometown || profile.hometown || ''}
                      onChange={(e) => setEditingData({...editingData, hometown: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Mumbai, India"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
                    <input
                      type="text"
                      value={editingData.student_id || profile.student_id || ''}
                      onChange={(e) => setEditingData({...editingData, student_id: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Your student ID (optional)"
                    />
                  </div>
                </div>
              </div>

              {/* Profile Image Section */}
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
                  <Camera className="w-4 h-4 mr-2" />
                  Profile Picture
                </h3>
                <div className="space-y-2">
                  <input
                    type="url"
                    value={editingData.profile_image_url || profile.profile_image_url || ''}
                    onChange={(e) => setEditingData({...editingData, profile_image_url: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="https://example.com/your-profile-image.jpg"
                  />
                  <p className="text-xs text-gray-500">
                    Add a URL to your profile picture (optional). Use a service like Imgur, Cloudinary, or your personal website.
                  </p>
                  {editingData.profile_image_url && (
                    <div className="mt-2">
                      <img
                        src={editingData.profile_image_url}
                        alt="Preview"
                        className="w-20 h-20 rounded-full border-2 border-gray-300 object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none'
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* About Section */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
                  <BookOpen className="w-4 h-4 mr-2" />
                  About You
                </h3>
                <textarea
                  rows="5"
                  value={editingData.bio || profile.bio || ''}
                  onChange={(e) => setEditingData({...editingData, bio: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Tell us about yourself, your interests, goals, and what you're passionate about..."
                  maxLength="1000"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {(editingData.bio || profile.bio || '').length}/1000 characters
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2 pt-4 border-t border-gray-200">
                <button
                  onClick={() => saveSection('basic', editingData)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2 font-medium"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
                <button
                  onClick={cancelEditing}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center space-x-2 font-medium"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{profile?.name || 'Unknown User'}</h1>
                  {/* Show custom headline if available */}
                  {profile?.headline ? (
                    <div>
                      <p className="text-lg text-gray-700 mt-1 font-medium">
                        {profile.headline}
                      </p>
                      {/* Show academic info as supplementary if we have department or major */}
                      {(profile?.department || profile?.major) && (
                        <p className="text-md text-gray-600 mt-1">
                          {profile?.role === 'faculty' 
                            ? `Faculty at ${profile?.department || 'University'}`
                            : `Student pursuing ${profile?.major || profile?.department || 'Computer Science'}`
                          }
                        </p>
                      )}
                    </div>
                  ) : (
                    /* Fallback to generic role description */
                    <p className="text-lg text-gray-700 mt-1">
                      {profile?.role === 'faculty' 
                        ? `Faculty at ${profile?.department || 'University'}`
                        : `Student pursuing ${profile?.major || profile?.department || 'Computer Science'}`
                      }
                    </p>
                  )}
                  {profile.location && (
                    <div className="flex items-center space-x-1 mt-2 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <span>{profile.location}</span>
                    </div>
                  )}
                </div>
                {canEdit && (
                  <button
                    onClick={() => startEditing('basic', {
                      name: profile.name,
                      headline: profile.headline,
                      location: profile.location,
                      bio: profile.bio,
                      department: profile.department,
                      major: profile.major,
                      minor: profile.minor,
                      year: profile.year,
                      graduation_year: profile.graduation_year,
                      gpa: profile.gpa,
                      hometown: profile.hometown,
                      student_id: profile.student_id,
                      profile_image_url: profile.profile_image_url,
                      avatar_url: profile.avatar_url
                    })}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <div className="flex flex-wrap gap-3">
                {isOwnProfile && (
                  <button className="px-6 py-2 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700">
                    Open To Work
                  </button>
                )}
                
                {!isOwnProfile && (
                  <button 
                    onClick={startMessage}
                    className="flex items-center space-x-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-full font-medium hover:bg-blue-50 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Send Message</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* About Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">About</h2>
          {canEdit && editingSection !== 'basic' && (
            <button
              onClick={() => startEditing('basic', {
                name: profile?.name || '',
                headline: profile?.headline || '',
                location: profile?.location || '',
                bio: profile?.bio || '',
                department: profile?.department || '',
                major: profile?.major || '',
                minor: profile?.minor || '',
                year: profile?.year || '',
                graduation_year: profile?.graduation_year || '',
                gpa: profile?.gpa || '',
                hometown: profile?.hometown || '',
                student_id: profile?.student_id || '',
                profile_image_url: profile?.profile_image_url || '',
                avatar_url: profile?.avatar_url || ''
              })}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          )}
        </div>
        <p className="text-gray-700 whitespace-pre-wrap">
          {profile?.bio || 'No description available.'}
        </p>
      </div>

      {/* Academic & Personal Information Section - Fully Editable */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <GraduationCap className="w-5 h-5 mr-2" />
            Academic & Personal Information
          </h2>
          {canEdit && (
            <span className="text-sm text-blue-600">✏️ All fields are editable - click to edit</span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Academic Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800 flex items-center border-b border-gray-200 pb-2">
              <BookOpen className="w-4 h-4 mr-2" />
              Academic Details
            </h3>
            
            {/* Department Field */}
            <EditableField 
              label="Department"
              value={profile?.department}
              rawValue={profile?.department || ''}
              field="department"
              canEdit={canEdit}
              onSave={(value) => handleFieldSave('department', value)}
              placeholder="e.g., Computer Science, Engineering"
            />
            
            {/* Major Field */}
            <EditableField 
              label="Major/Specialization"
              value={profile?.major}
              rawValue={profile?.major || ''}
              field="major"
              canEdit={canEdit}
              onSave={(value) => handleFieldSave('major', value)}
              placeholder="e.g., Software Engineering, Data Science"
            />
            
            {/* Minor Field */}
            <EditableField 
              label="Minor"
              value={profile?.minor}
              rawValue={profile?.minor || ''}
              field="minor"
              canEdit={canEdit}
              onSave={(value) => handleFieldSave('minor', value)}
              placeholder="e.g., Mathematics, Business"
            />
            
            {/* Year Field */}
            <EditableField 
              label="Current Year"
              value={profile?.year ? `${profile.year}${profile.year === 1 ? 'st' : profile.year === 2 ? 'nd' : profile.year === 3 ? 'rd' : 'th'} Year` : ''}
              rawValue={profile?.year || ''}
              field="year"
              type="select"
              canEdit={canEdit}
              onSave={(value) => handleFieldSave('year', value)}
              options={[
                { value: '', label: 'Select Year' },
                { value: '1', label: '1st Year' },
                { value: '2', label: '2nd Year' },
                { value: '3', label: '3rd Year' },
                { value: '4', label: '4th Year' },
                { value: '5', label: '5th Year (Masters)' },
                { value: '6', label: '6th Year (PhD)' }
              ]}
            />
            
            {/* Graduation Year Field */}
            <EditableField 
              label="Expected Graduation"
              value={profile?.graduation_year}
              rawValue={profile?.graduation_year || ''}
              field="graduation_year"
              type="number"
              canEdit={canEdit}
              onSave={(value) => handleFieldSave('graduation_year', value)}
              placeholder="2025"
              inputProps={{ min: 2020, max: 2050 }}
            />
            
            {/* GPA Field */}
            <EditableField 
              label="GPA"
              value={profile?.gpa ? `${profile.gpa}/4.0` : ''}
              rawValue={profile?.gpa || ''}
              field="gpa"
              type="number"
              canEdit={canEdit}
              onSave={(value) => handleFieldSave('gpa', value)}
              placeholder="3.75"
              inputProps={{ min: 0, max: 4, step: 0.01 }}
            />
            
            {/* Student ID Field */}
            <EditableField 
              label="Student ID"
              value={profile?.student_id}
              rawValue={profile?.student_id || ''}
              field="student_id"
              canEdit={canEdit}
              onSave={(value) => handleFieldSave('student_id', value)}
              placeholder="Your student ID"
            />
          </div>

          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800 flex items-center border-b border-gray-200 pb-2">
              <User className="w-4 h-4 mr-2" />
              Personal Details
            </h3>
            
            {/* Headline Field */}
            <EditableField 
              label="Professional Headline"
              value={profile?.headline}
              rawValue={profile?.headline || ''}
              field="headline"
              canEdit={canEdit}
              onSave={(value) => handleFieldSave('headline', value)}
              placeholder="e.g., Full Stack Developer | AI Enthusiast"
            />
            
            {/* Location Field */}
            <EditableField 
              label="Current Location"
              value={profile?.location}
              rawValue={profile?.location || ''}
              field="location"
              canEdit={canEdit}
              onSave={(value) => handleFieldSave('location', value)}
              placeholder="e.g., Mumbai, India"
            />
            
            {/* Hometown Field */}
            <EditableField 
              label="Hometown"
              value={profile?.hometown}
              rawValue={profile?.hometown || ''}
              field="hometown"
              canEdit={canEdit}
              onSave={(value) => handleFieldSave('hometown', value)}
              placeholder="e.g., Delhi, India"
            />
            
            {/* Role Field - Read Only */}
            <div className="space-y-1">
              <span className="text-sm font-medium text-gray-600">Role</span>
              <div className="px-3 py-2 border border-gray-200 rounded-md bg-gray-50">
                <span className="text-gray-900 capitalize">{profile?.role || 'Student'}</span>
                <span className="text-xs text-gray-500 ml-2">(Contact admin to change)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Information Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Mail className="w-5 h-5 mr-2" />
            Contact Information
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Phone Number Field */}
          <EditableField 
            label="Phone Number"
            value={profile?.phone_number}
            rawValue={profile?.phone_number || ''}
            field="phone_number"
            type="tel"
            canEdit={canEdit}
            onSave={(value) => handleFieldSave('phone_number', value)}
            placeholder="+1 (555) 123-4567"
          />
          
          {/* Portfolio URL Field */}
          <EditableField 
            label="Portfolio Website"
            value={profile?.portfolio_url}
            rawValue={profile?.portfolio_url || ''}
            field="portfolio_url"
            type="url"
            canEdit={canEdit}
            onSave={(value) => handleFieldSave('portfolio_url', value)}
            placeholder="https://yourportfolio.com"
          />
          
          {/* LinkedIn URL Field */}
          <EditableField 
            label="LinkedIn Profile"
            value={profile?.linkedin_url}
            rawValue={profile?.linkedin_url || ''}
            field="linkedin_url"
            type="url"
            canEdit={canEdit}
            onSave={(value) => handleFieldSave('linkedin_url', value)}
            placeholder="https://linkedin.com/in/username"
          />
          
          {/* GitHub URL Field */}
          <EditableField 
            label="GitHub Profile"
            value={profile?.github_url}
            rawValue={profile?.github_url || ''}
            field="github_url"
            type="url"
            canEdit={canEdit}
            onSave={(value) => handleFieldSave('github_url', value)}
            placeholder="https://github.com/username"
          />
        </div>
      </div>

      {/* Experience Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Briefcase className="w-5 h-5 mr-2" />
            Experience
          </h2>
          {canEdit && (
            <button
              onClick={handleAddNewExperience}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors flex items-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm">Add Experience</span>
            </button>
          )}
        </div>

        <div className="space-y-4">
          {/* Add New Experience Form */}
          {addingNewExperience && (
            <AddNewExperienceForm
              onSave={handleSaveNewExperience}
              onCancel={handleCancelNewExperience}
            />
          )}

          {(() => {
            const experiences = getExperienceArray(profile?.experience) || []
            
            if (experiences.length > 0) {
              return experiences.map((exp, index) => (
                <EditableExperienceItem
                  key={exp.id || index}
                  experience={exp}
                  canEdit={canEdit}
                  onSave={handleExperienceSave}
                  onDelete={deleteExperience}
                />
              ))
            }
            
            if (!addingNewExperience) {
              return (
                <div className="text-center py-12">
                  <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg mb-2">No experience added yet</p>
                  {canEdit && (
                    <button
                      onClick={handleAddNewExperience}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Add your first experience
                    </button>
                  )}
                </div>
              )
            }
            
            return null
          })()}
        </div>
      </div>

      {/* Projects Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Code2 className="w-5 h-5 mr-2" />
            Projects
          </h2>
          {canEdit && (
            <button
              onClick={handleAddNewProject}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors flex items-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm">Add Project</span>
            </button>
          )}
        </div>

        <div className="space-y-4">
          {/* Add New Project Form */}
          {addingNewProject && (
            <AddNewProjectForm
              onSave={handleSaveNewProject}
              onCancel={handleCancelNewProject}
            />
          )}

          {(() => {
            const projects = getProjectsArray(profile?.projects) || []
            
            if (projects.length > 0) {
              return projects.map((project, index) => (
                <EditableProjectItem
                  key={project.id || index}
                  project={project}
                  canEdit={canEdit}
                  onSave={handleProjectSave}
                  onDelete={deleteProject}
                />
              ))
            }
            
            if (!addingNewProject) {
              return (
                <div className="text-center py-12">
                  <Code2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg mb-2">No projects added yet</p>
                  {canEdit && (
                    <button
                      onClick={handleAddNewProject}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Add your first project
                    </button>
                  )}
                </div>
              )
            }
            
            return null
          })()}
        </div>
      </div>

      {/* Certifications Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Award className="w-5 h-5 mr-2" />
            Certifications
          </h2>
          {canEdit && (
            <button
              onClick={handleAddNewCertification}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors flex items-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm">Add Certification</span>
            </button>
          )}
        </div>

        <div className="space-y-4">
          {/* Add New Certification Form */}
          {addingNewCertification && (
            <AddNewCertificationForm
              onSave={handleSaveNewCertification}
              onCancel={handleCancelNewCertification}
            />
          )}

          {(() => {
            const certifications = getCertificationsArray(profile?.certifications) || []
            
            if (certifications.length > 0) {
              return certifications.map((certification, index) => (
                <EditableCertificationItem
                  key={certification.id || index}
                  certification={certification}
                  canEdit={canEdit}
                  onSave={handleCertificationSave}
                  onDelete={deleteCertification}
                />
              ))
            }
            
            if (!addingNewCertification) {
              return (
                <div className="text-center py-12">
                  <Award className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg mb-2">No certifications added yet</p>
                  {canEdit && (
                    <button
                      onClick={handleAddNewCertification}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Add your first certification
                    </button>
                  )}
                </div>
              )
            }
            
            return null
          })()}
        </div>
      </div>

      {/* Skills & Interests Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Zap className="w-5 h-5 mr-2" />
            Skills & Interests
          </h2>
          {canEdit && (
            <button
              onClick={() => startEditing('skills', { 
                skills: profile?.skills || [],
                interests: profile?.interests || []
              })}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          )}
        </div>

        {editingSection === 'skills' ? (
          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-md font-semibold text-gray-800 mb-2 flex items-center">
                <Code2 className="w-4 h-4 mr-2" />
                Technical Skills
              </h3>
              <input
                type="text"
                value={editingData.skills ? editingData.skills.join(', ') : ''}
                onChange={(e) => setEditingData({
                  ...editingData, 
                  skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="JavaScript, React, Node.js, Python, Java, Machine Learning, Data Science..."
              />
              <p className="text-xs text-gray-500 mt-1">Add your technical skills separated by commas</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-md font-semibold text-gray-800 mb-2 flex items-center">
                <Star className="w-4 h-4 mr-2" />
                Interests & Hobbies
              </h3>
              <input
                type="text"
                value={editingData.interests ? editingData.interests.join(', ') : ''}
                onChange={(e) => setEditingData({
                  ...editingData, 
                  interests: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Photography, Gaming, Music, Sports, Reading, Travel, Cooking..."
              />
              <p className="text-xs text-gray-500 mt-1">Add your interests and hobbies separated by commas</p>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => saveSection('skills', editingData)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-1"
              >
                <Save className="w-4 h-4" />
                <span>Save</span>
              </button>
              <button
                onClick={cancelEditing}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 flex items-center space-x-1"
              >
                <X className="w-4 h-4" />
                <span>Cancel</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Technical Skills */}
            <div>
              <h3 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
                <Code2 className="w-4 h-4 mr-2" />
                Technical Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {profile?.skills && profile.skills.length > 0 ? (
                  profile.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-500">No technical skills added yet.</p>
                )}
              </div>
            </div>
            
            {/* Interests */}
            <div>
              <h3 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
                <Star className="w-4 h-4 mr-2" />
                Interests & Hobbies
              </h3>
              <div className="flex flex-wrap gap-2">
                {profile?.interests && profile.interests.length > 0 ? (
                  profile.interests.map((interest, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                    >
                      {interest}
                    </span>
                  ))
                ) : (
                  <p className="text-gray-500">No interests added yet.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Profile