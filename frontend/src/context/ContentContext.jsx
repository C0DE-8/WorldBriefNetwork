import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../api/api.js'

const ContentContext = createContext(null)

export function ContentProvider({ children }) {
  const [stories, setStories] = useState([])
  const [categories, setCategories] = useState([])
  const [backendReady, setBackendReady] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let current = true
    Promise.all([api('/stories?limit=100'), api('/categories')])
      .then(([storyResponse, categoryResponse]) => {
        if (!current) return
        setStories(storyResponse.data)
        setCategories(categoryResponse.data.map((item) => item.name))
        setBackendReady(true)
      })
      .catch((requestError) => { setBackendReady(false); setError(requestError.message || 'The publication API is unavailable.') })
    return () => { current = false }
  }, [])

  const value = useMemo(() => ({ stories, categories, backendReady }), [stories, categories, backendReady])
  if (error) return <main style={{minHeight:'100vh',display:'grid',placeItems:'center',padding:30,textAlign:'center'}}><div><h1>WorldBriefNetwork is temporarily unavailable.</h1><p>{error}</p><button className="darkButton" onClick={()=>window.location.reload()}>Try again</button></div></main>
  if (!backendReady) return <main style={{minHeight:'100vh',display:'grid',placeItems:'center'}} aria-live="polite">Loading WorldBriefNetwork…</main>
  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useContent() {
  const value = useContext(ContentContext)
  if (!value) throw new Error('useContent must be used inside ContentProvider')
  return value
}
