# # import sqlite3
# # from datetime import datetime
# # from contextlib import contextmanager
# # import os

# # DATABASE_PATH = "interview_system.db"

# # def init_db():
# #     """Initialize database with all required tables"""
# #     conn = sqlite3.connect(DATABASE_PATH)
# #     cursor = conn.cursor()
    
# #     # Candidates table
# #     cursor.execute('''
# #         CREATE TABLE IF NOT EXISTS candidates (
# #             id INTEGER PRIMARY KEY AUTOINCREMENT,
# #             name TEXT NOT NULL,
# #             email TEXT UNIQUE NOT NULL,
# #             position TEXT NOT NULL,
# #             phone TEXT,
# #             created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
# #         )
# #     ''')
    
# #     # Interviews table
# #     cursor.execute('''
# #         CREATE TABLE IF NOT EXISTS interviews (
# #             id INTEGER PRIMARY KEY AUTOINCREMENT,
# #             candidate_id INTEGER NOT NULL,
# #             audio_path TEXT NOT NULL,
# #             duration REAL,
# #             status TEXT DEFAULT 'pending',
# #             created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
# #             FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
# #         )
# #     ''')
    
# #     # Transcriptions table
# #     cursor.execute('''
# #         CREATE TABLE IF NOT EXISTS transcriptions (
# #             id INTEGER PRIMARY KEY AUTOINCREMENT,
# #             interview_id INTEGER NOT NULL,
# #             speaker TEXT NOT NULL,
# #             text TEXT NOT NULL,
# #             start_time REAL,
# #             end_time REAL,
# #             confidence REAL,
# #             created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
# #             FOREIGN KEY (interview_id) REFERENCES interviews(id) ON DELETE CASCADE
# #         )
# #     ''')
    
# #     # Question-Answer Pairs table
# #   # Question-Answer Pairs table
# #           # Question-Answer Pairs table
# #     cursor.execute('''
# #         CREATE TABLE IF NOT EXISTS qa_pairs (
# #         id INTEGER PRIMARY KEY AUTOINCREMENT,
# #         interview_id INTEGER NOT NULL,
# #         question TEXT NOT NULL,
# #         answer TEXT NOT NULL,
# #         question_time REAL,
# #         answer_time REAL,
# #         pair_valid INTEGER DEFAULT 1,  -- ✅ Add this line
# #         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
# #         FOREIGN KEY (interview_id) REFERENCES interviews(id) ON DELETE CASCADE
# #     )
# # ''')

  
  
  
  
  
  
  
  
  
  
  
  
  
  
# #     # cursor.execute('''
# #     #     CREATE TABLE IF NOT EXISTS qa_pairs (
# #     #         id INTEGER PRIMARY KEY AUTOINCREMENT,
# #     #         interview_id INTEGER NOT NULL,
# #     #         question TEXT NOT NULL,
# #     #         answer TEXT NOT NULL,
# #     #         question_time REAL,
# #     #         answer_time REAL,
# #     #         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
# #     #         FOREIGN KEY (interview_id) REFERENCES interviews(id) ON DELETE CASCADE
# #     #     )
# #     # ''')
    
# #     # Assessments table
# #     cursor.execute('''
# #         CREATE TABLE IF NOT EXISTS assessments (
# #             id INTEGER PRIMARY KEY AUTOINCREMENT,
# #             interview_id INTEGER NOT NULL,
# #             content_score REAL NOT NULL,
# #             communication_score REAL NOT NULL,
# #             confidence_score REAL NOT NULL,
# #             technical_score REAL NOT NULL,
# #             overall_score REAL NOT NULL,
# #             success_probability REAL NOT NULL,
# #             grade TEXT,
# #             strengths TEXT,
# #             weaknesses TEXT,
# #             recommendation TEXT,
# #             created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
# #             FOREIGN KEY (interview_id) REFERENCES interviews(id) ON DELETE CASCADE
# #         )
# #     ''')
    
# #     # Create indexes for faster queries
# #     cursor.execute('CREATE INDEX IF NOT EXISTS idx_interviews_candidate ON interviews(candidate_id)')
# #     cursor.execute('CREATE INDEX IF NOT EXISTS idx_transcriptions_interview ON transcriptions(interview_id)')
# #     cursor.execute('CREATE INDEX IF NOT EXISTS idx_assessments_interview ON assessments(interview_id)')
    
