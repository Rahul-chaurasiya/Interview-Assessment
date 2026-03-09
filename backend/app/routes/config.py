"""
Configuration Routes - API endpoints for roles, categories, and difficulties
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from app.services import config as config_service

router = APIRouter(prefix="/config", tags=["Configuration"])


# =====================================================
# Response Models
# =====================================================

class RoleResponse(BaseModel):
    id: str
    name: str
    description: str = ""


class CategoryResponse(BaseModel):
    key: str
    name: str
    description: str = ""


class DifficultyResponse(BaseModel):
    key: str
    name: str
    description: str = ""


class ConfigResponse(BaseModel):
    roles: List[RoleResponse]
    categories: List[CategoryResponse]
    difficulties: List[DifficultyResponse]


# =====================================================
# API Endpoints
# =====================================================

@router.get("/roles", response_model=List[RoleResponse])
async def get_roles():
    """
    Get all active roles
    """
    try:
        roles = config_service.get_all_roles()
        return roles
    except Exception as e:
        print(f"❌ Error fetching roles: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/roles/{role_key}", response_model=RoleResponse)
async def get_role(role_key: str):
    """
    Get a specific role by key
    """
    try:
        role = config_service.get_role_by_key(role_key)
        if not role:
            raise HTTPException(status_code=404, detail="Role not found")
        return role
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching role: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/categories", response_model=List[CategoryResponse])
async def get_categories():
    """
    Get all active categories
    """
    try:
        categories = config_service.get_all_categories()
        return categories
    except Exception as e:
        print(f"❌ Error fetching categories: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/categories/{category_key}", response_model=CategoryResponse)
async def get_category(category_key: str):
    """
    Get a specific category by key
    """
    try:
        category = config_service.get_category_by_key(category_key)
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")
        return category
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching category: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/difficulties", response_model=List[DifficultyResponse])
async def get_difficulties():
    """
    Get all difficulties
    """
    try:
        difficulties = config_service.get_all_difficulties()
        return difficulties
    except Exception as e:
        print(f"❌ Error fetching difficulties: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/difficulties/{difficulty_key}", response_model=DifficultyResponse)
async def get_difficulty(difficulty_key: str):
    """
    Get a specific difficulty by key
    """
    try:
        difficulty = config_service.get_difficulty_by_key(difficulty_key)
        if not difficulty:
            raise HTTPException(status_code=404, detail="Difficulty not found")
        return difficulty
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching difficulty: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/all", response_model=ConfigResponse)
async def get_all_config():
    """
    Get all configuration (roles, categories, difficulties)
    """
    try:
        config = config_service.get_all_config()
        return config
    except Exception as e:
        print(f"❌ Error fetching config: {e}")
        raise HTTPException(status_code=500, detail=str(e))

