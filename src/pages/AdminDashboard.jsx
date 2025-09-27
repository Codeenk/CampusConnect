import React, { useState, useEffect } from 'react'
import api from '../services/api'
import { Users, FileText, Award, MessageCircle, Download, Search, ListFilter as Filter, MoveVertical as MoreVertical, Shield, UserCheck, UserX, TrendingUp } from 'lucide-react'
import LoadingSpinner from '../components/LoadingSpinner'

const AdminDashboard = () => {
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [usersLoading, setUsersLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)

  useEffect(() => {
    fetchStatistics()
    fetchUsers()
  }, [])

  const fetchStatistics = async () => {
    try {
      const response = await api.get('/admin/statistics')
      setStats(response.data.data)
    } catch (error) {
      console.error('Error fetching statistics:', error)
    }
  }

  const fetchUsers = async () => {
    setUsersLoading(true)
    try {
      const params = new URLSearchParams()
      if (searchQuery) params.append('search', searchQuery)
      if (roleFilter) params.append('role', roleFilter)
      
      const response = await api.get(`/admin/users?${params}`)
      setUsers(response.data.data.users || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setUsersLoading(false)
      setLoading(false)
    }
  }

  const handleExportProfile = async (userId, userName) => {
    try {
      const response = await api.get(`/admin/export/${userId}`, {
        responseType: 'blob'
      })
      
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${userName}_Profile_Export.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting profile:', error)
    }
  }

  const handleRoleUpdate = async (userId, newRole) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole })
      fetchUsers() // Refresh the users list
    } catch (error) {
      console.error('Error updating user role:', error)
    }
  }

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await api.delete(`/admin/users/${userId}`)
        fetchUsers() // Refresh the users list
      } catch (error) {
        console.error('Error deleting user:', error)
      }
    }
  }

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchUsers()
    }, 500)

    return () => clearTimeout(debounceTimer)
  }, [searchQuery, roleFilter])

  if (loading) {
    return <LoadingSpinner text="Loading admin dashboard..." />
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.users?.total || 0,
      icon: Users,
      color: 'blue',
      subtitle: `${stats?.users?.recent || 0} new this month`
    },
    {
      title: 'Students',
      value: stats?.users?.students || 0,
      icon: UserCheck,
      color: 'green',
      subtitle: 'Active students'
    },
    {
      title: 'Faculty',
      value: stats?.users?.faculty || 0,
      icon: Shield,
      color: 'purple',
      subtitle: 'Faculty members'
    },
    {
      title: 'Total Posts',
      value: stats?.posts?.total || 0,
      icon: FileText,
      color: 'orange',
      subtitle: `${stats?.posts?.recent || 0} recent posts`
    },
    {
      title: 'Endorsements',
      value: stats?.endorsements?.total || 0,
      icon: Award,
      color: 'yellow',
      subtitle: 'Faculty endorsements'
    },
    {
      title: 'Messages',
      value: stats?.messages?.total || 0,
      icon: MessageCircle,
      color: 'pink',
      subtitle: 'Total messages sent'
    }
  ]

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-500 text-blue-600 bg-blue-50',
      green: 'bg-green-500 text-green-600 bg-green-50',
      purple: 'bg-purple-500 text-purple-600 bg-purple-50',
      orange: 'bg-orange-500 text-orange-600 bg-orange-50',
      yellow: 'bg-yellow-500 text-yellow-600 bg-yellow-50',
      pink: 'bg-pink-500 text-pink-600 bg-pink-50'
    }
    return colors[color] || colors.blue
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage users and monitor platform activity</p>
        </div>
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-green-500" />
          <span className="text-sm text-gray-600">Platform growing</span>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => {
          const colorClasses = getColorClasses(stat.color).split(' ')
          return (
            <div key={index} className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  <p className="text-sm text-gray-500 mt-1">{stat.subtitle}</p>
                </div>
                <div className={`w-12 h-12 ${colorClasses[2]} rounded-lg flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${colorClasses[1]}`} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Users Management */}
      <div className="card">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">User Management</h2>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search users by name, email, or department..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Roles</option>
                <option value="student">Students</option>
                <option value="faculty">Faculty</option>
                <option value="admin">Admins</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          {usersLoading ? (
            <div className="p-8">
              <LoadingSpinner text="Loading users..." />
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Activity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.user_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {user.name?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full capitalize ${
                        user.role === 'admin' ? 'bg-red-100 text-red-800' :
                        user.role === 'faculty' ? 'bg-purple-100 text-purple-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.department || 'Not specified'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="space-y-1">
                        <div>Posts: {user.posts?.[0]?.count || 0}</div>
                        <div>Endorsements: {(user.endorsements_received?.[0]?.count || 0) + (user.endorsements_given?.[0]?.count || 0)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {user.role === 'student' && (
                          <button
                            onClick={() => handleExportProfile(user.user_id, user.name)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded"
                            title="Export Profile"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        )}
                        
                        <div className="relative">
                          <button
                            onClick={() => setSelectedUser(selectedUser === user.user_id ? null : user.user_id)}
                            className="text-gray-400 hover:text-gray-600 p-1 rounded"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          
                          {selectedUser === user.user_id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                              <div className="py-1">
                                <div className="px-4 py-2 text-xs text-gray-500 border-b">Change Role</div>
                                {['student', 'faculty', 'admin'].filter(role => role !== user.role).map(role => (
                                  <button
                                    key={role}
                                    onClick={() => {
                                      handleRoleUpdate(user.user_id, role)
                                      setSelectedUser(null)
                                    }}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 capitalize"
                                  >
                                    Make {role}
                                  </button>
                                ))}
                                <div className="border-t border-gray-100">
                                  <button
                                    onClick={() => {
                                      handleDeleteUser(user.user_id)
                                      setSelectedUser(null)
                                    }}
                                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                  >
                                    Delete User
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard