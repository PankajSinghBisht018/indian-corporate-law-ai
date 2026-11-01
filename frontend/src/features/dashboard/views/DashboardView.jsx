import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, CheckCircle2, Clock4, Upload, Terminal, FileCode2, Cpu, Shield, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../auth/models/authStore'
import { useFileStore } from '../../documents/models/fileStore'
import { useUIStore } from '../../../shared/store/uiStore'
import { documentAPI, summarizeAPI } from '../../../shared/utils/api'

const fadeItem = (i) => ({ initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.07, duration: 0.45, ease: [0.16, 1, 0.3, 1] } })

function Stat({ icon: Icon, label, value, color, delay }) {
  return (
    <motion.div {...fadeItem(delay)} className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-md border border-gray-200 dark:border-neutral-800 rounded-2xl p-6 flex items-center gap-4 hover:border-orange-500/40 hover:shadow-lg transition-all cursor-default">
      <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: `color-mix(in srgb, ${color} 12%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 22%, transparent)` }}>
        <Icon size={22} color={color} />
      </div>
      <div>
        <div className="font-outfit text-3xl font-black text-gray-900 dark:text-white leading-none tracking-tight">{value}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 font-medium font-poppins">{label}</div>
      </div>
    </motion.div>
  )
}

function FeatureCard({ icon: Icon, title, desc, delay }) {
  return (
    <motion.div {...fadeItem(delay)} className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-md border border-gray-200 dark:border-neutral-800 rounded-2xl p-6 hover:border-orange-500/40 transition-all cursor-default">
      <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-4">
        <Icon size={18} className="text-orange-500" />
      </div>
      <div className="font-outfit text-sm font-bold text-gray-900 dark:text-white mb-2">{title}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-poppins">{desc}</div>
    </motion.div>
  )
}

