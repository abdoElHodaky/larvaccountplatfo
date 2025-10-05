# Laravel Modular Accounting Platform - Development Makefile

.PHONY: help install setup fresh test lint format optimize clean docker-up docker-down

# Default target
help: ## Show this help message
	@echo "Laravel Modular Accounting Platform - Development Commands"
	@echo "========================================================="
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Installation and Setup
install: ## Install all dependencies (PHP and Node.js)
	composer install
	npm install

setup: ## Complete project setup for development
	@echo "Setting up Laravel Modular Accounting Platform..."
	composer install
	npm install
	cp .env.example .env
	php artisan key:generate
	php artisan storage:link
	@echo "Please configure your database settings in .env file"
	@echo "Then run: make migrate-fresh"

migrate: ## Run database migrations
	php artisan migrate

migrate-fresh: ## Fresh migration with seeders
	php artisan migrate:fresh --seed

fresh: ## Complete fresh setup (migrations + cache clear)
	php artisan migrate:fresh --seed
	php artisan optimize:clear
	npm run build

# Development
dev: ## Start development servers (Laravel + Vite)
	@echo "Starting development servers..."
	@echo "Laravel: http://localhost:8000"
	@echo "Vite: http://localhost:5173"
	php artisan serve & npm run dev

serve: ## Start Laravel development server
	php artisan serve

reverb: ## Start Laravel Reverb WebSocket server
	php artisan reverb:start

horizon: ## Start Laravel Horizon queue worker
	php artisan horizon

queue: ## Start queue worker
	php artisan queue:work

# Testing
test: ## Run all tests
	php artisan test

test-coverage: ## Run tests with coverage
	php artisan test --coverage

test-unit: ## Run unit tests only
	php artisan test --testsuite=Unit

test-feature: ## Run feature tests only
	php artisan test --testsuite=Feature

test-module: ## Run module tests only
	php artisan test --testsuite=Module

# Code Quality
lint: ## Run PHP and JavaScript linters
	./vendor/bin/pint --test
	npm run lint

lint-fix: ## Fix linting issues
	./vendor/bin/pint
	npm run lint:fix

format: ## Format code (PHP and JavaScript)
	./vendor/bin/pint
	npm run format

stan: ## Run PHPStan static analysis
	./vendor/bin/phpstan analyse

# Optimization
optimize: ## Optimize application for production
	php artisan config:cache
	php artisan route:cache
	php artisan view:cache
	php artisan event:cache
	npm run build

optimize-clear: ## Clear all optimization caches
	php artisan optimize:clear

ide-helper: ## Generate IDE helper files
	php artisan ide-helper:generate
	php artisan ide-helper:models --nowrite
	php artisan ide-helper:meta

# Database
db-reset: ## Reset database (fresh migration with seeders)
	php artisan migrate:fresh --seed

db-seed: ## Run database seeders
	php artisan db:seed

db-backup: ## Create database backup
	php artisan backup:run

# Maintenance
clean: ## Clean temporary files and caches
	php artisan optimize:clear
	composer dump-autoload
	npm run build
	rm -rf node_modules/.cache
	rm -rf storage/logs/*.log

logs: ## View application logs
	tail -f storage/logs/laravel.log

# Production
production-setup: ## Setup for production deployment
	composer install --no-dev --optimize-autoloader
	npm ci --production
	php artisan key:generate
	php artisan config:cache
	php artisan route:cache
	php artisan view:cache
	php artisan event:cache
	php artisan storage:link
	npm run build

# Docker (if using Docker)
docker-up: ## Start Docker containers
	docker-compose up -d

docker-down: ## Stop Docker containers
	docker-compose down

docker-build: ## Build Docker containers
	docker-compose build

docker-logs: ## View Docker logs
	docker-compose logs -f

# Module Management
module-list: ## List all available modules
	php artisan module:list

module-enable: ## Enable a module (usage: make module-enable MODULE=ModuleName)
	php artisan module:enable $(MODULE)

module-disable: ## Disable a module (usage: make module-disable MODULE=ModuleName)
	php artisan module:disable $(MODULE)

# Security
security-scan: ## Run security scans
	composer audit
	npm audit

# Monitoring
monitor: ## Start monitoring tools
	@echo "Starting monitoring tools..."
	php artisan telescope:install
	php artisan horizon:install

# Documentation
docs: ## Generate documentation
	@echo "Generating documentation..."
	@echo "API Documentation: /docs/api"
	@echo "Architecture Diagrams: /docs/diagrams"

# Quick Commands
quick-setup: install migrate-fresh optimize ## Quick setup for new developers
	@echo "✅ Quick setup completed!"
	@echo "🚀 Run 'make dev' to start development servers"

quick-test: lint test ## Quick test suite (lint + tests)
	@echo "✅ All tests passed!"

quick-deploy: production-setup ## Quick production deployment
	@echo "✅ Production deployment ready!"

# Status
status: ## Show application status
	@echo "Laravel Modular Accounting Platform Status"
	@echo "=========================================="
	@echo "PHP Version: $(shell php --version | head -n 1)"
	@echo "Laravel Version: $(shell php artisan --version)"
	@echo "Node.js Version: $(shell node --version)"
	@echo "NPM Version: $(shell npm --version)"
	@echo "Database Status: $(shell php artisan migrate:status | tail -n 1)"
	@echo "Cache Status: $(shell php artisan config:show cache.default)"
	@echo "Queue Status: $(shell php artisan queue:monitor | head -n 1)"

