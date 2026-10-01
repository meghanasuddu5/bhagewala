#!/usr/bin/env python3
"""
Baghewala Field — AI-Enabled Well-to-Surface Digital Twin
Unified Application Runner (main.py)

Problem Statement SIH26120:
Integrated Cyclic Steam Stimulation (CSS) & Sucker Rod Pump (SRP) Optimization.

Usage:
    python main.py                     # Run unified app (Backend API + 3D Dashboard)
    python main.py --dev               # Run full development mode (FastAPI + Vite HMR)
    python main.py --backend-only      # Run only FastAPI backend on port 8000
    python main.py --frontend-only     # Run only Vite dev server on port 5173
    python main.py --build             # Build React frontend assets
    python main.py --test              # Run pytest test suite
    python main.py --check             # Pre-flight environment & model sanity check
"""

import argparse
import os
import platform
import shutil
import signal
import subprocess
import sys
import threading
import time
import webbrowser
from pathlib import Path

# Ensure root and backend directory are in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent
BACKEND_DIR = PROJECT_ROOT / "backend"
FRONTEND_DIR = PROJECT_ROOT / "frontend"
FRONTEND_DIST = FRONTEND_DIR / "dist"

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

# Safe UTF-8 reconfiguration for Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass


# Terminal symbols & formatting
class Symbols:
    OK = "[OK]"
    WARN = "[!]"
    ERR = "[X]"
    BULLET = "*"


