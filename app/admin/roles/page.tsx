'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { 
  Shield, 
  ShieldAlert, 
  UserPlus, 
  Plus, 
  Edit2, 
  Trash2, 
  Check, 
  X, 
  Search, 
  Users, 
  Lock, 
  Unlock,
  AlertCircle
} from 'lucide-react'

interface RoleDefinition {
  id: string
  name: string
  description: string
  permissions: string[]
  isSystem?: boolean
}

interface UserAssignment {
  id: string
  name: string
  email: string
  roleId: string
  joined: string
}

const AVAILABLE_PERMISSIONS = [
  { id: 'dashboard:view', label: 'View Dashboard', description: 'Access dashboard analytics and stats' },
  { id: 'products:manage', label: 'Manage Products', description: 'Create, update, and delete products' },
  { id: 'categories:manage', label: 'Manage Categories', description: 'Add and edit product categories' },
  { id: 'orders:manage', label: 'Manage Orders', description: 'View, edit, and ship orders' },
  { id: 'custom_requests:manage', label: 'Manage Custom Requests', description: 'Handle 3D printing custom requests' },
  { id: 'reviews:moderate', label: 'Moderate Reviews', description: 'Approve or delete user reviews' },
  { id: 'inquiries:reply', label: 'Reply to Inquiries', description: 'Answer support and contact tickets' },
  { id: 'settings:edit', label: 'Edit Settings', description: 'Change business and shipping configurations' },
]

const DEFAULT_ROLES: RoleDefinition[] = [
  {
    id: 'admin',
    name: 'Administrator',
    description: 'Full system access with all administrative privileges.',
    permissions: AVAILABLE_PERMISSIONS.map(p => p.id),
    isSystem: true
  },
  {
    id: 'catalog_manager',
    name: 'Catalog Manager',
    description: 'Responsible for product inventory, tags, and category updates.',
    permissions: ['products:manage', 'categories:manage', 'dashboard:view'],
    isSystem: false
  },
  {
    id: 'order_manager',
    name: 'Order Fulfillment Manager',
    description: 'Manages shipments, updates order tracking, and handles returns.',
    permissions: ['orders:manage', 'dashboard:view'],
    isSystem: false
  },
  {
    id: 'support_agent',
    name: 'Support Representative',
    description: 'Handles support inquiries, reviews, and client requests.',
    permissions: ['inquiries:reply', 'reviews:moderate', 'custom_requests:manage', 'dashboard:view'],
    isSystem: false
  }
]

const DEFAULT_USERS: UserAssignment[] = [
  { id: 'u1', name: 'John Doe', email: 'john@example.com', roleId: 'customer', joined: '2024-01-01' },
  { id: 'u2', name: 'Jane Smith', email: 'jane@example.com', roleId: 'admin', joined: '2024-01-05' },
  { id: 'u3', name: 'Mike Johnson', email: 'mike@example.com', roleId: 'catalog_manager', joined: '2024-01-15' },
  { id: 'u4', name: 'Sara Connor', email: 'sara.c@skulture.com', roleId: 'support_agent', joined: '2024-02-10' },
  { id: 'u5', name: 'Rahul Sharma', email: 'rahul@skulture.com', roleId: 'order_manager', joined: '2024-03-01' },
]

