"""
Questions Service - Handles roles, categories, and questions from MySQL database
"""
from app.database_mysql import get_db
from typing import List, Dict, Optional
import random

def get_all_roles() -> List[Dict]:
    """
    Get all unique roles from the questions table in MySQL
    """
    try:
        with get_db() as cursor:
            cursor.execute("SELECT DISTINCT role FROM questions WHERE role IS NOT NULL ORDER BY role")
            roles = cursor.fetchall()
            
            # Convert to format expected by UI
            result = []
            for row in roles:
                role = row['role']
                # Convert role to display format (e.g., software_engineer -> Software Engineer)
                display_name = role.replace('_', ' ').title()
                result.append({
                    'id': role,
                    'name': display_name
                })
            return result
    except Exception as e:
        print(f"❌ Error fetching roles: {e}")
        # Return default roles if table is empty
        return []


def get_all_categories() -> List[str]:
    """
    Get all unique categories from the questions table in MySQL
    """
    try:
        with get_db() as cursor:
            cursor.execute("SELECT DISTINCT category FROM questions WHERE category IS NOT NULL ORDER BY category")
            categories = cursor.fetchall()
            
            result = [row['category'] for row in categories]
            
            # If no categories in DB, return defaults
            if not result:
                return ['technical', 'hr', 'behavioral', 'role_based']
            
            return result
    except Exception as e:
        print(f"❌ Error fetching categories: {e}")
        # Return default categories if table is empty
        return ['technical', 'hr', 'behavioral', 'role_based']


def get_topics_for_category(category: str, role: Optional[str] = None) -> List[str]:
    """
    Get topics for a specific category (optionally filtered by role)
    """
    try:
        with get_db() as cursor:
            if role:
                cursor.execute(
                    "SELECT DISTINCT topic FROM questions WHERE category = %s AND role = %s AND topic IS NOT NULL ORDER BY topic",
                    (category, role)
                )
            else:
                cursor.execute(
                    "SELECT DISTINCT topic FROM questions WHERE category = %s AND topic IS NOT NULL ORDER BY topic",
                    (category,)
                )
            
            topics = cursor.fetchall()
            return [row['topic'] for row in topics]
    except Exception as e:
        print(f"❌ Error fetching topics: {e}")
        return []


def get_questions(
    role: Optional[str] = None,
    category: Optional[str] = None,
    topic: Optional[str] = None,
    difficulty: Optional[str] = None,
    limit: int = 50
) -> List[Dict]:
    """
    Get filtered questions from the database
    """
    try:
        with get_db() as cursor:
            # Build query dynamically
            query = "SELECT * FROM questions WHERE 1=1"
            params = []
            
            if role:
                query += " AND role = %s"
                params.append(role)
            
            if category:
                query += " AND category = %s"
                params.append(category)
            
            if topic:
                query += " AND topic = %s"
                params.append(topic)
            
            if difficulty:
                query += " AND difficulty = %s"
                params.append(difficulty)
            
            query += " ORDER BY id LIMIT %s"
            params.append(limit)
            
            cursor.execute(query, params)
            questions = cursor.fetchall()
            
            return [
                {
                    'id': q['id'],
                    'category': q['category'],
                    'role': q['role'],
                    'topic': q['topic'],
                    'difficulty': q['difficulty'],
                    'question_text': q['question_text'],
                    'ideal_answer': q.get('ideal_answer')
                }
                for q in questions
            ]
    except Exception as e:
        print(f"❌ Error fetching questions: {e}")
        return []


