#!/usr/bin/env python3
import json
import os
import subprocess
import tempfile
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path


class Handler(BaseHTTPRequestHandler):
    def _json(self, code: int, payload: dict):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path == "/health":
            self._json(200, {"ok": True})
            return
        self._json(404, {"error": "not found"})

    def do_POST(self):
        if self.path != "/compile":
            self._json(404, {"error": "not found"})
            return
        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length)
        try:
            data = json.loads(raw.decode("utf-8"))
            latex = data["latex"]
        except Exception:
            self._json(400, {"error": "invalid json"})
            return

        with tempfile.TemporaryDirectory() as tmp:
            tex = Path(tmp) / "resume.tex"
            tex.write_text(latex, encoding="utf-8")
            try:
                subprocess.run(
                    ["tectonic", "-X", "compile", "--outfmt", "pdf", str(tex)],
                    check=True,
                    cwd=tmp,
                    timeout=60,
                )
            except Exception as exc:
                self._json(500, {"error": f"tectonic failed: {exc}"})
                return
            pdf = (Path(tmp) / "resume.pdf").read_bytes()
            text = ""
            try:
                text = subprocess.check_output(
                    ["pdftotext", "-layout", str(Path(tmp) / "resume.pdf"), "-"],
                    timeout=15,
                ).decode("utf-8", errors="ignore")
            except Exception:
                text = ""
            self._json(
                200,
                {
                    "pdfBase64": __import__("base64").b64encode(pdf).decode("ascii"),
                    "text": text,
                },
            )


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8080"))
    HTTPServer(("0.0.0.0", port), Handler).serve_forever()
