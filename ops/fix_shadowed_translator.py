#!/usr/bin/env python3
"""Report (and optionally rename) every rebinding of the `_` translation helper.

`from frappe import _` is the operator-message helper. Binding it to a throwaway
(`settings, _ = ...`, `for _ in ...`) inside a function makes the next `_("…")`
call raise `TypeError: 'list' object is not callable` — which is exactly how
`create_supply` answered a stray field on the live site.

Usage:
    python3 fix_shadowed_translator.py            # report only
    python3 fix_shadowed_translator.py --apply    # rename to `_unused`
"""

from __future__ import annotations

import ast
import pathlib
import sys

APP = pathlib.Path("/home/twenty/frappe/cardboard-bench/apps/cardboard_management/cardboard_management")
FILES = sorted((APP / "cardboard_management" / "api").glob("*.py")) + [APP / "reporting.py", APP / "inventory.py"]


def main() -> int:
    apply = "--apply" in sys.argv
    findings = []
    for path in FILES:
        source = path.read_text(encoding="utf-8")
        tree = ast.parse(source)
        lines = source.splitlines()
        targets = [
            node
            for node in ast.walk(tree)
            if isinstance(node, ast.Name) and node.id == "_" and isinstance(node.ctx, ast.Store)
        ]
        if not targets:
            continue
        for node in targets:
            context = lines[node.lineno - 1].strip()
            findings.append(f"{path.name}:{node.lineno}: {context}")

    if not findings:
        print("no shadowing found")
        return 0

    print("\n".join(findings))
    if not apply:
        print(f"\n{len(findings)} binding(s) reported; re-run with --apply to rename them to _unused")
        return 1

    for path in FILES:
        source = path.read_text(encoding="utf-8")
        tree = ast.parse(source)
        lines = source.splitlines()
        targets = sorted(
            [
                node
                for node in ast.walk(tree)
                if isinstance(node, ast.Name) and node.id == "_" and isinstance(node.ctx, ast.Store)
            ],
            key=lambda node: (node.lineno, node.col_offset),
            reverse=True,
        )
        if not targets:
            continue
        for node in targets:
            line = lines[node.lineno - 1]
            if line[node.col_offset] != "_":
                raise SystemExit(f"unexpected column in {path.name}:{node.lineno}")
            lines[node.lineno - 1] = line[: node.col_offset] + "_unused" + line[node.col_offset + 1 :]
        path.write_text("\n".join(lines) + ("\n" if source.endswith("\n") else ""), encoding="utf-8", newline="\n")
    print(f"\nrenamed {len(findings)} binding(s)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
