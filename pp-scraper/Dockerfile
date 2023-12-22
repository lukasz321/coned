# Build Stage
FROM python:3.11-slim-bookworm as builder

ENV POETRY_VERSION=1.6.1 \
    POETRY_VIRTUALENVS_IN_PROJECT=1 \
    POETRY_VIRTUALENVS_CREATE=1

WORKDIR /app

RUN pip install "poetry==${POETRY_VERSION}"

COPY poetry.lock pyproject.toml /app/

RUN poetry install --no-interaction --no-cache


# Carry over the virtual environment to Runtime
FROM python:3.11-slim-bookworm as runtime

ENV VIRTUAL_ENV=/app/.venv \
    PATH="/app/.venv/bin:$PATH" \
    PYTHONFAULTHANDLER=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONHASHSEED=random

COPY --from=builder ${VIRTUAL_ENV} ${VIRTUAL_ENV}

WORKDIR /app

COPY ./powerplot_scraper /app/powerplot_scraper

CMD ["python", "-m", "powerplot_scraper"]
