import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, FileText, File, FileType, Trash2, Loader2, Brain,
  BookOpen, Target, ShieldAlert, ShieldCheck, CheckCircle, CheckCircle2,
  XCircle, Clock, Sparkles, FolderOpen, Search, ArrowLeft, RefreshCw, LayoutGrid, AlertTriangle
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useFileStore } from '../models/fileStore'
import { useAuthStore } from '../../auth/models/authStore'
import { documentAPI, summarizeAPI } from '../../../shared/utils/api'
import FileViewer from './FileViewerView'
import { ContentLoader } from '../../../shared/ui/Loader'

const PROCESSING = ['processing', 'uploaded', 'queued', 'extracting', 'chunking', 'embedding', 'indexing', 'analyzing']

const BADGE_BASE = 'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md'

const TYPE_BADGE = {
  PDF: 'bg-orange-100 text-orange-800 dark:bg-orange-500/10 dark:text-orange-500',
  DOCX: 'bg-blue-100 text-blue-800 dark:bg-blue-500/10 dark:text-blue-500',
  DOC: 'bg-blue-100 text-blue-800 dark:bg-blue-500/10 dark:text-blue-500',
  TXT: 'bg-gray-100 text-gray-800 dark:bg-gray-500/10 dark:text-gray-500',
}

const TABS = [
  { id: 'file',        label: 'Preview'    },
  { id: 'summary',     label: 'Summary'    },
  { id: 'clauses',     label: 'Clauses'    },
  { id: 'obligations', label: 'Objectives' },
  { id: 'risks',       label: 'Risk'       },
  { id: 'compliance',  label: 'Compliance' },
]

const CARD_META = {
  summary:     { icon: Brain,       bg: 'bg-emerald-500', title: 'Executive Summary' },
  clauses:     { icon: BookOpen,    bg: 'bg-blue-500',    title: 'Detected Clauses' },
  obligations: { icon: Target,      bg: 'bg-orange-500',  title: 'Legal Objectives' },
  risks:       { icon: ShieldAlert, bg: 'bg-rose-500',    title: 'Risk Assessment' },
  compliance:  { icon: ShieldCheck, bg: 'bg-violet-500',  title: 'Compliance Status' },
}

const FILTERS = [
  { id: 'all',      label: 'All',      icon: LayoutGrid  },
  { id: 'recent',   label: 'Recent',   icon: Clock       },
  { id: 'analyzed', label: 'Analyzed', icon: CheckCircle },
]

const STEPS = ['Chunking', 'Embedding', 'Searching', 'Generating']
const STEP_INDEX = { chunking: 0, embedding: 1, indexing: 2, analyzing: 3 }

const getExt = (filename) => (filename?.split('.').pop() || '').toUpperCase()

const toBullets = (text) => {
  const raw = String(text || '').trim()
  if (!raw) return []
  if (raw.includes('\n')) return raw.split('\n').map((l) => l.trim()).filter(Boolean).map((l) => (/^[-*]/.test(l) ? l : `- ${l}`))
  return raw.split(/(?<=[.!?])\s+(?=[A-Z"'(])/).map((s) => `- ${s.trim()}`).filter((s) => s.length > 2)
}

const isDone = (status) =>['done', 'completed'].includes((status || '').toLowerCase())

function TypeIcon({ ext }) {
  if (ext === 'PDF') return <FileText size={20} className="text-orange-500" />
  if (ext === 'DOCX' || ext === 'DOC') return <File size={20} className="text-blue-500" />
  return <FileType size={20} className="text-gray-500 dark:text-gray-400" />
}

function StatusBadge({ status }) {
  const st = (status || '').toLowerCase()
  if (isDone(st)) return (
    <span className={`${BADGE_BASE} flex items-center gap-1 bg-green-500/10 text-green-600 dark:text-green-500`}>
      <CheckCircle size={11} /> Analyzed
    </span>
  )
  if (st === 'failed' || st === 'cancelled') return (
    <span className={`${BADGE_BASE} flex items-center gap-1 bg-red-500/10 text-red-600 dark:text-red-500`}>
      <XCircle size={11} /> {st === 'failed' ? 'Failed' : 'Cancelled'}
    </span>
  )
  return (
    <span className={`${BADGE_BASE} flex items-center gap-1 bg-yellow-500/10 text-yellow-600 dark:text-yellow-500`}>
      <Clock size={11} /> {['uploaded', 'queued', ''].includes(st) ? 'Queued' : 'Processing'}
    </span>
  )
}

function renderBold(text) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i} className="text-gray-900 dark:text-white">{part.slice(2, -2)}</strong>
      : part
  )
}

