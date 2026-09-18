import axios from 'axios'

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1').replace(/\/$/, '')

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.response.use(
  (response) => response,
  (requestError) => {
    const payload = requestError.response?.data
    const error = new Error(payload?.error?.message || 'The request could not be completed.')
    error.code = payload?.error?.code
    error.fields = payload?.error?.fields
    error.status = requestError.response?.status
    return Promise.reject(error)
  },
)

export async function api(path, options = {}) {
  const { body, ...config } = options
  const response = await apiClient.request({
    url: path,
    ...config,
    data: typeof body === 'string' ? JSON.parse(body) : body,
  })
  return response.data
}
