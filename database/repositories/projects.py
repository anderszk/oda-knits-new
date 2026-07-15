import json
from datetime import UTC, datetime

from fastapi import HTTPException

from database.connection import get_connection
from database.repositories.base import unique_id

COLUMNS = (
    "id", "title", "category", "description", "image", "images", "yarn", "fiber",
    "technique", "needles", "size", "time", "year", "colors", "created_at", "updated_at",
)


class ProjectRepository:
    """Data access for the knitting project portfolio."""

    columns = COLUMNS

    def _from_row(self, row):
        project = dict(zip(self.columns, row, strict=True))
        project["images"] = json.loads(project["images"])
        project["colors"] = json.loads(project["colors"])
        return project

    def list(self):
        with get_connection() as connection:
            rows = connection.execute(
                f"SELECT {', '.join(self.columns)} FROM projects ORDER BY created_at DESC"
            ).fetchall()
        return [self._from_row(row) for row in rows]

    def exists(self, project_id: str) -> bool:
        with get_connection() as connection:
            return connection.execute("SELECT 1 FROM projects WHERE id = ?", (project_id,)).fetchone() is not None

    def delete(self, project_id: str):
        with get_connection() as connection:
            connection.execute("DELETE FROM projects WHERE id = ?", (project_id,))

    def save(self, project, project_id=None):
        with get_connection() as connection:
            now = datetime.now(UTC).isoformat()
            existing = connection.execute(
                "SELECT created_at FROM projects WHERE id = ?", (project_id or project.id,)
            ).fetchone()
            final_id = project_id or project.id or unique_id(connection, "projects", project.title, "project")
            images = [image for image in project.images if image]
            if project.image and project.image not in images:
                images.insert(0, project.image)
            cover = project.image or (images[0] if images else "")
            if not cover:
                raise HTTPException(status_code=400, detail="Project image is required")
            values = {
                "id": final_id,
                "title": project.title,
                "category": project.category,
                "description": project.description,
                "image": cover,
                "images": json.dumps(images),
                "yarn": project.yarn,
                "fiber": project.fiber,
                "technique": project.technique,
                "needles": project.needles,
                "size": project.size,
                "time": project.time,
                "year": project.year,
                "colors": json.dumps([color.model_dump() for color in project.colors]),
                "created_at": existing[0] if existing else now,
                "updated_at": now,
            }
            placeholders = ", ".join(["?"] * len(self.columns))
            connection.execute(
                f"INSERT OR REPLACE INTO projects ({', '.join(self.columns)}) VALUES ({placeholders})",
                tuple(values[column] for column in self.columns),
            )
        return values


project_repository = ProjectRepository()
