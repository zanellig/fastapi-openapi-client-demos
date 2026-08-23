import pytest
from fastapi.testclient import TestClient

from app.main import create_app


@pytest.fixture
def client() -> TestClient:
    with TestClient(create_app()) as test_client:
        yield test_client


def test_openapi_contract_has_stable_operation_ids(client: TestClient) -> None:
    response = client.get("/openapi.json")

    assert response.status_code == 200
    schema = response.json()
    assert schema["info"]["title"] == "Dispatch Desk API"
    assert schema["paths"]["/api/dispatches"]["get"]["operationId"] == "listDispatches"
    assert schema["paths"]["/api/forecast"]["get"]["operationId"] == "getForecast"


def test_create_dispatch_is_visible_in_the_public_list(client: TestClient) -> None:
    create_response = client.post(
        "/api/dispatches",
        json={
            "destination": "Copper Ridge Observatory",
            "contact": "Nora Singh",
            "note": "Call at the lower gate",
            "priority": "urgent",
        },
    )

    assert create_response.status_code == 201
    created = create_response.json()
    assert created["status"] == "queued"

    list_response = client.get("/api/dispatches", params={"status": "queued"})
    assert list_response.status_code == 200
    assert created["id"] in [dispatch["id"] for dispatch in list_response.json()]


def test_advance_dispatch_enforces_the_lifecycle(client: TestClient) -> None:
    first_response = client.post("/api/dispatches/1/advance")
    second_response = client.post("/api/dispatches/1/advance")
    conflict_response = client.post("/api/dispatches/1/advance")

    assert first_response.json()["status"] == "in_transit"
    assert second_response.json()["status"] == "delivered"
    assert conflict_response.status_code == 409
    assert conflict_response.json() == {
        "detail": "Delivered dispatches cannot advance further"
    }


def test_missing_dispatch_returns_a_documented_error(client: TestClient) -> None:
    response = client.get("/api/dispatches/999")

    assert response.status_code == 404
    assert response.json() == {"detail": "Dispatch not found"}


def test_forecast_query_parameters_are_validated(client: TestClient) -> None:
    response = client.get("/api/forecast", params={"city": "Rosario", "days": 4})
    invalid_response = client.get(
        "/api/forecast",
        params={"city": "Rosario", "days": 8},
    )

    assert response.status_code == 200
    assert response.json()["city"] == "Rosario"
    assert len(response.json()["days"]) == 4
    assert invalid_response.status_code == 422
