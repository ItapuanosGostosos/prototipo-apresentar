# Portfolio Tracker API

Backend do **Portfolio Tracker** — aplicação de rastreamento de portfólio de investimentos com análise de sentimento de notícias via IA.

## Arquitetura

```
React Native App
       │
       ▼
  Keycloak 24          ← Auth Gateway (JWT / OIDC)
       │
       ▼
  Django API (DRF)     ← Core: carteiras, ativos, notícias, análises
       │
   ┌───┴────────────┐
   ▼                ▼
RabbitMQ        Oracle DB (FIAP)
   │
   ▼
Sentiment Worker (Celery)  ← IA de análise de sentimento de notícias
```

**Stack:**
- Python 3.11 + Django 4.2 + Django REST Framework
- Oracle DB (FIAP RM551157) via `oracledb`
- Keycloak 24 (autenticação JWT/OIDC)
- Celery + RabbitMQ (filas de tarefas)
- Docker Compose (todos os serviços)

---

## Pré-requisitos

- Docker Desktop instalado e rodando
- Porta 8000 (API), 8080 (Keycloak), 5672/15672 (RabbitMQ) livres

---

## Subindo o projeto

```bash
docker compose up -d --build
```

Containers iniciados:
| Container | Porta | Função |
|---|---|---|
| `portfolio_keycloak` | 8080 | Auth Gateway |
| `portfolio_rabbitmq` | 5672, 15672 | Fila de mensagens |
| `portfolio_api` | 8000 | API Django |
| `portfolio_celery_worker` | — | Worker geral (notificações, news) |
| `portfolio_sentiment_worker` | — | Worker de análise de sentimento (IA) |
| `portfolio_celery_beat` | — | Scheduler (busca news a cada hora) |

> O `api` aguarda o `keycloak` estar healthy antes de iniciar.  
> Os workers aguardam a `api` estar healthy.

---

## Endpoints

### Auth (`/api/auth`)

| Método | URL | Auth | Descrição |
|---|---|---|---|
| POST | `/api/auth/register` | Não | Cadastra usuário no Keycloak |
| POST | `/api/auth/login` | Não | Login — retorna `access` + `refresh` tokens |
| GET | `/api/auth/me` | Bearer | Perfil do usuário autenticado |
| PUT/PATCH | `/api/auth/me` | Bearer | Atualiza perfil |

**Register body:**
```json
{ "email": "user@example.com", "username": "user", "password": "senha123" }
```

**Login body:**
```json
{ "email": "user@example.com", "password": "senha123" }
```

**Login response:**
```json
{ "access": "<jwt>", "refresh": "<jwt>" }
```

---

### Carteiras (`/api/portfolios`)

| Método | URL | Descrição |
|---|---|---|
| GET | `/api/portfolios` | Lista carteiras do usuário |
| POST | `/api/portfolios` | Cria carteira |
| GET | `/api/portfolios/{id}` | Detalhe da carteira |
| PATCH | `/api/portfolios/{id}` | Atualiza nome |
| DELETE | `/api/portfolios/{id}` | Remove carteira |

---

### Ativos (`/api/portfolios/{id}/assets`)

| Método | URL | Descrição |
|---|---|---|
| GET | `/api/portfolios/{id}/assets` | Lista ativos da carteira |
| POST | `/api/portfolios/{id}/assets` | Adiciona ativo |
| DELETE | `/api/portfolios/{id}/assets/{asset_id}` | Remove ativo |

**Asset body:**
```json
{ "ticker": "PETR4", "name": "Petrobras", "asset_type": "stock" }
```

`asset_type` aceita: `stock`, `fii`, `crypto`, `etf`, `bdr`

---

### Notícias (`/api/news`)

| Método | URL | Descrição |
|---|---|---|
| GET | `/api/news` | Feed de notícias em tempo real (todos os ativos) |
| GET | `/api/news/portfolio/{id}` | Notícias de uma carteira específica |

---

### Análise de Sentimento com IA (`/api/portfolios/{id}/analyse`)

