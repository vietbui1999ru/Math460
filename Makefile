# Makefile for PDE Simulation Platform

.PHONY: help install dev build up down logs clean test

help:
	@echo "PDE Simulation Platform - Make Commands"
	@echo ""
	@echo "  make install    - Install dependencies for local development"
	@echo "  make dev        - Run development servers locally"
	@echo "  make build      - Build Docker containers"
	@echo "  make up         - Start Docker containers"
	@echo "  make down       - Stop Docker containers"
	@echo "  make logs       - View container logs"
	@echo "  make clean      - Clean build artifacts and caches"
	@echo "  make test       - Run tests"

# Local development
install:
	@echo "Installing backend dependencies..."
	cd backend && pip install -r requirements.txt
	@echo "Installing frontend dependencies..."
	cd frontend && npm install
	@echo "Installation complete!"

dev:
	@echo "Starting development servers..."
	@echo "Backend: http://localhost:8001"
	@echo "Frontend: http://localhost:5743"
	@echo ""
	@make -j2 dev-backend dev-frontend

dev-backend:
	cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8001

dev-frontend:
	cd frontend && npm run dev

# Docker operations
build:
	docker-compose build

up:
	docker-compose up -d
	@echo "Services started!"
	@echo "Frontend: http://localhost"
	@echo "Backend API: http://localhost:8001"
	@echo "API Docs: http://localhost:8001/docs"

up-dev:
	docker-compose -f docker-compose.dev.yml up
	@echo "Development services started!"

down:
	docker-compose down

logs:
	docker-compose logs -f

logs-backend:
	docker-compose logs -f backend

logs-frontend:
	docker-compose logs -f frontend

# Testing
test:
	cd backend && pytest tests/ -v

test-coverage:
	cd backend && pytest tests/ --cov=app --cov-report=html

# Cleaning
clean:
	@echo "Cleaning build artifacts..."
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	cd frontend && rm -rf dist/ node_modules/.vite
	@echo "Clean complete!"

clean-docker:
	docker-compose down -v
	docker system prune -f

# Code quality
lint:
	cd backend && flake8 app/
	cd frontend && npm run lint

format:
	cd backend && black app/
	cd frontend && npm run format

# Database/migrations (for future use)
migrate:
	@echo "No migrations configured yet"

# Deployment
deploy-prod:
	@echo "Building production containers..."
	docker-compose -f docker-compose.yml build
	docker-compose -f docker-compose.yml up -d
	@echo "Production deployment complete!"
