#!/usr/bin/env python3
"""Serve a built Nova bundle, optionally reverse-proxying /api to Frappe.

This is the production-shaped preview: a static SPA plus a same-origin proxy that
sets the site Host header, exactly like nginx does in `docs/DEPLOYMENT.md`. It is
how the *built* artifact is verified against the live backend - not the dev server.

Usage:
    python serve.py 5199                                   # mock bundle, static only
    python serve.py 5200 --dist dist --proxy http://127.0.0.1:8000
"""

from __future__ import annotations

import argparse
import functools
import http.client
import http.server
import os
import sys
import urllib.parse

DEFAULT_SITE_HOST = "cardboard.localhost"
HOP_BY_HOP = {"connection", "keep-alive", "transfer-encoding", "upgrade", "content-length", "host"}


class SpaHandler(http.server.SimpleHTTPRequestHandler):
    proxy_target: str = ""
    site_host: str = DEFAULT_SITE_HOST

    def __init__(self, *args, directory: str = "", **kwargs):
        super().__init__(*args, directory=directory, **kwargs)

    def log_message(self, format: str, *args) -> None:  # noqa: A002 - signature of the base class
        sys.stderr.write("  %s\n" % (format % args))

    def end_headers(self) -> None:
        # The hashed bundle lives under /nova/ (see vite.config.ts assetsDir): it is
        # safe to cache forever, everything else must revalidate.
        if self.path.startswith("/nova/"):
            self.send_header("Cache-Control", "public, max-age=31536000, immutable")
        else:
            self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def do_GET(self) -> None:  # noqa: N802 - base class API
        if self._is_backend():
            self._proxy("GET")
            return
        super().do_GET()

    def do_HEAD(self) -> None:  # noqa: N802
        if self._is_backend():
            self._proxy("HEAD")
            return
        super().do_HEAD()

    def do_POST(self) -> None:  # noqa: N802
        self._proxy("POST")

    def do_PUT(self) -> None:  # noqa: N802
        self._proxy("PUT")

    def do_DELETE(self) -> None:  # noqa: N802
        self._proxy("DELETE")

    def _is_backend(self) -> bool:
        """Paths Frappe owns even when the SPA shares the origin."""
        if not self.proxy_target:
            return False
        for route in ("/login", "/app", "/printview"):
            if self.path == route or self.path.startswith(f"{route}/") or self.path.startswith(f"{route}?"):
                return True
        return any(self.path.startswith(prefix) for prefix in ("/api/", "/files/", "/private/"))

    def send_head(self):  # SPA fallback for deep links
        path = self.translate_path(self.path)
        if not os.path.exists(path) and not self.path.startswith("/assets/"):
            self.path = "/index.html"
        return super().send_head()

    def _proxy(self, method: str) -> None:
        if not self.proxy_target:
            self.send_error(502, "No proxy target configured")
            return

        target = urllib.parse.urlsplit(self.proxy_target)
        length = int(self.headers.get("Content-Length") or 0)
        body = self.rfile.read(length) if length else None

        # http.client is used instead of urllib on purpose: urllib drops a
        # caller-supplied Host header, and Host is exactly what selects the
        # Frappe site (and therefore the session + the installed app).
        headers = {key: value for key, value in self.headers.items() if key.lower() not in HOP_BY_HOP}
        headers["Host"] = self.site_host
        headers["X-Forwarded-Host"] = self.headers.get("Host", self.site_host)

        connection = http.client.HTTPConnection(target.hostname, target.port or 80, timeout=60)
        try:
            connection.request(method, self.path, body=body, headers=headers)
            upstream = connection.getresponse()
            payload = upstream.read()
            status = upstream.status
            response_headers = upstream.getheaders()
        except OSError as failure:
            self.send_error(502, f"Upstream unavailable: {failure}")
            return
        finally:
            connection.close()

        self.send_response(status)
        for key, value in response_headers:
            if key.lower() in HOP_BY_HOP:
                continue
            self.send_header(key, value)
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        if method != "HEAD":
            self.wfile.write(payload)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("port", nargs="?", type=int, default=5199)
    parser.add_argument("--dist", default="dist-mock", help="bundle directory to serve")
    parser.add_argument("--proxy", default="", help="backend origin for /api, e.g. http://127.0.0.1:8000")
    parser.add_argument("--host-header", default=DEFAULT_SITE_HOST, help="Host header sent to the backend")
    options = parser.parse_args()

    if not os.path.isdir(options.dist):
        print(f"bundle directory not found: {options.dist}", file=sys.stderr)
        return 2

    SpaHandler.proxy_target = options.proxy.rstrip("/")
    SpaHandler.site_host = options.host_header
    handler = functools.partial(SpaHandler, directory=options.dist)

    with http.server.ThreadingHTTPServer(("127.0.0.1", options.port), handler) as server:
        mode = f"proxy /api -> {options.proxy} (Host: {options.host_header})" if options.proxy else "static only"
        print(f"serving {options.dist} on http://127.0.0.1:{options.port} - {mode}", flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
