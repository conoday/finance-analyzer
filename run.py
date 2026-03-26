"""
run.py — Start backend (FastAPI) + frontend (Next.js) concurrently.

Usage:
    python run.py            # start both
    python run.py --api      # backend only
    python run.py --ui       # frontend only
    python run.py --streamlit # Streamlit fallback only
"""

import argparse
import os
import shutil
import signal
import subprocess
import sys
import threading
from pathlib import Path

ROOT = Path(__file__).parent
FRONTEND = ROOT / "frontend"
VENV_PYTHON = ROOT / ".venv" / "Scripts" / "python.exe"

# Use venv python if available, else fall back to current interpreter
PYTHON = str(VENV_PYTHON) if VENV_PYTHON.exists() else sys.executable


def _stream(proc: subprocess.Popen, prefix: str) -> None:
    """Print subprocess stdout/stderr with a prefix label."""
    assert proc.stdout is not None
    for line in proc.stdout:
        print(f"[{prefix}] {line}", end="", flush=True)


def start_api() -> subprocess.Popen:
    print("[run] Starting FastAPI backend on http://localhost:8000 ...")
    return subprocess.Popen(
        [PYTHON, "-m", "uvicorn", "api.main:app", "--reload", "--port", "8000"],
        cwd=ROOT,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        env={**os.environ, "PYTHONUNBUFFERED": "1"},
    )


def start_frontend() -> subprocess.Popen:
    npm = shutil.which("npm")
    if npm is None:
        print("[run] ERROR: npm not found. Install Node.js first.")
        sys.exit(1)

    node_modules = FRONTEND / "node_modules"
    if not node_modules.exists():
        print("[run] node_modules not found — running npm install ...")
        result = subprocess.run([npm, "install"], cwd=FRONTEND)
        if result.returncode != 0:
            print("[run] ERROR: npm install failed. Fix package.json errors and retry.")
            sys.exit(1)

    print("[run] Starting Next.js frontend on http://localhost:3000 ...")
    return subprocess.Popen(
        [npm, "run", "dev"],
        cwd=FRONTEND,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        shell=(sys.platform == "win32"),
    )


def start_streamlit() -> subprocess.Popen:
    ui_path = ROOT / "app" / "ui.py"
    print("[run] Starting Streamlit on http://localhost:8501 ...")
    return subprocess.Popen(
        [PYTHON, "-m", "streamlit", "run", str(ui_path)],
        cwd=ROOT,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        env={**os.environ, "PYTHONUNBUFFERED": "1"},
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Finance Analyzer launcher")
    parser.add_argument("--api", action="store_true", help="Backend only")
    parser.add_argument("--ui", action="store_true", help="Frontend only")
    parser.add_argument("--streamlit", action="store_true", help="Streamlit only")
    args = parser.parse_args()

    procs: list[subprocess.Popen] = []

    if args.streamlit:
        procs.append(start_streamlit())
    elif args.api:
        procs.append(start_api())
    elif args.ui:
        procs.append(start_frontend())
    else:
        # Default: start both
        api_proc = start_api()
        procs.append(api_proc)
        try:
            procs.append(start_frontend())
        except SystemExit:
            # npm install failed — shut down the already-started API
            api_proc.terminate()
            raise

    # ── Stream output from all processes ──────────────────────────────────
    labels = ["api", "frontend"] if len(procs) == 2 else ["app"]
    threads = [
        threading.Thread(target=_stream, args=(p, labels[i]), daemon=True)
        for i, p in enumerate(procs)
    ]
    for t in threads:
        t.start()

    # ── Graceful shutdown on Ctrl+C ────────────────────────────────────────
    def _shutdown(sig, frame):
        print("\n[run] Shutting down...", flush=True)
        for p in procs:
            p.terminate()
        for p in procs:
            try:
                p.wait(timeout=5)
            except subprocess.TimeoutExpired:
                p.kill()
        sys.exit(0)

    signal.signal(signal.SIGINT, _shutdown)
    signal.signal(signal.SIGTERM, _shutdown)

    # Wait for all processes
    for p in procs:
        p.wait()


if __name__ == "__main__":
    main()

