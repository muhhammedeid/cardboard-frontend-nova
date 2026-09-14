"""SPA static server for the standalone mock build (Windows-side demo).

    python serve.py [port]        # default 5199, serves ./dist-mock

Unknown paths fall back to index.html so client-side routes survive a refresh.
"""

import http.server
import os
import socketserver
import sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dist-mock")
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 5199


class SpaHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def do_GET(self):  # noqa: N802 - stdlib naming
        path = self.translate_path(self.path)
        if not os.path.exists(path) or os.path.isdir(path) and not os.path.exists(os.path.join(path, "index.html")):
            self.path = "/index.html"
        return super().do_GET()

    def log_message(self, fmt, *args):
        sys.stderr.write("%s - %s\n" % (self.address_string(), fmt % args))


if __name__ == "__main__":
    if not os.path.isdir(ROOT):
        raise SystemExit("dist-mock not found — run `npm run build:mock` first.")
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("127.0.0.1", PORT), SpaHandler) as httpd:
        print(f"Nova mock preview → http://localhost:{PORT}  (root: {ROOT})")
        httpd.serve_forever()
