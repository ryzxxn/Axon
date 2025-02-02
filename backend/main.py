# main.py
from fastapi import FastAPI
from routers.auth.auth_router import router as auth_router
from routers.ingest.ingest_router import router as ingest_router
from routers.service.service_router import router as service_router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://axonn.xyz"],  # Update with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the router
app.include_router(auth_router, prefix="/api", tags=['auth'])
app.include_router(ingest_router, prefix="/api", tags=['ingest'])
app.include_router(service_router, prefix="/api", tags=['service'])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
