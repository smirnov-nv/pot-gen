# syntax=docker/dockerfile:1.7
#
# Multi-stage image for the pot generator.
#
# Everything (dev server, tests, lint, production build) runs inside these
# stages. The host is expected to have Docker and nothing else -- no Node,
# no pnpm, no Python. See SPEC.md section 2.1.

# ---------------------------------------------------------------------------
# base -- toolchain only, shared by every other stage
# ---------------------------------------------------------------------------
FROM node:22-bookworm-slim AS base

# COREPACK_HOME is pinned to a world-readable path: corepack downloads the
# pinned pnpm into it as root here, and the unprivileged `node` user must be
# able to read it later instead of re-downloading into its own home.
ENV PNPM_HOME=/pnpm \
    COREPACK_HOME=/corepack \
    PATH=/pnpm:$PATH \
    CI=1

RUN corepack enable \
    && corepack prepare pnpm@9.15.4 --activate \
    && mkdir -p /pnpm /corepack /app \
    && chown -R node:node /pnpm /corepack /app

WORKDIR /app
# Non-root: files written into bind-mounted paths (dist/, fixtures) must not
# land on the host owned by root.
USER node

# ---------------------------------------------------------------------------
# deps -- node_modules resolved strictly from the lockfile
# ---------------------------------------------------------------------------
FROM base AS deps

COPY --chown=node:node package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store,uid=1000,gid=1000 \
    pnpm install --frozen-lockfile

# ---------------------------------------------------------------------------
# dev -- dev server, tests, lint. Sources arrive via bind mount at runtime.
# ---------------------------------------------------------------------------
FROM base AS dev

COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node . .

# 5173 vite dev server, 9229 node inspector
EXPOSE 5173 9229
CMD ["pnpm", "dev"]

# ---------------------------------------------------------------------------
# build -- production bundle in /app/dist
# ---------------------------------------------------------------------------
FROM deps AS build

COPY --chown=node:node . .
RUN pnpm build

# ---------------------------------------------------------------------------
# runtime -- static hosting of the built bundle, for verifying prod output
# ---------------------------------------------------------------------------
FROM nginx:alpine AS runtime

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80