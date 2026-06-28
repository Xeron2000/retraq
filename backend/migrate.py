"""Startup migration: profiles, trade.profile_id, default / example data."""
import os
from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

from database import engine, SessionLocal, Base
from models import Profile, Trade
from services.trade_importer import trade_importer

DEFAULT_LEGACY_NAME = "默认"
EXAMPLE_PROFILE_NAME = "浪哥（示例）"


def _trades_has_profile_id() -> bool:
    insp = inspect(engine)
    if "trades" not in insp.get_table_names():
        return False
    return "profile_id" in {c["name"] for c in insp.get_columns("trades")}


def _add_profile_id_column():
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE trades ADD COLUMN profile_id INTEGER"))


def ensure_database() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        _migrate_profiles(db)
    finally:
        db.close()


def _trade_count() -> int:
    if not _trades_has_profile_id():
        with engine.connect() as conn:
            return int(conn.execute(text("SELECT COUNT(*) FROM trades")).scalar() or 0)
    db = SessionLocal()
    try:
        return db.query(Trade).count()
    finally:
        db.close()


def _migrate_profiles(db: Session) -> None:
    has_col = _trades_has_profile_id()
    trade_count = _trade_count()

    if not has_col and trade_count > 0:
        default_p = db.query(Profile).filter(Profile.name == DEFAULT_LEGACY_NAME).first()
        if not default_p:
            default_p = Profile(name=DEFAULT_LEGACY_NAME)
            db.add(default_p)
            db.commit()
            db.refresh(default_p)
        else:
            db.commit()
        _add_profile_id_column()
        with engine.begin() as conn:
            conn.execute(
                text("UPDATE trades SET profile_id = :pid WHERE profile_id IS NULL"),
                {"pid": default_p.id},
            )
        return

    if trade_count == 0 and db.query(Profile).count() == 0:
        if not has_col:
            _add_profile_id_column()
        example = Profile(name=EXAMPLE_PROFILE_NAME)
        db.add(example)
        db.commit()
        db.refresh(example)
        excel_path = os.path.join(os.path.dirname(__file__), "..", "1.xlsx")
        if os.path.exists(excel_path):
            trade_importer.parse_file(db, excel_path, example.id, "langge")