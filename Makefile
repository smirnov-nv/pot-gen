# The only interface a human uses on the host. Requires Docker, nothing else.
#
# Every target is a thin wrapper over docker compose -- see SPEC.md section 2.1.

COMPOSE := docker compose

.PHONY: help dev restart logs stop test test-watch lint typecheck build preview fixtures shell install lock clean

help: ## Показать доступные команды
	@grep -hE '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
		| awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

dev: ## Dev-сервер на http://localhost:5173 (HMR, инспектор на 9229)
	$(COMPOSE) up --build dev

# Пересоздаёт контейнер, а не `restart`: так подхватываются изменения в
# Dockerfile и docker-compose.yml, а не только перезапускается vite.
restart: ## Перезапустить dev-сервер в фоне (логи -- make logs)
	$(COMPOSE) up -d --build --force-recreate dev
	@echo "dev: http://localhost:5173"

logs: ## Логи фонового dev-сервера (Ctrl-C выходит, сервер живёт)
	$(COMPOSE) logs -f dev

stop: ## Остановить фоновые контейнеры
	$(COMPOSE) stop

test: ## Прогнать тесты один раз
	$(COMPOSE) run --rm --build test

test-watch: ## Тесты в watch-режиме
	$(COMPOSE) run --rm --build test-watch

lint: ## tsc --noEmit + eslint + docs:check
	$(COMPOSE) run --rm --build lint

typecheck: ## Только tsc --noEmit
	$(COMPOSE) run --rm --build test pnpm typecheck

build: ## Production-сборка в ./dist
	$(COMPOSE) run --rm --build build

preview: ## Отдать собранную статику через nginx на http://localhost:8080
	$(COMPOSE) up --build preview

fixtures: ## Перегенерировать golden-фикстуры из potgen.py (python-контейнер)
	$(COMPOSE) run --rm --build fixtures

shell: ## Интерактивный shell внутри dev-контейнера
	$(COMPOSE) run --rm --build dev bash

install: ## Установить зависимости и обновить pnpm-lock.yaml
	$(COMPOSE) run --rm --no-deps --entrypoint sh dev -c "pnpm install"

lock: ## Пересоздать pnpm-lock.yaml без установки
	docker run --rm -v "$(PWD)":/app -w /app -u 1000:1000 \
		-e COREPACK_HOME=/tmp/corepack node:22-bookworm-slim \
		sh -c "mkdir -p /tmp/bin && corepack enable --install-directory /tmp/bin \
			&& PATH=/tmp/bin:\$$PATH corepack prepare pnpm@9.15.4 --activate \
			&& PATH=/tmp/bin:\$$PATH pnpm install --lockfile-only"

clean: ## Снести контейнеры, тома и артефакты сборки
	$(COMPOSE) down -v --remove-orphans
	rm -rf dist