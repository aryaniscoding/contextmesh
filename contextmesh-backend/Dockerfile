# Python 3.12 rather than 3.13 because every dependency here ships a prebuilt
# wheel for it, so the image needs no compiler and builds fine on a 1GB instance.
FROM python:3.12-slim

# PYTHONUNBUFFERED matters in a container: without it, log lines sit in a buffer
# and `docker logs` appears empty while the app is actually running.
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PORT=8000

WORKDIR /app

# Dependencies are copied on their own first so this layer stays cached until
# requirements.txt itself changes. Copying the source first would rebuild the
# whole dependency install on every code edit.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Run unprivileged, so a compromise inside the container is not root
RUN useradd --create-home --shell /usr/sbin/nologin appuser \
    && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

# Uses the stdlib so the image needs no curl. Docker restarts the container when
# this fails, which covers the app wedging without the process actually dying.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD python -c "import os,urllib.request,sys; p=os.getenv('PORT','8000'); sys.exit(0 if urllib.request.urlopen(f'http://127.0.0.1:{p}/health',timeout=4).status==200 else 1)"

# One worker on purpose. The APScheduler job in scheduler.py lives inside the
# process, so each worker would start its own; the advisory lock in
# services/locks.py is what keeps that safe if you ever raise this.
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT} --workers 1"]
