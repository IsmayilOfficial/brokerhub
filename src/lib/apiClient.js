import axios from 'axios'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  headers: {
    Accept: 'application/json',
  },
})

export const brokerApi = {
  getBrokers(params) {
    return apiClient.get('/brokers', { params })
  },
  getBroker(slug) {
    return apiClient.get(`/brokers/${encodeURIComponent(slug)}`)
  },
  search(query) {
    return apiClient.get('/search', { params: { query } })
  },
  compare(ids) {
    return apiClient.get('/compare', { params: { ids: ids.join(',') } })
  },
  getRankings(params) {
    return apiClient.get('/rankings', { params })
  },
}
