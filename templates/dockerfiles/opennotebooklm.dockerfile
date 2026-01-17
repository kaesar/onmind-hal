FROM python:3.12-slim

WORKDIR /tmp

RUN apt-get update && apt-get install -y git curl && \
    rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir uv streamlit

RUN git clone https://github.com/lfnovo/open-notebook.git /app

WORKDIR /app

RUN uv pip install --system .

EXPOSE 8502

CMD ["streamlit", "run", "app.py", "--server.port=8502", "--server.address=0.0.0.0"]
