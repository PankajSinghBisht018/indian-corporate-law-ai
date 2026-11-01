import { useState } from 'react'
import { motion } from 'framer-motion'
import { RotateCcw, Shield, ShieldAlert, User, CheckCircle2, Trash2 } from 'lucide-react'
import { useUIStore } from '../../../shared/store/uiStore'
import { adminAPI } from '../../../shared/utils/api'
import toast from 'react-hot-toast'

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString()
}

export default function AdminUsers({ users = [], setSelectedUser, fetchData }) {
  const { setPage } = useUIStore()
  const [busyId, setBusyId] = useState(null)

  const handleResetLimit = async (e, userId) => {
    e.stopPropagation()
    setBusyId(userId)
    const tid = toast.loading('Resetting user document limit…')
    try {
      const res = await adminAPI.resetLimit(userId)
      toast.success(res.message || 'User upload limit reset to 0!', { id: tid })
      fetchData?.()
    } catch (err) {
      toast.error(err.message || 'Failed to reset limit', { id: tid })
    } finally {
      setBusyId(null)
    }
  }

  const handleToggleRole = async (e, userId) => {
    e.stopPropagation()
    setBusyId(userId)
    const tid = toast.loading('Updating user access role…')
    try {
      const res = await adminAPI.toggleRole(userId)
      toast.success(res.message || 'Role updated!', { id: tid })
      fetchData?.()
    } catch (err) {
      toast.error(err.message || 'Failed to toggle role', { id: tid })
    } finally {
      setBusyId(null)
    }
  }

  const handleDeleteUser = async (e, u) => {
    e.stopPropagation()
    if (u.email?.toLowerCase() === 'admin@legalbuddy.com') {
      return toast.error('Master admin account cannot be deleted.')
    }
    const confirmed = window.confirm(`Permanently delete user ${u.email}? All associated documents will also be removed.`)
    if (!confirmed) return

    setBusyId(u.id)
    const tid = toast.loading(`Deleting ${u.email}…`)
    try {
      const res = await adminAPI.deleteUser(u.id)
      toast.success(res.message || 'User deleted successfully!', { id: tid })
      fetchData?.()
    } catch (err) {
      toast.error(err.message || 'Failed to delete user', { id: tid })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in">
      <div>
        <h1 className="text-3xl font-outfit font-extrabold text-gray-900 dark:text-white tracking-tight">User Management</h1>
        <p className="text-gray-500 dark:text-gray-400 font-poppins mt-2">
          Manage platform accounts, reset upload limits, and assign Admin privileges.
        </p>
      </div>
      
      <div className="bg-white/60 dark:bg-neutral-900/40 backdrop-blur-md rounded-2xl border border-gray-200 dark:border-neutral-800 overflow-hidden shadow-lg shadow-black/5">
        <div className="overflow-x-auto">
          {users.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400 font-poppins text-sm">No registered users found.</div>
          ) : (
            <table className="w-full text-left font-poppins text-sm">
              <thead className="bg-gray-50 dark:bg-neutral-900/50 text-gray-500 dark:text-gray-400 font-semibold border-b border-gray-200 dark:border-neutral-800 text-xs uppercase tracking-wider font-outfit">
                <tr>
                  <th className="px-6 py-4">User Email</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Upload Usage</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-neutral-800">
                {users.map((u) => {
                  const isAdmin = u.role === 'admin' || u.is_unlimited === true
                  const isBusy = busyId === u.id

                  return (
                    <motion.tr 
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={u.id}
                      className="hover:bg-gray-50 dark:hover:bg-neutral-800/30 transition-colors cursor-pointer"
                      onClick={() => { setSelectedUser(u); setPage('admin_user_detail'); }}
                    >
                      <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span>{u.email}</span>
                            {u.auth_provider === 'google' && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 font-bold uppercase">Google</span>
                            )}
                          </div>
                          <span className="text-xs text-gray-400 dark:text-gray-500 font-normal">
                            {u.company || 'IT Department'} · Registered: {formatDate(u.created_at)}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {isAdmin ? (
                          <span className="inline-flex items-center gap-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[11px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider font-outfit">
                            <Shield size={12} /> Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[11px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider font-outfit">
                            <User size={12} /> Standard
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {isAdmin ? (
                          <span className="text-xs font-bold text-green-600 dark:text-green-400 font-outfit">
                            Unlimited Uploads
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold font-outfit ${u.daily_doc_count >= 5 ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}`}>
                              {u.daily_doc_count || 0} / 5 docs used
                            </span>
                            {u.daily_doc_count >= 5 && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-500/10 text-red-500 font-bold uppercase">Limit Reached</span>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          {!isAdmin && (
                            <button
                              disabled={isBusy}
                              onClick={(e) => handleResetLimit(e, u.id)}
                              className="px-3 py-1.5 rounded-lg border border-orange-500/30 text-orange-500 hover:bg-orange-500/10 text-xs font-semibold font-outfit transition-colors flex items-center gap-1 disabled:opacity-50"
                              title="Reset user upload counter to 0"
                            >
                              <RotateCcw size={12} /> Reset Limit (0/5)
                            </button>
                          )}

                          <button
                            disabled={isBusy}
                            onClick={(e) => handleToggleRole(e, u.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-outfit transition-colors flex items-center gap-1 disabled:opacity-50 ${
                              isAdmin 
                                ? 'border border-gray-300 dark:border-neutral-700 text-gray-500 hover:bg-gray-100 dark:hover:bg-neutral-800' 
                                : 'bg-purple-600 hover:bg-purple-700 text-white'
                            }`}
                            title={isAdmin ? "Demote to Standard User" : "Grant Unlimited Admin Access"}
                          >
                            <Shield size={12} /> {isAdmin ? 'Make User' : 'Grant Unlimited'}
                          </button>

                          {u.email?.toLowerCase() !== 'admin@legalbuddy.com' && (
                            <button
                              disabled={isBusy}
                              onClick={(e) => handleDeleteUser(e, u)}
                              className="p-2 rounded-lg border border-red-500/30 text-red-500 hover:bg-red-500/10 text-xs transition-colors flex items-center justify-center disabled:opacity-50"
                              title={`Permanently delete user ${u.email}`}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
