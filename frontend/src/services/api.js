import axios from 'axios'

const API_BASE = '/api'

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
})

// ============ DASHBOARD ============
export const getDashboardStats = async () => {
  const [criminals, thanas, jails, arrests] = await Promise.all([
    api.get('/criminals/stats'),
    api.get('/thanas/stats'),
    api.get('/jails/stats'),
    api.get('/arrests/stats')
  ])
  return {
    criminals: criminals.data,
    thanas: thanas.data,
    jails: jails.data,
    arrests: arrests.data
  }
}

// ============ CRIMINALS ============
export const getCriminals = () => api.get('/criminals').then(r => r.data)
export const getCriminal = (id) => api.get(`/criminals/${id}`).then(r => r.data)
export const createCriminal = (data) => api.post('/criminals', data).then(r => r.data)
export const updateCriminal = (id, data) => api.put(`/criminals/${id}`, data).then(r => r.data)
export const deleteCriminal = (id) => api.delete(`/criminals/${id}`).then(r => r.data)
export const searchCriminals = (query) => api.get(`/criminals/search?q=${query}`).then(r => r.data)
export const getCriminalNetwork = (id) => api.get(`/criminals/${id}/network`).then(r => r.data)

// ============ ARRESTS ============
export const getArrests = () => api.get('/arrests').then(r => r.data)
export const getArrest = (id) => api.get(`/arrests/${id}`).then(r => r.data)
export const createArrest = (data) => api.post('/arrests', data).then(r => r.data)
export const updateArrest = (id, data) => api.put(`/arrests/${id}`, data).then(r => r.data)

// ============ JAILS ============
export const getJails = () => api.get('/jails').then(r => r.data)
export const getJail = (id) => api.get(`/jails/${id}`).then(r => r.data)
export const createJail = (data) => api.post('/jails', data).then(r => r.data)
export const getJailCells = (id) => api.get(`/jails/${id}/cells`).then(r => r.data)

// ============ THANAS ============
export const getThanas = () => api.get('/thanas').then(r => r.data)
export const getThana = (id) => api.get(`/thanas/${id}`).then(r => r.data)
export const createThana = (data) => api.post('/thanas', data).then(r => r.data)
export const updateThana = (id, data) => api.put(`/thanas/${id}`, data).then(r => r.data)
export const deleteThana = (id) => api.delete(`/thanas/${id}`).then(r => r.data)

// ============ OFFICERS ============
export const getOfficers = () => api.get('/officers').then(r => r.data)
export const getOfficer = (id) => api.get(`/officers/${id}`).then(r => r.data)
export const createOfficer = (data) => api.post('/officers', data).then(r => r.data)
export const updateOfficer = (id, data) => api.put(`/officers/${id}`, data).then(r => r.data)
export const deleteOfficer = (id) => api.delete(`/officers/${id}`).then(r => r.data)
export const getRanks = () => api.get('/officers/ranks/all').then(r => r.data)

// ============ CASES ============
export const getCases = () => api.get('/cases').then(r => r.data)
export const getCase = (id) => api.get(`/cases/${id}`).then(r => r.data)
export const createCase = (data) => api.post('/cases', data).then(r => r.data)
export const updateCase = (id, data) => api.put(`/cases/${id}`, data).then(r => r.data)
export const updateCaseStatus = (id, status) => api.put(`/cases/${id}/status`, { status }).then(r => r.data)
export const deleteCase = (id) => api.delete(`/cases/${id}`).then(r => r.data)

// ============ GD REPORTS ============
export const getGDReports = () => api.get('/gd-reports').then(r => r.data)
export const getGDReport = (id) => api.get(`/gd-reports/${id}`).then(r => r.data)
export const createGDReport = (data) => api.post('/gd-reports', data).then(r => r.data)
export const updateGDReportStatus = (id, status, officerId) => 
  api.put(`/gd-reports/${id}`, { status, approved_by_officer_id: officerId }).then(r => r.data)

// ============ INCARCERATIONS ============
export const getIncarcerations = () => api.get('/incarcerations').then(r => r.data)
export const getActiveIncarcerations = () => api.get('/incarcerations/active').then(r => r.data)
export const createIncarceration = (data) => api.post('/incarcerations', data).then(r => r.data)
export const releaseIncarceration = (id) => api.post(`/incarcerations/${id}/release`).then(r => r.data)

// ============ BAIL RECORDS ============
export const getBailRecords = () => api.get('/bail-records').then(r => r.data)
export const createBailRecord = (data) => api.post('/bail-records', data).then(r => r.data)
export const updateBailRecord = (id, data) => api.put(`/bail-records/${id}`, data).then(r => r.data)
export const revokeBail = (id) => api.post(`/bail-records/${id}/revoke`).then(r => r.data)

// ============ ANALYTICS ============
export const getQueryPerformance = () => api.get('/analytics/performance').then(r => r.data)
export const getThanaSummary = () => api.get('/analytics/thana-summary').then(r => r.data)
export const getJailOccupancy = () => api.get('/analytics/jail-occupancy').then(r => r.data)
export const getRiskDistribution = () => api.get('/analytics/risk-distribution').then(r => r.data)
export const getArrestTrends = () => api.get('/analytics/arrest-trends').then(r => r.data)

export default api
