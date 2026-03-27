.PHONY: install run test lint typecheck audit check build

install:
	pip install -e ".[dev]"

run:
	docker compose -f infra/docker/docker-compose.dev.yml up --build

stop:
	docker compose -f infra/docker/docker-compose.dev.yml down

test:
	pytest tests/ -v --cov=app --cov-report=term-missing

lint:
	ruff check app/ tests/

typecheck:
	mypy app/ --strict

audit:
	pip-audit

predeploy:
	python scripts/pre_deploy_check.py

check: lint typecheck audit

build:
	docker build -t yuni-ai -f infra/docker/Dockerfile .
