from datetime import datetime
from enum import StrEnum
from typing import Annotated

from pydantic import BaseModel, StringConstraints


class DispatchStatus(StrEnum):
    QUEUED = "queued"
    IN_TRANSIT = "in_transit"
    DELIVERED = "delivered"


class Priority(StrEnum):
    STANDARD = "standard"
    URGENT = "urgent"


class DispatchCreate(BaseModel):
    destination: Annotated[
        str, StringConstraints(strip_whitespace=True, min_length=2, max_length=80)
    ]
    contact: Annotated[
        str, StringConstraints(strip_whitespace=True, min_length=2, max_length=50)
    ]
    note: Annotated[str, StringConstraints(strip_whitespace=True, max_length=160)] = ""
    priority: Priority = Priority.STANDARD


class Dispatch(BaseModel):
    id: int
    destination: str
    contact: str
    note: str
    priority: Priority
    status: DispatchStatus
    created_at: datetime


class ForecastDay(BaseModel):
    day: str
    condition: str
    high_c: int
    low_c: int


class Forecast(BaseModel):
    city: str
    days: list[ForecastDay]


class Health(BaseModel):
    status: str
    service: str
    openapi_url: str


class ApiError(BaseModel):
    detail: str