# #     conn.commit()
# #     conn.close()
# #     print("✅ Database initialized successfully!")

# # @contextmanager
# # def get_db():
# #     """Context manager for database connections"""
# #     conn = sqlite3.connect(DATABASE_PATH)
# #     conn.row_factory = sqlite3.Row  # Access columns by name
# #     try:
# #         yield conn
# #         conn.commit()
# #     except Exception as e:
# #         conn.rollback()
# #         raise e
# #     finally:
# #         conn.close()

# # def get_db_connection():
# #     """Get a simple database connection"""
# #     conn = sqlite3.connect(DATABASE_PATH)
# #     conn.row_factory = sqlite3.Row
# #     return conn

# # # Initialize database on module import
# # if not os.path.exists(DATABASE_PATH):
# #     init_db()

# import sqlite3
# from datetime import datetime
# from contextlib import contextmanager
# import os
# import json

# DATABASE_PATH = "interview_system.db"

# def init_db():
#     """Initialize database with all required tables"""
#     conn = sqlite3.connect(DATABASE_PATH)
#     cursor = conn.cursor()
    
#     # Candidates table
#     cursor.execute('''
#         CREATE TABLE IF NOT EXISTS candidates (
#             id INTEGER PRIMARY KEY AUTOINCREMENT,
#             name TEXT NOT NULL,
#             email TEXT UNIQUE NOT NULL,
#             position TEXT NOT NULL,
#             phone TEXT,
#             created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
#         )
#     ''')
    
#     # Interviews table
#     cursor.execute('''
#         CREATE TABLE IF NOT EXISTS interviews (
#             id INTEGER PRIMARY KEY AUTOINCREMENT,
#             candidate_id INTEGER NOT NULL,
#             audio_path TEXT NOT NULL,
#             duration REAL,
#             status TEXT DEFAULT 'pending',
#             created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
#             FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
#         )
#     ''')
    
#     # Transcriptions table
#     cursor.execute('''
#         CREATE TABLE IF NOT EXISTS transcriptions (
#             id INTEGER PRIMARY KEY AUTOINCREMENT,
#             interview_id INTEGER NOT NULL,
#             speaker TEXT NOT NULL,
#             text TEXT NOT NULL,
#             start_time REAL,
#             end_time REAL,
#             confidence REAL,
#             created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
#             FOREIGN KEY (interview_id) REFERENCES interviews(id) ON DELETE CASCADE
#         )
#     ''')
    
#     # Q/A Pairs table (pair_valid included)
#     cursor.execute('''
#         CREATE TABLE IF NOT EXISTS qa_pairs (
#             id INTEGER PRIMARY KEY AUTOINCREMENT,
#             interview_id INTEGER NOT NULL,
#             question TEXT NOT NULL,
#             answer TEXT NOT NULL,
#             question_time REAL,
#             answer_time REAL,
#             pair_valid INTEGER DEFAULT 1,
#             created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
#             FOREIGN KEY (interview_id) REFERENCES interviews(id) ON DELETE CASCADE
#         )
#     ''')

#     # Assessments table
#     cursor.execute('''
#         CREATE TABLE IF NOT EXISTS assessments (
#             id INTEGER PRIMARY KEY AUTOINCREMENT,
#             interview_id INTEGER NOT NULL,
#             content_score REAL NOT NULL,
#             communication_score REAL NOT NULL,
#             confidence_score REAL NOT NULL,
#             technical_score REAL NOT NULL,
#             overall_score REAL NOT NULL,
#             success_probability REAL NOT NULL,
#             grade TEXT,
#             strengths TEXT,
#             weaknesses TEXT,
#             recommendation TEXT,
#             created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
#             FOREIGN KEY (interview_id) REFERENCES interviews(id) ON DELETE CASCADE
#         )
#     ''')

#     # New: Evaluation Logs table (store NLP/explainability/emotion/other analysis JSON)
#     cursor.execute('''
#         CREATE TABLE IF NOT EXISTS evaluation_logs (
#             id INTEGER PRIMARY KEY AUTOINCREMENT,
#             interview_id INTEGER NOT NULL,
#             analysis_type TEXT NOT NULL,   -- e.g. "NLP", "EXPLAINABILITY", "EMOTION", "SUMMARY"
#             analysis_data TEXT NOT NULL,   -- JSON string
#             created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
#             FOREIGN KEY (interview_id) REFERENCES interviews(id) ON DELETE CASCADE
#         )
#     ''')

