# routers/auth/auth_router.py
from fastapi import APIRouter

router = APIRouter()

@router.get("/register")
def get_users():
    return {"message": "hello"}
