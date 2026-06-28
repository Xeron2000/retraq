from fastapi import HTTPException, Request
from sqlalchemy.orm import Session

from models import Profile

PROFILE_HEADER = "X-Profile-Id"


def get_profile_id(request: Request, db: Session) -> int:
    raw = request.headers.get(PROFILE_HEADER)
    if raw is None or raw == "":
        raise HTTPException(400, f"Missing header {PROFILE_HEADER}")
    try:
        pid = int(raw)
    except ValueError:
        raise HTTPException(400, f"Invalid {PROFILE_HEADER}")
    if not db.query(Profile).filter(Profile.id == pid).first():
        raise HTTPException(400, "Profile not found")
    return pid