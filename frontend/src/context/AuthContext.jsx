import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../api/api.js'

const AuthContext = createContext(null)
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => { api('/auth/me').then(({ data }) => setUser(data)).catch(() => setUser(null)).finally(() => setReady(true)) }, [])

  async function signUp({ name, email, password }) {
    const { data } = await api('/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) })
    setUser(data)
    return data
  }

  async function signIn({ email, password }) {
    const { data } = await api('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
    setUser(data)
    return data
  }

  async function resetPassword({ email }) {
    await api('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) })
  }

  async function updateProfile(values) { const {data}=await api('/auth/profile',{method:'PATCH',body:JSON.stringify(values)});if(!data.pending)setUser(data);return data }
  async function changePassword(values) { return api('/auth/password',{method:'PATCH',body:JSON.stringify(values)}) }
  async function requestAccountDeletion() { return api('/auth/delete-account-request',{method:'POST'}) }

  async function signOut() {
    await api('/auth/logout', { method: 'POST' }).catch(() => {})
    setUser(null)
  }

  const value = useMemo(() => ({ user, ready, signUp, signIn, signOut, resetPassword, updateProfile, changePassword, requestAccountDeletion }), [user, ready])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
