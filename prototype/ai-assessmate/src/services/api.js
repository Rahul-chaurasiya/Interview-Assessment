import axios from 'axios'
export const getDashboardStats = () =>
  api.get("/dashboard/stats");

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Candidate APIs
export const createCandidate = (data) =>
  api.post('/interview/create-candidate', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

export const uploadAudio = (candidateId, file) => {
  const formData = new FormData()
  formData.append('candidate_id', candidateId)
  formData.append('file', file)
  return api.post('/interview/upload-audio', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export const getInterviewDetails = (interviewId) =>
  api.get(`/interview/interview/${interviewId}`)

// Assessment APIs
export const transcribeInterview = (interviewId) =>
  api.post(`/assessment/transcribe/${interviewId}`)

export const fetchTranscriptionData = (interviewId) =>
  api.get(`/interview/transcription/${interviewId}`);


export const evaluateInterview = (interviewId) =>
  api.post(`/assessment/evaluate/${interviewId}`)

export const getCandidatesList = () =>
  api.get('/candidates/list')

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



// ✅ Backend base URL (FastAPI)
const API_BASE = "http://127.0.0.1:8000";

export const getAllInterviews = async () => {
  const res = await axios.get(`${API_BASE}/history/list`);
  return res.data;
};
export default api







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
