from fastapi import  Request

def get_session_token(request: Request):
    return request.cookies.get("session-token")