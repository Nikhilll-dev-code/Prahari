import subprocess
import time
import sys
import os
import signal
import re

def kill_port_process(port):
    """Find and terminate any process listening on the given port (cross-platform / Windows)."""
    try:
        if os.name == 'nt':
            output = subprocess.check_output(f'netstat -ano | findstr ":{port}"', shell=True).decode('utf-8', errors='ignore')
            pids = set()
            for line in output.strip().split('\n'):
                if 'LISTENING' in line:
                    parts = line.strip().split()
                    if parts:
                        pids.add(parts[-1])
            for pid in pids:
                if pid and pid != '0':
                    print(f"  -> Freeing occupied port {port} (killing PID {pid})...")
                    subprocess.run(f"taskkill /F /PID {pid}", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except Exception:
        pass

def run():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    ml_dir = os.path.join(base_dir, "ml_service")
    backend_dir = os.path.join(base_dir, "backend")
    frontend_dir = os.path.join(base_dir, "frontend")

    print("=" * 72)
    print("  PRAHARI (प्रहरी) | AI/NLP SIF Precursor Detection Engine")
    print("  Problem Statement: SIH26165 | Organization: Oil India Limited")
    print("=" * 72)

    # 0. Clean up any stale ports from previous runs
    print("\n[0/3] Checking & clearing ports (8001, 5000, 3000)...")
    kill_port_process(8001)
    kill_port_process(5000)
    kill_port_process(3000)
    time.sleep(1)

    # 1. Start Python FastAPI ML NLP Service (Port 8001)
    print("\n[1/3] Starting FastAPI ML Service on http://127.0.0.1:8001 ...")
    ml_proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", "8001"],
        cwd=ml_dir
    )

    time.sleep(2)

    # 2. Start Express Backend API (Port 5000)
    print("\n[2/3] Starting Express Backend API on http://127.0.0.1:5000 ...")
    backend_proc = subprocess.Popen(
        ["node", "server.js"],
        cwd=backend_dir,
        shell=True
    )

    time.sleep(2)

    # 3. Start Vite Frontend (Port 3000)
    print("\n[3/3] Starting Vite React Frontend on http://localhost:3000 ...")
    frontend_proc = subprocess.Popen(
        ["npm", "run", "dev"],
        cwd=frontend_dir,
        shell=True
    )

    print("\n" + "=" * 72)
    print("  All PRAHARI services are running successfully!")
    print("  • Frontend UI:       http://localhost:3000")
    print("  • Backend API:       http://127.0.0.1:5000")
    print("  • ML NLP Service:    http://127.0.0.1:8001/docs")
    print("=" * 72)
    print("\nPress Ctrl+C to stop all services.\n")

    def shutdown(sig=None, frame=None):
        print("\nStopping all PRAHARI services...")
        try:
            if os.name == 'nt':
                subprocess.run(f"taskkill /F /T /PID {ml_proc.pid}", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                subprocess.run(f"taskkill /F /T /PID {backend_proc.pid}", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                subprocess.run(f"taskkill /F /T /PID {frontend_proc.pid}", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            else:
                ml_proc.terminate()
                backend_proc.terminate()
                frontend_proc.terminate()
        except Exception:
            pass
        kill_port_process(8001)
        kill_port_process(5000)
        kill_port_process(3000)
        print("All services stopped.")
        sys.exit(0)

    signal.signal(signal.SIGINT, shutdown)
    if hasattr(signal, 'SIGBREAK'):
        signal.signal(signal.SIGBREAK, shutdown)

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        shutdown()

if __name__ == "__main__":
    run()
