import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Log API calls in development
if (import.meta.env.DEV) {
  api.interceptors.request.use((config) => {
    console.log(`📤 API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`)
    return config
  })
  api.interceptors.response.use(
    (response) => {
      console.log(`📥 API Response: ${response.status} ${response.config.url}`)
      return response
    },
    (error) => {
      console.error(`❌ API Error: ${error.config?.url}`, error.response?.data || error.message)
      return Promise.reject(error)
    }
  )
}

// Candidate APIs
export const createCandidate = (data) =>
  api.post('/interview/create-candidate', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

export const getDashboardStats = () =>
  api.get("/dashboard/stats");

export const uploadAudio = (candidateId, file) => {
  const formData = new FormData()
  formData.append('candidate_id', candidateId)
  formData.append('file', file)
  return api.post('/interview/upload-audio', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const getInterviewDetails = (interviewId) =>
  api.get(`/interview/${interviewId}`)

// Assessment APIs
export const transcribeInterview = (interviewId) =>
  api.post(`/assessment/transcribe/${interviewId}`)

export const fetchTranscriptionData = (interviewId) =>
  api.get(`/interview/transcription/${interviewId}`);


export const evaluateInterview = (interviewId) =>
  api.post(`/assessment/evaluate/${interviewId}`)

export const getCandidatesList = () =>
  api.get('/candidates/list')

export const getCandidateById = (candidateId) =>
  api.get(`/candidates/${candidateId}`)

export const getInterviewsList = (status) =>
  api.get(`/candidates/interviews/list?status=${status}`)

// ===============================
// 📜 HISTORY & EVALUATION APIs
// ===============================

// Get all interviews & assessments for one candidate
export const getCandidateHistory = (candidateId) =>
  api.get(`/history/candidate/${candidateId}`)

// Get full details for a specific interview
export const getInterviewHistory = (interviewId) =>
  api.get(`/history/interview/${interviewId}`)

// Get recent interviews (for dashboard or summary)
export const getAllInterviewSummaries = (limit = 50, offset = 0) =>
  api.get(`/history/list?limit=${limit}&offset=${offset}`)

// ===============================
// 📋 INTERVIEWS APIs
// ===============================

// Get all interviews with pagination
export const getAllInterviews = (params = '') => {
  if (params) {
    return api.get(`/interviews?${params}`)
  }
  return api.get('/interviews')
}

// Get recent interviews for dashboard
export const getRecentInterviews = (limit = 3) => {
  return api.get(`/interviews/recent?limit=${limit}`)
}

// Get interview by ID
export const getInterviewById = (id) => {
  return api.get(`/interviews/${id}`)
}

// Get interviews statistics
export const getInterviewsStats = () => {
  return api.get('/interviews/stats/summary')
}

// ===============================
// �� QUESTION BANK APIs
// ===============================

// Get all available roles
export const getRoles = () =>
  api.get('/questions/roles')

// Get all question categories
export const getCategories = () =>
  api.get('/questions/categories')

// ===============================
// 📋 CONFIG APIs (New - from config tables)
// ===============================

// Get all roles from config table
export const getConfigRoles = () =>
  api.get('/config/roles')

// Get all categories from config table
export const getConfigCategories = () =>
  api.get('/config/categories')

// Get all difficulties from config table
export const getConfigDifficulties = () =>
  api.get('/config/difficulties')

// Get all config (roles, categories, difficulties) in one call
export const getAllConfig = () =>
  api.get('/config/all')

// Get topics for a category
export const getTopics = (category, role) => {
  const params = new URLSearchParams({ category })
  if (role) params.append('role', role)
  return api.get(`/questions/topics?${params}`)
}

// Get filtered questions
export const getQuestions = (role, category, topic, difficulty, limit = 50) => {
  const params = new URLSearchParams()
  if (role) params.append('role', role)
  if (category) params.append('category', category)
  if (topic) params.append('topic', topic)
  if (difficulty) params.append('difficulty', difficulty)
  params.append('limit', limit)
  return api.get(`/questions?${params}`)
}

// Generate question set based on criteria
export const generateQuestions = (data) =>
  api.post('/questions/generate', data)

// Get questions assigned to an interview
export const getInterviewQuestions = (interviewId) =>
  api.get(`/questions/interview/${interviewId}`)

// Assign questions to an interview
export const assignQuestionsToInterview = (interviewId, questions) =>
  api.post(`/questions/interview/${interviewId}`, questions)

// Update question status
export const updateQuestionStatus = (interviewId, questionId, asked, answered) => {
  const params = new URLSearchParams()
  if (asked !== undefined) params.append('asked', asked)
  if (answered !== undefined) params.append('answered', answered)
  return api.patch(`/questions/interview/${interviewId}/question/${questionId}?${params}`)
}

export default api



// ============================================================
// LIVE INTERVIEW APIs (Flow 2 - Question by Question)
// ============================================================

// Start a live interview session
export const startLiveInterview = (data) =>
  api.post('/live-interview/start', data)

// Get session status and current question
export const getLiveSessionStatus = (sessionId) =>
  api.get(`/live-interview/session/${sessionId}`)

// Get next question
export const getNextQuestion = (sessionId) =>
  api.get(`/live-interview/question/${sessionId}/next`)

// Save question response (with audio)
export const saveQuestionResponse = async (sessionId, questionId, audioFile, responseText, responseTimeSeconds) => {
  const formData = new FormData()
  formData.append('question_id', questionId)
  formData.append('response_time_seconds', responseTimeSeconds)
  if (audioFile) {
    formData.append('audio', audioFile)
  }
  if (responseText) {
    formData.append('response_text', responseText)
  }
  return api.post(`/live-interview/response/${sessionId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

// Generate follow-up question
export const generateFollowUp = (sessionId, questionId) =>
  api.post(`/live-interview/followup/${sessionId}?question_id=${questionId}`)

// Complete interview and get evaluation
export const completeLiveInterview = (sessionId) =>
  api.post(`/live-interview/complete/${sessionId}`)

// Get detailed results
export const getLiveInterviewResults = (sessionId) =>
  api.get(`/live-interview/results/${sessionId}`)

// Delete session
export const deleteLiveSession = (sessionId) =>
  api.delete(`/live-interview/session/${sessionId}`)







// import axios from 'axios';

// const API_BASE = 'http://localhost:8000';

// export const createCandidate = (data) =>
//   axios.post(`${API_BASE}/interview/create-candidate`, data);

// export const uploadAudio = (candidateId, file) => {
//   const formData = new FormData();
//   formData.append('candidate_id', candidateId);
//   formData.append('file', file);
//   return axios.post(`${API_BASE}/interview/upload-audio`, formData);
// };

// export const transcribeInterview = (interviewId) =>
//   axios.post(`${API_BASE}/assessment/transcribe/${interviewId}`);

// export const evaluateInterview = (interviewId) =>
//   axios.post(`${API_BASE}/assessment/evaluate/${interviewId}`);

// export const getInterviewDetails = (candidateId) =>
//   axios.get(`${API_BASE}/interview/interview/${candidateId}`);

// export const getCandidatesList = () =>
//   axios.get(`${API_BASE}/candidates`);
