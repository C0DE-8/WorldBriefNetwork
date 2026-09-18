import { api } from '../../api/api.js'

export const getDashboard = () => api('/admin/dashboard')
export const getAdminStories = () => api('/admin/stories')
export const updateStoryStatus = (id, status) => api(`/admin/stories/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
export const getContacts = () => api('/admin/contacts')
export const updateContactStatus = (id, status) => api(`/admin/contacts/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
export const getComments = () => api('/admin/comments')
export const updateCommentStatus = (id, status) => api(`/admin/comments/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
export const getUsers = () => api('/admin/users')
export const updateUserStatus = (id, status) => api(`/admin/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
