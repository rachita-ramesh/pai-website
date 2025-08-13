// API configuration for frontend
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '' // Use relative URLs for Vercel API routes
  : 'http://localhost:8000' // Local development

export const API_ENDPOINTS = {
  startInterview: `${API_BASE_URL}/api/start-interview`,
  sendMessage: `${API_BASE_URL}/api/send-message`,
  chat: `${API_BASE_URL}/api/chat`,
  createProfile: `${API_BASE_URL}/api/create-profile`,
  validation: {
    survey: `${API_BASE_URL}/api/validation/survey`,
    predict: `${API_BASE_URL}/api/validation/predict`,
    compare: `${API_BASE_URL}/api/validation/compare`,
    saveResults: `${API_BASE_URL}/api/validation/save-results`,
    history: `${API_BASE_URL}/api/validation/history`,
    results: (profileId: string) => `${API_BASE_URL}/api/validation/results/${profileId}`,
    detailResults: (sessionId: string) => `${API_BASE_URL}/api/validation/detail/${sessionId}`
  }
}