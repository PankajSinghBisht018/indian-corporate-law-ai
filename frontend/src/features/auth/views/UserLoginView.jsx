import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Mail, Lock, Eye, EyeOff, ArrowRight, Shield, Sun, Moon, 
  Loader2, Cpu, Terminal, FileCode2, User, Building, Briefcase, Target
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../models/authStore'
import { useUIStore } from '../../../shared/store/uiStore'
import { authAPI } from '../../../shared/utils/api'
import { LegalBuddyLogo } from '../../../shared/ui/LegalBuddyLogo'

const itFeatures = [
  { icon: Terminal,   label: 'DPDP 2023 & IT Act', sub: 'Statutory compliance for Indian corporate tech teams' },
  { icon: FileCode2,  label: 'Tech Clause Detection', sub: 'SLA (99.9%), Source Code Escrow & Software IP' },
  { icon: Shield,     label: 'CERT-In & Cyber Risk', sub: 'Vendor liability & mandatory incident reporting' },
]

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

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { delay, duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
})

export default function UserLoginView() {
  const [tab, setTab] = useState('login') // 'login' | 'signup'
  
  // Form fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [company, setCompany] = useState('')
  const [roleDesignation, setRoleDesignation] = useState(IT_ROLES[0])
  const [purpose, setPurpose] = useState(IT_PURPOSES[0])
  const [showPass, setShowPass] = useState(false)
  const [busy, setBusy] = useState(false)

  // Right panel scroll ref to prevent any upside cut-off
  const rightPanelRef = useRef(null)

  // Google Fallback Modal
  const [showGooglePrompt, setShowGooglePrompt] = useState(false)
  const [googleEmailInput, setGoogleEmailInput] = useState('')

  const { login } = useAuthStore()
  const { theme, toggleTheme, setPage } = useUIStore()

  // Reset scroll to top when switching between login and signup
  useEffect(() => {
    if (rightPanelRef.current) {
      rightPanelRef.current.scrollTop = 0
    }
  }, [tab])

  // Initialize Google Identity Services
  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (clientId && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleCredentialResponse,
        })
      } catch (err) {
        console.warn('Google Identity initialization error:', err)
      }
    }
  }, [])

  // Google credential callback from GIS
  const handleGoogleCredentialResponse = async (response) => {
    const tid = toast.loading('Signing in with Google…')
    try {
      const data = await authAPI.googleAuth({
        credential: response.credential,
        role: 'user'
      })

      login({ 
        access_token: data.access_token, 
        user_id: data.user_id, 
        email: data.email, 
        name: data.name || data.email.split('@')[0], 
        role: 'user' 
      })
      setPage('dashboard')
      toast.success(`Welcome to LegalBuddy, ${data.name || data.email.split('@')[0]}!`, { id: tid })
    } catch (err) {
      toast.error(err.message || 'Google authentication failed', { id: tid })
    }
  }

  // Trigger Google Login
  const triggerGoogleAuth = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (clientId && window.google?.accounts?.id) {
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          setShowGooglePrompt(true)
        }
      })
    } else {
      setShowGooglePrompt(true)
    }
  }

  // Fallback Google Sign-In dialog
  const submitGoogleFallback = async (e) => {
    e.preventDefault()
    if (!googleEmailInput || !googleEmailInput.includes('@')) {
      return toast.error('Please enter a valid Google email address')
    }
    setShowGooglePrompt(false)
    const tid = toast.loading('Signing in with Google account…')
    try {
      const data = await authAPI.googleAuth({
        email: googleEmailInput,
        name: googleEmailInput.split('@')[0],
        role: 'user'
      })

      login({ 
        access_token: data.access_token, 
        user_id: data.user_id, 
        email: data.email, 
        name: data.name || data.email.split('@')[0], 
        role: 'user' 
      })
      setPage('dashboard')
      toast.success(`Welcome to LegalBuddy, ${data.name || data.email.split('@')[0]}!`, { id: tid })
    } catch (err) {
      toast.error(err.message || 'Google login failed', { id: tid })
    }
  }

  // Handle User Submit (Direct Login or Signup — NO OTP)
  const submit = async (e) => {
    e.preventDefault()
    if (!email || !pass) {
      return toast.error('Please fill in email and password')
    }

    setBusy(true)
    const tid = toast.loading(tab === 'signup' ? 'Setting up your LegalBuddy workspace…' : 'Signing in…')
    try {
      if (tab === 'signup') {
        const res = await authAPI.signup({
          email: email.trim().toLowerCase(),
          password: pass,
          name: name.trim() || email.split('@')[0],
          company: company.trim(),
          role_designation: roleDesignation,
          purpose: purpose,
          role: 'user'
        })

        login(res)
        setPage('dashboard')
        localStorage.setItem('lb_new_signup_tour', 'true')
        toast.success(`Account created! Welcome to LegalBuddy, ${res.name || email.split('@')[0]}!`, { id: tid })
      } else {
        const res = await authAPI.login(email.trim().toLowerCase(), pass)
        login(res)
        setPage('dashboard')
        toast.success('Signed in successfully!', { id: tid })
      }
    } catch (err) {
      toast.error(err.message || 'Authentication error', { id: tid })
    } finally {
      setBusy(false)
    }
  }

  const goToAdminPortal = () => {
    window.history.pushState({}, '', '/admin')
    window.location.reload()
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-3 sm:p-4 md:p-6 lg:p-8 bg-gray-50 dark:bg-black relative overflow-x-hidden overflow-y-auto font-poppins selection:bg-orange-500 selection:text-white transition-colors duration-300">
      
      {/* Background Glow Orbs */}
      <div className="absolute rounded-full pointer-events-none blur-[120px] bg-orange-500/10 dark:bg-orange-500/8 w-[550px] h-[550px] -top-32 -left-20 z-0" />
      <div className="absolute rounded-full pointer-events-none blur-[120px] bg-orange-500/8 dark:bg-orange-500/5 w-[500px] h-[500px] -bottom-32 -right-20 z-0" />

      {/* Google Fallback Modal */}
      {showGooglePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-neutral-950 border border-gray-200 dark:border-neutral-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="font-outfit text-lg font-bold text-gray-900 dark:text-white mb-2">
              Sign In with Google Account
            </h3>
            <p className="text-xs text-gray-500 dark:text-neutral-400 font-poppins mb-4">
              Enter your Google email address to log in to your LegalBuddy workspace.
            </p>
            <form onSubmit={submitGoogleFallback} className="flex flex-col gap-3">
              <input
                type="email"
                placeholder="your.email@gmail.com"
                value={googleEmailInput}
                onChange={(e) => setGoogleEmailInput(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900 text-sm text-gray-900 dark:text-white outline-none focus:border-orange-500"
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowGooglePrompt(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-500 hover:text-gray-900 dark:hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-orange-500 text-white rounded-xl hover:bg-orange-600 cursor-pointer shadow-md shadow-orange-500/20"
                >
                  Continue with Google
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-4xl flex flex-col md:flex-row rounded-[24px] md:rounded-[28px] overflow-hidden border border-gray-200 dark:border-neutral-800 shadow-2xl relative z-10 bg-white dark:bg-neutral-950 my-auto"
      >
        {/* ── Left: Branding Panel ── */}
        <div className="hidden md:flex flex-col w-[45%] bg-gray-50 dark:bg-[#070707] border-r border-gray-200 dark:border-neutral-800/80 p-7 lg:p-9 gap-5 relative overflow-hidden shrink-0">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-[radial-gradient(circle,rgba(249,115,22,0.12)_0%,transparent_70%)] pointer-events-none" />

          <motion.div {...fadeUp(0.1)} className="flex items-center gap-3">
            <LegalBuddyLogo size={42} withGlow={true} className="shrink-0" />
            <div>
              <div className="font-outfit text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                LegalBuddy
              </div>
              <div className="text-[10px] text-orange-500 font-semibold font-poppins uppercase tracking-wider">
                AI-Driven Legal Document Summarization
              </div>
            </div>
          </motion.div>

          <motion.div {...fadeUp(0.15)}>
            <h1 className="font-outfit text-2xl lg:text-3xl font-black leading-tight mb-2.5 text-gray-900 dark:text-white tracking-tight">
              AI-Driven Legal<br />
              <span className="bg-gradient-to-br from-gray-900 to-gray-500 dark:from-white dark:to-orange-500 bg-clip-text text-transparent">Document Summarization</span><br />
              <span className="text-sm lg:text-base font-bold text-orange-500 block mt-1 tracking-normal font-outfit">Specialized for IT Corporate Law</span>
            </h1>
            <p className="text-gray-600 dark:text-neutral-400 text-xs lg:text-sm leading-relaxed font-poppins">
              Enterprise legal intelligence built specifically for Information Technology (IT) departments: Master Services Agreements (MSA), SaaS SLAs (99.9%), software licensing, DPDP Act 2023, and CERT-In cyber compliance.
            </p>
          </motion.div>

          <motion.div {...fadeUp(0.2)} className="flex flex-col gap-2">
            {itFeatures.map(({ icon: Icon, label, sub }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 + i * 0.05, duration: 0.3 }}
                className="flex items-center gap-3 py-2 px-3 rounded-xl bg-white dark:bg-neutral-900/60 border border-gray-200/80 dark:border-neutral-800/80"
              >
                <div className="w-7 h-7 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                  <Icon size={13} className="text-orange-500" />
                </div>
                <div>
                  <div className="text-xs font-bold text-gray-900 dark:text-white font-outfit">{label}</div>
                  <div className="text-[10px] text-gray-500 dark:text-neutral-400 mt-px font-poppins">{sub}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            {...fadeUp(0.4)}
            className="mt-auto py-2.5 px-3.5 rounded-xl bg-orange-500/5 border border-orange-500/15 dark:border-neutral-800/80"
          >
            <p className="text-[11px] text-gray-600 dark:text-neutral-400 leading-relaxed font-poppins italic">
              "Enterprise legal workspace for contract analysis and IT compliance."
            </p>
          </motion.div>
        </div>

        {/* ── Right: Auth Form Panel (Never cuts off from top) ── */}
        <div 
          ref={rightPanelRef}
          className="flex-1 bg-white dark:bg-neutral-950 p-6 sm:p-7 md:p-8 lg:p-9 flex flex-col justify-start gap-3.5 relative overflow-y-auto max-h-[85vh] md:max-h-[88vh]"
        >
          {/* Top Controls: Header & Theme Toggle */}
          <div className="flex items-center justify-between shrink-0">
            <span className="text-xs font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-wider font-outfit">
              User Portal
            </span>

            <button
              onClick={toggleTheme}
              className="border border-gray-200 dark:border-neutral-800 bg-gray-100 dark:bg-neutral-900 p-2 rounded-xl cursor-pointer text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white transition-all"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            </button>
          </div>

          {/* Heading */}
          <div className="shrink-0">
            <h2 className="font-outfit text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white mb-0.5 tracking-tight">
              {tab === 'signup' ? 'Create Your Account' : 'Sign in to LegalBuddy'}
            </h2>
            <p className="text-gray-500 dark:text-neutral-400 text-xs font-poppins">
              {tab === 'signup'
                ? 'Fill in your IT role and organization for personalized contract review.'
                : 'Direct access to your contract summaries, DPDP findings, and cyber risk reports.'}
            </p>
          </div>

          {/* Tabs: Sign In / Sign Up */}
          <div className="flex bg-gray-100 dark:bg-neutral-900 p-1 rounded-xl border border-gray-200 dark:border-neutral-800 shrink-0">
            <button
              type="button"
              onClick={() => setTab('login')}
              className={`flex-1 py-1.5 px-2 rounded-lg cursor-pointer text-xs font-semibold transition-all duration-200 font-outfit ${
                tab === 'login' 
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30' 
                  : 'bg-transparent text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setTab('signup')}
              className={`flex-1 py-1.5 px-2 rounded-lg cursor-pointer text-xs font-semibold transition-all duration-200 font-outfit ${
                tab === 'signup' 
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30' 
                  : 'bg-transparent text-gray-600 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* ── Social Auth: Google Only (Users Only) ── */}
          <div className="flex flex-col gap-2 shrink-0">
            <button
              type="button"
              onClick={triggerGoogleAuth}
              className="w-full flex items-center justify-center gap-2.5 py-2.5 px-3 rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:bg-gray-100 dark:hover:bg-neutral-800 dark:hover:border-neutral-700 text-gray-800 dark:text-white font-outfit font-semibold text-xs transition-colors duration-150 shadow-sm cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="flex items-center gap-3 my-0.5">
              <div className="flex-1 h-px bg-gray-200 dark:bg-neutral-800" />
              <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 dark:text-neutral-500 font-outfit">or with email</span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-neutral-800" />
            </div>
          </div>

          {/* Form */}
          <form onSubmit={submit} className="flex flex-col gap-2.5 sm:gap-3">
            {/* If Signup: Full Name */}
            {tab === 'signup' && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-700 dark:text-neutral-300 font-outfit">Full Name</label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 transition-all">
                  <User size={15} className="text-gray-400 dark:text-neutral-500 shrink-0" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Aditi Verma"
                    required
                    className="flex-1 bg-transparent border-none text-gray-900 dark:text-white outline-none text-xs sm:text-sm font-poppins placeholder:text-gray-400 dark:placeholder:text-neutral-500"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-700 dark:text-neutral-300 font-outfit">Email Address</label>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 transition-all">
                <Mail size={15} className="text-gray-400 dark:text-neutral-500 shrink-0" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  className="flex-1 bg-transparent border-none text-gray-900 dark:text-white outline-none text-xs sm:text-sm font-poppins placeholder:text-gray-400 dark:placeholder:text-neutral-500"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-700 dark:text-neutral-300 font-outfit">Password</label>
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 transition-all">
                <Lock size={15} className="text-gray-400 dark:text-neutral-500 shrink-0" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="flex-1 bg-transparent border-none text-gray-900 dark:text-white outline-none text-xs sm:text-sm font-poppins placeholder:text-gray-400 dark:placeholder:text-neutral-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Extra IT onboarding fields if Signup */}
            {tab === 'signup' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex flex-col gap-2.5 pt-0.5">
                {/* Company Name */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-700 dark:text-neutral-300 font-outfit">Company / Organization</label>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 transition-all">
                    <Building size={14} className="text-gray-400 dark:text-neutral-500 shrink-0" />
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="TechCorp Innovations Pvt Ltd"
                      className="flex-1 bg-transparent border-none text-gray-900 dark:text-white outline-none text-xs sm:text-sm font-poppins placeholder:text-gray-400 dark:placeholder:text-neutral-500"
                    />
                  </div>
                </div>

                {/* IT Role / Designation Dropdown */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-700 dark:text-neutral-300 font-outfit flex items-center gap-1.5">
                    <Briefcase size={12} className="text-orange-500" /> IT Role / Department Designation
                  </label>
                  <select
                    value={roleDesignation}
                    onChange={(e) => setRoleDesignation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900 text-gray-900 dark:text-white text-xs font-poppins outline-none focus:border-orange-500 cursor-pointer"
                  >
                    {IT_ROLES.map((r) => (
                      <option key={r} value={r} className="bg-white dark:bg-neutral-900 text-gray-900 dark:text-white">{r}</option>
                    ))}
                  </select>
                </div>

                {/* Primary Legal Purpose */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-700 dark:text-neutral-300 font-outfit flex items-center gap-1.5">
                    <Target size={12} className="text-orange-500" /> Primary Legal Intelligence Use Case
                  </label>
                  <select
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900 text-gray-900 dark:text-white text-xs font-poppins outline-none focus:border-orange-500 cursor-pointer"
                  >
                    {IT_PURPOSES.map((p) => (
                      <option key={p} value={p} className="bg-white dark:bg-neutral-900 text-gray-900 dark:text-white">{p}</option>
                    ))}
                  </select>
                </div>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full py-2.5 sm:py-3 rounded-xl bg-orange-500 text-white font-outfit font-bold text-xs sm:text-sm flex items-center justify-center gap-2 hover:bg-orange-600 transition-all shadow-md shadow-orange-500/30 cursor-pointer disabled:opacity-50 mt-1 shrink-0"
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : <>{tab === 'signup' ? 'Create Account & Enter Workspace' : 'Sign In'} <ArrowRight size={15} /></>}
            </button>
          </form>

          {/* Footer Link to Admin Portal */}
          <div className="pt-2 text-center border-t border-gray-200 dark:border-neutral-800 mt-0.5 shrink-0">
            <button
              onClick={goToAdminPortal}
              className="text-xs text-gray-400 dark:text-neutral-400 hover:text-orange-500 dark:hover:text-orange-500 transition-colors font-outfit inline-flex items-center gap-1 cursor-pointer"
            >
              System Administrator? <span className="font-semibold text-orange-500 underline">Access Admin Portal</span> →
            </button>
          </div>

        </div>
      </motion.div>
    </div>
  )
}
