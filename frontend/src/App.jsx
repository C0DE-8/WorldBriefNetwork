import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Listing from './pages/Listing'
import Article from './pages/Article'
import Info from './pages/Info'
function ScrollToTop(){const {pathname}=useLocation();useEffect(()=>{window.scrollTo(0,0);document.title=pathname==='/'?'WorldBriefNetwork — Stay curious. Stay informed.':`${pathname.split('/').pop().replaceAll('-',' ')} | WorldBriefNetwork`},[pathname]);return null}
export default function App(){const [saved,setSaved]=useState(()=>{try{const value=JSON.parse(localStorage.getItem('wbn-saved')||'[]');return Array.isArray(value)?value:[]}catch{return []}});function onSave(id){setSaved(previous=>{const next=previous.includes(id)?previous.filter(x=>x!==id):[...previous,id];localStorage.setItem('wbn-saved',JSON.stringify(next));return next})}const props={saved,onSave};return <BrowserRouter><ScrollToTop/><Routes><Route element={<Layout saved={saved}/>}><Route index element={<Home {...props}/>}/><Route path="category/:category" element={<Listing {...props}/>}/><Route path="article/:id" element={<Article {...props} key={window.location.pathname}/>}/>{['search','saved','trending'].map(type=><Route key={type} path={type} element={<Listing type={type} {...props}/>}/>)}{['about','contact','privacy','newsletter'].map(type=><Route key={type} path={type} element={<Info key={type} type={type}/>}/>)}<Route path="*" element={<Info type="notfound"/>}/></Route></Routes></BrowserRouter>}
