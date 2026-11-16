"""Write the FastAPI OpenAPI document to openapi/openapi.json without a server."""

import json
import sys
from pathlib import Path

REPOSITORY_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPOSITORY_ROOT / "backend"))

from app.main import create_app  # noqa: E402

OUTPUT_PATH = REPOSITORY_ROOT / "openapi" / "openapi.json"


def main() -> int:
    document = json.dumps(create_app().openapi(), indent=2, ensure_ascii=False) + "\n"
    if OUTPUT_PATH.exists() and OUTPUT_PATH.read_text(encoding="utf-8") == document:
        return 0
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(document, encoding="utf-8", newline="\n")
    print(f"Wrote {OUTPUT_PATH.relative_to(REPOSITORY_ROOT)}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
