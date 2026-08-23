from datetime import UTC, datetime

from .models import Dispatch, DispatchCreate, DispatchStatus, Priority


class DispatchAlreadyDeliveredError(Exception):
    pass


class DispatchStore:
    def __init__(self) -> None:
        self._dispatches: dict[int, Dispatch] = {}
        self._next_id = 1
        self._seed()

    def list_dispatches(
        self,
        status: DispatchStatus | None = None,
    ) -> list[Dispatch]:
        dispatches = list(self._dispatches.values())
        if status is not None:
            dispatches = [item for item in dispatches if item.status == status]
        return sorted(dispatches, key=lambda item: item.id, reverse=True)

    def create_dispatch(self, request: DispatchCreate) -> Dispatch:
        dispatch = Dispatch(
            id=self._next_id,
            destination=request.destination.strip(),
            contact=request.contact.strip(),
            note=request.note.strip(),
            priority=request.priority,
            status=DispatchStatus.QUEUED,
            created_at=datetime.now(UTC),
        )
        self._dispatches[dispatch.id] = dispatch
        self._next_id += 1
        return dispatch

    def find_dispatch(self, dispatch_id: int) -> Dispatch | None:
        return self._dispatches.get(dispatch_id)

    def advance_dispatch(self, dispatch_id: int) -> Dispatch | None:
        dispatch = self.find_dispatch(dispatch_id)
        if dispatch is None:
            return None
        if dispatch.status == DispatchStatus.DELIVERED:
            raise DispatchAlreadyDeliveredError

        next_status = {
            DispatchStatus.QUEUED: DispatchStatus.IN_TRANSIT,
            DispatchStatus.IN_TRANSIT: DispatchStatus.DELIVERED,
        }[dispatch.status]
        advanced = dispatch.model_copy(update={"status": next_status})
        self._dispatches[dispatch_id] = advanced
        return advanced

    def _seed(self) -> None:
        samples = [
            DispatchCreate(
                destination="North Harbor Lab",
                contact="Mina Okafor",
                note="Keep sensor case upright",
                priority=Priority.URGENT,
            ),
            DispatchCreate(
                destination="Juniper Field Station",
                contact="Theo Martins",
                note="Gate closes at 18:00",
            ),
            DispatchCreate(
                destination="Atlas Archive",
                contact="Ren Ito",
                note="Leave with collections desk",
            ),
        ]
        for sample in samples:
            self.create_dispatch(sample)
        self.advance_dispatch(2)
        self.advance_dispatch(3)
        self.advance_dispatch(3)
