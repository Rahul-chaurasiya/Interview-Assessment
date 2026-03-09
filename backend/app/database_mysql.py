"""
MySQL Database Connection Module
This replaces SQLite with MySQL for the interview assessment system
"""

import mysql.connector
from mysql.connector import pooling
from contextlib import contextmanager
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# MySQL Configuration
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': int(os.getenv('DB_PORT', 3306)),
    'database': os.getenv('DB_NAME', 'interview_assessment'),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', 'root')
}

# Create connection pool
connection_pool = None

def init_db_pool():
    """Initialize the database connection pool"""
    global connection_pool
    try:
        connection_pool = pooling.MySQLConnectionPool(
            pool_name="interview_pool",
            pool_size=5,
            **DB_CONFIG
        )
        print("✅ MySQL connection pool initialized!")
    except Exception as e:
        print(f"⚠️ Could not create connection pool: {e}")
        # Fall back to direct connection
        connection_pool = None

@contextmanager
def get_db():
    """Context manager for database connections"""
    connection = None
    cursor = None
    try:
        if connection_pool:
            connection = connection_pool.get_connection()
        else:
            connection = mysql.connector.connect(**DB_CONFIG)
        
        cursor = connection.cursor(dictionary=True)
        
        yield cursor
        
        connection.commit()
    except Exception as e:
        if connection:
            connection.rollback()
        raise e
    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()

def get_db_connection():
    """Get a direct database connection"""
    return mysql.connector.connect(**DB_CONFIG)

def init_db():
    """Initialize database tables (if needed)"""
    # Tables are already created by setup_mysql.py
    # This function can be used for any additional setup
    print("✅ Database ready!")

# Initialize on import
init_db_pool()
init_db()

