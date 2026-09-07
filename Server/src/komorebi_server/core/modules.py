"""Explicit startup registration; application code receives ports, not a service locator."""

from collections.abc import Callable
from dataclasses import dataclass, field

from fastapi import APIRouter


@dataclass(frozen=True)
class Subscription:
    event_type: str
    consumer: str
    handler: Callable
    required_scope: str


@dataclass(frozen=True)
class JobHandler:
    handle: Callable
    required_scope: str
    external: bool = False
    lease_seconds: int | None = None


@dataclass(frozen=True)
class Module:
    name: str
    schema: str
    router: APIRouter
    provides: tuple[str, ...] = ()
    requires: tuple[str, ...] = ()
    optional: tuple[str, ...] = ()
    permissions: tuple[str, ...] = ()
    subscriptions: tuple[Subscription, ...] = ()
    jobs: dict[str, JobHandler] = field(default_factory=dict)
    export: Callable | None = None
    maintenance: Callable | None = None


def validate_modules(modules: list[Module]) -> list[Module]:
    names, schemas, providers = set(), set(), {}
    for module in modules:
        if module.name in names or module.schema in schemas:
            raise ValueError(f"Duplicate module/schema: {module.name}")
        names.add(module.name)
        schemas.add(module.schema)
        for port in module.provides:
            if port in providers:
                raise ValueError(f"Duplicate port: {port}")
            providers[port] = module.name
    by_name = {m.name: m for m in modules}
    ordered, visiting, visited = [], set(), set()

    def visit(name):
        if name in visiting:
            raise ValueError(f"Module dependency cycle at {name}")
        if name in visited:
            return
        visiting.add(name)
        module = by_name[name]
        for port in module.requires:
            if port not in providers:
                raise ValueError(f"{name} requires missing port {port}")
        for port in module.requires + module.optional:
            if port in providers and providers[port] != name:
                visit(providers[port])
        visiting.remove(name)
        visited.add(name)
        ordered.append(module)

    for name in by_name:
        visit(name)
    job_types, consumers = set(), set()
    for module in ordered:
        for job_type in module.jobs:
            if not job_type.startswith(module.name + ".") or job_type in job_types:
                raise ValueError(f"Invalid/duplicate job type {job_type}")
            job_types.add(job_type)
        for sub in module.subscriptions:
            if sub.consumer in consumers:
                raise ValueError(f"Duplicate event consumer {sub.consumer}")
            consumers.add(sub.consumer)
    return ordered
