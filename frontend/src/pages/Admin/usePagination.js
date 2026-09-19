import { useState } from 'react'

export default function usePagination(items,pageSize=10){const [requestedPage,setPage]=useState(1);const pages=Math.max(1,Math.ceil(items.length/pageSize));const page=Math.min(requestedPage,pages);return{paged:items.slice((page-1)*pageSize,page*pageSize),page,pages,setPage,total:items.length,pageSize}}
