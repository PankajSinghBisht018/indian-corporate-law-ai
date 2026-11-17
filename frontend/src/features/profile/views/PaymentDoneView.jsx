import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, XCircle, Clock, Loader2, ArrowLeft } from 'lucide-react'
import { authAPI } from '../../../shared/utils/api'
import { useAuthStore } from '../../auth/models/authStore'
import { useUIStore } from '../../../shared/store/uiStore'
import { LegalBuddyLogo } from '../../../shared/ui/LegalBuddyLogo'

const SCREENS = {
  checking: {
    icon: Loader2,
    iconCls: 'text-orange-500 animate-spin',
    ring: 'bg-orange-500/10 border-orange-500/20',
    title: 'Confirming your payment…',
    text: 'Please wait while we check with PhonePe. Do not close this tab.',
  },
  success: {
    icon: CheckCircle2,
    iconCls: 'text-green-500',
    ring: 'bg-green-500/10 border-green-500/20',
    title: 'Payment Successful',
    text: 'LegalBuddy Pro is now active on your account. Enjoy unlimited IT contract uploads.',
  },
  failed: {
    icon: XCircle,
    iconCls: 'text-red-500',
    ring: 'bg-red-500/10 border-red-500/20',
    title: 'Payment Failed',
    text: 'The payment did not go through. If money was deducted, it will be refunded automatically.',
  },
  pending: {
    icon: Clock,
    iconCls: 'text-amber-500',
    ring: 'bg-amber-500/10 border-amber-500/20',
    title: 'Payment Pending',
    text: 'PhonePe has not confirmed the payment yet. Check your profile again in a few minutes.',
  },
}

const fadeUp = (i) => ({
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] },
})

export default function PaymentDoneView() {
  const { theme } = useUIStore()
  const { user, login } = useAuthStore()
  const [screen, setScreen] = useState('checking')
  const [expires, setExpires] = useState(null)

  useEffect(() => {
    const orderId = new URLSearchParams(window.location.search).get('order_id')
    if (!orderId) { setScreen('failed'); return }
    let tries = 0
    let stopped = false

    const check = async () => {
      if (stopped) return
      tries += 1
      try {
        const res = await authAPI.paymentStatus(orderId)
        if (res.state === 'COMPLETED') {
          setExpires(res.expires)
          if (user) await login({ ...user, subscription_tier: 'pro', subscription_expiry: res.expires, unlimited: true })
          setScreen('success')
          return
        }
        if (res.state === 'FAILED') { setScreen('failed'); return }
      } catch {}
      if (tries >= 20) { setScreen('pending'); return }
      setTimeout(check, 3000)
    }

    check()
    return () => { stopped = true }
  }, [])

  const s = SCREENS[screen]
  const Icon = s.icon

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <div className="min-h-screen bg-gray-50 dark:bg-[#050505] flex items-center justify-center p-4 relative overflow-hidden font-poppins">
        <div className="absolute rounded-full pointer-events-none blur-[80px] bg-orange-500 w-[500px] h-[500px] -top-[15%] -right-[8%] opacity-10" />
        <div className="absolute rounded-full pointer-events-none blur-[80px] bg-orange-500 w-[350px] h-[350px] -bottom-[20%] left-[10%] opacity-10" />

        <motion.div {...fadeUp(0)} className="relative z-10 w-full max-w-md bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border border-gray-200 dark:border-neutral-800 rounded-3xl p-8 shadow-xl text-center">
          <motion.div {...fadeUp(1)} className="flex items-center justify-center gap-2.5 mb-8">
            <LegalBuddyLogo size={36} withGlow={true} />
            <span className="font-outfit text-xl font-extrabold text-gray-900 dark:text-white">LegalBuddy</span>
          </motion.div>

          <motion.div {...fadeUp(2)} key={screen} className={`w-20 h-20 mx-auto rounded-full border flex items-center justify-center mb-6 ${s.ring}`}>
            <Icon size={38} className={s.iconCls} />
          </motion.div>

          <motion.h1 {...fadeUp(3)} className="font-outfit text-2xl font-bold text-gray-900 dark:text-white mb-2">{s.title}</motion.h1>
          <motion.p {...fadeUp(4)} className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-6">{s.text}</motion.p>

          {screen === 'success' && expires && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
              Pro valid till{' '}
              <span className="font-semibold text-gray-900 dark:text-white">
                {new Date(expires).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </p>
          )}

          {screen !== 'checking' && (
            <motion.a
              {...fadeUp(5)}
              href="/"
              className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-white text-sm font-bold font-outfit shadow-md shadow-orange-500/30 transition-all hover:-translate-y-px"
            >
              <ArrowLeft size={16} /> Back to LegalBuddy
            </motion.a>
          )}
        </motion.div>
      </div>
    </div>
  )
}
