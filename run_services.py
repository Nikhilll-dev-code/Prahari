import subprocess
import time
import sys
import os
import signal

def run():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    ml_dir = os.path.join(base_dir, "ml_service")
    backend_dir = os.path.join(base_dir, "backend")
    frontend_dir = os.path.join(base_dir, "frontend")

    print("=" * 70)
    print("  SIF-Sentinel | AI/NLP Engine for SIF Precursor Detection")
    print("  Problem Statement: SIH26165 | Organization: Oil India Limited")
    print("=" * 70)

    # 1. Start Python FastAPI ML NLP Service (Port 8001)
    print("\n[1/3] Starting FastAPI ML Service on http://127.0.0.1:8001 ...")
    ml_proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", "8001"],
        cwd=ml_dir
    )

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

    print("\n" + "=" * 70)
    print("  All SIF-Sentinel services are running!")
    print("  • Frontend UI:       http://localhost:3000")
    print("  • Backend API:       http://127.0.0.1:5000")
    print("  • ML NLP Service:    http://127.0.0.1:8001/docs")
    print("=" * 70)
    print("\nPress Ctrl+C to stop all services.\n")

    def signal_handler(sig, frame):
        print("\nStopping all services...")
        try:
            ml_proc.terminate()
            backend_proc.terminate()
            frontend_proc.terminate()
        except:
            pass
        sys.exit(0)

    signal.signal(signal.SIGINT, signal_handler)

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        signal_handler(None, None)

if __name__ == "__main__":
    run()
