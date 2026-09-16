import { createContext, useContext, useMemo, useState } from 'react'

const AuthContext = createContext(null)
const USERS_KEY = 'wbn-demo-users'
const SESSION_KEY = 'wbn-demo-session'

function readStorage(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || 'null')
    return value ?? fallback
  } catch {
    return fallback
  }
}

async function hashPassword(email, password) {
  const bytes = new TextEncoder().encode(`${email.toLowerCase().trim()}:${password}`)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readStorage(SESSION_KEY, null))

  async function signUp({ name, email, password }) {
    const normalizedEmail = email.toLowerCase().trim()
    const users = readStorage(USERS_KEY, [])
    if (users.some((account) => account.email === normalizedEmail)) throw new Error('An account with this email already exists.')
    const account = {
      id: crypto.randomUUID(),
      name: name.trim(),
      email: normalizedEmail,
      passwordHash: await hashPassword(normalizedEmail, password),
      joinedAt: new Date().toISOString(),
    }
    localStorage.setItem(USERS_KEY, JSON.stringify([...users, account]))
    const session = { id: account.id, name: account.name, email: account.email }
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    setUser(session)
    return session
  }

  async function signIn({ email, password }) {
    const normalizedEmail = email.toLowerCase().trim()
    const passwordHash = await hashPassword(normalizedEmail, password)
    const account = readStorage(USERS_KEY, []).find((item) => item.email === normalizedEmail && item.passwordHash === passwordHash)
    if (!account) throw new Error('The email or password is incorrect.')
    const session = { id: account.id, name: account.name, email: account.email }
    localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    setUser(session)
    return session
  }

  function signOut() {
    localStorage.removeItem(SESSION_KEY)
    setUser(null)
  }

  const value = useMemo(() => ({ user, signUp, signIn, signOut }), [user])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
