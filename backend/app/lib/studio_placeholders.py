"""Replace {{key}} tokens; unknown keys stay visible."""

from __future__ import annotations

import re
from typing import Any

_PLACEHOLDER_RE = re.compile(r"\{\{\s*([a-zA-Z0-9_]+)\s*\}\}")


def apply_placeholders(text: str, vars_map: dict[str, Any]) -> str:
    if not text or not vars_map:
        return text

    def repl(match: re.Match[str]) -> str:
        key = match.group(1)
        if key not in vars_map:
            return match.group(0)
        value = vars_map[key]
        if value is None or value == "":
            return ""
        return str(value)

    return _PLACEHOLDER_RE.sub(repl, text)
