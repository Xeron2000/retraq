"""API contract: dataset header, trades list shape."""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from database import Base, get_db
from main import app
from models import Dataset, Trade


@pytest.fixture()
def db_session():
    engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = Session()
    yield session
    session.close()


@pytest.fixture()
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def test_trades_requires_dataset_header(client: TestClient):
    r = client.get("/api/trades")
    assert r.status_code == 400
    assert "X-Dataset-Id" in r.json()["detail"]


def test_trades_empty_with_valid_dataset(client: TestClient, db_session):
    ds = Dataset(name="test-ds")
    db_session.add(ds)
    db_session.commit()
    db_session.refresh(ds)

    r = client.get("/api/trades", headers={"X-Dataset-Id": str(ds.id)})
    assert r.status_code == 200
    body = r.json()
    assert body == {"total": 0, "page": 1, "limit": 50, "data": []}


def test_trade_row_fields_match_frontend(client: TestClient, db_session):
    ds = Dataset(name="rows")
    db_session.add(ds)
    db_session.commit()
    db_session.refresh(ds)
    db_session.add(
        Trade(
            dataset_id=ds.id,
            symbol="BTC-USDT",
            direction="long",
            leverage=2.0,
            entry_price=100.0,
            exit_price=110.0,
            profit=10.0,
            profit_rate=0.1,
            margin=50.0,
            entry_time=1_700_000_000_000,
            exit_time=1_700_000_100_000,
        )
    )
    db_session.commit()

    r = client.get("/api/trades", headers={"X-Dataset-Id": str(ds.id)}, params={"limit": 10})
    assert r.status_code == 200
    row = r.json()["data"][0]
    expected = {
        "id",
        "symbol",
        "direction",
        "leverage",
        "entry_price",
        "exit_price",
        "profit",
        "profit_rate",
        "margin",
        "entry_time",
        "exit_time",
    }
    assert expected == set(row.keys())