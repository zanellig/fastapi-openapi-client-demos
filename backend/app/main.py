from collections.abc import Sequence
from datetime import date, timedelta

from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware

from .models import (
    ApiError,
    Dispatch,
    DispatchCreate,
    DispatchStatus,
    Forecast,
    ForecastDay,
    Health,
)
from .repository import DispatchAlreadyDeliveredError, DispatchStore


def create_app() -> FastAPI:
    store = DispatchStore()
    application = FastAPI(
        title="Dispatch Desk API",
        summary="A compact OpenAPI contract for generated TypeScript clients.",
        version="1.0.0",
        openapi_url="/openapi.json",
        docs_url="/docs",
    )
    application.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173", "http://localhost:5174"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @application.get(
        "/api/health",
        response_model=Health,
        operation_id="getHealth",
        tags=["system"],
    )
    async def get_health() -> Health:
        return Health(
            status="ready",
            service="Dispatch Desk API",
            openapi_url="/openapi.json",
        )

    @application.get(
        "/api/dispatches",
        response_model=list[Dispatch],
        operation_id="listDispatches",
        tags=["dispatches"],
    )
    async def list_dispatches(
        status_filter: DispatchStatus | None = Query(
            default=None,
            alias="status",
            description="Return only dispatches in this lifecycle state.",
        ),
    ) -> Sequence[Dispatch]:
        return store.list_dispatches(status_filter)

    @application.post(
        "/api/dispatches",
        response_model=Dispatch,
        status_code=status.HTTP_201_CREATED,
        operation_id="createDispatch",
        tags=["dispatches"],
    )
    async def create_dispatch(request: DispatchCreate) -> Dispatch:
        return store.create_dispatch(request)

    @application.get(
        "/api/dispatches/{dispatch_id}",
        response_model=Dispatch,
        responses={status.HTTP_404_NOT_FOUND: {"model": ApiError}},
        operation_id="getDispatch",
        tags=["dispatches"],
    )
    async def get_dispatch(dispatch_id: int) -> Dispatch:
        dispatch = store.find_dispatch(dispatch_id)
        if dispatch is None:
            raise HTTPException(status_code=404, detail="Dispatch not found")
        return dispatch

    @application.post(
        "/api/dispatches/{dispatch_id}/advance",
        response_model=Dispatch,
        responses={
            status.HTTP_404_NOT_FOUND: {"model": ApiError},
            status.HTTP_409_CONFLICT: {"model": ApiError},
        },
        operation_id="advanceDispatch",
        tags=["dispatches"],
    )
    async def advance_dispatch(dispatch_id: int) -> Dispatch:
        try:
            dispatch = store.advance_dispatch(dispatch_id)
        except DispatchAlreadyDeliveredError as error:
            raise HTTPException(
                status_code=409,
                detail="Delivered dispatches cannot advance further",
            ) from error
        if dispatch is None:
            raise HTTPException(status_code=404, detail="Dispatch not found")
        return dispatch

    @application.get(
        "/api/forecast",
        response_model=Forecast,
        operation_id="getForecast",
        tags=["planning"],
    )
    async def get_forecast(
        city: str = Query(min_length=2, max_length=40),
        days: int = Query(default=3, ge=1, le=5),
    ) -> Forecast:
        clean_city = city.strip()
        conditions = ("Clear", "Crosswind", "Light rain", "Cloud cover")
        city_seed = sum(ord(character) for character in clean_city)
        today = date.today()
        forecast_days = [
            ForecastDay(
                day=(today + timedelta(days=offset)).isoformat(),
                condition=conditions[(city_seed + offset) % len(conditions)],
                high_c=18 + ((city_seed + offset * 3) % 11),
                low_c=8 + ((city_seed + offset * 2) % 7),
            )
            for offset in range(days)
        ]
        return Forecast(city=clean_city, days=forecast_days)

    return application


app = create_app()
