from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.routes.auth import auth_router

app = FastAPI(title="Social media post scheduler", version="1.0")

origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/v1", )
