import json
from typing import Callable
from fastapi import FastAPI, APIRouter, Request, Response
from fastapi.routing import APIRoute
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from routes.scheudler import scheduler_router
from routes.auth import auth_router
from routes.social import social_router


# # ---------------------------------------------------------
# # 1. Create the Custom Route Class
# # ---------------------------------------------------------
# class StandardResponseRoute(APIRoute):
#     def get_route_handler(self) -> Callable:
#         original_route_handler = super().get_route_handler()
#
#         async def custom_route_handler(request: Request) -> Response:
#             # Execute the actual endpoint code
#             response: Response = await original_route_handler(request)
#
#             # We only want to intercept and wrap standard JSON responses
#             if response.media_type == "application/json" and 200 <= response.status_code < 300:
#                 try:
#                     # Extract the original data that your endpoint returned
#                     original_data = json.loads(response.body.decode("utf-8"))
#
#                     # Wrap it in your required format
#                     formatted_body = {
#                         "success": True,
#                         "data": original_data
#                     }
#
#                     # Return the newly formatted response
#                     return Response(
#                         content=json.dumps(formatted_body).encode("utf-8"),
#                         status_code=response.status_code,
#                         headers=dict(response.headers),
#                         media_type="application/json"
#                     )
#                 except json.JSONDecodeError:
#                     pass  # Fallback just in case the body isn't actually JSON
#
#             return response
#
#         return custom_route_handler
#

# ---------------------------------------------------------
# 2. Standard App Initialization
# ---------------------------------------------------------
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


# ---------------------------------------------------------
# 3. Global Error Handlers (Crucial for consistency)
# ---------------------------------------------------------
# If you wrap successes, you should also standardise errors!
# @app.exception_handler(StarletteHTTPException)
# async def http_exception_handler(request: Request, exc: StarletteHTTPException):
#     return JSONResponse(
#         status_code=exc.status_code,
#         content={"success": False, "data": None, "error": exc.detail},
#     )
#
#
# @app.exception_handler(RequestValidationError)
# async def validation_exception_handler(request: Request, exc: RequestValidationError):
#     return JSONResponse(
#         status_code=422,
#         content={"success": False, "data": None, "error": exc.errors()},
#     )


# ---------------------------------------------------------
# 4. Attach the Custom Route to your Main Router
# ---------------------------------------------------------
# Notice the `route_class=StandardResponseRoute` parameter here
v1_router = APIRouter(prefix="/api/v1")

v1_router.include_router(auth_router)
v1_router.include_router(social_router)
v1_router.include_router(scheduler_router)

app.include_router(v1_router)