def generate_question_set(
    role: str,
    categories: List[str],
    difficulty: str,
    question_count: int,
    shuffle: bool = True
) -> List[Dict]:
    """
    Generate a set of questions based on criteria
    """
    try:
        with get_db() as cursor:
            # Get questions matching criteria
            query = """
                SELECT * FROM questions 
                WHERE role = %s AND category = %s AND difficulty = %s
            """
            params = [role, categories[0] if categories else 'technical', difficulty]
            
            # If multiple categories, get from all
            if len(categories) > 1:
                placeholders = ','.join(['%s'] * len(categories))
                query = f"""
                    SELECT * FROM questions 
                    WHERE role = %s AND category IN ({placeholders}) AND difficulty = %s
                """
                params = [role] + categories + [difficulty]
            
            cursor.execute(query, params)
            questions = cursor.fetchall()
            
            if not questions:
                # Return some default questions if none in DB
                return get_questions(role=role, category=categories[0] if categories else 'technical', difficulty=difficulty, limit=question_count)
            
            # Convert to list of dicts
            question_list = [
                {
                    'id': q['id'],
                    'category': q['category'],
                    'role': q['role'],
                    'topic': q['topic'],
                    'difficulty': q['difficulty'],
                    'question_text': q['question_text'],
                    'ideal_answer': q.get('ideal_answer')
                }
                for q in questions
            ]
            
            # Shuffle if requested
            if shuffle:
                random.shuffle(question_list)
            
            # Return requested count
            return question_list[:question_count]
            
    except Exception as e:
        print(f"❌ Error generating question set: {e}")
        return get_questions(role=role, category=categories[0] if categories else 'technical', difficulty=difficulty, limit=question_count)


def get_interview_questions(interview_id: int) -> List[Dict]:
    """
    Get questions assigned to a specific interview
    """
    try:
        with get_db() as cursor:
            cursor.execute("""
                SELECT q.*, iq.sequence_order, iq.asked, iq.answered
                FROM interview_questions iq
                JOIN questions q ON iq.question_id = q.id
                WHERE iq.interview_id = %s
                ORDER BY iq.sequence_order
            """, (interview_id,))
            
            questions = cursor.fetchall()
            return [
                {
                    'id': q['id'],
                    'category': q['category'],
                    'role': q['role'],
                    'topic': q['topic'],
                    'difficulty': q['difficulty'],
                    'question_text': q['question_text'],
                    'ideal_answer': q.get('ideal_answer'),
                    'sequence_order': q['sequence_order'],
                    'asked': q['asked'],
                    'answered': q['answered']
                }
                for q in questions
            ]
    except Exception as e:
        print(f"❌ Error fetching interview questions: {e}")
        return []


def assign_questions_to_interview(interview_id: int, questions: List[Dict]) -> None:
    """
    Assign questions to an interview
    """
    try:
        with get_db() as cursor:
            for i, q in enumerate(questions):
                cursor.execute("""
                    INSERT INTO interview_questions (interview_id, question_id, sequence_order)
                    VALUES (%s, %s, %s)
                """, (interview_id, q['id'], i + 1))
            
            cursor.execute("COMMIT")
    except Exception as e:
        print(f"❌ Error assigning questions: {e}")
        raise


def update_question_status(interview_id: int, question_id: int, asked: Optional[bool] = None, answered: Optional[bool] = None) -> None:
    """
    Update the status of a question in an interview
    """
    try:
        with get_db() as cursor:
            updates = []
            params = []
            
            if asked is not None:
                updates.append("asked = %s")
                params.append(asked)
            
            if answered is not None:
                updates.append("answered = %s")
                params.append(answered)
            
            if updates:
                params.extend([interview_id, question_id])
                query = f"""
                    UPDATE interview_questions 
                    SET {', '.join(updates)}
                    WHERE interview_id = %s AND question_id = %s
                """
                cursor.execute(query, params)
                cursor.execute("COMMIT")
    except Exception as e:
        print(f"❌ Error updating question status: {e}")
        raise


def init_questions_db():
    """
    Initialize questions database - create tables if they don't exist
    """
    try:
        with get_db() as cursor:
            # Check if questions table exists and has data
            cursor.execute("SELECT COUNT(*) as count FROM questions")
            result = cursor.fetchone()
            
            if result['count'] == 0:
                print("⚠️ Questions table is empty. Run setup_mysql_complete.py to seed data.")
            else:
                print(f"✅ Questions table ready with {result['count']} questions")
    except Exception as e:
        print(f"⚠️ Could not check questions table: {e}")

