import ast
from pathlib import Path

import pytest
from fastapi import APIRouter

from komorebi_server.core.modules import Module, validate_modules

ROOT = Path(__file__).resolve().parents[2] / "src" / "komorebi_server"


def test_import_boundaries():
    violations = []
    for path in ROOT.rglob("*.py"):
        parts = path.relative_to(ROOT).parts
        for node in ast.walk(ast.parse(path.read_text())):
            if isinstance(node, ast.Import):
                imports = [n.name for n in node.names]
            elif isinstance(node, ast.ImportFrom):
                assert not node.level, f"Use explicit imports so boundaries are auditable: {path}"
                imports = [node.module or ""]
            else:
                continue
            for name in imports:
                if parts[0] == "shared" and (
                    name.startswith("komorebi_server.core")
                    or name.startswith("komorebi_server.capabilities")
                    or name.startswith("sqlalchemy")
                ):
                    violations.append((path, name))
                if parts[0] == "core" and (
                    name.startswith("komorebi_server.capabilities")
                    or name.startswith("komorebi_server.app")
                    or (
                        name.startswith("komorebi_server.shared.contracts.")
                        and name != "komorebi_server.shared.contracts.common"
                    )
                ):
                    violations.append((path, name))
                if parts[0] == "capabilities" and name.startswith("komorebi_server.capabilities."):
                    if name.split(".")[2] != parts[1]:
                        violations.append((path, name))
                if parts[0] == "capabilities" and name == "komorebi_server.core.models":
                    violations.append((path, name))
    assert violations == []


def module(name, provides=(), requires=(), optional=()):
    return Module(
        name=name,
        schema=name,
        router=APIRouter(),
        provides=provides,
        requires=requires,
        optional=optional,
    )


def test_manifest_missing_ports_cycles_duplicates_and_order():
    with pytest.raises(ValueError, match="missing port"):
        validate_modules([module("consumer", requires=("missing",))])
    with pytest.raises(ValueError, match="cycle"):
        validate_modules(
            [module("a", ("a.port",), ("b.port",)), module("b", ("b.port",), ("a.port",))]
        )
    with pytest.raises(ValueError, match="Duplicate port"):
        validate_modules([module("a", ("same",)), module("b", ("same",))])
    result = validate_modules([module("b", requires=("a.port",)), module("a", ("a.port",))])
    assert [m.name for m in result] == ["a", "b"]
    assert validate_modules([module("a", optional=("missing",))])
