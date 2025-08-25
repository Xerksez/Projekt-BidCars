# BidCars (monorepo)

Aplikacja podobna do bid.cars: frontend (Next.js) + backend (NestJS) + infra (Postgres, Redis, RabbitMQ, OpenSearch w Dockerze).

## 🔧 Wymagania
- Node.js LTS (20.x)
- pnpm
- Docker Desktop
- Git (np. GitHub Desktop)

## 📁 Struktura
.
├─ apps/
│  ├─ web/   # Next.js (Frontend, port 3000)
│  └─ api/   # NestJS (Backend, port 3001)
├─ packages/ # (opcjonalnie) współdzielone paczki, np. UI
├─ docker-compose.yml
├─ pnpm-workspace.yaml
├─ package.json (skrypty workspace)
└─ README.md

## 🚀 Szybki start (dev)

1. Uruchom serwisy w Dockerze:
   ```bash
   docker compose up -d
   ```

2. Zmienne środowiskowe:
   - root: utwórz `.env.local` na podstawie `.env.example` (patrz niżej)
   - backend: utwórz `apps/api/.env` na podstawie `apps/api/.env.example`

3. Instalacja paczek:
   ```bash
   pnpm install
   ```

4. Start aplikacji (oba serwisy naraz):
   ```bash
   pnpm dev
   ```
   - Frontend: http://localhost:3000  
   - Backend: http://localhost:3001/health

> Alternatywnie odpalaj osobno:
> ```bash
> pnpm dev:web   # Next.js
> pnpm dev:api   # NestJS
> ```

## 🔌 Zmienne środowiskowe

**Root – `.env.local`**
```
DATABASE_URL="postgresql://bidcars:bidcars@localhost:5432/bidcars"
REDIS_URL="redis://localhost:6379"
RABBITMQ_URL="amqp://guest:guest@localhost:5672"
OPENSEARCH_URL="http://localhost:9200"
```

**Backend – `apps/api/.env`**
```
PORT=3001
DATABASE_URL=postgresql://bidcars:bidcars@localhost:5432/bidcars
REDIS_URL=redis://localhost:6379
RABBITMQ_URL=amqp://guest:guest@localhost:5672
OPENSEARCH_URL=http://localhost:9200
```

## 🧪 Szybkie testy
- RabbitMQ panel: http://localhost:15672 (guest/guest)
- OpenSearch Dashboards: http://localhost:5601
- API health: http://localhost:3001/health
- Front: http://localhost:3000

## 🛠️ Komendy
- `pnpm dev` – uruchamia frontend i backend przez `concurrently`
- `pnpm dev:web` – tylko Next.js
- `pnpm dev:api` – tylko NestJS
- `docker compose up -d` – start Postgres/Redis/RabbitMQ/OpenSearch
- `docker compose down` – stop kontenerów (dane Postgres zostają w volume)

## 🧱 Architektura (dev)
- Kod aplikacji (Next/Nest) działa lokalnie (łatwy debug).
- Baza/cache/kolejki/wyszukiwarka w Dockerze.
- Front (3000) → fetch do Back (3001) → Back łączy się z DB/Redis/Rabbit/OpenSearch.

## ❗ Najczęstsze problemy
- `EADDRINUSE: 3000/3001` – port zajęty → zamknij proces albo zmień port.
- `ECONNREFUSED` z frontu → backend nie działa na 3001.
- OpenSearch nie startuje → zwiększ RAM w Docker Desktop (4–6 GB).

## 📝 Licencja
Wewnętrzny projekt (do uzupełnienia).
