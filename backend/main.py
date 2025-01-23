# main.py
from fastapi import FastAPI
from routers.auth.auth_router import router as auth_router

app = FastAPI()

# Include the router
app.include_router(auth_router, prefix="/api", tags=['auth'])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
