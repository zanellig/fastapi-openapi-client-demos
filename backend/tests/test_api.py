from collections.abc import Iterator

import pytest
from fastapi.testclient import TestClient

from app.main import create_app


@pytest.fixture
def client() -> Iterator[TestClient]:
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


def test_whitespace_only_dispatch_fields_are_rejected(client: TestClient) -> None:
    response = client.post(
        "/api/dispatches",
        json={"destination": "   ", "contact": "  "},
    )

    assert response.status_code == 422
    rejected_fields = {error["loc"][-1] for error in response.json()["detail"]}
    assert rejected_fields == {"destination", "contact"}


def test_padded_dispatch_fields_are_stored_stripped(client: TestClient) -> None:
    response = client.post(
        "/api/dispatches",
        json={
            "destination": "  Copper Ridge  ",
            "contact": " Nora Singh ",
            "note": "  Lower gate  ",
        },
    )

    assert response.status_code == 201
    created = response.json()
    assert created["destination"] == "Copper Ridge"
    assert created["contact"] == "Nora Singh"
    assert created["note"] == "Lower gate"

    fetched = client.get(f"/api/dispatches/{created['id']}").json()
    assert fetched["destination"] == "Copper Ridge"


def test_whitespace_only_forecast_city_is_rejected(client: TestClient) -> None:
    response = client.get("/api/forecast", params={"city": "   "})

    assert response.status_code == 422


def test_forecast_city_is_stripped(client: TestClient) -> None:
    response = client.get("/api/forecast", params={"city": "  Rosario  "})

    assert response.status_code == 200
    assert response.json()["city"] == "Rosario"


def test_forecast_city_constraints_are_documented(client: TestClient) -> None:
    parameters = client.get("/openapi.json").json()["paths"]["/api/forecast"]["get"][
        "parameters"
    ]
    city = next(item for item in parameters if item["name"] == "city")

    assert city["required"] is True
    assert city["schema"]["minLength"] == 2
    assert city["schema"]["maxLength"] == 40


def test_advancing_a_missing_dispatch_returns_not_found(client: TestClient) -> None:
    response = client.post("/api/dispatches/999/advance")

    assert response.status_code == 404
    assert response.json() == {"detail": "Dispatch not found"}


def test_cors_preflight_allows_loopback_origin_without_credentials(
    client: TestClient,
) -> None:
    response = client.options(
        "/api/dispatches",
        headers={
            "Origin": "http://127.0.0.1:5173",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Content-Type",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://127.0.0.1:5173"
    assert "access-control-allow-credentials" not in response.headers
