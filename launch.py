"""Start the offline application on loopback, without a Node runtime."""
from pathlib import Path
import argparse
import os
import socket
import threading
import time
import urllib.request
import webbrowser


def main():
    parser = argparse.ArgumentParser(description="ControlLab local")
    parser.add_argument("--port", type=int, default=8765)
    parser.add_argument("--no-browser", action="store_true")
    args = parser.parse_args()
    root = Path(__file__).resolve().parent
    os.chdir(root)
    if not (root / "frontend/dist/index.html").is_file():
        parser.exit(1, "Falta la interfaz compilada. Ejecuta setup.cmd primero.\n")
    if not 1 <= args.port <= 65535:
        parser.error("El puerto debe estar entre 1 y 65535.")
    with socket.socket() as probe:
        try:
            probe.bind(("127.0.0.1", args.port))
        except OSError:
            parser.exit(1, f"El puerto {args.port} esta ocupado. Usa --port 8766 o cierra la otra instancia.\n")
    try:
        import uvicorn
    except ImportError:
        parser.exit(1, "Faltan dependencias de Python. Ejecuta setup.cmd.\n")
    url = f"http://127.0.0.1:{args.port}"
    print(f"ControlLab: {url}\nPara cerrar: Ctrl+C en esta ventana.", flush=True)
    if not args.no_browser:
        def open_when_ready():
            for _ in range(100):
                try:
                    with urllib.request.urlopen(url + "/api/health", timeout=0.3) as response:
                        if response.status == 200:
                            webbrowser.open(url)
                            return
                except OSError:
                    time.sleep(0.1)
        threading.Thread(target=open_when_ready, daemon=True).start()
    uvicorn.run("backend.main:app", host="127.0.0.1", port=args.port, log_level="warning")


if __name__ == "__main__":
    main()
