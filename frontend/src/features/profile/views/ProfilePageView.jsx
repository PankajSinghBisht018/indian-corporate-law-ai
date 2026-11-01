import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  User, Mail, Building, Briefcase, Target, Shield, Check, 
  Loader2, Sparkles, ShieldCheck, Clock, ArrowRight, Save
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

const fadeItem = (i) => ({
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }
})

export default function ProfilePageView() {
  const { user, login } = useAuthStore()
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [designation, setDesignation] = useState('')
  const [purpose, setPurpose] = useState('')
  const [saving, setSaving] = useState(false)

  const [hoursLeft, setHoursLeft] = useState(24)
  const [minsLeft, setMinsLeft] = useState(0)

  useEffect(() => {
    const calc = () => {
      const now = new Date()
      const nextMidnightUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0))
      const diff = nextMidnightUTC - now
      setHoursLeft(Math.floor(diff / (1000 * 60 * 60)))
      setMinsLeft(Math.floor((diff / (1000 * 60)) % 60))
    }
    calc()
    const t = setInterval(calc, 60000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (user) {
      setName(user.name || '')
      setCompany(user.company || '')
      setDesignation(user.designation || user.role_designation || IT_ROLES[0])
      setPurpose(user.purpose || IT_PURPOSES[0])
    }
  }, [user])

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

      await login({ ...user, ...updated })
      toast.success('Profile updated successfully!', { id: tid })
    } catch (err) {
      toast.error(err.message || 'Failed to update profile', { id: tid })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in font-poppins pb-16">
      
      {/* Header */}
      <motion.div {...fadeItem(0)}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-outfit font-extrabold text-gray-900 dark:text-white tracking-tight">
              Profile Management
            </h1>
            <p className="text-gray-500 dark:text-gray-400 font-poppins text-sm mt-1">
              Manage your personal credentials, corporate IT designation, and review contract analysis quotas.
            </p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ── Left Column: Profile Card & Usage Quota ── */}
        <div className="space-y-6">
          
          {/* User Overview Card */}
          <motion.div {...fadeItem(1)} className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-md border border-gray-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-extrabold text-3xl font-outfit shadow-lg shadow-orange-500/20 mb-4">
                {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <h2 className="font-outfit text-xl font-bold text-gray-900 dark:text-white">
                {user?.name || user?.email?.split('@')[0] || 'User'}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-poppins mt-0.5 mb-3">
                {user?.email}
              </p>
              
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold font-outfit mb-4 capitalize">
                {isAdmin ? (
                  <span className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 px-3 py-1 rounded-full flex items-center gap-1.5">
                    <ShieldCheck size={13} /> Administrator
                  </span>
                ) : (
                  <span className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 px-3 py-1 rounded-full flex items-center gap-1.5">
                    <User size={13} /> IT Legal User
                  </span>
                )}
              </div>

              <div className="w-full border-t border-gray-100 dark:border-neutral-800 pt-4 flex items-center justify-between text-xs">
                <span className="text-gray-500 dark:text-gray-400 font-medium">Status</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  Active &amp; Verified
                </span>
              </div>
            </div>
          </motion.div>

          {/* Usage & Quota Card */}
          <motion.div {...fadeItem(2)} className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-md border border-gray-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm">
            <h3 className="font-outfit text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Clock size={16} className="text-orange-500" />
              Document Upload Quota
            </h3>

            {isAdmin ? (
              <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/20">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-green-700 dark:text-green-400 font-outfit uppercase tracking-wider">
                    Admin Access
                  </span>
                  <span className="text-xs font-extrabold text-green-600 dark:text-green-400 font-poppins">
                    Unlimited
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 font-poppins leading-relaxed">
                  Administrator accounts enjoy unmetered contract uploads and full IT governance capabilities.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 font-outfit">
                    Daily Usage
                  </span>
                  <span className="text-sm font-bold text-orange-500 font-poppins">
                    {usedUploads} / {maxUploads} documents
                  </span>
                </div>

                <div className="h-2 w-full bg-gray-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ease-out ${
                      usedUploads >= maxUploads ? 'bg-red-500' : 'bg-orange-500'
                    }`}
                    style={{ width: `${percentUsed}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-gray-400 dark:text-gray-500 font-poppins pt-1">
                  <span>Standard 5 docs daily</span>
                  <span>Resets in {hoursLeft}h {minsLeft}m</span>
                </div>

                {usedUploads >= maxUploads && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-poppins leading-relaxed">
                    You have reached the daily 5-document limit. Uploads reset at midnight UTC, or ask your administrator to reset your quota.
                  </div>
                )}
              </div>
            )}
          </motion.div>

        </div>

        {/* ── Right Column: Edit Profile Form ── */}
        <motion.div {...fadeItem(3)} className="lg:col-span-2">
          <div className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-md border border-gray-200 dark:border-neutral-800 rounded-3xl p-6 md:p-8 shadow-sm">
            <h2 className="font-outfit text-xl font-bold text-gray-900 dark:text-white mb-1">
              Account Details
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-poppins mb-6">
              Update your personal information and IT corporate department settings.
            </p>

            <form onSubmit={handleSave} className="space-y-5">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Full Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 font-outfit">
                    Full Name
                  </label>
                  <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 transition-all">
                    <User size={16} className="text-gray-400 shrink-0" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your Full Name"
                      required
                      className="flex-1 bg-transparent border-none text-gray-900 dark:text-white outline-none text-sm font-poppins placeholder:text-gray-400"
                    />
                  </div>
                </div>

                {/* Email (Read-Only) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 font-outfit">
                    Email Address
                  </label>
                  <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-800 bg-gray-100/60 dark:bg-neutral-900/30 opacity-75 cursor-not-allowed">
                    <Mail size={16} className="text-gray-400 shrink-0" />
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="flex-1 bg-transparent border-none text-gray-500 dark:text-gray-400 outline-none text-sm font-poppins cursor-not-allowed"
                    />
                  </div>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 font-poppins">
                    Primary login identity
                  </span>
                </div>
              </div>

              {/* Company / Organization */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 font-outfit">
                  Company / Organization
                </label>
                <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 transition-all">
                  <Building size={16} className="text-gray-400 shrink-0" />
                  <input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. Infotech Global Solutions"
                    required
                    className="flex-1 bg-transparent border-none text-gray-900 dark:text-white outline-none text-sm font-poppins placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* IT Role / Designation Dropdown */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 font-outfit">
                  IT Department Designation / Role
                </label>
                <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 focus-within:border-orange-500 transition-all">
                  <Briefcase size={16} className="text-gray-400 shrink-0" />
                  <select
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="flex-1 bg-transparent border-none text-gray-900 dark:text-white outline-none text-sm font-poppins cursor-pointer"
                  >
                    {IT_ROLES.map((role) => (
                      <option key={role} value={role} className="bg-white dark:bg-neutral-900 text-gray-900 dark:text-white">
                        {role}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Primary IT Legal Purpose Dropdown */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 font-outfit">
                  Primary IT Legal Use Case / Purpose
                </label>
                <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/50 focus-within:border-orange-500 transition-all">
                  <Target size={16} className="text-gray-400 shrink-0" />
                  <select
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    className="flex-1 bg-transparent border-none text-gray-900 dark:text-white outline-none text-sm font-poppins cursor-pointer"
                  >
                    {IT_PURPOSES.map((p) => (
                      <option key={p} value={p} className="bg-white dark:bg-neutral-900 text-gray-900 dark:text-white">
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-outfit font-bold text-sm shadow-md shadow-orange-500/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Saving…</span>
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </motion.div>

      </div>
    </div>
  )
}

