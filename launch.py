"""Start ControlLab without a Node runtime."""
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
    parser.add_argument("--lan", action="store_true", help="Permitir acceso desde la red local.")
    args = parser.parse_args()
    root = Path(__file__).resolve().parent
    os.chdir(root)
    if not (root / "frontend/dist/index.html").is_file():
        parser.exit(1, "Falta la interfaz compilada. Ejecuta setup.cmd primero.\n")
    if not 1 <= args.port <= 65535:
        parser.error("El puerto debe estar entre 1 y 65535.")
    host = "0.0.0.0" if args.lan else "127.0.0.1"
    with socket.socket() as probe:
        try:
            probe.bind((host, args.port))
        except OSError:
            parser.exit(1, f"El puerto {args.port} esta ocupado. Usa --port 8766 o cierra la otra instancia.\n")
    try:
        import uvicorn
    except ImportError:
        parser.exit(1, "Faltan dependencias de Python. Ejecuta setup.cmd.\n")
    url = f"http://127.0.0.1:{args.port}"
    print(f"ControlLab: {url}\nPara cerrar: Ctrl+C en esta ventana.", flush=True)
    if args.lan:
        try:
            interfaces = socket.getaddrinfo(socket.gethostname(), None, socket.AF_INET)
            addresses = sorted({item[4][0] for item in interfaces if not item[4][0].startswith("127.")})
        except OSError:
            addresses = []
        for address in addresses:
            print(f"Desde otro dispositivo de la red: http://{address}:{args.port}/#tutor", flush=True)
        if not addresses:
            print(f"Desde el celular, usá la IPv4 de esta PC (ipconfig) en el puerto {args.port}.", flush=True)
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
    uvicorn.run("backend.main:app", host=host, port=args.port, log_level="warning")


if __name__ == "__main__":
    main()
