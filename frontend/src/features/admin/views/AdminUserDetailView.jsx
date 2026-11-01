import { Activity, Shield, ArrowLeft, RotateCcw, ShieldCheck, User, Trash2 } from 'lucide-react'
import { useUIStore } from '../../../shared/store/uiStore'
import { adminAPI } from '../../../shared/utils/api'
import toast from 'react-hot-toast'
import { useState } from 'react'

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString()
}

export default function AdminUserDetail({ selectedUser, fetchData }) {
  const { setPage } = useUIStore()
  const [actionLoading, setActionLoading] = useState(false)

  const handleResetLimit = async (id) => {
    setActionLoading(true)
    const tid = toast.loading('Resetting document upload limit…')
    try {
      const res = await adminAPI.resetLimit(id)
      toast.success(res.message || 'User limit reset to 0! 5 fresh uploads available.', { id: tid })
      fetchData?.()
    } catch (err) {
      toast.error(err.message || 'Failed to reset limit', { id: tid })
    } finally {
      setActionLoading(false)
    }
  }

  const handleToggleRole = async (id) => {
    setActionLoading(true)
    const tid = toast.loading('Updating user access role…')
    try {
      const res = await adminAPI.toggleRole(id)
      toast.success(res.message || 'Role updated!', { id: tid })
      fetchData?.()
    } catch (err) {
      toast.error(err.message || 'Failed to update role', { id: tid })
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteUser = async (u) => {
    if (u.email?.toLowerCase() === 'admin@legalbuddy.com') {
      return toast.error('Master admin account cannot be deleted.')
    }
    const confirmed = window.confirm(`Permanently delete user ${u.email}? All associated documents will also be removed.`)
    if (!confirmed) return

    setActionLoading(true)
    const tid = toast.loading(`Deleting ${u.email}…`)
    try {
      const res = await adminAPI.deleteUser(u.id)
      toast.success(res.message || 'User deleted successfully!', { id: tid })
      fetchData?.()
      setPage('admin_users')
    } catch (err) {
      toast.error(err.message || 'Failed to delete user', { id: tid })
    } finally {
      setActionLoading(false)
    }
  }

  if (!selectedUser) return null
  const isAdmin = selectedUser.role === 'admin' || selectedUser.is_unlimited === true

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => setPage('admin_users')} 
          className="p-2 hover:bg-gray-200 dark:hover:bg-neutral-800 rounded-full transition-colors text-gray-500"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-outfit font-extrabold text-gray-900 dark:text-white tracking-tight">User Details</h1>
          <p className="text-gray-500 dark:text-gray-400 font-poppins mt-1">ID: {selectedUser.id}</p>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="bg-white/60 dark:bg-neutral-900/40 backdrop-blur-md rounded-3xl border border-gray-200 dark:border-neutral-800 p-8 shadow-lg shadow-black/5">
          <h3 className="font-outfit font-bold text-lg text-gray-900 dark:text-white mb-6">Profile &amp; Upload Quota</h3>
          <div className="space-y-4 font-poppins text-sm">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-4 border-b border-gray-100 dark:border-neutral-800 pb-3">
              <span className="text-gray-500 shrink-0">Email Address</span>
              <span className="font-medium text-gray-900 dark:text-white text-left sm:text-right break-all">{selectedUser.email}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-4 border-b border-gray-100 dark:border-neutral-800 pb-3">
              <span className="text-gray-500 shrink-0">Account Level</span>
              <span className="font-medium text-gray-900 dark:text-white uppercase text-left sm:text-right font-outfit">
                {isAdmin ? (
                  <span className="px-2.5 py-1 rounded bg-purple-500/10 text-purple-600 font-bold flex items-center gap-1">
                    <ShieldCheck size={14} /> Admin (Unlimited Uploads)
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded bg-blue-500/10 text-blue-600 font-bold flex items-center gap-1">
                    <User size={14} /> Standard User (5 Document Limit)
                  </span>
                )}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-4 border-b border-gray-100 dark:border-neutral-800 pb-3">
              <span className="text-gray-500 shrink-0">Company / IT Dept</span>
              <span className="font-medium text-gray-900 dark:text-white capitalize text-left sm:text-right">{selectedUser.company || 'IT Department'}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-4 border-b border-gray-100 dark:border-neutral-800 pb-3">
              <span className="text-gray-500 shrink-0">Authentication Type</span>
              <span className="font-medium text-gray-900 dark:text-white uppercase text-left sm:text-right text-xs">
                {selectedUser.auth_provider === 'google' ? 'Google Auth' : 'Email & Password'}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-4 pb-3">
              <span className="text-gray-500 shrink-0 flex items-center gap-2"><Activity size={14}/> Upload Usage</span>
              <span className="font-bold text-gray-900 dark:text-white text-left sm:text-right font-outfit">
                {isAdmin ? (
                  <span className="text-green-500">Unlimited Uploads</span>
                ) : (
                  <span className={selectedUser.daily_doc_count >= 5 ? 'text-red-500' : 'text-orange-500'}>
                    {selectedUser.daily_doc_count || 0} / 5 documents used
                  </span>
                )}
              </span>
            </div>
          </div>
          
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-neutral-800 flex flex-wrap justify-end gap-3">
            {!isAdmin && (
              <button
                disabled={actionLoading}
                onClick={() => handleResetLimit(selectedUser.id)}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2.5 rounded-xl text-xs font-semibold tracking-wide shadow-md shadow-orange-500/20 transition-all disabled:opacity-50 flex items-center gap-1.5 font-outfit"
              >
                <RotateCcw size={14} /> Reset Limit to 0 (Allow 5 Uploads)
              </button>
            )}

            <button
              disabled={actionLoading}
              onClick={() => handleToggleRole(selectedUser.id)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-xl text-xs font-semibold tracking-wide shadow-md shadow-purple-600/20 transition-all disabled:opacity-50 flex items-center gap-1.5 font-outfit"
            >
              <Shield size={14} /> {isAdmin ? 'Demote to Standard User (5 Limit)' : 'Grant Unlimited Admin Access'}
            </button>

            {selectedUser.email?.toLowerCase() !== 'admin@legalbuddy.com' && (
              <button
                disabled={actionLoading}
                onClick={() => handleDeleteUser(selectedUser)}
                className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/30 px-5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all disabled:opacity-50 flex items-center gap-1.5 font-outfit"
              >
                <Trash2 size={14} /> Delete Account
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
