import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Mail, Lock, Eye, EyeOff, ArrowRight, Sun, Moon, 
  Loader2, Cpu, Terminal, FileCode2, Shield
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

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { delay, duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
})

export default function AdminLoginView() {
  const [tab, setTab] = useState('login') // 'login' | 'otp'
  const [email, setEmail] = useState('admin@legalbuddy.com')
  const [pass, setPass] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [busy, setBusy] = useState(false)
  const [notifyEmail, setNotifyEmail] = useState('hemabisht14888@gmail.com')

  // OTP State
  const [tempToken, setTempToken] = useState(null)
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const inputRefs = useRef([])

  const { login } = useAuthStore()
  const { theme, toggleTheme, setPage } = useUIStore()

  // Handle OTP paste
  const handleOtpPaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').trim()
    const digits = pasted.replace(/\D/g, '').slice(0, 6)
    if (!digits) return

    const newOtp = [...otp]
    for (let i = 0; i < 6; i++) {
      newOtp[i] = digits[i] || ''
    }
    setOtp(newOtp)

    const nextIndex = Math.min(digits.length, 5)
    inputRefs.current[nextIndex]?.focus()
  }

  // Handle OTP digit changes
  const handleOtpChange = (index, value) => {
    const clean = value.replace(/\D/g, '')
    if (!clean) {
      const newOtp = [...otp]
      newOtp[index] = ''
      setOtp(newOtp)
      return
    }
    if (clean.length > 1) {
      const newOtp = [...otp]
      for (let i = 0; i < 6; i++) {
        if (clean[i]) newOtp[i] = clean[i]
      }
      setOtp(newOtp)
      const nextIndex = Math.min(clean.length, 5)
      inputRefs.current[nextIndex]?.focus()
      return
    }
    const newOtp = [...otp]
    newOtp[index] = clean
    setOtp(newOtp)
    if (clean && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  // Submit credentials
  const submitLogin = async (e) => {
    e.preventDefault()
    if (!email || !pass) {
      return toast.error('Please enter admin credentials')
    }
    if (email.trim().toLowerCase() !== 'admin@legalbuddy.com') {
      return toast.error('Access restricted: Only admin@legalbuddy.com can access the Admin Portal.')
    }

    setBusy(true)
    const tid = toast.loading('Signing in…')
    try {
      const res = await authAPI.login(email.trim().toLowerCase(), pass)
      if (res.requires_otp) {
        setTempToken(res.temp_token)
        if (res.notify_email) setNotifyEmail(res.notify_email)
        setTab('otp')
        toast.success(`Verification code sent to ${res.notify_email || 'hemabisht14888@gmail.com'}`, { id: tid, duration: 5000 })
        setTimeout(() => inputRefs.current[0]?.focus(), 150)
      } else {
        login(res)
        setPage('admin_overview')
        toast.success('Welcome, Administrator!', { id: tid })
      }
    } catch (err) {
      toast.error(err.message || 'Admin authentication failed', { id: tid })
    } finally {
      setBusy(false)
    }
  }

  // Submit OTP
  const submitOtp = async (e) => {
    if (e && e.preventDefault) e.preventDefault()
    const fullOtp = otp.join('').trim()
    if (fullOtp.length !== 6) {
      return toast.error('Please enter complete 6-digit OTP code')
    }
    if (!tempToken) {
      toast.error('Session expired, please sign in again.')
      setTab('login')
      return
    }

    setBusy(true)
    const tid = toast.loading('Verifying code…')
    try {
      const verifyFn = authAPI.verifyOTP || authAPI.verifyOtp
      const res = await verifyFn(tempToken, fullOtp)
      if (res.role !== 'admin') {
        throw new Error('Access denied: Administrator privileges required.')
      }

      await login(res)
      setPage('admin_overview')
      toast.success('Welcome, Administrator!', { id: tid })
      window.history.pushState({}, '', '/admin')
    } catch (err) {
      console.error('OTP Verification Error:', err)
      toast.error(err.message || 'Invalid or expired verification code', { id: tid })
    } finally {
      setBusy(false)
    }
  }

  const goToUserPortal = () => {
    window.history.pushState({}, '', '/')
    window.location.reload()
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-3 sm:p-4 md:p-6 lg:p-8 bg-gray-50 dark:bg-black relative overflow-x-hidden overflow-y-auto font-poppins selection:bg-orange-500 selection:text-white transition-colors duration-300">
      
      {/* Background Glow Orbs */}
      <div className="absolute rounded-full pointer-events-none blur-[120px] bg-orange-500/10 dark:bg-orange-500/8 w-[550px] h-[550px] -top-32 -left-20 z-0" />
      <div className="absolute rounded-full pointer-events-none blur-[120px] bg-orange-500/8 dark:bg-orange-500/5 w-[500px] h-[500px] -bottom-32 -right-20 z-0" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-4xl flex flex-col md:flex-row rounded-[24px] md:rounded-[28px] overflow-hidden border border-gray-200 dark:border-neutral-800 shadow-2xl relative z-10 bg-white dark:bg-neutral-950 my-auto"
      >
        {/* ── Left: Branding Panel (Matches User Login) ── */}
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

        {/* ── Right: Auth Form Panel (Never cuts off) ── */}
        <div className="flex-1 bg-white dark:bg-neutral-950 p-6 sm:p-7 md:p-8 lg:p-9 flex flex-col justify-start gap-3.5 relative overflow-y-auto max-h-[85vh] md:max-h-[88vh]">
          
          {/* Top Controls: Header & Theme Toggle */}
          <div className="flex items-center justify-between shrink-0">
            <span className="text-xs font-bold text-gray-500 dark:text-neutral-400 uppercase tracking-wider font-outfit">
              Admin Portal
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
              {tab === 'otp' ? 'Two-Factor Verification' : 'Admin Sign In'}
            </h2>
            <p className="text-gray-500 dark:text-neutral-400 text-xs font-poppins">
              {tab === 'otp'
                ? `Enter the 6-digit verification code sent to your email.`
                : 'Sign in with your authorized administrator credentials.'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={tab === 'otp' ? submitOtp : submitLogin} className="flex flex-col gap-3">
            <AnimatePresence mode="wait">
              {tab === 'otp' ? (
                /* ── OTP Verification Screen ── */
                <motion.div
                  key="otp-fields"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="flex flex-col gap-3.5"
                >
                  <div className="flex justify-between gap-1.5 sm:gap-2 my-1" onPaste={handleOtpPaste}>
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => (inputRefs.current[i] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        className="w-10 sm:w-12 h-12 sm:h-14 text-center text-lg sm:text-xl font-bold font-outfit rounded-xl border border-gray-300 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900 text-gray-900 dark:text-white outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition-all shadow-sm"
                      />
                    ))}
                  </div>

                  <button
                    type="submit"
                    onClick={submitOtp}
                    disabled={busy}
                    className="w-full py-2.5 sm:py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-outfit font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-orange-500/20 cursor-pointer disabled:opacity-50 mt-1 shrink-0"
                  >
                    {busy ? <Loader2 size={16} className="animate-spin" /> : <>Verify &amp; Enter Dashboard <ArrowRight size={15} /></>}
                  </button>

                  <button
                    type="button"
                    onClick={() => { setTab('login'); setOtp(['','','','','','']); }}
                    className="text-xs text-gray-500 dark:text-neutral-400 hover:text-gray-900 dark:hover:text-white transition-colors text-center font-outfit mt-0.5 cursor-pointer"
                  >
                    ← Back to credentials
                  </button>
                </motion.div>
              ) : (
                /* ── Admin Login Screen ── */
                <motion.div
                  key="login-fields"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="flex flex-col gap-2.5 sm:gap-3"
                >
                  {/* Email */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-700 dark:text-neutral-300 font-outfit">Email Address</label>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 transition-all">
                      <Mail size={15} className="text-gray-400 dark:text-neutral-500 shrink-0" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@legalbuddy.com"
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

                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full py-2.5 sm:py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-outfit font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-orange-500/20 cursor-pointer disabled:opacity-50 mt-1 shrink-0"
                  >
                    {busy ? <Loader2 size={16} className="animate-spin" /> : <>Sign In as Administrator <ArrowRight size={15} /></>}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          {/* Footer Link to User Portal */}
          <div className="pt-2 text-center border-t border-gray-200 dark:border-neutral-800 mt-0.5 shrink-0">
            <button
              onClick={goToUserPortal}
              className="text-xs text-gray-400 dark:text-neutral-400 hover:text-orange-500 dark:hover:text-orange-500 transition-colors font-outfit inline-flex items-center gap-1 cursor-pointer"
            >
              Regular User? <span className="font-semibold text-orange-500 underline">Access User Portal</span> →
            </button>
          </div>

        </div>
      </motion.div>
    </div>
  )
}