| Método | URL | Descrição |
|---|---|---|
| POST | `/api/portfolios/{id}/analyse` | **Dispara análise** — busca notícias, salva no banco com status `pending`, envia para fila da IA |
| GET | `/api/portfolios/{id}/analyses` | Lista todas as análises dos ativos da carteira |
| GET | `/api/news/analyses/{analysis_id}` | Detalhe de uma análise específica |

**POST /analyse response (202 Accepted):**
```json
{
  "articles_processed": 5,
  "analyses": [
    {
      "id": 1,
      "ticker": "PETR4",
      "status": "pending",
      "result": null,
      "model_version": "rules-v2.0.0",
      "attempts": 0,
      "started_at": null,
      "finished_at": null,
      "created_at": "2026-06-16T10:00:00Z",
      "updated_at": "2026-06-16T10:00:00Z",
      "article_title": "Petrobras anuncia dividendos recordes",
      "article_url": "https://..."
    }
  ]
}
```

**GET /analyses — analysis com status `completed`:**
```json
{
  "id": 1,
  "ticker": "PETR4",
  "status": "completed",
  "result": {
    "sentiment": "positive",
    "score": 0.82,
    "summary": "Notícia positiva para PETR4...",
    "relevance": "high"
  },
  "finished_at": "2026-06-16T10:00:05Z"
}
```

**Fluxo da IA:**
1. `POST /analyse` → API busca notícias via Yahoo Finance, salva artigos no banco, cria registros em `analises` com `status=pending`, publica IDs na fila `sentiment_analysis`
2. `sentiment-worker` consome da fila, roda o engine de análise de sentimento, atualiza o registro com `status=completed` e o resultado em `result`
3. `GET /analyses` → retorna os registros atualizados (pending → completed)

---

### Notificações (`/api/notifications`)

| Método | URL | Descrição |
|---|---|---|
| POST | `/api/notifications/device-token` | Registra token FCM do dispositivo |
| DELETE | `/api/notifications/device-token` | Remove token FCM |

---

## Variáveis de ambiente

| Variável | Padrão | Descrição |
|---|---|---|
| `SECRET_KEY` | — | Django secret key |
| `DEBUG` | `False` | Modo debug |
| `DB_NAME` | `orcl` | Nome do banco Oracle |
| `DB_USER` | — | Usuário Oracle |
| `DB_PASSWORD` | — | Senha Oracle |
| `DB_HOST` | `oracle.fiap.com.br` | Host Oracle |
| `DB_PORT` | `1521` | Porta Oracle |
| `KEYCLOAK_SERVER_URL` | `http://localhost:8080` | URL do Keycloak |
| `KEYCLOAK_REALM` | `portfolio` | Realm do Keycloak |
| `KEYCLOAK_CLIENT_ID` | `portfolio-api` | Client ID |
| `CELERY_BROKER_URL` | `amqp://...` | URL do RabbitMQ |

---

## Desenvolvimento local

```bash
# Ver logs da API
docker compose logs -f api

# Ver logs do worker de IA
docker compose logs -f sentiment-worker

# Rodar migrations manualmente
docker compose exec api python manage.py migrate

# Acessar shell Django
docker compose exec api python manage.py shell

# Painel do RabbitMQ
open http://localhost:15672  # user: portfolio / pass: portfolio123

# Painel do Keycloak
open http://localhost:8080   # user: admin / pass: admin
```

---

## Arquivos principais

```
portifolio-tracker-api/
├── core/authentication.py       # Validação JWT Keycloak
├── users/views.py               # Register / Login / Me
├── portfolios/views.py          # CRUD carteiras + endpoints de análise
├── news/views.py                # News feed + detail de análise
├── news/models.py               # Analysis, NewsArticle, NewsSource
├── sentiment_ai/tasks.py        # Celery task: processa análise de sentimento
├── sentiment_ai/services.py     # request_analysis() — cria row + publica na fila
├── sentiment_ai/engine/         # Engine de análise de sentimento (regras + léxico)
├── keycloak/portfolio-realm.json# Realm config importado no Keycloak
└── docker-compose.yml           # Orquestração dos serviços
```
