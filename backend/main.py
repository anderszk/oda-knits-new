from contextlib import asynccontextmanager

from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.config import UPLOAD_DIR
from backend.db import init_db
from backend.repositories import load_about, load_contact_info, load_products, load_projects
from backend.routes import admin, contact, instagram, orders, payments

# Called eagerly (not just from lifespan) because the test suite calls route and
# repository functions directly, without ever starting the app through an ASGI
# server or TestClient that would trigger the lifespan below.
init_db()


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="oda-knit API", lifespan=lifespan)

app.mount("/api/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
    return load_projects()


@app.get("/api/about")
def get_about():
    return load_about()


@app.get("/api/contact-info")
def get_contact_info():
    return load_contact_info()


@app.get("/api/products")
def get_products():
    return load_products()


@app.get("/api/bootstrap")
def get_bootstrap(response: Response):
    response.headers["Cache-Control"] = "public, max-age=60"
    return {
        "work": load_projects(),
        "products": load_products(),
        "about": load_about(),
        "contact_info": load_contact_info(),
    }
