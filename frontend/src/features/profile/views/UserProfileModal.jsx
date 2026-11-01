import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  User, Mail, Building, Briefcase, Target, Shield, Check, 
  X, Loader2, Sparkles, AlertCircle, RefreshCw
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../auth/models/authStore'
import { authAPI } from '../../../shared/utils/api'

const IT_ROLES = [
  "IT Corporate Legal Counsel",
  "DevOps / Cloud Infrastructure Lead",
  "Software Architect / Tech Lead",
  "IT Procurement & Vendor Manager",
  "Chief Information Security Officer (CISO)",
  "Data Protection & Compliance Officer",
  "Other Technology Role"
]

const IT_PURPOSES = [
  "SaaS & Cloud Vendor SLAs (99.9% uptime)",
  "DPDP Act 2023 & CERT-In Cyber Compliance",
  "Software IP, Escrow & Source Code Licensing",
  "IT Employment & Confidentiality (NDA)",
  "General Technology Vendor Contracts"
]

export default function UserProfileModal({ isOpen, onClose }) {
  const { user, login } = useAuthStore()
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [designation, setDesignation] = useState('')
  const [purpose, setPurpose] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) {
      setName(user.name || '')
      setCompany(user.company || '')
      setDesignation(user.designation || user.role_designation || IT_ROLES[0])
      setPurpose(user.purpose || IT_PURPOSES[0])
    }
  }, [user, isOpen])

  if (!isOpen) return null

  const isAdmin = user?.role === 'admin'
  const usedUploads = user?.daily_doc_count || 0
  const maxUploads = 5
  const percentUsed = isAdmin ? 0 : Math.min(100, (usedUploads / maxUploads) * 100)

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    const tid = toast.loading('Saving profile changes…')
    try {
      const updated = await authAPI.updateProfile({
        name: name.trim(),
        company: company.trim(),
        role_designation: designation,
        designation: designation,
        purpose: purpose
      })

      // Update store
      await login({ ...user, ...updated })
      toast.success('Profile updated successfully!', { id: tid })
      onClose()
    } catch (err) {
      toast.error(err.message || 'Failed to update profile', { id: tid })
    } finally {
      setSaving(false)
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.22 }}
          className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl relative overflow-hidden font-poppins"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-neutral-800 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-bold text-lg font-outfit shadow-md shadow-orange-500/20">
                {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <h3 className="font-outfit text-xl font-bold text-gray-900 dark:text-white">
                  Profile Management
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-poppins">
                  Manage your personal details and IT role designation
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 dark:hover:text-white p-1 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Quota Card */}
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300 font-outfit uppercase tracking-wide">
                  Account Plan &amp; Quota
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isAdmin ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-orange-500/10 text-orange-500 border border-orange-500/20'}`}>
                  {isAdmin ? 'Administrator (Unlimited)' : 'Standard User Plan'}
                </span>
              </div>
              <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 font-poppins">
                {isAdmin ? 'Unlimited Uploads' : `${usedUploads} / 5 used`}
              </span>
            </div>

            {!isAdmin && (
              <>
                <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-neutral-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${usedUploads >= 5 ? 'bg-red-500' : 'bg-orange-500'}`}
                    style={{ width: `${percentUsed}%` }}
                  />
                </div>
                <p className="text-[10px] text-gray-500 mt-2 font-poppins">
                  Your daily limit resets automatically every 24 hours (or an Admin can reset it from the Admin Panel).
                </p>
              </>
            )}
          </div>

          {/* Edit Form */}
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            {/* Email (Read only) */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 font-outfit">Email Address (Registered)</label>
              <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-800 bg-gray-100/70 dark:bg-neutral-950/70 text-gray-500 text-xs font-poppins">
                <Mail size={14} />
                <span className="truncate">{user?.email || 'N/A'}</span>
              </div>
            </div>

            {/* Name */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 font-outfit">Full Name</label>
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-neutral-800 bg-transparent focus-within:border-orange-500">
                <User size={14} className="text-gray-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                  required
                  className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white outline-none font-poppins"
                />
              </div>
            </div>

            {/* Company */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 font-outfit">Company / Organization</label>
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-neutral-800 bg-transparent focus-within:border-orange-500">
                <Building size={14} className="text-gray-400" />
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Company Name"
                  className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white outline-none font-poppins"
                />
              </div>
            </div>

            {/* IT Role / Designation */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 font-outfit">IT Role / Designation</label>
              <select
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-gray-900 dark:text-white text-xs font-poppins outline-none focus:border-orange-500 cursor-pointer"
              >
                {IT_ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            {/* Purpose */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 font-outfit">Primary Legal Focus</label>
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-gray-900 dark:text-white text-xs font-poppins outline-none focus:border-orange-500 cursor-pointer"
              >
                {IT_PURPOSES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-neutral-800 mt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-gray-500 hover:text-gray-900 dark:hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold font-outfit transition-all flex items-center gap-1.5 shadow-md shadow-orange-500/20 disabled:opacity-50"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <>Save Changes <Check size={14} /></>}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

