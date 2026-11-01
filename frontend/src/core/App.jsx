import { useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import { useAuthStore } from '../features/auth/models/authStore'
import UserLogin from '../features/auth/views/UserLoginView'
import AdminLogin from '../features/auth/views/AdminLoginView'
import Layout from './LayoutView'
import { PageLoader } from '../shared/ui/Loader'

export default function App() {
  const { isLoggedIn } = useAuthStore()
  const [appReady, setAppReady] = useState(false)
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith('/admin')

  useEffect(() => {
    const t = setTimeout(() => setAppReady(true), 600)
    return () => clearTimeout(t)
  }, [])

  return (
    <>
      <AnimatePresence>
        {!appReady && <PageLoader show message="Initializing…" />}
      </AnimatePresence>
      {appReady && (
        isLoggedIn 
          ? <Layout /> 
          : isAdminRoute 
            ? <AdminLogin /> 
            : <UserLogin />
      )}
    </>
  )
}
