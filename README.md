# 🎯 AI Interview Assessment System

An intelligent platform designed to evaluate candidates' interview performance using AI-driven insights for objective, data-based assessments.

## 🚀 Features

- **🎤 Live Interview**: Real-time interview sessions with AI evaluation
- **📝 Question Generation**: AI-powered question creation based on role and category
- **🤖 Speech Recognition**: Audio transcription using OpenAI Whisper
- **📊 AI Evaluation**: Automated scoring and feedback generation
- **👥 Candidate Management**: Complete candidate lifecycle management
- **📈 Analytics Dashboard**: Performance insights and metrics

## 🏗️ Architecture

```plain
interview-assessment/
├── backend/                    # FastAPI Backend
│   ├── app/
│   │   ├── routes/            # API Endpoints
│   │   ├── services/          # Business Logic
│   │   └── database_mysql.py  # MySQL Connection
│   └── main.py               # FastAPI Application
├── prototype/ai-assessmate/    # React Frontend
│   ├── src/
│   │   ├── components/        # UI Components
│   │   ├── pages/            # Page Components
│   │   ├── services/         # API Services
│   │   ├── hooks/            # Custom Hooks
│   │   └── utils/            # Utility Functions
│   └── package.json
└── README.md
```

## 🛠️ Technology Stack

### Backend
- **FastAPI**: Modern Python web framework
- **MySQL**: Relational database
- **OpenAI Whisper**: Audio transcription
- **Google Gemini**: AI evaluation and recommendations

### Frontend
- **React 18**: Modern UI framework
- **TypeScript**: Type safety
- **Tailwind CSS**: Utility-first styling
- **Shadcn/ui**: Component library
- **Framer Motion**: Animations

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- MySQL 8.0+

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
# Configure .env file with MySQL settings
python -m uvicorn main:fastapi_app --reload
```

### Frontend Setup
```bash
cd prototype/ai-assessmate
npm install
npm run dev
```

### Database Setup
```bash
# Create MySQL database
mysql -u root -p
CREATE DATABASE interview_assessment;

# Tables will be created automatically on first run
```

## 📱 Access Points

- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 🔄 Core Flows

### 1. Live Interview Flow
```
Home → SelectRole → ShowQuestions → LiveInterviewV2 → LiveResults
```

### 2. Candidate Management Flow
```
CandidatesList → CreateCandidate → LiveInterviewV2
```

### 3. Recorded Interview Flow
```
RecordInterview → Transcription → Assessment → ViewResults
```

## 🗄️ Database Schema

### Core Tables
- `candidates` - Candidate information
- `questions` - Question bank with answers
- `live_interview_sessions` - Interview sessions
- `live_interview_questions` - Session-specific questions
- `live_interview_responses` - Candidate responses

## 🔧 Environment Variables

Create `.env` file in backend directory:
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=interview_assessment
DB_USER=root
DB_PASSWORD='#Rahul123'
GEMINI_API_KEY=AIzaSyADbcIq1ZvlRGb1Bst56OG-sxA-Qb--iKQ
USE_LOCAL_WHISPER=true
WHISPER_MODEL=base
```

## 📝 Development Notes

- **Clean Architecture**: Separation of concerns with modular structure
- **Type Safety**: TypeScript for frontend, Pydantic for backend
- **Error Handling**: Comprehensive error boundaries and validation
- **Performance**: Lazy loading and connection pooling
- **Security**: Input validation and CORS configuration

## 🤝 Contributing

1. Follow the existing code structure
2. Use TypeScript for frontend
3. Add proper error handling
4. Update documentation
5. Test thoroughly

## 📄 License

This project is licensed under the MIT License.
