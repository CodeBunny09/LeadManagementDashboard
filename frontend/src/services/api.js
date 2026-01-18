import axios from "axios"

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json"
  }
})

// Always attach token immediately if present
const token = localStorage.getItem("token")
if (token) {
  API.defaults.headers.common["Authorization"] = `Bearer ${token}`
}

// Also keep interceptor for future updates
API.interceptors.request.use((config) => {
  const freshToken = localStorage.getItem("token")
  if (freshToken) {
    config.headers.Authorization = `Bearer ${freshToken}`
  }
  return config
})

export default API
