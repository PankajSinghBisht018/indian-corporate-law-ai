import os
import sys
import subprocess
import time

def _free_ports(ports):
    if os.name != "nt":
        return
    try:
        out = subprocess.check_output("netstat -ano", shell=True, text=True, stderr=subprocess.DEVNULL)
        pids = set()
        for line in out.splitlines():
            if any(f":{p} " in line for p in ports) and "LISTENING" in line:
                pids.add(line.strip().split()[-1])
        for pid in pids:
            subprocess.run(f"taskkill /F /T /PID {pid}", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        if pids:
            time.sleep(1)
    except Exception:
        pass

def main():
    _free_ports([5000, 8001, 8002, 8003, 8004])
    print("\n========================================")
    print("   LegalBuddy — Microservices Dev Mode")
    print("========================================\n")
    print("Starting all services...")
    print("  Auth Service     -> http://localhost:8001")
    print("  Document Service -> http://localhost:8002")
    print("  RAG Service      -> http://localhost:8003")
    print("  Payment Service  -> http://localhost:8004")
    print("  API Gateway      -> http://localhost:5000\n")
    print("Frontend still runs on http://localhost:5173 (npm run dev)\n")

    import platform
    is_windows = platform.system() == "Windows"
    
    if is_windows:
        venv_python = os.path.join("venv", "Scripts", "python.exe")
    else:
        venv_python = os.path.join("venv", "bin", "python")

    # If local venv path doesn't exist (e.g. inside Docker or global python), fallback to current interpreter
    if not os.path.exists(venv_python):
        venv_python = sys.executable
    else:
        venv_python = os.path.abspath(venv_python)

    cwd = os.path.abspath(os.getcwd())
    env = os.environ.copy()
    env["PYTHONPATH"] = cwd
    
    processes = []

    def start_service(module, port):
        cmd = [venv_python, "-m", "uvicorn", module, "--host", "0.0.0.0", "--port", str(port)]
        p = subprocess.Popen(cmd, env=env)
        processes.append(p)

    start_service("services.auth_service.main:app", 8001)
    start_service("services.document_service.main:app", 8002)
    start_service("services.rag_service.main:app", 8003)
    start_service("services.payment_service.main:app", 8004)
    
    time.sleep(3)
    
    start_service("services.api_gateway.main:app", 5000)

    print("\nAll services launched in this single terminal! Press Ctrl+C to stop all services.")
    try:
        for p in processes:
            p.wait()
    except KeyboardInterrupt:
        print("\nStopping all services...")
        for p in processes:
            p.terminate()

if __name__ == "__main__":
    main()
