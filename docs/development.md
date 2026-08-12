# Разработка

Всё живёт в контейнерах. На хосте нужен только Docker — Node, pnpm и Python
там не устанавливаются и не предполагаются.

---

## 1. Устройство окружения

### `Dockerfile` — стадии

| Стадия | Что это |
|---|---|
| `base` | `node:22-bookworm-slim`, corepack, pnpm фиксированной версии, пользователь `node` |
| `deps` | `pnpm install --frozen-lockfile` c кэшем pnpm-store |
| `dev` | образ для dev-сервера, тестов и линта; исходники приезжают bind-mount'ом |
| `build` | `pnpm build`, результат в `/app/dist` |
| `runtime` | `nginx:alpine` со статикой из `build` |

### `Dockerfile.python`

`python:3.12-slim` для `potgen.py` и генерации golden-фикстур. Версия
интерпретатора зафиксирована: эталонные значения должны быть одинаковыми на
любой машине и в CI.

### Сервисы compose

| Сервис | Команда |
|---|---|
| `dev` | `pnpm dev`, порты 5173 и 9229 |
| `test` | `pnpm test` |
| `test-watch` | `pnpm test:watch` |
| `lint` | `pnpm verify` (tsc + eslint + docs:check + тесты) |
| `build` | `pnpm build`, `dist/` наружу через bind-mount |
| `preview` | nginx на 8080 |
| `fixtures` | `python3 tests/fixtures/gen_fixtures.py` |

### `Makefile`

Единственный интерфейс на хосте. `make help` печатает список целей. Прямых
вызовов `pnpm` на хосте быть не должно — если вам нужен pnpm, вам нужен
`make shell`.

---

## 2. Ежедневная работа

```sh
make dev            # http://localhost:5173, HMR работает через bind-mount
make restart        # пересоздать dev-контейнер в фоне (+ make logs / make stop)
make test           # один прогон
make test-watch     # watch-режим
make lint           # tsc --noEmit + eslint + docs:check + тесты
make build          # ./dist
make preview        # проверить production-сборку на :8080
make shell          # bash внутри dev-контейнера
```

Внутри `make shell` доступен обычный pnpm:

```sh
pnpm vitest run tests/shell.test.ts
pnpm tsx scripts/gen-docs-figures.ts
```

---

## 3. Почему `--host 0.0.0.0`

Vite по умолчанию слушает `localhost`, то есть петлевой интерфейс **внутри
контейнера**. Снаружи такой порт недоступен, даже если он проброшен: с точки
зрения контейнера ваш браузер — чужая машина. Поэтому в `vite.config.ts` стоит
`server.host = '0.0.0.0'`.

---

## 4. HMR через bind-mount

Файловые события (inotify) не проходят через bind-mount на macOS и Windows:
Vite не узнаёт, что файл изменился, и HMR молча умирает — страница просто не
обновляется, ошибок нет.

Лечится опросом. Он включён по умолчанию:

```ts
// vite.config.ts
const usePolling = process.env['VITE_USE_POLLING'] !== '0';
```

На Linux, где inotify работает, опрос можно выключить и сэкономить CPU:

```sh
POLL=0 make dev
```

Признак того, что опрос нужен, а его нет: правки в `src/` не приводят ни к
чему, а перезапуск `make dev` подхватывает их сразу.

---

## 5. Отладка в контейнере

### Node-инспектор

Порт 9229 проброшен наружу. Запустите dev-сервер под инспектором:

```sh
make shell
node --inspect=0.0.0.0:9229 node_modules/vite/bin/vite.js --host 0.0.0.0
```

**VS Code** — `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "attach",
  "name": "Attach to Docker",
  "address": "localhost",
  "port": 9229,
  "localRoot": "${workspaceFolder}",
  "remoteRoot": "/app",
  "skipFiles": ["<node_internals>/**"]
}
```

`remoteRoot: "/app"` обязателен: пути в контейнере не совпадают с путями на
хосте, и без этого соответствия точки останова не сработают.

**WebStorm** — Run → Edit Configurations → Attach to Node.js/Chrome, порт 9229,
в «Remote URLs of local files» сопоставьте корень проекта с `/app`.

### Отладка тестов

```sh
make shell
node --inspect-brk=0.0.0.0:9229 node_modules/vitest/vitest.mjs run tests/shell.test.ts
```

Отладчик остановится до первой строки — успеете подключиться.

### Отладка кода в браузере

Фронтенд выполняется в вашем браузере, а не в контейнере, поэтому DevTools
работают как обычно. Sourcemap включены и в dev, и в production-сборке.
Код воркера видно в DevTools → Sources → отдельный поток `mesh.worker`.

---

## 6. Golden-фикстуры

```sh
make fixtures
```

Запускает `tests/fixtures/gen_fixtures.py` в питоновском образе. Скрипт
пересобирает `tests/fixtures/*.json` и `*.stl.gz` из `potgen.py`.

**Когда это делать:** только если изменился сам `potgen.py`. Если фикстуры
разошлись с портом, а `potgen.py` не менялся — сломан порт, и перегенерация
фикстур просто спрячет регрессию.

Golden-тесты сравнивают каждую координату STL с эталоном при относительном
допуске `1e-6`. Байтовое равенство между Python и V8 недостижимо: их `cos` и
`sin` расходятся на ulp у осей, и это изредка переворачивает последний бит
float32.

---

## 7. Права на файлы

Контейнеры работают под пользователем `node` (uid 1000). Без этого `dist/` и
перегенерированные фикстуры прилетали бы на хост с владельцем root, и удалить
их можно было бы только через sudo.

Если файлы всё же оказались root-овыми (например, после ручного
`docker run` без `-u`):

```sh
sudo chown -R "$(id -u):$(id -g)" .
```

---

## 8. Зависимости и версии

pnpm зафиксирован в `package.json` (`packageManager`) и в `Dockerfile` — одна
и та же версия в разработке, в CI и в образе.

```sh
make lock       # пересобрать pnpm-lock.yaml после правки package.json
make install    # установить зависимости в контейнере
```

После правки зависимостей пересоберите образ: `make test` и остальные цели
делают это сами (`--build`), `make dev` — тоже.

---

## 9. Чистка

```sh
make clean      # контейнеры, тома, dist
docker builder prune    # кэш сборки, если места мало
```

Анонимный том на `/app/node_modules` живёт отдельно от хоста; `make clean`
сносит и его, следующий запуск переустановит зависимости из образа.

---

## 10. CI

CI гоняет ровно те же сервисы compose:

```sh
make lint       # tsc + eslint + docs:check + тесты
make build
```

Никаких отдельных «CI-only» шагов с установкой Node напрямую — расхождение
сред между CI и локальной машиной недопустимо и обычно вылезает в самый
неудачный момент.
