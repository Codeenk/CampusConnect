// Updated Profile.jsx sections to use proper database columns
// This shows the key changes needed to use experience, projects, and certifications columns

// 1. Add certifications component before existing components
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

// 2. Add New Certification Form Component
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

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.issuer.trim()) {
      alert('Certification name and issuer are required')
      return
    }

    try {
      await onSave(formData)
      onCancel() // Close the form after successful save
    } catch (error) {
      console.error('Save failed:', error)
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
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Certification</span>
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// 3. Updated helper functions to use direct column access
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

// 4. Updated save handlers to use proper database columns
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
    const response = await api.put(`/api/profile/${userId}`, {
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
    const response = await api.put(`/api/profile/${userId}`, {
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
    const response = await api.put(`/api/profile/${userId}`, {
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

// 5. Delete handlers
const deleteExperience = async (experienceId) => {
  console.log('Deleting experience with ID:', experienceId)
  
  try {
    const currentExperience = profile.experience || []
    const updatedExperience = currentExperience.filter(exp => exp.id !== experienceId)
    
    console.log('Updated experience array after delete:', updatedExperience)
    
    // Save to database
    const response = await api.put(`/api/profile/${userId}`, {
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
    const response = await api.put(`/api/profile/${userId}`, {
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
    const response = await api.put(`/api/profile/${userId}`, {
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

// 6. Usage in the main component render section:
// Replace the achievements-based logic with direct column usage:

// For Experience section:
const experienceData = getExperienceArray(profile.experience)

// For Projects section:  
const projectsData = getProjectsArray(profile.projects)

// For Certifications section:
const certificationsData = getCertificationsArray(profile.certifications)