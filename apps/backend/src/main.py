from fastapi import FastAPI,APIRouter
from fastapi.middleware.cors import CORSMiddleware

from src.routes.auth import auth_router
from src.routes.social import social_router

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

v1_router = APIRouter(prefix="/api/v1")

v1_router.include_router(auth_router)
v1_router.include_router(social_router)

app.include_router(v1_router)