# ANSI terminal colors (with fallback if disabled)
class Colors:
    CYAN = "\033[96m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    RED = "\033[91m"
    BOLD = "\033[1m"
    DIM = "\033[2m"
    RESET = "\033[0m"


def print_banner(host: str, port: int, mode: str = "Production / Integrated", frontend_port: int = 5173):
    """Display an informative industrial-grade terminal banner."""
    print(f"{Colors.CYAN}{Colors.BOLD}")
    print("================================================================================")
    print("   BAGHEWALA HEAVY OIL FIELD -- AI-ENABLED WELL-TO-SURFACE DIGITAL TWIN   ")
    print("   SIH26120: Cyclic Steam Stimulation (CSS) & Sucker Rod Pump Optimization      ")
    print("================================================================================")
    print(f"{Colors.RESET}")
    print(f" {Colors.BOLD}Execution Mode:{Colors.RESET}       {mode}")
    print(f" {Colors.BOLD}Platform:{Colors.RESET}             {platform.system()} ({platform.python_implementation()} {platform.python_version()})")
    print(f" {Colors.BOLD}Project Root:{Colors.RESET}         {PROJECT_ROOT}")
    print("--------------------------------------------------------------------------------")
    print(f" {Colors.GREEN}*{Colors.RESET} {Colors.BOLD}FastAPI Backend:{Colors.RESET}      http://{host}:{port}")
    print(f" {Colors.GREEN}*{Colors.RESET} {Colors.BOLD}Interactive Docs:{Colors.RESET}     http://{host}:{port}/docs")
    print(f" {Colors.GREEN}*{Colors.RESET} {Colors.BOLD}Health Endpoint:{Colors.RESET}      http://{host}:{port}/api/v1/health")

    if mode == "Development (FastAPI + Vite)":
        print(f" {Colors.YELLOW}*{Colors.RESET} {Colors.BOLD}Vite Dev Dashboard:{Colors.RESET}   http://{host}:{frontend_port}")
    elif FRONTEND_DIST.exists():
        print(f" {Colors.GREEN}*{Colors.RESET} {Colors.BOLD}Digital Twin 3D UI:{Colors.RESET}   http://{host}:{port}/dashboard")
    else:
        print(f" {Colors.YELLOW}[!]{Colors.RESET} {Colors.BOLD}Frontend Build:{Colors.RESET}       Not found. Run `python main.py --build` to compile.")

    print("--------------------------------------------------------------------------------")
    print(f" {Colors.DIM}Press Ctrl+C to stop the server.{Colors.RESET}")
    print("================================================================================\n")


def check_environment() -> bool:
    """Validate python version, key dependencies, and model artifacts."""
    print(f"\n{Colors.BOLD}[1/3] Validating Python Runtime & Dependencies...{Colors.RESET}")

    if sys.version_info < (3, 10):
        print(f"{Colors.RED}[X] Error: Python 3.10 or higher is required (found {sys.version.split()[0]}).{Colors.RESET}")
        return False
    print(f"  {Colors.GREEN}[OK]{Colors.RESET} Python {platform.python_version()} verified.")

    required_pkgs = ["fastapi", "uvicorn", "pydantic", "sklearn", "pandas", "numpy", "joblib"]
    missing = []
    for pkg in required_pkgs:
        try:
            __import__(pkg)
        except ImportError:
            missing.append(pkg)

    if missing:
        print(f"{Colors.RED}[X] Missing required Python packages: {', '.join(missing)}{Colors.RESET}")
        print(f"  Install via: pip install -r backend/requirements.txt")
        return False
    print(f"  {Colors.GREEN}[OK]{Colors.RESET} All core backend dependencies loaded.")

    print(f"\n{Colors.BOLD}[2/3] Checking ML Model Artifacts...{Colors.RESET}")
    model_file = BACKEND_DIR / "models" / "production" / "two_stage_oil_model.joblib"
    manifest_file = BACKEND_DIR / "models" / "production" / "model_manifest.json"

    if not model_file.exists():
        print(f"{Colors.RED}[X] Missing model bundle: {model_file}{Colors.RESET}")
        return False
    if not manifest_file.exists():
        print(f"{Colors.RED}[X] Missing model manifest: {manifest_file}{Colors.RESET}")
        return False
    print(f"  {Colors.GREEN}[OK]{Colors.RESET} V1.3 Two-stage ML model artifact detected ({model_file.name}).")
    print(f"  {Colors.GREEN}[OK]{Colors.RESET} Model manifest detected ({manifest_file.name}).")

    print(f"\n{Colors.BOLD}[3/3] Checking Frontend UI Assets...{Colors.RESET}")
    dist_html = FRONTEND_DIST / "index.html"
    if dist_html.exists():
        print(f"  {Colors.GREEN}[OK]{Colors.RESET} Built frontend assets found in frontend/dist (Ready to serve at /dashboard).")
    else:
        npm_path = shutil.which("npm")
        if npm_path:
            print(f"  {Colors.YELLOW}[!]{Colors.RESET} Built frontend not found, but npm is available ({npm_path}).")
        else:
            print(f"  {Colors.YELLOW}[!]{Colors.RESET} Built frontend not found and npm not detected.")

    print(f"\n{Colors.GREEN}{Colors.BOLD}[OK] Environment validation successful.{Colors.RESET}\n")
    return True



def run_tests() -> int:
    """Execute pytest suite."""
    print(f"\n{Colors.CYAN}{Colors.BOLD}Running Baghewala Backend Test Suite (pytest)...{Colors.RESET}\n")
    cmd = [sys.executable, "-m", "pytest", str(BACKEND_DIR / "tests"), "-v"]
    return subprocess.call(cmd, cwd=str(PROJECT_ROOT))


def build_frontend() -> bool:
    """Compile the React/Vite frontend into frontend/dist."""
    print(f"\n{Colors.CYAN}{Colors.BOLD}Building React / Three.js Frontend...{Colors.RESET}")
    npm_path = shutil.which("npm")
    if not npm_path:
        print(f"{Colors.RED}✖ npm is not installed or not found in PATH.{Colors.RESET}")
        return False

    # Check node_modules
    if not (FRONTEND_DIR / "node_modules").exists():
        print(f"Installing frontend dependencies (npm install)...")
        res = subprocess.call([npm_path, "install"], cwd=str(FRONTEND_DIR), shell=platform.system() == "Windows")
        if res != 0:
            print(f"{Colors.RED}✖ npm install failed with exit code {res}.{Colors.RESET}")
            return False

    print("Executing Vite build...")
    res = subprocess.call([npm_path, "run", "build"], cwd=str(FRONTEND_DIR), shell=platform.system() == "Windows")
    if res == 0:
        print(f"{Colors.GREEN}✔ Frontend build completed successfully -> frontend/dist{Colors.RESET}\n")
        return True
    else:
        print(f"{Colors.RED}✖ Frontend build failed with exit code {res}.{Colors.RESET}\n")
        return False


def open_browser_delayed(url: str, delay: float = 1.2):
    """Launch browser in background after brief delay."""
    def _open():
        time.sleep(delay)
        try:
            webbrowser.open(url)
        except Exception:
            pass
    threading.Thread(target=_open, daemon=True).start()


def run_backend(host: str, port: int, reload: bool = False):
    """Run FastAPI uvicorn server directly."""
    import uvicorn
    uvicorn.run(
        "backend.app.main:app",
        host=host,
        port=port,
        reload=reload,
        reload_dirs=[str(BACKEND_DIR)] if reload else None,
        log_level="info",
    )


def run_dev_concurrent(host: str, backend_port: int, frontend_port: int, open_browser: bool = True):
    """Run both FastAPI backend and Vite frontend development server concurrently."""
    npm_path = shutil.which("npm")
    if not npm_path:
        print(f"{Colors.RED}✖ npm not found in PATH. Cannot run Vite frontend dev server.{Colors.RESET}")
        print("Falling back to backend-only mode...")
        run_backend(host, backend_port, reload=True)
        return

    # Check node_modules
    if not (FRONTEND_DIR / "node_modules").exists():
        print("Installing frontend dependencies (npm install)...")
        subprocess.call([npm_path, "install"], cwd=str(FRONTEND_DIR), shell=platform.system() == "Windows")

    backend_cmd = [
        sys.executable,
        "-m",
        "uvicorn",
        "backend.app.main:app",
        "--host",
        host,
        "--port",
        str(backend_port),
        "--reload",
    ]

    frontend_cmd = [
        npm_path,
        "run",
        "dev",
        "--",
        "--host",
        host,
        "--port",
        str(frontend_port),
    ]

    print_banner(host, backend_port, mode="Development (FastAPI + Vite)", frontend_port=frontend_port)

    procs = []
    is_windows = platform.system() == "Windows"

    def terminate_all():
        for p in procs:
            if p.poll() is None:
                try:
                    if is_windows:
                        subprocess.call(["taskkill", "/F", "/T", "/PID", str(p.pid)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                    else:
                        p.terminate()
                except Exception:
                    pass

    try:
        # Start backend
        backend_proc = subprocess.Popen(
            backend_cmd,
            cwd=str(PROJECT_ROOT),
            env=os.environ.copy(),
        )
        procs.append(backend_proc)

        # Start frontend
        frontend_proc = subprocess.Popen(
            frontend_cmd,
            cwd=str(FRONTEND_DIR),
            shell=is_windows,
            env=os.environ.copy(),
        )
        procs.append(frontend_proc)

        if open_browser:
            open_browser_delayed(f"http://{host}:{frontend_port}", delay=2.0)

        # Wait on processes
        while all(p.poll() is None for p in procs):
            time.sleep(0.5)

    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}Shutting down development servers...{Colors.RESET}")
    finally:
        terminate_all()
        print(f"{Colors.GREEN}Servers successfully terminated.{Colors.RESET}")


def run_frontend_only(host: str, frontend_port: int, open_browser: bool = True):
    """Run only the Vite dev server."""
    npm_path = shutil.which("npm")
    if not npm_path:
        print(f"{Colors.RED}✖ npm not found in PATH.{Colors.RESET}")
        sys.exit(1)

    if open_browser:
        open_browser_delayed(f"http://{host}:{frontend_port}", delay=1.5)

    cmd = [npm_path, "run", "dev", "--", "--host", host, "--port", str(frontend_port)]
    subprocess.call(cmd, cwd=str(FRONTEND_DIR), shell=platform.system() == "Windows")


def main():
    parser = argparse.ArgumentParser(
        description="Baghewala Field AI-Enabled Well-to-Surface Digital Twin Runner",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python main.py                     # Start backend + integrated 3D dashboard
  python main.py --dev               # Run full development mode (FastAPI + Vite HMR)
  python main.py --backend-only      # Run only FastAPI backend
  python main.py --frontend-only     # Run only Vite frontend
  python main.py --build             # Build React/Vite assets into frontend/dist
  python main.py --test              # Run test suite
  python main.py --port 8080         # Custom backend port
        """,
    )

    parser.add_argument(
        "--host",
        type=str,
        default="127.0.0.1",
        help="Host address to bind (default: 127.0.0.1)",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=8000,
        help="Backend port to bind (default: 8000)",
    )
    parser.add_argument(
        "--frontend-port",
        type=int,
        default=5173,
        help="Frontend Vite dev server port (default: 5173)",
    )
    parser.add_argument(
        "--dev",
        action="store_true",
        help="Run in full development mode with FastAPI reload and Vite HMR concurrently",
    )
    parser.add_argument(
        "--backend-only",
        action="store_true",
        help="Run only the FastAPI backend server",
    )
    parser.add_argument(
        "--frontend-only",
        action="store_true",
        help="Run only the React/Vite frontend dev server",
    )
    parser.add_argument(
        "--reload",
        action="store_true",
        help="Enable uvicorn auto-reload for backend code changes",
    )
    parser.add_argument(
        "--no-browser",
        action="store_true",
        help="Do not automatically launch web browser on startup",
    )
    parser.add_argument(
        "--build",
        action="store_true",
        help="Build production frontend assets (npm run build) and exit",
    )
    parser.add_argument(
        "--test",
        action="store_true",
        help="Run backend pytest test suite and exit",
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="Perform pre-flight sanity checks on environment and models and exit",
    )

    args = parser.parse_args()

    # Standalone action: test
    if args.test:
        code = run_tests()
        sys.exit(code)

    # Standalone action: build
    if args.build:
        ok = build_frontend()
        sys.exit(0 if ok else 1)

    # Standalone action: check
    if args.check:
        ok = check_environment()
        sys.exit(0 if ok else 1)

    # Frontend-only mode
    if args.frontend_only:
        run_frontend_only(args.host, args.frontend_port, open_browser=not args.no_browser)
        return

    # Dev concurrent mode
    if args.dev:
        run_dev_concurrent(
            host=args.host,
            backend_port=args.port,
            frontend_port=args.frontend_port,
            open_browser=not args.no_browser,
        )
        return

    # Standard / Backend Mode
    # Pre-check environment
    if not check_environment():
        sys.exit(1)

    # If frontend dist does not exist, build it automatically if npm exists
    if not FRONTEND_DIST.exists() and not args.backend_only:
        npm_path = shutil.which("npm")
        if npm_path:
            print(f"{Colors.YELLOW}frontend/dist not found. Automatically building frontend...{Colors.RESET}")
            build_frontend()

    mode_label = "Backend Only" if args.backend_only else "Integrated (Backend + 3D Dashboard)"
    print_banner(args.host, args.port, mode=mode_label)

    # Determine launch URL
    if not args.no_browser:
        target_url = f"http://{args.host}:{args.port}/docs" if args.backend_only or not FRONTEND_DIST.exists() else f"http://{args.host}:{args.port}/dashboard"
        open_browser_delayed(target_url, delay=1.2)

    try:
        run_backend(args.host, args.port, reload=args.reload)
    except KeyboardInterrupt:
        print(f"\n{Colors.YELLOW}Baghewala Digital Twin server stopped.{Colors.RESET}")


if __name__ == "__main__":
    main()
