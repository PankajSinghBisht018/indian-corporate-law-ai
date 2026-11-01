import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sparkles, Upload, ShieldCheck, User, ArrowRight, ArrowLeft, 
  Check, X, HelpCircle, FileText, AlertTriangle
} from 'lucide-react'
import { LegalBuddyLogo } from '../../shared/ui/LegalBuddyLogo'

const TOUR_STEPS = [
  {
    icon: LegalBuddyLogo,
    color: 'from-orange-500 to-amber-500',
    title: 'Welcome to LegalBuddy',
    subtitle: 'AI-Driven Legal Document Summarization',
    desc: 'Specialized legal document summarization and compliance intelligence built specifically for Information Technology (IT) Corporate Law: Offer Letters, Employment Bonds, MSAs, SaaS SLAs, Software Licensing, and DPDP Act 2023.'
  },
  {
    icon: Upload,
    color: 'from-blue-500 to-indigo-500',
    title: 'Upload IT Contracts & Agreements',
    subtitle: 'Standard Accounts: 5 Documents Daily Quota',
    desc: 'Simply drag & drop or click to upload your IT Offer Letters, Employment Bonds, Master Services Agreements (MSA), SaaS SLAs, or vendor contracts in PDF or Word (.docx) formats.'
  },
  {
    icon: ShieldCheck,
    color: 'from-emerald-500 to-teal-500',
    title: 'AI Clause & Legal Risk Engine',
    subtitle: 'IT Corporate Law & Compliance Findings',
    desc: 'Our system automatically verifies employment bond terms, notice periods, SLA uptime commitments, software IP assignment, vendor liability caps, and calculates an instant Legal Risk Score.'
  },
  {
    icon: User,
    color: 'from-purple-500 to-pink-500',
    title: 'Profile & Quota Management',
    subtitle: 'Track Your Usage & Update IT Designation',
    desc: 'Click on your profile avatar in the top bar anytime to update your company name, IT designation, or check your daily upload quota. Need unlimited uploads? Your administrator can elevate your access.'
  }
]

export default function QuickTourModal({ isOpen, onClose }) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (isOpen) {
      setStep(0)
    }
  }, [isOpen])

  if (!isOpen) return null

  const current = TOUR_STEPS[step]
  const Icon = current.icon
  const isLast = step === TOUR_STEPS.length - 1

  const handleNext = () => {
    if (isLast) {
      handleComplete()
    } else {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    if (step > 0) setStep(step - 1)
  }

  const handleComplete = () => {
    try {
      localStorage.removeItem('lb_new_signup_tour')
      localStorage.removeItem('lb_show_tour')
      localStorage.setItem('lb_tour_completed', 'true')
    } catch {}
    onClose()
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl relative overflow-hidden font-poppins"
        >
          {/* Top Decorative Header Accent */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-orange-500 font-outfit uppercase tracking-wider bg-orange-500/10 border border-orange-500/20 px-2.5 py-1 rounded-full">
                Quick Glance Tour · {step + 1} of {TOUR_STEPS.length}
              </span>
            </div>
            <button
              onClick={handleComplete}
              className="text-gray-400 hover:text-gray-700 dark:hover:text-white p-1 rounded-lg transition-colors"
              title="Skip Tour"
            >
              <X size={18} />
            </button>
          </div>

          {/* Animated Step Body */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-4"
            >
              {step === 0 ? (
                <div className="w-14 h-14 flex items-center justify-center mb-1">
                  <LegalBuddyLogo size={48} withGlow={true} />
                </div>
              ) : (
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${current.color} flex items-center justify-center shadow-lg text-white mb-1`}>
                  <Icon size={28} />
                </div>
              )}

              <div>
                <h3 className="font-outfit text-2xl font-bold text-gray-900 dark:text-white">
                  {current.title}
                </h3>
                <div className="text-xs font-semibold text-orange-500 font-poppins mt-0.5">
                  {current.subtitle}
                </div>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-poppins">
                {current.desc}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Navigation & Progress Dots */}
          <div className="flex items-center justify-between mt-8 pt-5 border-t border-gray-100 dark:border-neutral-800">
            {/* Step Dots */}
            <div className="flex items-center gap-1.5">
              {TOUR_STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === step 
                      ? 'w-6 bg-orange-500' 
                      : 'w-2 bg-gray-200 dark:bg-neutral-800 hover:bg-gray-300'
                  }`}
                  aria-label={`Go to step ${i + 1}`}
                />
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleComplete}
                className="px-3 py-2 text-xs font-semibold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Skip Tour
              </button>

              {step > 0 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-3.5 py-2 rounded-xl border border-gray-200 dark:border-neutral-800 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors flex items-center gap-1"
                >
                  <ArrowLeft size={13} /> Back
                </button>
              )}

              <button
                type="button"
                onClick={handleNext}
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold font-outfit transition-all flex items-center gap-1.5 shadow-md shadow-orange-500/20"
              >
                {isLast ? <>Get Started <Check size={14} /></> : <>Next <ArrowRight size={14} /></>}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

