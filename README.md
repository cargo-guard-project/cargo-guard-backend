# CargoGuard Backend

Backend API for the CargoGuard system.

CargoGuard is used to monitor valuable cargo transportation. The backend stores users, cargo, containers, shipments, telemetry records, incidents and event logs.

The project is built with Express, TypeScript, TypeORM and PostgreSQL.

## Setup

Create `.env` from `.env.example`:

```powershell
Copy-Item .env.example .env
```

Install dependencies:

```powershell
npm install
```

Start PostgreSQL:

```powershell
docker compose up -d postgres
```

Run migrations:

```powershell
npm run migration:run
```

Start the backend:

```powershell
npm run dev
```

Swagger:

```text
http://localhost:3000/api-docs
```

Health check:

```text
http://localhost:3000/health
```

## Build

```powershell
npm run build
npm start
```

## Test user

Create a user through Swagger or Postman:

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "operator@test.com",
  "password": "123456",
  "name": "Test Operator",
  "role": "operator"
}
```

Use the returned token as:

```http
Authorization: Bearer <accessToken>
```

## Mobile endpoints

```text
POST /api/auth/login
POST /api/auth/logout
GET /api/shipments
GET /api/shipments/:id
GET /api/shipments/:id/incidents
GET /api/shipments/:id/telemetry?limit=100
GET /api/incidents
PUT /api/incidents/:id/resolve
```

## Web application

The lab 3 web application is located in `web`.

Run the backend first:

```powershell
npm install
docker compose up -d postgres
npm run migration:run
npm run dev
```

Run the web application:

```powershell
cd web
Copy-Item .env.example .env
npm install
npm run dev
```

The web app uses this env variable:

```text
VITE_API_BASE_URL=http://localhost:3000
```

Implemented web pages:

```text
Login
Dashboard
Shipments
Shipment details
Cargo
Containers
Incidents
Event logs
Admin
```

Role behavior:

```text
observer - read-only operational data
operator - cargo, containers, shipments status actions and incident resolve
admin - all operator features plus users, event logs, export/import/backup
```

Admin data endpoints added for lab 3:

```text
GET  /api/admin/data/export
GET  /api/admin/data/backup
POST /api/admin/data/import
```

`POST /api/admin/data/import` is intended for development/testing. It merges supported operational tables (`cargo`, `containers`, `shipments`, `telemetryRecords`, `incidents`) and skips `users` and `eventLogs` to avoid importing passwords or audit history.

## IoT endpoints

```text
POST /api/telemetry
POST /api/telemetry/door
```

IoT requests require the container API key:

```http
X-API-Key: <containerApiKey>
```

Example telemetry request:

```http
POST /api/telemetry
Content-Type: application/json
X-API-Key: <containerApiKey>

{
  "temperature": 30,
  "humidity": 80
}
```

Incidents are created only when the container has an active shipment with the `in_progress` status.
