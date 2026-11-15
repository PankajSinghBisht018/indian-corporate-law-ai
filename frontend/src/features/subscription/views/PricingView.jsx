import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Check, Sparkles, ShieldCheck, Zap, ArrowRight, Loader2, 
  CreditCard, Clock, FileText, CheckCircle2, AlertCircle, RefreshCw
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../auth/models/authStore'
import { paymentAPI } from '../../../shared/utils/api'
import { loadRazorpayScript } from '../../../shared/utils/razorpay'
import { LegalBuddyLogo } from '../../../shared/ui/LegalBuddyLogo'

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
  const [showMockModal, setShowMockModal] = useState(null) // Holds pending mock order

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

  useEffect(() => {
    fetchData()
  }, [])

  const handleUpgrade = async () => {
    if (isPro) {
      toast.success('You already have an active Pro subscription!')
      return
    }

    setUpgrading(true)
    const tid = toast.loading('Initiating secure Razorpay checkout…')

    try {
      // 1. Ensure Razorpay checkout script is loaded
      const scriptLoaded = await loadRazorpayScript()
      if (!scriptLoaded) {
        toast.error('Unable to load payment gateway. Please check your internet connection.', { id: tid })
        setUpgrading(false)
        return
      }

      // 2. Create Order from Backend
      const orderRes = await paymentAPI.createOrder('pro_monthly')
      if (!orderRes.success || !orderRes.order) {
        throw new Error(orderRes.message || 'Failed to initialize payment order')
      }

      const orderData = orderRes.order

      // If mock simulation mode (e.g. test key placeholder or local demo)
      if (orderData.is_mock) {
        toast.dismiss(tid)
        setShowMockModal(orderData)
        setUpgrading(false)
        return
      }

      // 3. Real Razorpay Standard Checkout Options
      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'LegalBuddy',
        description: 'Monthly Pro Subscription (₹199/month)',
        order_id: orderData.order_id,
        image: '/legalbuddy-logo.svg',
        prefill: {
          name: orderData.prefill?.name || user?.name || '',
          email: orderData.prefill?.email || user?.email || '',
        },
        theme: {
          color: '#f97316' // LegalBuddy brand orange
        },
        modal: {
          ondismiss: () => {
            setUpgrading(false)
            toast('Payment cancelled or window closed', { icon: 'ℹ️' })
          }
        },
        handler: async (response) => {
          const vTid = toast.loading('Verifying payment signature…')
          try {
            const verifyRes = await paymentAPI.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            })

            if (verifyRes.success) {
              toast.success('🎉 Payment successful! LegalBuddy Pro is now active.', { id: vTid })
              
              // Update local auth store so unlimited uploads take effect immediately
              await login({
                ...user,
                subscription_tier: 'pro',
                subscription_plan: 'pro_monthly',
                is_unlimited: true,
                subscription_expiry: verifyRes.subscription_expiry
              })

              await fetchData()
            } else {
              toast.error(verifyRes.message || 'Verification failed', { id: vTid })
            }
          } catch (err) {
            toast.error(err.message || 'Payment verification failed', { id: vTid })
          } finally {
            setUpgrading(false)
          }
        }
      }

      toast.dismiss(tid)
      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', (response) => {
        setUpgrading(false)
        toast.error(`Payment failed: ${response.error.description || 'Transaction declined'}`)
      })
      rzp.open()
    } catch (err) {
      toast.error(err.message || 'Failed to start payment process', { id: tid })
      setUpgrading(false)
    }
  }

  // Handle mock payment confirmation for test sandbox environments
  const handleConfirmMockPayment = async () => {
    if (!showMockModal) return
    const tid = toast.loading('Confirming sandbox payment…')
    try {
      const mockPaymentId = `pay_mock_${Math.random().toString(36).substring(2, 12)}`
      const mockSignature = `sig_mock_${Math.random().toString(36).substring(2, 16)}`

      const verifyRes = await paymentAPI.verifyPayment({
        razorpay_order_id: showMockModal.order_id,
        razorpay_payment_id: mockPaymentId,
        razorpay_signature: mockSignature
      })

      if (verifyRes.success) {
        toast.success('🎉 Test Payment Successful! Pro plan activated for 30 days.', { id: tid })
        
        await login({
          ...user,
          subscription_tier: 'pro',
          subscription_plan: 'pro_monthly',
          is_unlimited: true,
          subscription_expiry: verifyRes.subscription_expiry
        })

        setShowMockModal(null)
        await fetchData()
      } else {
        toast.error(verifyRes.message || 'Verification failed', { id: tid })
      }
    } catch (err) {
      toast.error(err.message || 'Sandbox verification failed', { id: tid })
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-10 font-poppins pb-20">
      
      {/* ── Page Header ── */}
      <motion.div {...fadeItem(0)} className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 text-xs font-semibold font-outfit uppercase tracking-wider">
          <Sparkles size={13} /> Flexible Subscriptions
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold font-outfit text-gray-900 dark:text-white tracking-tight">
          Select Your LegalBuddy Plan
        </h1>
        <p className="text-sm md:text-base text-gray-500 dark:text-gray-400">
          Analyze IT corporate employment agreements, non-competes, and vendor SLAs with speed and statutory compliance.
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
        <motion.div {...fadeItem(1)} className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0">
              <Clock size={20} />
            </div>
            <div>
              <h3 className="font-outfit text-sm font-bold text-gray-900 dark:text-white">
                You are currently on the Basic (Free) Plan
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-poppins">
                Daily quota: <strong className="text-orange-600 dark:text-orange-400">{user?.daily_doc_count || 0}/5</strong> documents used today. Upgrade to Pro for unlimited analyses.
              </p>
            </div>
          </div>
          <button
            onClick={handleUpgrade}
            disabled={upgrading}
            className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold font-outfit shadow-md shadow-orange-500/20 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            {upgrading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            Upgrade to Pro (₹199)
          </button>
        </motion.div>
      )}

      {/* ── Pricing Cards Grid (Basic Free vs Pro ₹199) ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch max-w-4xl mx-auto">
        
        {/* ── Card 1: Basic (Free) ── */}
        <motion.div 
          {...fadeItem(2)}
          className={`rounded-3xl p-6 md:p-8 flex flex-col justify-between transition-all bg-white dark:bg-neutral-900 border ${
            !isPro && !isAdmin 
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
                <Check size={16} className="text-orange-500 shrink-0 mt-0.5" />
                <span><strong>5 Document Uploads</strong> per day</span>
              </div>
              <div className="flex items-start gap-3 text-xs text-gray-700 dark:text-gray-300">
                <Check size={16} className="text-orange-500 shrink-0 mt-0.5" />
                <span>IT Employment Bond &amp; Notice Period check</span>
              </div>
              <div className="flex items-start gap-3 text-xs text-gray-700 dark:text-gray-300">
                <Check size={16} className="text-orange-500 shrink-0 mt-0.5" />
                <span>Legal Risk Score &amp; High-level summary</span>
              </div>
              <div className="flex items-start gap-3 text-xs text-gray-700 dark:text-gray-300">
                <Check size={16} className="text-orange-500 shrink-0 mt-0.5" />
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
          className={`rounded-3xl p-6 md:p-8 flex flex-col justify-between transition-all relative overflow-hidden bg-white dark:bg-neutral-900 border-2 ${
            isPro 
              ? 'border-emerald-500 shadow-lg shadow-emerald-500/10' 
              : 'border-orange-500 shadow-xl shadow-orange-500/10'
          }`}
        >
          {/* Top highlight ribbon */}
          <div className="absolute top-0 right-0 bg-gradient-to-l from-orange-500 to-amber-500 text-white text-[10px] font-extrabold uppercase tracking-widest py-1 px-4 rounded-bl-xl font-outfit shadow-sm">
            RECOMMENDED
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-bold font-outfit uppercase tracking-wider border border-orange-500/20 flex items-center gap-1">
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
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">/ month (Auto-renewal)</span>
            </div>

            <div className="space-y-3.5 mb-8 border-t border-gray-100 dark:border-neutral-800 pt-6">
              <div className="flex items-start gap-3 text-xs text-gray-900 dark:text-white font-medium">
                <div className="w-4 h-4 rounded-full bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Check size={12} className="stroke-[3]" />
                </div>
                <span><strong>Unlimited Document Uploads</strong> (No 5-doc daily limit)</span>
              </div>
              <div className="flex items-start gap-3 text-xs text-gray-900 dark:text-white font-medium">
                <div className="w-4 h-4 rounded-full bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Check size={12} className="stroke-[3]" />
                </div>
                <span><strong>Indian Contract Act Sec 27</strong> Enforceability Check</span>
              </div>
              <div className="flex items-start gap-3 text-xs text-gray-900 dark:text-white font-medium">
                <div className="w-4 h-4 rounded-full bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Check size={12} className="stroke-[3]" />
                </div>
                <span><strong>Priority AI Processing Queue</strong> (Instant LLM responses)</span>
              </div>
              <div className="flex items-start gap-3 text-xs text-gray-900 dark:text-white font-medium">
                <div className="w-4 h-4 rounded-full bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Check size={12} className="stroke-[3]" />
                </div>
                <span><strong>Export PDF &amp; DOCX</strong> Formal Diligence Reports</span>
              </div>
              <div className="flex items-start gap-3 text-xs text-gray-900 dark:text-white font-medium">
                <div className="w-4 h-4 rounded-full bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Check size={12} className="stroke-[3]" />
                </div>
                <span><strong>Direct Support</strong> for IT Contract Queries</span>
              </div>
            </div>
          </div>

          <div>
            {isPro ? (
              <button
                disabled
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold font-outfit uppercase tracking-wider flex items-center justify-center gap-2 cursor-default"
              >
                <CheckCircle2 size={16} /> Active Plan
              </button>
            ) : (
              <button
                onClick={handleUpgrade}
                disabled={upgrading}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-orange-500 via-orange-600 to-amber-500 hover:from-orange-600 hover:to-orange-500 text-white text-sm font-bold font-outfit uppercase tracking-wider shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
              >
                {upgrading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Opening Checkout…
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Upgrade to Pro (₹199 / mo)
                  </>
                )}
              </button>
            )}
            <p className="text-[11px] text-center text-gray-400 dark:text-gray-500 font-poppins mt-2.5 flex items-center justify-center gap-1">
              <ShieldCheck size={13} className="text-emerald-500" />
              Secured by Razorpay · UPI, Cards &amp; NetBanking
            </p>
          </div>
        </motion.div>
      </div>

      {/* ── Payment History Section ── */}
      {history && history.length > 0 && (
        <motion.div {...fadeItem(4)} className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-md border border-gray-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-outfit text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <CreditCard size={18} className="text-orange-500" />
              Payment &amp; Billing History
            </h3>
            <button 
              onClick={fetchData} 
              className="text-xs text-gray-500 hover:text-orange-500 transition-colors flex items-center gap-1 cursor-pointer"
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
                  <th className="pb-3 font-semibold">Amount</th>
                  <th className="pb-3 font-semibold">Payment ID</th>
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
                    <td className="py-3 text-gray-900 dark:text-white font-semibold">
                      ₹{item.amount}
                    </td>
                    <td className="py-3 font-mono text-[11px] text-gray-500 dark:text-gray-400 truncate max-w-[140px]">
                      {item.payment_id}
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

      {/* ── Sandbox / Demo Test Order Modal ── */}
      {showMockModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-5"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
                <CreditCard size={24} />
              </div>
              <div>
                <h3 className="font-outfit text-lg font-bold text-gray-900 dark:text-white">
                  Razorpay Sandbox Simulator
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Development Mode · Test Checkout
                </p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-neutral-800/50 border border-gray-100 dark:border-neutral-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Plan:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{showMockModal.plan_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Amount:</span>
                <span className="font-bold text-orange-500">₹{showMockModal.price_inr}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Order ID:</span>
                <span className="font-mono text-[11px] text-gray-600 dark:text-gray-300 truncate max-w-[180px]">{showMockModal.order_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Gateway:</span>
                <span className="text-emerald-500 font-semibold">Razorpay Ready</span>
              </div>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-poppins">
              You are running in developer sandbox mode. Click <strong>Complete Test Payment</strong> below to simulate a successful Razorpay transaction and instantly unlock Pro features for this account!
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowMockModal(null)}
                className="flex-1 py-3 px-4 rounded-xl border border-gray-200 dark:border-neutral-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800 text-xs font-semibold font-outfit cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmMockPayment}
                className="flex-1 py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold font-outfit shadow-md shadow-orange-500/20 cursor-pointer transition-all flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 size={15} /> Complete Payment (₹199)
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  )
}

