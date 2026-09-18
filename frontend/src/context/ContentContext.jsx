import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../api/api.js'
import { stories as fallbackStories, categories as fallbackCategories } from '../data/stories'

const ContentContext = createContext(null)

export function ContentProvider({ children }) {
  const [stories, setStories] = useState(fallbackStories)
  const [categories, setCategories] = useState(fallbackCategories)
  const [backendReady, setBackendReady] = useState(false)

  useEffect(() => {
    let current = true
    Promise.all([api('/stories?limit=100'), api('/categories')])
      .then(([storyResponse, categoryResponse]) => {
        if (!current) return
        setStories(storyResponse.data)
        setCategories(categoryResponse.data.map((item) => item.name))
        setBackendReady(true)
      })
      .catch(() => setBackendReady(false))
    return () => { current = false }
  }, [])

  const value = useMemo(() => ({ stories, categories, backendReady }), [stories, categories, backendReady])
  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useContent() {
  const value = useContext(ContentContext)
  if (!value) throw new Error('useContent must be used inside ContentProvider')
  return value
}
