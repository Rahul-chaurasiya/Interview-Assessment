"""
Configuration Service - Handles roles, categories, and difficulties from MySQL database
"""
from app.database_mysql import get_db
from typing import List, Dict, Optional

# Default fallback data in case database connection fails
DEFAULT_ROLES = [
    {"id": "software_engineer", "name": "Software Engineer", "description": "General software engineering role"},
    {"id": "data_scientist", "name": "Data Scientist", "description": "Data science and machine learning role"},
    {"id": "product_manager", "name": "Product Manager", "description": "Product management role"},
    {"id": "devops_engineer", "name": "DevOps Engineer", "description": "DevOps and infrastructure role"},
    {"id": "ui_ux_designer", "name": "UI/UX Designer", "description": "User interface and experience design role"},
    {"id": "data_engineer", "name": "Data Engineer", "description": "Data engineering and pipeline role"},
    {"id": "cybersecurity_analyst", "name": "Cybersecurity Analyst", "description": "Security analysis role"},
    {"id": "cloud_architect", "name": "Cloud Architect", "description": "Cloud architecture role"},
    {"id": "mobile_developer", "name": "Mobile Developer", "description": "Mobile application development role"},
    {"id": "business_analyst", "name": "Business Analyst", "description": "Business analysis role"},
]

DEFAULT_CATEGORIES = [
    {"key": "technical", "name": "Technical", "description": "Technical questions related to the role"},
    {"key": "hr", "name": "HR", "description": "Human Resources questions"},
    {"key": "behavioral", "name": "Behavioral", "description": "Behavioral and situational questions"},
    {"key": "role_based", "name": "Role Based", "description": "Role-specific questions"},
]

DEFAULT_DIFFICULTIES = [
    {"key": "beginner", "name": "Beginner", "description": "Entry level questions"},
    {"key": "intermediate", "name": "Intermediate", "description": "Mid-level questions"},
    {"key": "advanced", "name": "Advanced", "description": "Expert level questions"},
    {"key": "expert", "name": "Expert", "description": "Senior expert questions"},
]


def get_all_roles() -> List[Dict]:
    """
    Get all active roles from the roles table, with fallback to defaults
    """
    try:
        with get_db() as cursor:
            cursor.execute(
                "SELECT role_key as id, role_name as name, description FROM roles WHERE is_active = TRUE ORDER BY display_order"
            )
            roles = cursor.fetchall()
            if roles:
                return roles
    except Exception as e:
        print(f"❌ Error fetching roles from DB: {e}")
    
    # Return default roles if database fails
    print("⚠️ Using default roles")
    return DEFAULT_ROLES


def get_role_by_key(role_key: str) -> Optional[Dict]:
    """
    Get a specific role by key
    """
    try:
        with get_db() as cursor:
            cursor.execute(
                "SELECT role_key as id, role_name as name, description FROM roles WHERE role_key = %s AND is_active = TRUE",
                (role_key,)
            )
            role = cursor.fetchone()
            if role:
                return role
    except Exception as e:
        print(f"❌ Error fetching role: {e}")
    
    # Return from defaults
    for role in DEFAULT_ROLES:
        if role["id"] == role_key:
            return role
    return None


def get_all_categories() -> List[Dict]:
    """
    Get all active categories from the categories table, with fallback to defaults
    """
    try:
        with get_db() as cursor:
            cursor.execute(
                "SELECT category_key as key, category_name as name, description FROM categories WHERE is_active = TRUE ORDER BY display_order"
            )
            categories = cursor.fetchall()
            if categories:
                return categories
    except Exception as e:
        print(f"❌ Error fetching categories from DB: {e}")
    
    # Return default categories if database fails
    print("⚠️ Using default categories")
    return DEFAULT_CATEGORIES


def get_category_by_key(category_key: str) -> Optional[Dict]:
    """
    Get a specific category by key
    """
    try:
        with get_db() as cursor:
            cursor.execute(
                "SELECT category_key as key, category_name as name, description FROM categories WHERE category_key = %s AND is_active = TRUE",
                (category_key,)
            )
            category = cursor.fetchone()
            if category:
                return category
    except Exception as e:
        print(f"❌ Error fetching category: {e}")
    
    # Return from defaults
    for cat in DEFAULT_CATEGORIES:
        if cat["key"] == category_key:
            return cat
    return None


def get_all_difficulties() -> List[Dict]:
    """
    Get all difficulties from the difficulties table, with fallback to defaults
    """
    try:
        with get_db() as cursor:
            cursor.execute(
                "SELECT difficulty_key as key, difficulty_name as name, description FROM difficulties ORDER BY display_order"
            )
            difficulties = cursor.fetchall()
            if difficulties:
                return difficulties
    except Exception as e:
        print(f"❌ Error fetching difficulties from DB: {e}")
    
    # Return default difficulties if database fails
    print("⚠️ Using default difficulties")
    return DEFAULT_DIFFICULTIES


def get_difficulty_by_key(difficulty_key: str) -> Optional[Dict]:
    """
    Get a specific difficulty by key
    """
    try:
        with get_db() as cursor:
            cursor.execute(
                "SELECT difficulty_key as key, difficulty_name as name, description FROM difficulties WHERE difficulty_key = %s",
                (difficulty_key,)
            )
            difficulty = cursor.fetchone()
            if difficulty:
                return difficulty
    except Exception as e:
        print(f"❌ Error fetching difficulty: {e}")
    
    # Return from defaults
    for diff in DEFAULT_DIFFICULTIES:
        if diff["key"] == difficulty_key:
            return diff
    return None


def get_all_config() -> Dict:
    """
    Get all configuration data (roles, categories, difficulties)
    """
    return {
        "roles": get_all_roles(),
        "categories": get_all_categories(),
        "difficulties": get_all_difficulties()
    }