export default function AdminRoles() {
  const [roles, setRoles] = useState<RoleDefinition[]>([])
  const [users, setUsers] = useState<UserAssignment[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('ALL')
  
  // Modals state
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<RoleDefinition | null>(null)
  const [roleName, setRoleName] = useState('')
  const [roleDescription, setRoleDescription] = useState('')
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])

  // User creation modal state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  const [newUserName, setNewUserName] = useState('')
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserRole, setNewUserRole] = useState('customer')
  
  // Notification / feedback toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Load from local storage or set defaults
  useEffect(() => {
    const savedRoles = localStorage.getItem('skulture_admin_roles')
    const savedUsers = localStorage.getItem('skulture_admin_users')
    
    if (savedRoles) {
      setRoles(JSON.parse(savedRoles))
    } else {
      setRoles(DEFAULT_ROLES)
      localStorage.setItem('skulture_admin_roles', JSON.stringify(DEFAULT_ROLES))
    }
    
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers))
    } else {
      setUsers(DEFAULT_USERS)
      localStorage.setItem('skulture_admin_users', JSON.stringify(DEFAULT_USERS))
    }
  }, [])

  const saveToStorage = (updatedRoles: RoleDefinition[], updatedUsers: UserAssignment[]) => {
    setRoles(updatedRoles)
    setUsers(updatedUsers)
    localStorage.setItem('skulture_admin_roles', JSON.stringify(updatedRoles))
    localStorage.setItem('skulture_admin_users', JSON.stringify(updatedUsers))
  }

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Handle open role create/edit modal
  const openRoleModal = (role: RoleDefinition | null = null) => {
    if (role) {
      setEditingRole(role)
      setRoleName(role.name)
      setRoleDescription(role.description)
      setSelectedPermissions(role.permissions)
    } else {
      setEditingRole(null)
      setRoleName('')
      setRoleDescription('')
      setSelectedPermissions([])
    }
    setIsRoleModalOpen(true)
  }

  // Handle Save Role
  const handleSaveRole = (e: React.FormEvent) => {
    e.preventDefault()
    if (!roleName.trim()) {
      showToast('Role Name is required.', 'error')
      return
    }

    let updatedRoles = [...roles]
    if (editingRole) {
      // Update role
      updatedRoles = roles.map(r => 
        r.id === editingRole.id 
          ? { ...r, name: roleName, description: roleDescription, permissions: selectedPermissions }
          : r
      )
      showToast(`Role "${roleName}" updated successfully.`)
    } else {
      // Create role
      const newRole: RoleDefinition = {
        id: `role_${Date.now()}`,
        name: roleName,
        description: roleDescription,
        permissions: selectedPermissions,
        isSystem: false
      }
      updatedRoles.push(newRole)
      showToast(`Role "${roleName}" created successfully.`)
    }

    saveToStorage(updatedRoles, users)
    setIsRoleModalOpen(false)
  }

  // Handle Delete Role
  const handleDeleteRole = (roleId: string) => {
    const roleToDelete = roles.find(r => r.id === roleId)
    if (roleToDelete?.isSystem) {
      showToast('Cannot delete system-defined roles.', 'error')
      return
    }

    if (!confirm('Are you sure you want to delete this role? Users assigned to this role will be reverted.')) {
      return
    }

    const updatedRoles = roles.filter(r => r.id !== roleId)
    // Revert user roles to default 'customer' or similar
    const updatedUsers = users.map(u => u.roleId === roleId ? { ...u, roleId: 'customer' } : u)
    
    saveToStorage(updatedRoles, updatedUsers)
    showToast(`Role deleted successfully.`)
  }

  // Handle User Role Change
  const handleUserRoleChange = (userId: string, newRoleId: string) => {
    const updatedUsers = users.map(u => u.id === userId ? { ...u, roleId: newRoleId } : u)
    saveToStorage(roles, updatedUsers)
    showToast('User role updated successfully.')
  }

  // Handle Add User
  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUserName.trim() || !newUserEmail.trim()) {
      showToast('Name and Email are required.', 'error')
      return
    }

    if (users.some(u => u.email.toLowerCase() === newUserEmail.trim().toLowerCase())) {
      showToast('A user with this email already exists.', 'error')
      return
    }

    const newUser: UserAssignment = {
      id: `user_${Date.now()}`,
      name: newUserName.trim(),
      email: newUserEmail.trim().toLowerCase(),
      roleId: newUserRole,
      joined: new Date().toISOString().split('T')[0]
    }

    const updatedUsers = [...users, newUser]
    saveToStorage(roles, updatedUsers)
    
    // Reset form
    setNewUserName('')
    setNewUserEmail('')
    setNewUserRole('customer')
    setIsUserModalOpen(false)
    
    showToast(`Staff member "${newUserName}" added successfully.`)
  }

  // Handle Delete User
  const handleDeleteUser = (userId: string) => {
    if (!confirm('Are you sure you want to remove this user from the staff list?')) {
      return
    }
    const updatedUsers = users.filter(u => u.id !== userId)
    saveToStorage(roles, updatedUsers)
    showToast('User removed from staff list successfully.')
  }

  const togglePermission = (permId: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permId) ? prev.filter(p => p !== permId) : [...prev, permId]
    )
  }

  // Filtered Users
  const filteredUsers = users.filter(user => {
    const nameMatch = user.name.toLowerCase().includes(searchQuery.toLowerCase())
    const emailMatch = user.email.toLowerCase().includes(searchQuery.toLowerCase())
    const roleMatch = selectedRoleFilter === 'ALL' || user.roleId === selectedRoleFilter
    return (nameMatch || emailMatch) && roleMatch
  })

  return (
    <AdminLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-8"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="heading-2 uppercase tracking-wide flex items-center gap-2">
              <Shield className="w-7 h-7 text-primary" /> Roles & Permissions
            </h1>
            <p className="text-xs text-muted-text uppercase tracking-widest mt-1">
              Define access control levels and assign staff privileges
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsUserModalOpen(true)}
              className="flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/80 text-primary-text border border-border text-xs font-bold py-2.5 px-4 rounded-lg uppercase tracking-wider smooth-transition focus:outline-none"
            >
              <UserPlus className="w-4 h-4" /> Add User
            </button>
            <button
              onClick={() => openRoleModal(null)}
              className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold py-2.5 px-4 rounded-lg uppercase tracking-wider smooth-transition focus:outline-none"
            >
              <Plus className="w-4 h-4" /> Create Role
            </button>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-secondary/40 border border-border/80 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-primary-text uppercase tracking-wider">Access Control Policies</h4>
            <p className="text-xs text-muted-text mt-1">
              Permissions grant specific access to pages in the administration portal. System roles like <strong className="text-primary-text">Administrator</strong> possess full permissions and cannot be deleted or modified.
            </p>
          </div>
        </div>

        {/* Toast Notification */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg border text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg ${
                toast.type === 'error' 
                  ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                  : 'bg-green-500/10 text-green-400 border-green-500/20'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>{toast.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Roles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {roles.map((role) => (
            <div key={role.id} className="glass-card border border-border/60 hover:border-primary/35 p-6 flex flex-col justify-between smooth-transition relative group">
              {role.isSystem && (
                <span className="absolute top-4 right-4 text-[9px] font-bold text-amber-500 border border-amber-500/20 bg-amber-500/5 px-2 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> System
                </span>
              )}
              
              <div>
                <h3 className="text-sm font-extrabold text-primary-text uppercase tracking-wide flex items-center gap-2">
                  {role.name}
                </h3>
                <p className="text-xs text-muted-text mt-2 min-h-[32px]">{role.description}</p>
                
                {/* Active Permissions Badges */}
                <div className="mt-4">
                  <h4 className="text-[9px] font-bold text-muted-text uppercase tracking-widest mb-2">Permissions ({role.permissions.length})</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {role.permissions.map(perm => (
                      <span key={perm} className="text-[9px] font-semibold text-secondary-text bg-secondary/80 border border-border px-2.5 py-1 rounded-md">
                        {perm.replace(':', ' ').toUpperCase()}
                      </span>
                    ))}
                    {role.permissions.length === 0 && (
                      <span className="text-[9px] italic text-muted-text">No active permissions</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="mt-6 pt-4 border-t border-border/40 flex items-center justify-between">
                <span className="text-[10px] text-muted-text font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-primary" />
                  {users.filter(u => u.roleId === role.id).length} Assigned Users
                </span>
                
                {!role.isSystem && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => openRoleModal(role)}
                      className="p-1.5 text-muted-text hover:text-primary smooth-transition rounded-md hover:bg-secondary/40 focus:outline-none"
                      title="Edit Role"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteRole(role.id)}
                      className="p-1.5 text-muted-text hover:text-destructive smooth-transition rounded-md hover:bg-secondary/40 focus:outline-none"
                      title="Delete Role"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* User Role Assignment Section */}
        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-widest text-primary-text">Staff Assignments</h2>
            <p className="text-xs text-muted-text mt-1">Assign defined administrative roles to staff members</p>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-secondary/20 border border-border p-4 rounded-xl">
            <div className="relative w-full sm:max-w-xs flex items-center bg-secondary border border-border focus-within:border-primary/50 rounded-lg overflow-hidden transition-all duration-300">
              <Search className="w-4 h-4 text-muted-text ml-3 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search staff by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-2.5 px-3 bg-transparent text-primary-text placeholder:text-muted-text text-xs focus:outline-none tracking-wide"
              />
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-[10px] font-bold text-muted-text uppercase tracking-widest whitespace-nowrap">Filter Role:</span>
              <select
                value={selectedRoleFilter}
                onChange={(e) => setSelectedRoleFilter(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 bg-secondary border border-border rounded-lg text-[10px] text-primary-text focus:outline-none focus:border-primary/50 cursor-pointer uppercase font-bold tracking-wider"
              >
                <option value="ALL">All Roles</option>
                <option value="customer">Customer (Default)</option>
                {roles.map(role => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="glass-card overflow-x-auto border border-border">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/60 bg-secondary/40 text-[10px] font-bold text-muted-text uppercase tracking-widest">
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Assigned Access Role</th>
                  <th className="px-6 py-4">Joined Date</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-xs">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-secondary/25 smooth-transition">
                    <td className="px-6 py-4 font-bold text-primary-text">{user.name}</td>
                    <td className="px-6 py-4 font-medium text-secondary-text">{user.email}</td>
                    <td className="px-6 py-4">
                      <select
                        value={user.roleId}
                        onChange={(e) => handleUserRoleChange(user.id, e.target.value)}
                        className="px-2.5 py-1.5 bg-secondary/80 border border-border/80 rounded-md text-[11px] text-primary-text focus:outline-none focus:border-primary/50 cursor-pointer font-semibold"
                      >
                        <option value="customer">Customer (No Admin Access)</option>
                        {roles.map(role => (
                          <option key={role.id} value={role.id}>{role.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-muted-text">{user.joined}</td>
                    <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                      {user.roleId !== 'customer' ? (
                        <button
                          onClick={() => handleUserRoleChange(user.id, 'customer')}
                          className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-wider rounded border border-red-500/20 smooth-transition focus:outline-none"
                        >
                          Revoke Access
                        </button>
                      ) : (
                        <span className="text-[10px] text-muted-text italic mr-2">No Access</span>
                      )}
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-1.5 text-muted-text hover:text-destructive smooth-transition rounded-md hover:bg-secondary/40 focus:outline-none"
                        title="Remove User"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-xs text-muted-text uppercase tracking-wider">
                      No matching staff members found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Create/Edit Role */}
        <AnimatePresence>
          {isRoleModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              {/* Backdrop */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsRoleModalOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />

              {/* Dialog Content */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative glass-card border border-border/80 bg-neutral-900 w-full max-w-lg overflow-hidden shadow-xl"
              >
                <div className="p-6 border-b border-border/60 flex items-center justify-between">
                  <h3 className="text-sm font-extrabold uppercase tracking-widest text-primary-text">
                    {editingRole ? 'Edit Role Details' : 'Create Access Role'}
                  </h3>
                  <button 
                    onClick={() => setIsRoleModalOpen(false)}
                    className="p-1.5 hover:bg-secondary/40 rounded-lg text-muted-text hover:text-primary-text smooth-transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveRole} className="p-6 space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-text mb-1.5">
                      Role Name
                    </label>
                    <input
                      type="text"
                      value={roleName}
                      onChange={(e) => setRoleName(e.target.value)}
                      placeholder="e.g. Sales Assistant"
                      className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-xs text-primary-text focus:outline-none focus:border-primary/50"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-text mb-1.5">
                      Description
                    </label>
                    <textarea
                      value={roleDescription}
                      onChange={(e) => setRoleDescription(e.target.value)}
                      placeholder="Give a brief summary of who this role is for and what they do."
                      rows={3}
                      className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-xs text-primary-text focus:outline-none focus:border-primary/50 resize-none"
                    />
                  </div>

                  {/* Permissions Selection Grid */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-text mb-2">
                      Assign Access Privileges
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1">
                      {AVAILABLE_PERMISSIONS.map((perm) => {
                        const isChecked = selectedPermissions.includes(perm.id)
                        return (
                          <div 
                            key={perm.id}
                            onClick={() => togglePermission(perm.id)}
                            className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer smooth-transition ${
                              isChecked 
                                ? 'bg-primary/5 border-primary text-primary-text' 
                                : 'bg-secondary/20 border-border hover:border-border/80 text-muted-text'
                            }`}
                          >
                            <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 mt-0.5 ${
                              isChecked ? 'bg-primary border-primary' : 'border-border'
                            }`}>
                              {isChecked && <Check className="w-2.5 h-2.5 text-white" />}
                            </div>
                            <div>
                              <p className="text-[10px] font-extrabold uppercase tracking-wide leading-tight">
                                {perm.label}
                              </p>
                              <p className="text-[9px] text-muted-text leading-tight mt-0.5">
                                {perm.description}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Submit Actions */}
                  <div className="pt-4 border-t border-border/60 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsRoleModalOpen(false)}
                      className="px-4 py-2 border border-border hover:bg-secondary/40 text-primary-text text-[10px] font-bold rounded-lg uppercase tracking-wider smooth-transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-[10px] font-bold rounded-lg uppercase tracking-wider smooth-transition"
                    >
                      Save Role
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Modal: Add Staff User */}
        <AnimatePresence>
          {isUserModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              {/* Backdrop */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsUserModalOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />

              {/* Dialog Content */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative glass-card border border-border/80 bg-neutral-900 w-full max-w-md overflow-hidden shadow-xl"
              >
                <div className="p-6 border-b border-border/60 flex items-center justify-between">
                  <h3 className="text-sm font-extrabold uppercase tracking-widest text-primary-text flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-primary" /> Add Staff Member
                  </h3>
                  <button 
                    onClick={() => setIsUserModalOpen(false)}
                    className="p-1.5 hover:bg-secondary/40 rounded-lg text-muted-text hover:text-primary-text smooth-transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleAddUser} className="p-6 space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-text mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      placeholder="e.g. Aryan Srivastava"
                      className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-xs text-primary-text focus:outline-none focus:border-primary/50"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-text mb-1.5">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      placeholder="e.g. srivastava.coc@gmail.com"
                      className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-xs text-primary-text focus:outline-none focus:border-primary/50"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-text mb-1.5">
                      Initial Access Role
                    </label>
                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value)}
                      className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-xs text-primary-text focus:outline-none focus:border-primary/50 cursor-pointer font-semibold"
                    >
                      <option value="customer">Customer (No Admin Access)</option>
                      {roles.map(role => (
                        <option key={role.id} value={role.id}>{role.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Submit Actions */}
                  <div className="pt-4 border-t border-border/60 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsUserModalOpen(false)}
                      className="px-4 py-2 border border-border hover:bg-secondary/40 text-primary-text text-[10px] font-bold rounded-lg uppercase tracking-wider smooth-transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-[10px] font-bold rounded-lg uppercase tracking-wider smooth-transition"
                    >
                      Add Member
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </AdminLayout>
  )
}
