# Vigility Technologies — Full Stack Challenge

An interactive data visualization dashboard that **visualizes its own usage**. Every time a user interacts with a filter or chart, that event is tracked and fed back into the visualization.

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Node.js, Express.js |
| **Database** | SQLite (local) / PostgreSQL (production) |
| **ORM** | Prisma |
| **Auth** | JWT + bcryptjs (stored in cookies) |
| **Frontend** | React 18 (Vite) |
| **Charts** | Recharts |
| **Styling** | Tailwind CSS |
| **Cookies** | js-cookie |

---

## Running Locally

### Prerequisites
- Node.js v18+
- npm

### 1. Clone the Repository

```bash
git clone https://github.com/Vishal-jain-01/Vigility_assignment.git
cd Vigility_assignment
```

### 2. Backend Setup

Create a `.env` file inside the `backend/` folder:

```bash
cd backend
cp .env.example .env   # or create manually
```

`.env` contents for local development:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your_secret_key_here"
PORT=8002
# Leave FRONTEND_URL unset for local development (enables lax cookie mode)
```

Then install dependencies and start the server:

```bash
npm install
npm run db:generate   # Generate Prisma client
npm run db:push       # Create the database schema
npm run seed          # Populate with 10 users + 100 clicks
npm run dev           # Start server on http://localhost:8002
```

### 3. Frontend Setup

Create a `.env` file inside the `frontend/` folder:

```env
VITE_API_URL=http://localhost:8002
```

Then install dependencies and start the app:

```bash
cd frontend
npm install
npm run dev           # Start app on http://localhost:3000
```

Open **http://localhost:3000** in your browser.

---

## Seed Instructions

The seed script wipes all existing data and repopulates the database with realistic dummy data.

```bash
cd backend
npm run seed
```

**What it creates:**
- **10 users** with varied ages (16–55) and genders (Male, Female, Other)
- **100 feature click events** spread randomly across the last 90 days, across 7 tracked features:
  `date_filter`, `gender_filter`, `age_filter`, `bar_chart_zoom`, `line_chart_hover`, `export_data`, `refresh_data`

**Test credentials** — all users share the same password:

| Username | Age | Gender | Password |
|---|---|---|---|
| user1 | 16 | Male | password123 |
| user2 | 25 | Female | password123 |
| user3 | 32 | Male | password123 |
| user4 | 45 | Female | password123 |
| user5 | 55 | Other | password123 |
| user6 | 17 | Female | password123 |
| user7 | 28 | Male | password123 |
| user8 | 38 | Female | password123 |
| user9 | 50 | Male | password123 |
| user10 | 22 | Other | password123 |

---

## API Endpoints

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `POST` | `/register` | No | Register a new user |
| `POST` | `/login` | No | Login and receive JWT token |
| `POST` | `/logout` | No | Clear auth cookies |
| `POST` | `/track` | Yes (JWT) | Log a feature click event |
| `GET` | `/analytics` | Yes (JWT) | Get aggregated chart data with filters |

### GET /analytics Query Parameters

| Param | Example | Description |
|---|---|---|
| `startDate` | `2025-01-01` | Filter clicks from this date |
| `endDate` | `2026-01-01` | Filter clicks up to this date |
| `ageGroup` | `18-40` | Filter by user age (`<18`, `18-40`, `>40`) |
| `gender` | `Male` | Filter by user gender (`Male`, `Female`, `Other`) |
| `feature` | `date_filter` | Feature name for line chart time series |

---

## Architectural Choices

### Backend
A RESTful API built with **Express.js**. **Prisma ORM** handles all database interactions with a type-safe query API, and supports both SQLite (local development) and PostgreSQL (production) via a single config change in `schema.prisma`.

**Authentication** uses stateless **JWT** tokens. On login/register, the backend signs a JWT and:
1. Sets it as an `httpOnly` cookie (`auth_token`) — automatically sent by the browser on same-origin requests.
2. Returns it in the JSON response body — so the frontend can also store it in a JS-accessible cookie (`auth_token`) and attach it as an `Authorization: Bearer <token>` header.

This dual approach ensures auth works both locally (same-origin, cookies flow freely) and in production (cross-origin between Vercel and Render, where third-party cookies are blocked by browsers). The `authMiddleware` checks cookies first, then falls back to the `Authorization` header.

### Frontend
A single-page **React** application built with **Vite**. State is minimal — filters and user session are persisted in **browser cookies** (via `js-cookie`) so they survive page refreshes. React Router handles client-side navigation, and a `vercel.json` rewrite rule ensures direct URL loads and refreshes don't return 404.

Every user interaction (filter change, bar click, line chart hover) fires a `POST /track` request, which is then reflected back in the dashboard charts — the app literally visualizes its own usage.

**Data Flow:**
```
User Action → POST /track → Filter/State Update → GET /analytics → Charts Re-render
```

### Database Schema
Two models — `User` (id, username, password, age, gender) and `FeatureClick` (id, userId, featureName, timestamp) — with a foreign key relation. The analytics endpoint queries `FeatureClick` with dynamic `WHERE` filters built at runtime based on query parameters.

---

## Scalability Essay

> **If this dashboard needed to handle 1 million write-events per minute, how would you change your backend architecture?**

At 1 million writes per minute (~16,667 writes/sec), the current architecture — where each `POST /track` synchronously inserts a row into PostgreSQL and then responds — would quickly saturate the database connection pool and become the primary bottleneck. Here is how I would redesign it:

1. **Decouple writes with a Message Queue (Apache Kafka):** Instead of writing directly to the database on each `/track` request, the API would publish the event as a message to a Kafka topic and immediately return `202 Accepted`. This eliminates database write latency from the HTTP response path entirely and provides a durable, replayable event buffer.

2. **Batch Consumer Workers:** A separate worker service consumes messages from Kafka in batches (e.g., 1,000 events at a time) and performs bulk `INSERT` operations into the database. Batching reduces per-row overhead dramatically and is far more efficient than one insert per request.

3. **Time-Series Database (ClickHouse / TimescaleDB):** Replace PostgreSQL with a purpose-built analytical store. ClickHouse handles billions of append-only rows and can run the aggregation queries powering the analytics endpoint orders of magnitude faster than a transactional RDBMS at that scale.

4. **Redis Caching for Reads:** The `GET /analytics` endpoint would serve pre-computed results from Redis with a short TTL (30–60 seconds). Since users can tolerate slightly stale analytics data, this eliminates repetitive full-table scans and massively reduces read pressure on the database.

5. **Horizontal API Scaling:** Since the API is stateless (JWT auth, no server-side sessions), multiple instances can run behind a load balancer (AWS ALB / nginx) with zero coordination overhead.

6. **Pre-aggregated Summary Tables:** A background cron job would compute hourly and daily click summaries per feature, storing them in a lightweight summary table. The analytics endpoint reads from these fast aggregates instead of scanning millions of raw event rows.

---

## Deployment

**Backend** — deployed on [Render](https://render.com):
- Set `DATABASE_URL` to a PostgreSQL connection string
- Set `JWT_SECRET` to a secure random string
- Set `FRONTEND_URL` to your Vercel frontend URL (enables `SameSite=None; Secure` cookies)
- The start command (`npm start`) runs `prisma db push` before launching the server

**Frontend** — deployed on [Vercel](https://vercel.com):
- Set `VITE_API_URL` to your Render backend URL
- `vercel.json` includes a catch-all rewrite rule so React Router handles all client-side routes correctly on refresh


| Layer | Technology |
|---|---|
| **Backend** | Node.js, Express.js |
| **Database** | SQLite (local) / PostgreSQL (production) |
| **ORM** | Prisma |
| **Auth** | JWT + bcryptjs |
| **Frontend** | React (Vite) |
| **Charts** | Recharts |
| **Styling** | Tailwind CSS |
| **Cookies** | js-cookie |

---

## Getting Started (Local Setup)

### Prerequisites
- Node.js v18+
- npm

### 1. Backend

```bash
cd backend
npm install
npm run db:generate   # Generate Prisma client
npm run db:push       # Create SQLite database schema
npm run seed          # Populate with 10 users + 100 clicks
npm run dev           # Start server on http://localhost:8000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev           # Start app on http://localhost:3000
```

Open **http://localhost:3000** in your browser.

---

## Seed Instructions

The seed script creates:
- **10 users** with varied ages (16–55) and genders (Male, Female, Other)
- **100 feature clicks** spread randomly across the last 90 days

```bash
cd backend
npm run seed
```

**Test credentials** (all share the same password):
| Username | Age | Gender | Password |
|---|---|---|---|
| user1 | 16 | Male | password123 |
| user2 | 25 | Female | password123 |
| user3 | 32 | Male | password123 |
| user4 | 45 | Female | password123 |
| user5 | 55 | Other | password123 |

---

## API Endpoints

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `POST` | `/register` | No | Register a new user |
| `POST` | `/login` | No | Login and receive JWT token |
| `POST` | `/track` | Yes (JWT) | Log a feature click event |
| `GET` | `/analytics` | Yes (JWT) | Get aggregated chart data with filters |
| `GET` | `/health` | No | Health check |

### GET /analytics Query Parameters
| Param | Example | Description |
|---|---|---|
| `startDate` | `2025-01-01` | Filter clicks from this date |
| `endDate` | `2026-01-01` | Filter clicks up to this date |
| `ageGroup` | `18-40` | Filter by user age (`<18`, `18-40`, `>40`) |
| `gender` | `Male` | Filter by user gender (`Male`, `Female`, `Other`) |
| `feature` | `date_filter` | Feature name for line chart time series |

---

## Architecture

The application follows a clean client-server separation:

**Backend**: A RESTful API built with Express.js. Prisma ORM handles all database interactions, providing type-safe queries. JWT-based authentication is stateless — each request must include the token in the `Authorization: Bearer <token>` header. All write operations on `/track` are synchronous (write-then-respond), appropriate for this scale.

**Frontend**: A single-page React application. On mount, saved filter preferences are read from browser cookies and applied immediately — so when a user refreshes the page, their last-used filters are restored. Every user interaction (filter change, chart click, line chart hover) fires a `POST /track` request to the backend, which is then reflected in the dashboard visualizations.

**Data Flow**: `User Action → Track API call → State Update → Analytics re-fetch → Charts re-render`

---

## Scalability Essay

> If this dashboard needed to handle 1 million write-events per minute, how would you change your backend architecture?

At 1 million writes per minute (~16,667/sec), the current synchronous write-to-database approach would become the bottleneck. Here is how I would redesign the architecture:

1. **Message Queue (Apache Kafka)**: Instead of writing directly to the database on each `/track` request, the API would publish events to a Kafka topic and immediately respond with `202 Accepted`. This decouples the HTTP response latency from the DB write latency.

2. **Batch Consumer Workers**: A separate worker service would consume from Kafka in batches and perform bulk `INSERT` operations into the database (e.g., 1,000 rows per batch), reducing write overhead by orders of magnitude.

3. **Time-Series Database**: Replace PostgreSQL with **ClickHouse** or **TimescaleDB** — both are purpose-built for high-throughput append-only time-series data and can perform analytical aggregations significantly faster.

4. **Redis Caching for Reads**: The `GET /analytics` endpoint would serve results from Redis with a short TTL (e.g., 30–60 seconds), drastically reducing database load on read queries. Cache invalidation can be time-based.

5. **Horizontal API Scaling**: Since the API is stateless (JWT auth), multiple instances can run behind a load balancer (AWS ALB / nginx) with zero coordination needed.

6. **Pre-aggregated Summary Tables**: A background cron job would pre-compute hourly/daily feature click summaries. The analytics endpoint reads from these fast summary tables instead of scanning millions of raw rows.

---

## Deployment

**Backend** (Render / Railway):
- Set `DATABASE_URL` to a PostgreSQL connection string
- Set `JWT_SECRET` to a secure random string
- Run `npm run db:push` and `npm run seed` after first deploy

**Frontend** (Vercel / Netlify):
- Set `VITE_API_URL` to your backend's public URL
- Run `npm run build` and deploy the `dist/` folder
