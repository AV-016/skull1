'use client'

import { motion } from 'framer-motion'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { Edit2, Trash2, Shield } from 'lucide-react'

export default function AdminUsers() {
  const users = [
    { id: 1, name: 'John Doe', email: 'john@example.com', role: 'customer', joined: '2024-01-01' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'admin', joined: '2024-01-05' },
    { id: 3, name: 'Mike Johnson', email: 'mike@example.com', role: 'customer', joined: '2024-01-15' },
  ]

  return (
    <AdminLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <div>
          <h1 className="heading-2">Users</h1>
          <p className="text-muted">Manage user accounts and permissions</p>
        </div>

        <div className="glass-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-6 py-4 text-left text-sm font-semibold text-muted">Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-muted">Email</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-muted">Role</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-muted">Joined</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-white/10 hover:bg-white/5">
                  <td className="px-6 py-4">{user.name}</td>
                  <td className="px-6 py-4 text-muted">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      user.role === 'admin' ? 'bg-purple-500/20 text-purple-300' : 'bg-blue-500/20 text-blue-300'
                    }`}>
                      {user.role === 'admin' ? <Shield className="w-4 h-4 inline mr-1" /> : null}
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted">{user.joined}</td>
                  <td className="px-6 py-4 flex gap-2">
                    <button className="p-2 hover:bg-white/10 rounded"><Edit2 className="w-4 h-4" /></button>
                    <button className="p-2 hover:bg-white/10 rounded text-destructive"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </AdminLayout>
  )
}
