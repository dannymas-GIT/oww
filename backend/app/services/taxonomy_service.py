
"""Load OWW matching taxonomy from YAML."""
from __future__ import annotations
from functools import lru_cache
from pathlib import Path
from typing import Any
import yaml

TAXONOMY_PATH = Path(__file__).resolve().parent.parent / "taxonomy" / "oww_taxonomy.yaml"

@lru_cache(maxsize=1)
def get_taxonomy() -> dict[str, Any]:
    with TAXONOMY_PATH.open() as f:
        return yaml.safe_load(f)
