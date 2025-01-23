from fastapi import APIRouter, HTTPException, Depends, Response, Request
from pydantic import BaseModel, EmailStr, constr
from utils.supabase import supabase
from passlib.context import CryptContext  # type: ignore
import uuid
from datetime import datetime

router = APIRouter()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    username: str

class UserResponse(BaseModel):
    email: EmailStr
    username: str

class SessionResponse(BaseModel):
    id: str
    email: str
    username: str

@router.post("/register", response_model=UserResponse)
async def register(request: RegisterRequest, response: Response):
    # Check if the email or username already exists
    existing_user = (
        supabase.table('users')
        .select('id')
        .or_(
            f"email.eq.{request.email},username.eq.{request.username}"
        )
        .execute()
    )

    if existing_user.data:
        raise HTTPException(
            status_code=400,
            detail="Email or Username already exists"
        )

    # Hash the password
    hashed_password = pwd_context.hash(request.password)

    # Create a new user
    new_user = {
        "email": request.email,
        "password_hash": hashed_password,
        "username": request.username
    }
    try:
        user_response = supabase.table('users').insert(new_user).execute()
        if not user_response.data:
            raise HTTPException(status_code=500, detail="User creation failed")

        user_id = user_response.data[0]['id']

        # Create a session token
        session_token = str(uuid.uuid4())
        session_data = {
            "id": session_token,
            "user_id": user_id,
            "token": session_token,
            "last_login": datetime.utcnow().isoformat()
        }
        session_response = supabase.table('sessions').insert(session_data).execute()
        if not session_response.data:
            raise HTTPException(status_code=500, detail="Session creation failed")

        # Set the session token as a cookie
        response.set_cookie(
            key="session-token",
            value=session_token,
            httponly=True,
            secure=True,
        )

        return {"email": request.email, "username": request.username}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/session", response_model=SessionResponse)
async def validate_session(request: Request):
    # Retrieve the session token from cookies
    session_token = request.cookies.get("session-token")
    if not session_token:
        raise HTTPException(status_code=401, detail="Session token is missing")

    try:
        # Fetch session details from the database
        session_response = (
            supabase.table("sessions")
            .select("user_id, token")
            .eq("token", session_token)
            .single()
            .execute()
        )

        user_id = session_response.data['user_id']

        if user_id:
            session_data = supabase.table("users").select("id, email, username").eq("id", user_id).single().execute()

        if not session_response.data:
            raise HTTPException(status_code=401, detail="Invalid or expired session token")

        return session_data.data

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to validate session")
