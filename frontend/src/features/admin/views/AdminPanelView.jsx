import { useState, useEffect } from 'react'
import { Loader2, ShieldAlert } from 'lucide-react'
import toast from 'react-hot-toast'
import { adminAPI } from '../../../shared/utils/api'
import { useUIStore } from '../../../shared/store/uiStore'
import { useAuthStore } from '../../auth/models/authStore'

import AdminOverview from './AdminOverviewView'
import AdminUsers from './AdminUsersView'
import AdminUserDetail from './AdminUserDetailView'

export default function AdminPanel() {
  const { user } = useAuthStore()
  const [users, setUsers] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState(null)
  
  const { page } = useUIStore()

  if (user?.role !== 'admin') {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
          <ShieldAlert className="text-red-500 w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold font-outfit text-gray-900 dark:text-white">Access Denied</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-poppins max-w-md mt-1 mb-4">
          This section is restricted to System Administrators. Sign in with <span className="font-mono text-xs text-orange-500">admin@legalbuddy.com</span> at <a href="/admin" className="underline font-semibold">/admin</a> to access governance tools.
        </p>
      </div>
    )
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const [usersData, statsData] = await Promise.all([
        adminAPI.getAllUsers(),
        adminAPI.getStats()
      ])
      setUsers(usersData || [])
      setStats(statsData)
    } catch (err) {
      toast.error('Failed to load admin data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <Loader2 className="animate-spin text-orange-500 w-8 h-8" />
      </div>
    )
  }

  return (
    <div className="h-full bg-transparent overflow-hidden animate-in fade-in duration-500 flex flex-col min-h-0">
      <div className="flex-1 min-h-0 bg-gray-50/30 dark:bg-black/10 overflow-y-auto">
        {page === 'admin_overview' && <AdminOverview stats={stats} />}
        {(page === 'admin_users' || page === 'admin_agents') && (
          <AdminUsers users={users} setSelectedUser={setSelectedUser} fetchData={fetchData} />
        )}
        {(page === 'admin_user_detail' || page === 'admin_agent_detail') && (
          <AdminUserDetail selectedUser={selectedUser} fetchData={fetchData} />
        )}
      </div>
    </div>
  )
}
