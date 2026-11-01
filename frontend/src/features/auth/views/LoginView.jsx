import { useEffect, useState } from 'react'
import UserLoginView from './UserLoginView'
import AdminLoginView from './AdminLoginView'

export default function LoginView() {
  const [isAdminPath, setIsAdminPath] = useState(
    typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')
  )

  useEffect(() => {
    const handlePopState = () => {
      setIsAdminPath(window.location.pathname.startsWith('/admin'))
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  if (isAdminPath) {
    return <AdminLoginView />
  }

  return <UserLoginView />
}
