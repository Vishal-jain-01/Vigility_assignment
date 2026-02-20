# Vigility Technologies — Full Stack Challenge

An interactive data visualization dashboard that **visualizes its own usage**. Every time a user interacts with a filter or chart, that event is tracked and fed back into the visualization.

## Tech Stack

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