export default function Dashboard() {
  const { user } = useAuthStore()
  const { files, setFiles } = useFileStore()
  const { setPage } = useUIStore()
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef(null)

  const isAdmin = user?.role === 'admin'

  useEffect(() => { 
    documentAPI.list().then((r) => setFiles(r.documents || [])).catch(() => {}) 
  }, [])

  const done = files.filter((f) => ['done', 'completed'].includes(f.status)).length
  const processing = files.filter((f) => ['processing', 'uploaded', 'queued', 'extracting', 'chunking', 'embedding', 'indexing', 'analyzing'].includes(f.status)).length
  const recent = files.slice(0, 6)

  const handleFile = async (file) => {
    if (!file) return
    setUploading(true)
    const tid = toast.loading(`Uploading ${file.name}…`)
    try {
      const res = await documentAPI.upload(file)
      try { await summarizeAPI.trigger(res.doc_id) } catch {}
      toast.success('Uploaded successfully!', { id: tid })
      const updated = await documentAPI.list()
      setFiles(updated.documents || [])
    } catch (err) { 
      toast.error(err.message, { id: tid }) 
    } finally { 
      setUploading(false) 
    }
  }

  const onDrop = (e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]) }
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="relative w-full min-h-full overflow-hidden bg-transparent">
      
      {/* ── Ambient Orbs ── */}
      <div className="absolute rounded-full pointer-events-none blur-[80px] bg-orange-500 w-[500px] h-[500px] -top-20 -right-20 opacity-10 dark:opacity-5 z-0" />
      <div className="absolute rounded-full pointer-events-none blur-[80px] bg-orange-500 w-[400px] h-[400px] bottom-0 -left-20 opacity-10 dark:opacity-[3%] z-0" />

      {/* ── Main Content ── */}
      <div className="p-4 md:p-8 max-w-6xl flex flex-col gap-8 mx-auto relative z-10">
        <motion.div {...fadeItem(0)}>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-xs text-gray-500 font-bold tracking-widest uppercase font-outfit">{greeting}</span>
            <span className="text-[10px] bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold px-2 py-0.5 rounded-md border border-orange-500/20 uppercase tracking-wider font-outfit">
              AI-Driven Document Summarization
            </span>
          </div>
          <h1 className="font-outfit text-4xl font-black text-gray-900 dark:text-white leading-tight tracking-tight m-0">
            {user?.name || user?.email?.split('@')[0] || 'IT Counselor'}&nbsp;<span className="text-orange-500">✦</span>
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 font-poppins">
            Specialized legal intelligence for Information Technology (IT) departments: Corporate contracts, MSAs, SaaS SLAs &amp; DPDP compliance.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Stat icon={FileText} label="Total Documents" value={files.length} color="#f97316" delay={1} />
          <Stat icon={CheckCircle2} label="Analyzed" value={done} color="#22c55e" delay={2} />
          <Stat icon={Clock4} label="Processing" value={processing} color="#f59e0b" delay={3} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div {...fadeItem(4)} className={`bg-white/60 dark:bg-neutral-900/60 backdrop-blur-md border border-gray-200 dark:border-neutral-800 rounded-2xl p-8 shadow-sm ${recent.length === 0 ? 'md:col-span-2' : ''}`}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
                <Upload size={18} className="text-orange-500" />
              </div>
              <div>
                <div className="font-outfit text-base font-bold text-gray-900 dark:text-white">Upload IT Agreement / Contract</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 font-poppins mt-0.5">
                  PDF · DOCX · TXT · {isAdmin ? 'Unlimited for Admin' : 'Limit 5 documents for User'}
                </div>
              </div>
            </div>
            <div
              className={`border-2 border-dashed rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-4 transition-all duration-200 bg-white/40 dark:bg-neutral-950/40 ${dragging ? 'border-orange-500 bg-orange-500/10' : 'border-gray-300 dark:border-neutral-700 hover:border-orange-500 hover:bg-orange-500/5'} ${uploading ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={onDrop} onClick={() => !uploading && inputRef.current?.click()}
            >
              <input ref={inputRef} type="file" className="hidden" onChange={(e) => handleFile(e.target.files[0])} disabled={uploading} accept=".pdf,.doc,.docx" />
              {uploading ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 size={32} className="animate-spin text-orange-500" />
                  <span className="text-sm text-gray-500 dark:text-gray-400 font-poppins">Uploading IT contract...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload size={28} className="text-gray-400 dark:text-gray-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300 font-semibold font-outfit mt-2">Click to browse or drop IT contract file</span>
                  <span className="text-xs text-gray-500 font-poppins">MSA, SaaS, SLA, DPDP Policy, or Software License</span>
                </div>
              )}
            </div>
          </motion.div>

          {recent.length > 0 && (
            <motion.div {...fadeItem(5)} className="bg-white/60 dark:bg-neutral-900/60 backdrop-blur-md border border-gray-200 dark:border-neutral-800 rounded-2xl p-6 flex flex-col gap-4 shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <div className="font-outfit text-base font-bold text-gray-900 dark:text-white">Recent Documents</div>
                <button onClick={() => setPage('documents')} className="text-orange-500 text-xs font-bold font-outfit hover:underline underline-offset-2">View all</button>
              </div>
              <div className="flex flex-col gap-2.5">
                 {recent.map(doc => (
                   <div key={doc.doc_id} className="bg-white/80 dark:bg-black/60 border border-gray-200 dark:border-neutral-800 rounded-xl p-3 flex items-center gap-3 cursor-pointer hover:border-orange-500/50 hover:shadow-sm transition-all" onClick={() => setPage('documents')}>
                      <FileText size={16} className="text-orange-500 shrink-0" />
                      <span className="text-sm font-semibold text-gray-900 dark:text-white truncate font-outfit">{doc.filename}</span>
                   </div>
                 ))}
              </div>
            </motion.div>
          )}

          <FeatureCard 
            icon={Terminal} 
            title="IT Act 2000 & DPDP Act 2023" 
            desc="Statutory framework for digital contracts, data fiduciary compliance, CERT-In reporting & cyber governance." 
            delay={6} 
          />
          <FeatureCard 
            icon={FileCode2} 
            title="Tech Clauses & 99.9% SLA" 
            desc="Instant analysis of uptime, latency, source code escrow, software license scope, and developer IP work-for-hire." 
            delay={7} 
          />
        </div>
      </div>
    </div>
  )
}
