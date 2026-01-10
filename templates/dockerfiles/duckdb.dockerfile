FROM dunglas/frankenphp:latest

# Install DuckDB CLI
RUN apt-get update && apt-get install -y wget unzip \
    && wget https://github.com/duckdb/duckdb/releases/latest/download/duckdb_cli-linux-amd64.zip \
    && unzip duckdb_cli-linux-amd64.zip \
    && mv duckdb /usr/local/bin/ \
    && chmod +x /usr/local/bin/duckdb \
    && rm duckdb_cli-linux-amd64.zip \
    && apt-get clean

# Create directories
RUN mkdir -p /app/public /app/data

# Copy PHP files and Caddyfile
COPY templates/dockerfiles/duckdb-index.php /app/public/index.php
COPY templates/dockerfiles/duckdb-Caddyfile /etc/caddy/Caddyfile

EXPOSE 80

CMD ["frankenphp", "run", "--config", "/etc/caddy/Caddyfile"]