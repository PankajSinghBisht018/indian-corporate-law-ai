import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check, Sparkles, ShieldCheck, Loader2,
  CreditCard, Clock, CheckCircle2, RefreshCw,
  QrCode, ExternalLink, X
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../auth/models/authStore'
import { paymentAPI } from '../../../shared/utils/api'

const fadeItem = (i) => ({
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: i * 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }
})

export default function PricingView() {
  const { user, login } = useAuthStore()
  const [plans, setPlans] = useState([])
  const [subscription, setSubscription] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState(false)
  const [phonePeModal, setPhonePeModal] = useState(null) // holds PhonePe order data with payment_url
  const [iframeLoaded, setIframeLoaded] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const pollingRef = useRef(null)

  const isPro = user?.subscription_tier === 'pro' || subscription?.is_pro
  const isAdmin = user?.role === 'admin'

  const fetchData = async () => {
    try {
      setLoading(true)
      const [plansRes, subRes, histRes] = await Promise.allSettled([
        paymentAPI.getPlans(),
        paymentAPI.getSubscription(),
        paymentAPI.getHistory()
      ])

      if (plansRes.status === 'fulfilled' && plansRes.value?.plans) {
        setPlans(plansRes.value.plans)
      }
      if (subRes.status === 'fulfilled') {
        setSubscription(subRes.value)
      }
      if (histRes.status === 'fulfilled' && histRes.value?.history) {
        setHistory(histRes.value.history)
      }
    } catch (err) {
      console.error('Failed to load subscription details:', err)
    } finally {
      setLoading(false)
    }
  }

  // Auto-verify if user returns from PhonePe redirect URL
  const handleAutoVerifyPhonePe = async (txnId) => {
    const tid = toast.loading('Confirming PhonePe payment…')
    try {
      const res = await paymentAPI.verifyPhonePe(txnId, false)
      if (res.success) {
        toast.success('🎉 PhonePe Payment Confirmed! LegalBuddy Pro is active.', { id: tid })
        await login({
          ...user,
          subscription_tier: 'pro',
          subscription_plan: 'pro_monthly',
          is_unlimited: true,
          subscription_expiry: res.subscription_expiry
        })
        window.history.replaceState({}, '', window.location.pathname)
        await fetchData()
      } else {
        toast.error(res.message || 'Payment not yet confirmed.', { id: tid })
      }
    } catch (e) {
      toast.error('Payment confirmation in progress.', { id: tid })
    }
  }

  useEffect(() => {
    fetchData()

    // Detect PhonePe redirect query params
    const params = new URLSearchParams(window.location.search)
    const paymentFlag = params.get('payment')
    const txnId = params.get('txn_id')
    if (paymentFlag === 'phonepe_success' && txnId) {
      handleAutoVerifyPhonePe(txnId)
    }
  }, [])

  // ── Auto-poll PhonePe payment status in background while modal is open ────
  useEffect(() => {
    if (!phonePeModal) {
      if (pollingRef.current) clearInterval(pollingRef.current)
      return
    }

    setIsSuccess(false)
    setIframeLoaded(false)
    const orderId = phonePeModal.order_id

    // Check status every 2.5 seconds automatically without manual verify buttons
    pollingRef.current = setInterval(async () => {
      try {
        const res = await paymentAPI.verifyPhonePe(orderId, false)
        if (res.success) {
          clearInterval(pollingRef.current)
          setIsSuccess(true)
          toast.success('🎉 Payment Received! LegalBuddy Pro is active.')

          await login({
            ...user,
            subscription_tier: 'pro',
            subscription_plan: 'pro_monthly',
            is_unlimited: true,
            subscription_expiry: res.subscription_expiry
          })

          setTimeout(() => {
            setPhonePeModal(null)
            fetchData()
          }, 1800)
        }
      } catch (err) {
        // Silently continue polling
      }
    }, 2500)

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [phonePeModal])

  // ── Initiate PhonePe Payment Modal ──────────────────────────────────────────
  const handlePhonePeUpgrade = async () => {
    if (isPro) {
      toast.success('You already have an active Pro subscription!')
      return
    }

    setUpgrading(true)
    const tid = toast.loading('Initializing PhonePe Payment…')

    try {
      const res = await paymentAPI.createOrder('pro_monthly', 'phonepe')
      if (!res.success || !res.order) {
        throw new Error(res.message || 'Failed to initialize PhonePe order')
      }

      toast.dismiss(tid)
      setPhonePeModal(res.order)
    } catch (err) {
      toast.error(err.message || 'Failed to connect to PhonePe gateway', { id: tid })
    } finally {
      setUpgrading(false)
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-10 font-poppins pb-20">

      {/* ── Page Header ── */}
      <motion.div {...fadeItem(0)} className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 text-xs font-semibold font-outfit uppercase tracking-wider">
          <Sparkles size={13} /> Official PhonePe Gateway
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold font-outfit text-gray-900 dark:text-white tracking-tight">
          Select Your LegalBuddy Plan
        </h1>
        <p className="text-sm md:text-base text-gray-500 dark:text-gray-400">
          Official PhonePe QR Code &amp; UPI checkout with statutory IT corporate compliance.
        </p>
      </motion.div>

      {/* ── Active Status Banner ── */}
      {isAdmin ? (
        <motion.div {...fadeItem(1)} className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 className="font-outfit text-sm font-bold text-gray-900 dark:text-white">
                Administrator Account (Full Unmetered Access)
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-poppins">
                Your account has global system privileges with unlimited contract uploads and analyses.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-300 text-xs font-bold font-outfit uppercase tracking-wider shrink-0">
            Admin Tier
          </span>
        </motion.div>
      ) : isPro ? (
        <motion.div {...fadeItem(1)} className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <h3 className="font-outfit text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                Active Pro Subscription
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                  Unlimited Uploads
                </span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-poppins mt-0.5">
                {subscription?.days_left !== null && subscription?.days_left !== undefined
                  ? `${subscription.days_left} days remaining until renewal (${new Date(subscription.subscription_expiry).toLocaleDateString()})`
                  : 'Pro monthly subscription active'}
              </p>
            </div>
          </div>
          <span className="px-3.5 py-1.5 rounded-xl bg-emerald-500 text-white text-xs font-bold font-outfit flex items-center gap-1.5 shadow-sm">
            <Sparkles size={13} /> Active
          </span>
        </motion.div>
      ) : (
        <motion.div {...fadeItem(1)} className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
              <Clock size={20} />
            </div>
            <div>
              <h3 className="font-outfit text-sm font-bold text-gray-900 dark:text-white">
                You are currently on the Basic (Free) Plan
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-poppins">
                Daily quota: <strong className="text-purple-600 dark:text-purple-400">{user?.daily_doc_count || 0}/5</strong> documents used today. Upgrade to Pro for unlimited analyses.
              </p>
            </div>
          </div>
          <button
            onClick={handlePhonePeUpgrade}
            disabled={upgrading}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold font-outfit shadow-md shadow-purple-500/20 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            {upgrading ? <Loader2 size={14} className="animate-spin" /> : <QrCode size={14} />}
            Pay ₹199 via PhonePe UPI
          </button>
        </motion.div>
      )}

      {/* ── Pricing Cards Grid (Basic Free vs Pro ₹199) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch max-w-4xl mx-auto">

        {/* ── Card 1: Basic (Free) ── */}
        <motion.div
          {...fadeItem(2)}
          className={`rounded-3xl p-6 md:p-8 flex flex-col justify-between transition-all bg-white dark:bg-neutral-900 border ${!isPro && !isAdmin
            ? 'border-gray-300 dark:border-neutral-700 shadow-md ring-1 ring-gray-200 dark:ring-neutral-800'
            : 'border-gray-200 dark:border-neutral-800 opacity-90'
            }`}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 rounded-full bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400 text-xs font-bold font-outfit uppercase tracking-wider">
                Basic Free
              </span>
              {!isPro && !isAdmin && (
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 font-poppins">
                  Current Plan
                </span>
              )}
            </div>

            <h3 className="font-outfit text-2xl font-extrabold text-gray-900 dark:text-white">
              Basic
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-poppins mt-1 mb-6">
              Ideal for individual professionals and interns evaluating occasional offer letters.
            </p>

            <div className="flex items-baseline gap-1.5 mb-6">
              <span className="font-outfit text-4xl font-extrabold text-gray-900 dark:text-white">
                ₹0
              </span>
              <span className="text-xs text-gray-400 font-medium">/ forever</span>
            </div>

            <div className="space-y-3.5 mb-8 border-t border-gray-100 dark:border-neutral-800 pt-6">
              <div className="flex items-start gap-3 text-xs text-gray-700 dark:text-gray-300">
                <Check size={16} className="text-purple-600 shrink-0 mt-0.5" />
                <span><strong>5 Document Uploads</strong> per day</span>
              </div>
              <div className="flex items-start gap-3 text-xs text-gray-700 dark:text-gray-300">
                <Check size={16} className="text-purple-600 shrink-0 mt-0.5" />
                <span>IT Employment Bond &amp; Notice Period check</span>
              </div>
              <div className="flex items-start gap-3 text-xs text-gray-700 dark:text-gray-300">
                <Check size={16} className="text-purple-600 shrink-0 mt-0.5" />
                <span>Legal Risk Score &amp; High-level summary</span>
              </div>
              <div className="flex items-start gap-3 text-xs text-gray-700 dark:text-gray-300">
                <Check size={16} className="text-purple-600 shrink-0 mt-0.5" />
                <span>Standard local &amp; cloud AI processing</span>
              </div>
              <div className="flex items-start gap-3 text-xs text-gray-400 dark:text-gray-500">
                <span className="w-4 text-center shrink-0">—</span>
                <span className="line-through">Unlimited uploads &amp; priority AI</span>
              </div>
            </div>
          </div>

          <button
            disabled
            className="w-full py-3 px-4 rounded-2xl bg-gray-100 dark:bg-neutral-800 text-gray-500 dark:text-gray-400 text-xs font-bold font-outfit uppercase tracking-wider cursor-not-allowed text-center"
          >
            {!isPro && !isAdmin ? 'Currently Active' : 'Free Tier'}
          </button>
        </motion.div>

        {/* ── Card 2: Pro (₹199 / month) ── */}
        <motion.div
          {...fadeItem(3)}
          className={`rounded-3xl p-6 md:p-8 flex flex-col justify-between transition-all relative overflow-hidden bg-white dark:bg-neutral-900 border-2 ${isPro
            ? 'border-emerald-500 shadow-lg shadow-emerald-500/10'
            : 'border-purple-600 shadow-xl shadow-purple-600/15 ring-1 ring-purple-500/30'
            }`}
        >
          {/* Top highlight ribbon */}
          <div className="absolute top-0 right-0 bg-gradient-to-l from-purple-600 to-indigo-600 text-white text-[10px] font-extrabold uppercase tracking-widest py-1 px-4 rounded-bl-xl font-outfit shadow-sm">
            RECOMMENDED
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-bold font-outfit uppercase tracking-wider border border-purple-500/20 flex items-center gap-1">
                <Sparkles size={12} /> Pro Subscription
              </span>
            </div>

            <h3 className="font-outfit text-2xl font-extrabold text-gray-900 dark:text-white">
              Professional
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-poppins mt-1 mb-6">
              Complete IT corporate legal diligence for software engineers, tech founders &amp; teams.
            </p>

            <div className="flex items-baseline gap-1.5 mb-6">
              <span className="font-outfit text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white">
                ₹199
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">/ month</span>
            </div>

            <div className="space-y-3.5 mb-8 border-t border-gray-100 dark:border-neutral-800 pt-6">
              <div className="flex items-start gap-3 text-xs text-gray-900 dark:text-white font-medium">
                <div className="w-4 h-4 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Check size={12} className="stroke-[3]" />
                </div>
                <span><strong>Unlimited Document Uploads</strong> (No 5-doc daily limit)</span>
              </div>
              <div className="flex items-start gap-3 text-xs text-gray-900 dark:text-white font-medium">
                <div className="w-4 h-4 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Check size={12} className="stroke-[3]" />
                </div>
                <span><strong>Indian Contract Act Sec 27</strong> Enforceability Check</span>
              </div>
              <div className="flex items-start gap-3 text-xs text-gray-900 dark:text-white font-medium">
                <div className="w-4 h-4 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Check size={12} className="stroke-[3]" />
                </div>
                <span><strong>Priority AI Processing Queue</strong> (Instant LLM responses)</span>
              </div>
              <div className="flex items-start gap-3 text-xs text-gray-900 dark:text-white font-medium">
                <div className="w-4 h-4 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Check size={12} className="stroke-[3]" />
                </div>
                <span><strong>Export PDF &amp; DOCX</strong> Formal Diligence Reports</span>
              </div>
              <div className="flex items-start gap-3 text-xs text-gray-900 dark:text-white font-medium">
                <div className="w-4 h-4 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Check size={12} className="stroke-[3]" />
                </div>
                <span><strong>Direct Support</strong> for IT Contract Queries</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {isPro ? (
              <button
                disabled
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold font-outfit uppercase tracking-wider flex items-center justify-center gap-2 cursor-default"
              >
                <CheckCircle2 size={16} /> Active Plan
              </button>
            ) : (
              <button
                onClick={handlePhonePeUpgrade}
                disabled={upgrading}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:to-indigo-700 text-white text-sm font-bold font-outfit uppercase tracking-wider shadow-lg shadow-purple-600/25 hover:shadow-purple-600/40 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
              >
                {upgrading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Opening PhonePe…
                  </>
                ) : (
                  <>
                    <QrCode size={16} />
                    Pay with PhonePe / UPI QR (₹199)
                  </>
                )}
              </button>
            )}

            {/* Badges */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-1.5 text-[10px] text-gray-500 dark:text-gray-400 font-poppins">
              <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-300 font-semibold">PhonePe</span>
              <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-300 font-semibold">Google Pay</span>
              <span className="px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-300 font-semibold">Paytm</span>
              <span className="px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-600 dark:text-orange-300 font-semibold">BHIM UPI</span>
            </div>

            <p className="text-[11px] text-center text-gray-400 dark:text-gray-500 font-poppins flex items-center justify-center gap-1">
              <ShieldCheck size={13} className="text-emerald-500" />
              Secured by PhonePe · Instant UPI Activation
            </p>
          </div>
        </motion.div>
      </div>

      {/* ── Payment History Section ── */}
      {history && history.length > 0 && (
        <motion.div {...fadeItem(4)} className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-md border border-gray-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-outfit text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <CreditCard size={18} className="text-purple-600" />
              Payment &amp; Billing History
            </h3>
            <button
              onClick={fetchData}
              className="text-xs text-gray-500 hover:text-purple-600 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw size={12} /> Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-poppins">
              <thead>
                <tr className="border-b border-gray-200 dark:border-neutral-800 text-gray-400 uppercase text-[10px] tracking-wider">
                  <th className="pb-3 font-semibold">Date</th>
                  <th className="pb-3 font-semibold">Plan</th>
                  <th className="pb-3 font-semibold">Gateway</th>
                  <th className="pb-3 font-semibold">Amount</th>
                  <th className="pb-3 font-semibold">Transaction ID</th>
                  <th className="pb-3 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-neutral-800/60">
                {history.map((item, idx) => (
                  <tr key={item._id || idx} className="hover:bg-gray-50/50 dark:hover:bg-neutral-800/30 transition-colors">
                    <td className="py-3 text-gray-600 dark:text-gray-400">
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 font-semibold text-gray-900 dark:text-white font-outfit">
                      {item.plan_name || 'Pro Subscription'}
                    </td>
                    <td className="py-3 text-purple-600 dark:text-purple-400 font-semibold">
                      PhonePe UPI
                    </td>
                    <td className="py-3 text-gray-900 dark:text-white font-semibold">
                      ₹{item.amount}
                    </td>
                    <td className="py-3 font-mono text-[11px] text-gray-500 dark:text-gray-400 truncate max-w-[140px]">
                      {item.payment_id || item.order_id}
                    </td>
                    <td className="py-3 text-right">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold font-outfit uppercase">
                        <CheckCircle2 size={11} /> {item.status || 'Success'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* ── Official PhonePe Checkout Modal (Large Razorpay-Style Experience) ── */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {phonePeModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-neutral-900 border border-purple-500/40 rounded-3xl overflow-hidden w-[96vw] max-w-2xl lg:max-w-3xl h-[95vh] max-h-[780px] shadow-2xl flex flex-col relative ring-1 ring-purple-500/20"
            >
              {/* Top Navigation Bar */}
              <div className="px-5 sm:px-6 py-3 bg-gradient-to-r from-purple-700 via-indigo-700 to-purple-800 text-white flex items-center justify-between shrink-0 shadow-sm z-20">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white text-purple-700 flex items-center justify-center font-extrabold text-base shadow-sm shrink-0">
                    पे
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-outfit text-sm sm:text-base font-bold leading-tight">
                        PhonePe Official Checkout
                      </h3>
                      <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider">
                        ₹199 / mo
                      </span>
                    </div>
                    <p className="text-[11px] text-purple-200 font-poppins hidden sm:block">
                      Scan PhonePe UPI QR Code with PhonePe, GPay, Paytm or BHIM
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-2.5">
                  {/* Auto-detecting live pill */}
                  {!isSuccess && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-white text-[11px] font-medium border border-white/10 shrink-0">
                      <Loader2 size={12} className="animate-spin text-purple-300" />
                      <span className="hidden xs:inline">Auto-detecting</span>
                    </div>
                  )}

                  {phonePeModal.payment_url && (
                    <a
                      href={phonePeModal.payment_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                      title="Open PhonePe in Full Page"
                    >
                      <ExternalLink size={13} />
                      <span className="hidden sm:inline">Fullscreen</span>
                    </a>
                  )}

                  <button 
                    onClick={() => setPhonePeModal(null)}
                    className="p-1.5 rounded-xl hover:bg-white/20 text-white transition-colors cursor-pointer shrink-0"
                    title="Close"
                  >
                    <X size={19} />
                  </button>
                </div>
              </div>

              {/* Embedded Official PhonePe Checkout Screen (Unclipped Full Height) */}
              <div className="relative flex-1 w-full h-full bg-white dark:bg-neutral-950 overflow-hidden flex flex-col">
                {isSuccess ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                      <CheckCircle2 size={56} className="text-emerald-500" />
                    </motion.div>
                    <h3 className="text-2xl font-extrabold font-outfit text-gray-900 dark:text-white">
                      Payment Successful!
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-poppins">
                      Your LegalBuddy Pro subscription has been activated with unlimited document uploads!
                    </p>
                  </div>
                ) : (
                  <>
                    {!iframeLoaded && (
                      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/95 dark:bg-neutral-900/95 space-y-3">
                        <Loader2 size={40} className="text-purple-600 animate-spin" />
                        <p className="text-sm text-gray-600 dark:text-gray-300 font-poppins font-medium">
                          Loading PhonePe QR Code…
                        </p>
                      </div>
                    )}
                    <iframe
                      src={phonePeModal.payment_url}
                      title="PhonePe Official Checkout"
                      className="w-full h-full flex-1 border-0 rounded-b-3xl"
                      onLoad={() => setIframeLoaded(true)}
                      allow="payment *"
                    />
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
