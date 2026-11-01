import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, ChevronRight, Sparkles } from 'lucide-react'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from '../features/auth/models/authStore'
import { useUIStore } from '../shared/store/uiStore'
import { useFileStore } from '../features/documents/models/fileStore'
import Sidebar from './SidebarView'
import Dashboard from '../features/dashboard/views/DashboardView'
import DocumentsView from '../features/documents/views/DocumentsView'
import AdminPanel from '../features/admin/views/AdminPanelView'
import QuickTourModal from '../features/onboarding/QuickTourModal'
import ProfilePageView from '../features/profile/views/ProfilePageView'
import { LegalBuddyLogo } from '../shared/ui/LegalBuddyLogo'

const PAGE_TITLES = { 
  dashboard: 'Dashboard', 
  documents: 'Documents', 
  profile: 'Profile Management',
  admin_overview: 'Admin Dashboard',
  admin_users: 'All Users',
  admin_user_detail: 'User Details',
  admin_agents: 'All Users',
  admin_agent_detail: 'User Details'
}

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
  exit:    { opacity: 0, y: -6, transition: { duration: 0.18 } },
}

function TopBar() {
  const { page, setPage, setSidebarOpen } = useUIStore()
  const { user } = useAuthStore()
  const { files, activeDocId } = useFileStore()
  const activeDoc = activeDocId ? files.find(f => f.doc_id === activeDocId) : null
  const isAdmin = user?.role === 'admin'

  return (
    <header className="h-16 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-200 dark:border-neutral-800 flex items-center justify-between px-4 md:px-6 shrink-0 sticky top-0 z-20 transition-colors duration-300">
      <div className="flex items-center gap-3">
        <button
          className="md:hidden w-10 h-10 rounded-xl flex items-center justify-center bg-transparent border border-gray-200 dark:border-neutral-800 text-gray-500 dark:text-gray-400 transition-all duration-150 hover:bg-gray-100 dark:hover:bg-neutral-800 hover:text-gray-900 dark:hover:text-white"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={18} />
        </button>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-orange-500/10 border border-orange-500/20">
            <LegalBuddyLogo size={16} withGlow={false} className="shrink-0" />
            <span className="text-xs font-bold text-gray-800 dark:text-gray-200 font-outfit tracking-wide flex items-center gap-1">
              LegalBuddy <span className="text-[10px] text-orange-500 font-semibold ml-1">AI Summarization · IT Corporate Law</span>
            </span>
          </div>
          <ChevronRight size={14} className="text-gray-400 dark:text-gray-600" />
          <span className="text-sm font-bold text-gray-900 dark:text-white font-outfit">
            {PAGE_TITLES[page] || page}
          </span>
          {page === 'documents' && activeDoc && (
            <>
              <ChevronRight size={14} className="text-gray-400 dark:text-gray-600 shrink-0" />
              <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 font-poppins truncate max-w-[150px] sm:max-w-[200px] md:max-w-[300px]" title={activeDoc.filename}>
                {activeDoc.filename}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setPage('profile')}
          className="flex items-center gap-2.5 py-1.5 pr-4 pl-2 rounded-full bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 shadow-sm hover:border-orange-500/40 transition-all cursor-pointer group text-left"
          title="Profile Management Page"
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-600 to-orange-500 flex items-center justify-center text-xs font-extrabold text-white font-outfit shrink-0">
            {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 font-outfit max-w-[120px] truncate group-hover:text-orange-500 transition-colors">
              {user?.name || user?.email?.split('@')[0] || 'User'}
            </span>
            <span className="text-[9px] text-gray-400 font-poppins">
              {isAdmin ? 'Admin' : `${user?.daily_doc_count || 0}/5 docs`}
            </span>
          </div>
        </button>
      </div>
    </header>
  )
}

export default function Layout() {
  const { page, setPage } = useUIStore()
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'admin'
  const contentRef = useRef(null)

  const [showTour, setShowTour] = useState(() => {
    if (isAdmin) return false
    const userId = user?.user_id || user?.email || 'user'
    const isNewSignup = localStorage.getItem('lb_new_signup_tour') === 'true'
    const tourDone = localStorage.getItem(`lb_tour_completed_${userId}`)
    return isNewSignup && !tourDone
  })

  const closeTour = () => {
    const userId = user?.user_id || user?.email || 'user'
    try {
      localStorage.removeItem('lb_new_signup_tour')
      localStorage.removeItem('lb_show_tour')
      localStorage.setItem(`lb_tour_completed_${userId}`, 'true')
    } catch {}
    setShowTour(false)
  }

  useEffect(() => {
    // If admin is logged in and starts on dashboard, switch to admin overview
    if (isAdmin && (page === 'dashboard' || window.location.pathname.startsWith('/admin'))) {
      if (page === 'dashboard') {
        setPage('admin_overview')
      }
    } else if (!isAdmin && page.startsWith('admin_')) {
      setPage('dashboard')
    }
  }, [isAdmin])

  useEffect(() => {
    if (!contentRef.current) return
    import('gsap').then(({ gsap }) => {
      gsap.to(contentRef.current, { scrollTop: 0, duration: 0.45, ease: 'power2.out' })
    }).catch(() => {
      if (contentRef.current) contentRef.current.scrollTop = 0
    })
  }, [page])

  const renderContent = () => {
    switch (page) {
      case 'profile':
        return <ProfilePageView />
      case 'documents':
        return <DocumentsView />
      case 'admin_overview':
      case 'admin_users':
      case 'admin_user_detail':
      case 'admin_agents':
      case 'admin_agent_detail':
        return <AdminPanel />
      case 'dashboard':
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white dark:bg-black transition-colors duration-300 relative">
      
      {/* Fixed Toaster */}
      <Toaster
        position="top-right"
        toastOptions={{
          className: '!bg-white dark:!bg-neutral-900 !text-gray-900 dark:!text-white !border !border-gray-200 dark:!border-neutral-800 !rounded-xl !font-poppins !text-sm !shadow-lg',
          style: { background: 'transparent', color: 'inherit', boxShadow: 'none' } 
        }}
      />

      {/* Quick Glance Guided Tour Modal — Only for first-time new user signups */}
      <QuickTourModal isOpen={showTour} onClose={closeTour} />

      {/* Ambient Orbs */}
      <div className="absolute rounded-full pointer-events-none blur-[80px] bg-orange-500 w-[500px] h-[500px] -top-32 -right-24 opacity-10 dark:opacity-5 z-0" />
      <div className="absolute rounded-full pointer-events-none blur-[80px] bg-orange-500 w-[350px] h-[350px] -bottom-32 left-10 opacity-10 dark:opacity-5 z-0" />

      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden z-10">
        <TopBar />
        <main
          ref={contentRef}
          className={`flex-1 overflow-x-hidden relative ${
            ['documents', 'admin_overview', 'admin_users', 'admin_user_detail', 'admin_agents', 'admin_agent_detail'].includes(page) 
              ? 'flex flex-col min-h-0 overflow-hidden' 
              : 'overflow-y-auto pb-[env(safe-area-inset-bottom,16px)]'
          }`}
        >
          <AnimatePresence mode="wait">
            <motion.div 
              key={page.startsWith('admin_') ? 'admin' : page} 
              variants={pageVariants} 
              initial="initial" 
              animate="animate" 
              exit="exit" 
              className={`h-full ${page === 'documents' ? 'overflow-hidden' : ''}`}
            >
              {renderContent()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