function BulletBlock({ content }) {
  const lines = (Array.isArray(content) ? content : String(content || '').split('\n'))
    .map((l) => String(l).trim())
    .filter(Boolean)

  if (!lines.length) return <p className="text-gray-500 dark:text-gray-400">No items identified.</p>

  if (lines.length === 1 && !/^[-*]/.test(lines[0])) return (
    <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed whitespace-pre-wrap">{renderBold(lines[0])}</p>
  )

  return (
    <div className="flex flex-col gap-4">
      {lines.map((line, i) => (
        <div key={i} className="text-gray-700 dark:text-gray-300 text-base leading-relaxed">
          <span className="text-orange-500 mr-2">-</span>{renderBold(line.replace(/^[-*]\s*/, ''))}
        </div>
      ))}
    </div>
  )
}

function DetailCard({ tab, children }) {
  const { icon: Icon, bg, title } = CARD_META[tab]
  return (
    <div className="bg-white dark:bg-[#111111] rounded-3xl border border-gray-200 dark:border-[#1f1f1f] p-8">
      <div className="flex items-center gap-4 mb-6">
        <div className={`w-14 h-14 rounded-2xl ${bg} flex items-center justify-center text-white shrink-0`}>
          <Icon size={24} />
        </div>
        <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">{title}</h2>
      </div>
      {children}
    </div>
  )
}

