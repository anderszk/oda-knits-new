import sqlite3
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from backend.config import ALLOWED_ORIGINS, UPLOAD_DIR
from backend.routes import admin, contact, instagram, orders, payments
from database.migrations import init_db
from backend.repositories import content_repository, product_repository, project_repository

init_db()


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="oda-knit API", lifespan=lifespan)

app.mount("/api/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(sqlite3.OperationalError)
async def handle_sqlite_operational_error(request: Request, exc: sqlite3.OperationalError):
    return JSONResponse(
        status_code=503,
        content={"detail": "The database is temporarily unavailable. Please try again."},
    )


@app.middleware("http")
async def security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "same-origin"
    return response


app.include_router(orders.router)
app.include_router(payments.router)
app.include_router(instagram.router)
app.include_router(admin.router)
app.include_router(contact.router)


@app.get("/api/work")
def get_work():
    return project_repository.list()


@app.get("/api/about")
def get_about():
    return content_repository.get_about()


@app.get("/api/contact-info")
def get_contact_info():
    return content_repository.get_contact_info()


@app.get("/api/products")
def get_products():
    return product_repository.list()


@app.get("/api/bootstrap")
def get_bootstrap(response: Response):
    response.headers["Cache-Control"] = "public, max-age=60"
    return {
        "work": project_repository.list(),
        "products": product_repository.list(),
        "about": content_repository.get_about(),
        "contact_info": content_repository.get_contact_info(),
    }
