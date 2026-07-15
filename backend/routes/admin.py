import secrets
import shutil
import time
from datetime import UTC, datetime
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile

from backend.config import ADMIN_PASSWORD, ADMIN_SESSION_SECONDS, ADMIN_USERNAME, UPLOAD_DIR
from backend.models.auth import LoginPayload
from backend.models.content import AboutPayload, ContactInfoPayload
from backend.models.products import ProductPayload
from backend.models.projects import ProjectPayload
from backend.services.security import admin_tokens, check_rate_limit, client_key, require_admin
from backend.repositories import content_repository, product_repository, project_repository

router = APIRouter()


@router.post("/api/admin/login")
def admin_login(payload: LoginPayload, request: Request = None):
    check_rate_limit("login", f"{client_key(request)}:{payload.username}", 5, 15 * 60)
    if not ADMIN_PASSWORD:
        raise HTTPException(status_code=503, detail="Admin password is not configured")
    if not (
        secrets.compare_digest(payload.username, ADMIN_USERNAME)
        and secrets.compare_digest(payload.password, ADMIN_PASSWORD)
    ):
        raise HTTPException(status_code=401, detail="Wrong username or password")
    token = secrets.token_urlsafe(32)
    admin_tokens[token] = time.monotonic() + ADMIN_SESSION_SECONDS
    return {"token": token}


@router.get("/api/admin/projects")
def admin_projects(_=Depends(require_admin)):
    return project_repository.list()


@router.get("/api/admin/about")
def admin_about(_=Depends(require_admin)):
    return content_repository.get_about()


@router.put("/api/admin/about")
def update_about(about: AboutPayload, _=Depends(require_admin)):
    return {"ok": True, "about": content_repository.save_about(about)}


@router.get("/api/admin/contact-info")
def admin_contact_info(_=Depends(require_admin)):
    return content_repository.get_contact_info()


@router.put("/api/admin/contact-info")
def update_contact_info(contact_info: ContactInfoPayload, _=Depends(require_admin)):
    return {"ok": True, "contact": content_repository.save_contact_info(contact_info)}


@router.post("/api/admin/projects", status_code=201)
def create_project(project: ProjectPayload, _=Depends(require_admin)):
    saved = project_repository.save(project)
    return {"ok": True, "id": saved["id"]}


@router.put("/api/admin/projects/{project_id}")
def update_project(project_id: str, project: ProjectPayload, _=Depends(require_admin)):
    if not project_repository.exists(project_id):
        raise HTTPException(status_code=404, detail="Project not found")
    project_repository.save(project, project_id=project_id)
    return {"ok": True, "id": project_id}


@router.delete("/api/admin/projects/{project_id}", status_code=204)
def remove_project(project_id: str, _=Depends(require_admin)):
    project_repository.delete(project_id)


@router.get("/api/admin/products")
def admin_products(_=Depends(require_admin)):
    return product_repository.list()


@router.post("/api/admin/products", status_code=201)
def create_product(product: ProductPayload, _=Depends(require_admin)):
    saved = product_repository.save(product)
    return {"ok": True, "id": saved["id"]}


@router.put("/api/admin/products/{product_id}")
def update_product(product_id: str, product: ProductPayload, _=Depends(require_admin)):
    if not product_repository.exists(product_id):
        raise HTTPException(status_code=404, detail="Product not found")
    product_repository.save(product, product_id=product_id)
    return {"ok": True, "id": product_id}


@router.delete("/api/admin/products/{product_id}", status_code=204)
def remove_product(product_id: str, _=Depends(require_admin)):
    product_repository.delete(product_id)


@router.post("/api/admin/uploads", status_code=201)
def upload_project_image(file: UploadFile = File(...), _=Depends(require_admin)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Upload an image file")
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in {".jpg", ".jpeg", ".png", ".webp", ".gif"}:
        raise HTTPException(status_code=400, detail="Unsupported image type")
    filename = f"{datetime.now(UTC).strftime('%Y%m%d%H%M%S')}-{secrets.token_hex(4)}{suffix}"
    target = UPLOAD_DIR / filename
    with target.open("wb") as output:
        shutil.copyfileobj(file.file, output)
    return {"url": f"/api/uploads/{filename}"}