function AnalysisContent({ summaryData, activeTab, activeDocId, filename }) {
  const { setSummary } = useFileStore()
  const status = (summaryData?.status || '').toLowerCase()
  const isProcessing = PROCESSING.includes(status)

  const handleCancel = async () => {
    try {
      await summarizeAPI.cancel(activeDocId)
      setSummary({ ...summaryData, status: 'cancelled' })
    } catch {}
  }

  const handleRetry = async () => {
    setSummary({ ...summaryData, status: 'queued', error: null })
    try {
      await summarizeAPI.trigger(activeDocId)
    } catch {}
  }

  useEffect(() => {
    if (!isProcessing || !activeDocId) return
    const t = setInterval(async () => {
      try {
        const res = await summarizeAPI.get(activeDocId)
        setSummary(res)
      } catch (err) {
        console.error("Analysis polling error:", err)
      }
    }, 3000)
    return () => clearInterval(t)
  }, [isProcessing, activeDocId, setSummary])

  if (activeTab === 'file') return (
    <div className="h-[calc(100vh-220px)] rounded-2xl border border-gray-200 dark:border-[#1f1f1f] bg-white dark:bg-[#111111] overflow-hidden">
      <FileViewer docId={activeDocId} filename={filename} />
    </div>
  )

  if (status === 'failed' || status === 'cancelled') return (
    <div className="flex flex-col items-center py-24 gap-6 text-center">
      <div className={`p-6 rounded-2xl border max-w-md ${status === 'cancelled' ? 'bg-orange-50 dark:bg-orange-500/10 border-orange-200 dark:border-orange-500/20 text-orange-900 dark:text-orange-100' : 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20 text-red-900 dark:text-red-100'}`}>
        <p className="font-black uppercase tracking-wider mb-2">{status === 'cancelled' ? 'Analysis Cancelled' : 'Analysis Failed'}</p>
        <p className="text-sm opacity-90 mb-4">{status === 'cancelled' ? 'You stopped the analysis before it completed.' : (summaryData.error || 'An unexpected error occurred during analysis.')}</p>
        <button onClick={handleRetry} className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${status === 'cancelled' ? 'bg-orange-500 text-white hover:bg-orange-400' : 'bg-red-500 text-white hover:bg-red-600'}`}>
          Retry Analysis
        </button>
      </div>
    </div>
  )

  if (isProcessing) {
    const current = STEP_INDEX[status] ?? 0
    return (
      <div className="flex flex-col items-center py-24 gap-6">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-2 border-gray-200 dark:border-[#222222] rounded-full" />
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="absolute inset-0 border-2 border-transparent border-t-orange-500 rounded-full" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Brain size={20} className="text-orange-500" />
          </div>
        </div>
        <div className="text-center">
          <div className="font-black uppercase text-gray-900 dark:text-white mb-1">Analyzing document...</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Running RAG pipeline against knowledge base</div>
        </div>
        <div className="flex gap-6">
          {STEPS.map((step, i) => (
            <div key={step} className="flex flex-col items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-full ${i < current ? 'bg-orange-500' : i === current ? 'bg-orange-500 animate-pulse' : 'bg-gray-300 dark:bg-[#2a2a2a]'}`} />
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{step}</span>
            </div>
          ))}
        </div>
        <button onClick={handleCancel} className="text-red-500 border border-red-500/30 hover:bg-red-500/10 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors">
          Stop Analysis
        </button>
      </div>
    )
  }

  const d = {
    document_type:  summaryData?.document_type  || 'IT Corporate Document',
    summary:        summaryData?.summary        || '',
    clauses:        summaryData?.clauses        || [],
    obligations:    summaryData?.obligations    || [],
    risks:          summaryData?.risks          || [],
    risk_score:     summaryData?.risk_score     || 0,
    critical_risks: summaryData?.critical_risks || '',
    compliance:     summaryData?.compliance     || '',
  }

  const scoreColor = d.risk_score > 70 ? 'rose-500' : d.risk_score > 30 ? 'yellow-500' : 'green-500'
  const strokeCls = { 'rose-500': 'stroke-rose-500', 'yellow-500': 'stroke-yellow-500', 'green-500': 'stroke-green-500' }[scoreColor]
  const textCls = { 'rose-500': 'text-rose-500', 'yellow-500': 'text-yellow-500', 'green-500': 'text-green-500' }[scoreColor]

  return (
    <AnimatePresence mode="wait">
      <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }} className="max-w-5xl mx-auto w-full">
        {activeTab === 'summary' && (
          <DetailCard tab="summary">
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20 mb-5">
              <Sparkles size={14} className="text-orange-500" />
              <span className="text-xs text-orange-500 font-bold tracking-wide uppercase">{d.document_type}</span>
            </div>
            <BulletBlock content={toBullets(d.summary)} />
          </DetailCard>
        )}

        {activeTab === 'clauses' && (
          <DetailCard tab="clauses">
            <BulletBlock content={d.clauses} />
          </DetailCard>
        )}

        {activeTab === 'obligations' && (
          <DetailCard tab="obligations">
            <BulletBlock content={d.obligations} />
          </DetailCard>
        )}

        {activeTab === 'risks' && (
          <DetailCard tab="risks">
            <div className="flex flex-col gap-6">
              <div className="flex items-start md:items-center justify-between p-6 rounded-2xl border border-gray-200/60 dark:border-neutral-800/60 bg-white/60 dark:bg-neutral-900/40 backdrop-blur-md shadow-sm gap-6 flex-col md:flex-row">
                <p className="flex-1 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {d.critical_risks || 'No critical corporate legal or contractual risks identified in this document.'}
                </p>
                <div className="flex flex-col items-center justify-center shrink-0">
                  <div className="relative w-20 h-20">
                    <svg className="w-20 h-20 -rotate-90">
                      <circle cx="40" cy="40" r="36" className="stroke-gray-200 dark:stroke-neutral-800 fill-none" strokeWidth="6" />
                      <circle cx="40" cy="40" r="36" className={`fill-none ${strokeCls}`} strokeWidth="6" strokeDasharray="226" strokeDashoffset={226 - (226 * d.risk_score) / 100} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease-in-out' }} />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-xl font-bold ${textCls}`}>{d.risk_score}%</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 mt-2">Risk Score</span>
                </div>
              </div>

              {d.risks.length ? (
                <div className="flex flex-col gap-3">
                  {d.risks.map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="p-4 rounded-xl border border-rose-200/60 dark:border-rose-500/20 border-l-[3px] border-l-rose-500 bg-rose-50/60 dark:bg-rose-500/10 backdrop-blur-md shadow-sm text-rose-900 dark:text-rose-100 text-sm leading-relaxed"
                    >
                      {renderBold(String(item))}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">No items identified.</p>
              )}
            </div>
          </DetailCard>
        )}

        {activeTab === 'compliance' && (
          <DetailCard tab="compliance">
            <BulletBlock content={d.compliance} />
          </DetailCard>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

export default function DocumentsView() {
  const { files, setFiles, activeDocId, summaryData, setActive, setSummary, clearActive } = useFileStore()
  const { user, incrementDocCount, initAuth } = useAuthStore()
  const [activeTab, setActiveTab] = useState('file')
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading]     = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)

  const isPro = user?.subscription_tier === 'pro' || user?.is_unlimited === true
  const isAdmin = user?.role === 'admin'
  const isUnlimited = isAdmin || isPro
  const docsUsedToday = user?.daily_doc_count ?? 0
  const isLimitReached = !isUnlimited && docsUsedToday >= 5

  const fetchFiles = async () => {
    try {
      const r = await documentAPI.list()
      setFiles(r.documents || [])
    } catch {}
  }

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchFiles(), initAuth()]).finally(() => setLoading(false))
  }, [])

  const hasProcessingFiles = files.some((f) => PROCESSING.includes((f.status || '').toLowerCase()))
  useEffect(() => {
    if (!hasProcessingFiles) return
    const t = setInterval(fetchFiles, 4000)
    return () => clearInterval(t)
  }, [hasProcessingFiles])

  const handleSelect = async (doc, tab = 'file') => {
    setActive(doc.doc_id, { status: doc.status, filename: doc.filename, doc_id: doc.doc_id })
    setActiveTab(tab)
    const st = (doc.status || '').toLowerCase()
    const processingStates = ['processing', 'extracting', 'chunking', 'embedding', 'indexing', 'analyzing']
    if (st === 'done' || st === 'completed') {
      try {
        const res = await summarizeAPI.get(doc.doc_id)
        setSummary(res)
      } catch (err) {
        console.error("Summary fetch error:", err)
        toast.error("Failed to load summary: " + err.message)
      }
    } else if (st === 'uploaded' || st === 'queued') {
      try { await summarizeAPI.trigger(doc.doc_id) } catch {}
      setSummary({ status: 'processing', filename: doc.filename, doc_id: doc.doc_id })
    } else if (processingStates.includes(st)) {
      setSummary({ status: st, filename: doc.filename, doc_id: doc.doc_id })
    }
  }

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) handleUpload(e.dataTransfer.files[0])
  }

  const handleUpload = async (file) => {
    if (!file) return
    if (isLimitReached) {
      toast.error('Daily limit of 5 uploads reached. An Admin can reset your limit in the Admin Panel.')
      return
    }
    const name = file.name.toLowerCase()
    if (!name.endsWith('.pdf') && !name.endsWith('.doc') && !name.endsWith('.docx')) {
      toast.error('Only PDF and Word (.doc/.docx) files are allowed.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be under 5MB.')
      return
    }
    setUploading(true)
    const tid = toast.loading(`Uploading ${file.name}…`)
    try {
      const res = await documentAPI.upload(file)
      toast.success('Uploaded — running IT analysis…', { id: tid })
      try { await summarizeAPI.trigger(res.doc_id) } catch {}
      setActive(res.doc_id, { status: 'processing', filename: res.filename, doc_id: res.doc_id })
      setActiveTab('file')
      incrementDocCount()
      await fetchFiles()
    } catch (err) {
      toast.error(err.message.replace(/^\d+:\s*/, '').slice(0, 100), { id: tid })
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (e, docId) => {
    e.stopPropagation()
    if (!confirm('Delete this IT document?')) return
    try {
      await documentAPI.delete(docId)
      if (activeDocId === docId) clearActive()
      await fetchFiles()
      toast.success('Deleted')
    } catch {
      toast.error('Delete failed')
    }
  }

  const activeDoc = files.find((f) => f.doc_id === activeDocId)
  const activeName = activeDoc?.filename || summaryData?.filename || ''

  const dateOf = (f) => new Date(f.uploaded_at || f.created_at || 0).getTime()
  const searched = files.filter(f => f.filename.toLowerCase().includes(searchQuery.toLowerCase()))
  const filteredFiles =
    filter === 'analyzed' ? searched.filter(f => isDone(f.status)) :
    filter === 'recent'   ? [...searched].sort((a, b) => dateOf(b) - dateOf(a)).slice(0, 6) :
    searched

  return (
    <div className="flex h-[calc(100vh-58px)] bg-gray-50 dark:bg-[#050505] overflow-hidden flex-col md:flex-row transition-colors duration-300 relative">

      <div className="absolute rounded-full pointer-events-none blur-[80px] bg-orange-500 w-[500px] h-[500px] -top-[15%] -right-[8%] opacity-5 z-0" />
      <div className="absolute rounded-full pointer-events-none blur-[80px] bg-orange-500 w-[350px] h-[350px] -bottom-[20%] left-[15%] opacity-5 z-0" />

      <AnimatePresence mode="wait">
        {!activeDocId ? (
          <motion.div key="library" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="w-full h-full overflow-y-auto p-4 md:p-10 relative z-10">
            <div className="max-w-5xl mx-auto">

              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white font-outfit tracking-tight flex items-center gap-2 flex-wrap">
                    IT Corporate Documents
                    {isAdmin ? (
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold border border-purple-500/20">
                        Admin • Unlimited Uploads
                      </span>
                    ) : isPro ? (
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                        Pro • Unlimited Uploads
                      </span>
                    ) : (
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${isLimitReached ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-orange-500/10 text-orange-500 border-orange-500/20'}`}>
                        Uploads Today: {docsUsedToday} / 5
                      </span>
                    )}
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-poppins mt-1">
                    Manage Master Services Agreements, SaaS SLAs, Data Processing Addendums, and software contracts.
                  </p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                  <button
                    onClick={() => initAuth()}
                    className="p-2 rounded-xl border border-gray-200 dark:border-[#1f1f1f] text-gray-500 dark:text-gray-400 hover:text-orange-500 transition-colors bg-white dark:bg-[#111111]"
                    title="Refresh user limits"
                  >
                    <RefreshCw size={15} />
                  </button>

                  <div className="flex items-center gap-2.5 bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#1f1f1f] px-4 py-2 rounded-xl w-full md:w-72 transition-colors duration-200 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20">
                    <Search size={16} className="text-gray-400 dark:text-gray-500" />
                    <input type="text" placeholder="Search IT documents..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1 bg-transparent border-none text-gray-900 dark:text-white outline-none text-sm font-poppins" />
                  </div>
                </div>
              </div>

              <div
                className={`rounded-2xl border-2 border-dashed p-6 text-center transition-all mb-8 ${uploading ? 'cursor-not-allowed' : 'cursor-pointer'} ${
                  isLimitReached
                    ? 'border-amber-400 dark:border-amber-600/50 bg-amber-500/5'
                    : dragging
                      ? 'border-orange-500 bg-orange-500/5'
                      : 'border-gray-300 dark:border-[#2a2a2a] bg-white dark:bg-[#0d0d0d] hover:border-orange-400'
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => !uploading && inputRef.current?.click()}
              >
                <input ref={inputRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleUpload(e.target.files[0]); e.target.value = '' }} disabled={uploading} />
                {uploading ? (
                  <div className="flex items-center justify-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">Processing and analyzing IT contract...</span>
                  </div>
                ) : isLimitReached ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2 text-amber-500">
                      <AlertTriangle className="w-5 h-5" />
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">User Document Limit Reached ({docsUsedToday}/5)</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                      You have used your 5 document uploads for this period. An Admin can reset your limit anytime from the Admin Panel, or log in as Admin for unlimited uploads.
                    </p>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); initAuth(); toast.success('Checking updated limits...') }}
                      className="text-xs font-semibold text-orange-500 hover:underline flex items-center gap-1 mx-auto"
                    >
                      <RefreshCw size={12} /> Check if Admin has reset your limit
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3 flex-wrap">
                    <Upload className="w-5 h-5 text-orange-500" />
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">Drop file or click to upload</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      PDF, DOCX, DOC · {isAdmin ? 'Unlimited uploads' : `${5 - docsUsedToday} upload(s) left`}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                <div className="flex items-center gap-2.5">
                  <FolderOpen size={18} className="text-gray-400 dark:text-gray-500" />
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white font-outfit">
                    Uploaded IT Files {filteredFiles.length > 0 && `(${filteredFiles.length})`}
                  </h3>
                </div>

                <div className="flex items-center gap-1 bg-gray-100 dark:bg-[#111111] p-1 rounded-xl w-fit border border-gray-200 dark:border-[#1f1f1f]">
                  {FILTERS.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setFilter(id)}
                      className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${filter === id ? 'bg-orange-500 text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                    >
                      <Icon size={14} /> {label}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <ContentLoader rows={3} />
              ) : filteredFiles.length === 0 ? (
                <div className="text-center py-12 rounded-2xl bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#1f1f1f]">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-poppins">
                    {searchQuery ? 'No IT documents match your search.' : filter === 'analyzed' ? 'No analyzed IT documents yet.' : 'No IT contracts uploaded yet.'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <AnimatePresence>
                    {filteredFiles.map((doc, i) => {
                      const ext = getExt(doc.filename)
                      return (
                        <motion.div
                          key={doc.doc_id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ delay: i * 0.03 }}
                          onClick={() => handleSelect(doc)}
                          className="bg-white dark:bg-[#161616] rounded-2xl p-6 border border-gray-200 dark:border-[#1f1f1f] hover:border-orange-500/40 transition-colors cursor-pointer group relative"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                              <TypeIcon ext={ext} />
                            </div>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleSelect(doc, 'summary') }}
                                className="p-1.5 rounded-lg bg-orange-500/10 text-orange-500 hover:bg-orange-500/20"
                                title="View analysis"
                              >
                                <Sparkles size={14} />
                              </button>
                              <button
                                onClick={(e) => handleDelete(e, doc.doc_id)}
                                className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20"
                                title="Delete document"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>

                          <h3 className="text-gray-900 dark:text-white font-bold text-base truncate" title={doc.filename}>
                            {doc.filename.replace(/\.[^.]+$/, '')}
                          </h3>

                          <div className="flex items-center gap-2 mt-3">
                            <span className={`${BADGE_BASE} ${TYPE_BADGE[ext] || TYPE_BADGE.TXT}`}>{ext || 'FILE'}</span>
                            <StatusBadge status={doc.status} />
                          </div>
                        </motion.div>
                      )
                    })}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        ) : (

          <motion.div key="detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="w-full h-full flex flex-col relative z-10">

            <div className="flex items-center justify-between py-4 px-6 border-b border-gray-200 dark:border-[#1a1a1a] gap-4 flex-wrap shrink-0">
              <button
                onClick={() => clearActive()}
                className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm font-medium transition-colors"
              >
                <ArrowLeft size={16} /> Back
              </button>

              <div className="flex items-center bg-gray-100 dark:bg-[#111111] rounded-full p-1 border border-gray-200 dark:border-[#1f1f1f] overflow-x-auto flex-nowrap max-w-full">
                {TABS.map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`shrink-0 whitespace-nowrap px-3 py-2 md:px-5 rounded-full text-[11px] md:text-xs font-bold uppercase tracking-wider transition-all ${
                      activeTab === id
                        ? 'bg-white dark:bg-[#1f1f1f] text-orange-500 shadow-sm'
                        : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-[#1a1a1a] gap-4 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <FileText size={16} className="text-orange-500 shrink-0" />
                <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">{activeName}</span>
              </div>
              {isDone(summaryData?.status) && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 py-1 px-3 rounded-full bg-green-500/10 border border-green-500/20 shrink-0">
                  <CheckCircle2 size={12} className="text-green-600 dark:text-green-500" />
                  <span className="text-[11px] text-green-600 dark:text-green-500 font-bold uppercase tracking-wider">Analysis Ready</span>
                </motion.div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              <AnalysisContent summaryData={summaryData} activeTab={activeTab} activeDocId={activeDocId} filename={activeName} />
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
