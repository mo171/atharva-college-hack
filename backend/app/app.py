from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routes import project as project_routes
from app.routes import editor as editor_routes
from app.routes import ws_editor as ws_editor_routes

app = FastAPI(title="Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(project_routes.router)
app.include_router(editor_routes.router)
app.include_router(ws_editor_routes.router)


@app.get("/health")
def health_check():
    return {"status": "healthy", "message": "Backend is running"}

