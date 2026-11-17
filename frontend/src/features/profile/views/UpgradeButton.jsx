import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Crown, Loader2, X, ShieldCheck, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../auth/models/authStore'
import { authAPI } from '../../../shared/utils/api'

const PERKS = [
  'Unlimited IT contract uploads',
  'Full RAG analysis on every document',
  '30 days of Pro access',
]

export default function UpgradeButton() {
  const { user, login } = useAuthStore()
  const [busy, setBusy] = useState(false)
  const [showPay, setShowPay] = useState(false)
  const [orderId, setOrderId] = useState(null)
  const startedAt = useRef(0)

  const isAdmin = user?.role === 'admin'
  const isPro = user?.subscription_tier === 'pro'

  useEffect(() => {
    if (!orderId) return
    const t = setInterval(async () => {
      if (Date.now() - startedAt.current > 10 * 60 * 1000) {
        clearInterval(t)
        setOrderId(null)
        setBusy(false)
        toast.error('Payment timed out. Please try again.')
        return
      }
      try {
        const res = await authAPI.paymentStatus(orderId)
        if (res.state === 'COMPLETED') {
          clearInterval(t)
          await login({ ...user, subscription_tier: 'pro', subscription_expiry: res.expires, unlimited: true })
          setOrderId(null)
          setBusy(false)
          setShowPay(false)
          toast.success('Payment successful — Pro is active!')
        } else if (res.state === 'FAILED') {
          clearInterval(t)
          setOrderId(null)
          setBusy(false)
          toast.error('Payment failed. No money was charged.')
        }
      } catch {}
    }, 3000)
    return () => clearInterval(t)
  }, [orderId])

  if (isAdmin) return null

  const upgrade = async () => {
    const win = window.open('', '_blank')
    setBusy(true)
    try {
      const order = await authAPI.createOrder()
      if (win) win.location.href = order.redirect_url
      else window.location.href = order.redirect_url
      startedAt.current = Date.now()
      setOrderId(order.order_id)
    } catch (err) {
      if (win) win.close()
      setBusy(false)
      toast.error(err.message || 'Could not start payment')
    }
  }

  return (
    <>
      <button
        onClick={() => setShowPay(true)}
        className="w-full mt-2 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-bold font-outfit flex items-center justify-center gap-2 shadow-md shadow-orange-500/30 hover:-translate-y-px transition-all"
      >
        <Crown size={15} /> {isPro ? 'Renew Pro' : 'Upgrade to Pro · ₹199'}
      </button>

      {isPro && user?.subscription_expiry && (
        <p className="text-[11px] text-center text-gray-500 dark:text-gray-400 font-poppins mt-1">
          Pro active till {new Date(user.subscription_expiry).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      )}

      {createPortal(
        <AnimatePresence>
          {showPay && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={() => !busy && setShowPay(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-3xl p-6 shadow-2xl font-poppins"
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                      <Crown size={20} className="text-orange-500" />
                    </div>
                    <div>
                      <h3 className="font-outfit text-lg font-bold text-gray-900 dark:text-white">LegalBuddy Pro</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">₹199 · 30 days</p>
                    </div>
                  </div>
                  <button
                    onClick={() => !busy && setShowPay(false)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-neutral-800"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="space-y-2.5 mb-6">
                  {PERKS.map((p) => (
                    <div key={p} className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                      <Check size={15} className="text-green-500 shrink-0" /> {p}
                    </div>
                  ))}
                </div>

                <button
                  onClick={upgrade}
                  disabled={busy}
                  className="w-full py-3 rounded-xl bg-[#5f259f] hover:bg-[#4e1d85] disabled:opacity-70 text-white font-bold text-sm font-outfit flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  {busy ? <><Loader2 size={16} className="animate-spin" /> Waiting for payment…</> : 'Pay ₹199 with PhonePe'}
                </button>

                <p className="flex items-center justify-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400 mt-3">
                  <ShieldCheck size={12} className="text-green-500" /> Secure checkout opens in a new tab
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  )
}