#     # Create indexes for faster queries
#     cursor.execute('CREATE INDEX IF NOT EXISTS idx_interviews_candidate ON interviews(candidate_id)')
#     cursor.execute('CREATE INDEX IF NOT EXISTS idx_transcriptions_interview ON transcriptions(interview_id)')
#     cursor.execute('CREATE INDEX IF NOT EXISTS idx_assessments_interview ON assessments(interview_id)')
#     cursor.execute('CREATE INDEX IF NOT EXISTS idx_logs_interview ON evaluation_logs(interview_id)')

#     conn.commit()
#     conn.close()
#     print("✅ Database initialized successfully!")

# @contextmanager
# def get_db():
#     """Context manager for database connections"""
#     conn = sqlite3.connect(DATABASE_PATH)
#     conn.row_factory = sqlite3.Row  # Access columns by name
#     try:
#         yield conn
#         conn.commit()
#     except Exception as e:
#         conn.rollback()
#         raise e
#     finally:
#         conn.close()

# def get_db_connection():
#     """Get a simple database connection"""
#     conn = sqlite3.connect(DATABASE_PATH)
#     conn.row_factory = sqlite3.Row
#     return conn

# # Initialize database on module import if file doesn't exist
# if not os.path.exists(DATABASE_PATH):
#     init_db()
# else:
#     # Optional safety: ensure tables exist (idempotent)
#     init_db()


import sqlite3
from datetime import datetime
from contextlib import contextmanager
import os
import json


DATABASE_PATH = "interview_system.db"


def init_db():
    """Initialize database with all required tables"""
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    # Candidates table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS candidates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            position TEXT NOT NULL,
            phone TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Interviews table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS interviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            candidate_id INTEGER NOT NULL,
            audio_path TEXT NOT NULL,
            duration REAL,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
        )
    ''')
    
    # Transcriptions table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS transcriptions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            interview_id INTEGER NOT NULL,
            speaker TEXT NOT NULL,
            text TEXT NOT NULL,
            start_time REAL,
            end_time REAL,
            confidence REAL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (interview_id) REFERENCES interviews(id) ON DELETE CASCADE
        )
    ''')
    
    # Q/A Pairs table (pair_valid included)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS qa_pairs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            interview_id INTEGER NOT NULL,
            question TEXT NOT NULL,
            answer TEXT NOT NULL,
            question_time REAL,
            answer_time REAL,
            pair_valid INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (interview_id) REFERENCES interviews(id) ON DELETE CASCADE
        )
    ''')


    # Assessments table - ✅ ONLY CHANGE: Added ai_recommendation column
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS assessments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            interview_id INTEGER NOT NULL,
            content_score REAL NOT NULL,
            communication_score REAL NOT NULL,
            confidence_score REAL NOT NULL,
            technical_score REAL NOT NULL,
            overall_score REAL NOT NULL,
            success_probability REAL NOT NULL,
            grade TEXT,
            strengths TEXT,
            weaknesses TEXT,
            recommendation TEXT,
            ai_recommendation TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (interview_id) REFERENCES interviews(id) ON DELETE CASCADE
        )
    ''')


    # New: Evaluation Logs table (store NLP/explainability/emotion/other analysis JSON)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS evaluation_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            interview_id INTEGER NOT NULL,
            analysis_type TEXT NOT NULL,   -- e.g. "NLP", "EXPLAINABILITY", "EMOTION", "SUMMARY"
            analysis_data TEXT NOT NULL,   -- JSON string
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (interview_id) REFERENCES interviews(id) ON DELETE CASCADE
        )
    ''')


    # Create indexes for faster queries
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_interviews_candidate ON interviews(candidate_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_transcriptions_interview ON transcriptions(interview_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_assessments_interview ON assessments(interview_id)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_logs_interview ON evaluation_logs(interview_id)')


    conn.commit()
    conn.close()
    print("✅ Database initialized successfully!")


@contextmanager
def get_db():
    """Context manager for database connections"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row  # Access columns by name
    try:
        yield conn
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()


def get_db_connection():
    """Get a simple database connection"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn


# Initialize database on module import if file doesn't exist
if not os.path.exists(DATABASE_PATH):
    init_db()
else:
    # Optional safety: ensure tables exist (idempotent)
    init_db()