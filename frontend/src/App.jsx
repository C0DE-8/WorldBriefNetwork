import { useCallback, useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Seo from './components/Seo'
import Preloader from './components/Preloader/Preloader'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ContentProvider } from './context/ContentContext'
import { api } from './api/api.js'
import Home from './pages/Home/Home'
import Listing from './pages/Listing/Listing'
import Article from './pages/Article/Article'
import Info from './pages/Info/Info'
import Auth from './pages/Auth/Auth'
import ForgotPassword from './pages/ForgotPassword/ForgotPassword'
import AdminLayout from './pages/Admin/AdminLayout'
import AdminLogin from './pages/Admin/AdminLogin'
import Dashboard from './pages/Admin/Dashboard'
import Stories from './pages/Admin/Stories'
import StoryEditor from './pages/Admin/StoryEditor'
import Authors from './pages/Admin/Authors'
import Moderation from './pages/Admin/Moderation'
import Contacts from './pages/Admin/Contacts'
import Users from './pages/Admin/Users'
import NotFound from './pages/NotFound/NotFound'
import Author from './pages/Author/Author'

function AppRoutes() {
  const { user } = useAuth()
  const [saved,setSaved] = useState(()=>{try{return JSON.parse(localStorage.getItem('wbn-saved')||'[]')}catch{return []}})
  useEffect(()=>{if(user)api('/me/bookmarks').then(({data})=>setSaved(data.map(item=>item.id))).catch(()=>{})},[user])
  const onSave=useCallback(async(id)=>{const saving=!saved.includes(id);setSaved(current=>saving?[...current,id]:current.filter(item=>item!==id));if(user){try{await api(`/me/bookmarks/${id}`,{method:saving?'PUT':'DELETE'})}catch{setSaved(current=>saving?current.filter(item=>item!==id):[...current,id])}}else{setSaved(current=>{localStorage.setItem('wbn-saved',JSON.stringify(current));return current})}},[saved,user])
  const props={saved,onSave}
  return <><Seo/><Routes>
    <Route path="admin/login" element={<AdminLogin/>}/>
    <Route path="admin" element={<AdminLayout/>}>
      <Route index element={<Dashboard/>}/><Route path="stories" element={<Stories/>}/><Route path="stories/new" element={<StoryEditor/>}/><Route path="stories/:id" element={<StoryEditor/>}/><Route path="authors" element={<Authors/>}/><Route path="moderation" element={<Moderation/>}/><Route path="contacts" element={<Contacts/>}/><Route path="users" element={<Users/>}/>
    </Route>
    <Route element={<Layout saved={saved}/>}>
      <Route index element={<Home {...props}/>}/><Route path="category/:category" element={<Listing {...props}/>}/><Route path="article/:id" element={<Article {...props} key={window.location.pathname}/>}/><Route path="author/:slug" element={<Author {...props}/>}/><Route path="login" element={<Auth mode="login"/>}/><Route path="signup" element={<Auth mode="signup"/>}/><Route path="forgot-password" element={<ForgotPassword/>}/>
      {['search','saved','trending','following'].map(type=><Route key={type} path={type} element={<Listing type={type} {...props}/>}/>)}
      {['about','contact','privacy','newsletter'].map(type=><Route key={type} path={type} element={<Info key={type} type={type}/>}/>)}
      <Route path="*" element={<NotFound/>}/>
    </Route>
  </Routes></>
}
export default function App(){return <AuthProvider><BrowserRouter><ContentProvider><Preloader/><AppRoutes/></ContentProvider></BrowserRouter></AuthProvider>}
