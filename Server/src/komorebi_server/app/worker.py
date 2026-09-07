import logging
import signal
import threading

from komorebi_server.app.composition import compose
from komorebi_server.core.config import Settings
from komorebi_server.core.jobs import Worker


def run():
    logging.basicConfig(level=logging.INFO)
    settings = Settings()
    platform, modules = compose(settings)
    worker = Worker(platform, modules)
    stopped = threading.Event()
    for sig in (signal.SIGINT, signal.SIGTERM):
        signal.signal(sig, lambda *_: stopped.set())

    def heartbeat():
        while not stopped.wait(30):
            try:
                worker.heartbeat()
            except Exception:
                logging.error("worker_heartbeat_failed")

    pulse = threading.Thread(target=heartbeat, daemon=True)
    pulse.start()
    try:
        while not stopped.is_set():
            try:
                worked = worker.tick()
            except Exception as exc:
                logging.error("worker_tick_failed exception_type=%s", type(exc).__name__)
                worked = False
            if not worked:
                stopped.wait(settings.worker_poll_seconds)
    finally:
        stopped.set()
        pulse.join(timeout=5)
        platform.db.engine.dispose()
