FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates curl tar poppler-utils python3 \
    && rm -rf /var/lib/apt/lists/*

RUN curl -L -o /tmp/tectonic.tar.gz \
    https://github.com/tectonic-typesetting/tectonic/releases/download/tectonic%400.15.0/tectonic-0.15.0-x86_64-unknown-linux-gnu.tar.gz \
    && tar -xzf /tmp/tectonic.tar.gz -C /usr/local/bin \
    && rm /tmp/tectonic.tar.gz

WORKDIR /app
COPY server.py /app/server.py

EXPOSE 8080
CMD ["python3", "/app/server.py"]
