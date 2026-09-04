# Reflex – Project Documentation

**Reflex** is a delivery coordination system designed for small Kenyan retailers.

It provides one place to:

- Create delivery requests
- Assign deliveries to riders
- Track delivery status
- Update delivery progress
- Generate delivery QR codes
- Allow customers to confirm receipt
- Keep users updated in real time
---

## 1. Problem & Purpose

Small shops currently coordinate deliveries over WhatsApp and phone calls. Nobody has a single, shared view of:
- What's been requested
- Who it's assigned to
- Whether it's been picked up or delivered

Reflex gives every person in the chain (retailer, dispatcher, rider, customer) the same live picture of a delivery's status.

---

## 2. Who Uses It (Personas)

| Role | Responsibility |
|------|-----------------|
| **Retailer staff** | Logs a delivery request |
| **Dispatcher** | Assigns open requests to a rider |
| **Rider** | Updates status as they pick up / deliver, shows QR to customer |
| **Customer** | Scans QR to confirm receipt — no account needed |

---

## 3. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, Vanilla JavaScript |
| Real-time client | Socket.io Client |
| Backend | Node.js |
| API | Express.js |
| Real-time communication | Socket.io |
| Database | PostgreSQL |
| Database driver | `pg` |
| Authentication | JWT |
| QR generation | `qrcode` |
| QR scanning | HTML5 QR Code |
| Unique IDs | UUID |
| Hosting | Render |

### Main Components

- **Frontend:** Provides interfaces for retailers, dispatchers, riders, and customers.
- **Backend:** Handles authentication, authorization, validation, delivery operations, QR generation, and API requests.
- **PostgreSQL:** Stores users and delivery records.
- **Socket.io:** Sends real-time delivery updates to connected clients.
- **QR flow:** Allows customers to confirm receipt without creating an account.


             FRONTEND
      HTML + CSS + Vanilla JS
               ↓
        HTTP / Socket.io
               ↓
             
             BACKEND
               ↓
        Node.js + Express + Socket.io
               ↓
            PostgreSQL
            
            CUSTOMER
               ↓
            Scan QR
               ↓
        Public Confirmation Page
               ↓
           Backend API

## 4. Status Machine

A delivery can only move forward through these states, in order:

```
pending → assigned → picked_up → delivered
```

The server rejects any request that tries to skip a step or go backward (e.g. `pending` straight to `delivered`).

---

## 5. End-to-End Workflow
Reflex uses **JWT authentication** and role-based authorization.

### Login Flow

```text
User enters credentials
        ↓
POST /api/login
        ↓
Backend verifies credentials
        ↓
JWT returned
        ↓
Frontend uses token for protected requests
```

Protected requests use:

```text
Authorization: Bearer <token>
```

## Role Access

- **Retailer:** create and view their deliveries
- **Dispatcher:** view deliveries, view riders, assign riders
- **Rider:** view assigned deliveries and update status
- **Customer:** use public confirmation without logging in

1. **Retailer logs a request**
   `POST /api/deliveries` → new row, status `pending` → broadcast `delivery:new` over Socket.io

2. **Everyone sees it live**
   Dispatcher's screen updates instantly, no page refresh needed.

3. **Dispatcher assigns a rider**
   `POST /api/deliveries/:id/assign` → status becomes `assigned`, `rider_id` set

4. **Rider updates status**
   Either by tapping a button (`POST /api/deliveries/:id/status`) or by scanning the QR (`POST /api/deliveries/confirm-scan`) → moves to `picked_up`, then later `delivered`

5. **QR code for the customer**
   Each delivery has a QR encoding a public link: `https://<host>/confirm/{deliveryId}`

6. **Customer confirms receipt**
   No login required. `POST /api/public/confirm/:id` → status set to `delivered` → broadcast to all connected clients

---

## 6. API Reference

All endpoints are prefixed `/api`. Endpoints that require a `Bearer <token>` header from `/api/login`; the required role is noted.

| Method | Endpoint | Access | Purpose |
|--------|----------|--------|---------|
| POST | `/login` | Public | Log in with `name` + `password`, returns JWT |
| GET | `/me` | any logged-in user | Get current user's profile |
| GET | `/riders` |  dispatcher | List all users with role `rider` |
| POST | `/deliveries` |  retailer | Create a new delivery request |
| GET | `/deliveries` |  any logged-in user | List deliveries (retailers see their own, riders see their assigned ones, dispatchers see all) |
| POST | `/deliveries/:id/assign` |  dispatcher | Assign a rider to a pending delivery |
| POST | `/deliveries/:id/status` |  rider | Advance status (`assigned`→`picked_up`, `picked_up`→`delivered`) for their own delivery |
| GET | `/deliveries/:id/qr` |  any logged-in user | Get a QR code (as a data URL) that links to the public confirmation page |
| POST | `/deliveries/confirm-scan` |  rider | Same as `/status`, but driven by scanning the QR |
| GET | `/public/delivery/:id` | Public | Read-only delivery summary for the customer confirmation page |
| POST | `/public/confirm/:id` | Public | Customer confirms delivery — sets status to `delivered` |

**Real-time events (Socket.io)**
- `delivery:new` — fired when a retailer creates a request
- `delivery:updated` — fired on any assignment or status change

---

## 7. Important Project Files

| File / Folder | Purpose |
|---|---|
| `server.js` | Main backend server, routes, authentication, delivery logic, QR handling, and Socket.io |
| `db.js` | PostgreSQL connection and database setup |
| `seed.js` | Creates demo users and delivery data |
| `public/` | Frontend files and interfaces |
| `docs/` | Project documentation |
| `package.json` | Dependencies and npm scripts |
| `render.yaml` | Render deployment configuration |



## 8. Setup & Running Locally

```bash
cd reflex-app
npm install
```

Set a `DATABASE_URL` environment variable pointing to a PostgreSQL instance locally. 
$env:DATABASE_URL="postgresql://postgres:YOURPASSWORD@localhost:5432/reflex" (replace YOURPASSWORD with your postgres password)

Then:

```bash
npm run seed   # creates tables and seeds demo accounts/data
npm run dev    # starts the server
```

Open **http://localhost:3000**\
On the browser **https://reflex-app-otd4.onrender.com**

### Demo accounts

| Role | Name | Password |
|------|------|----------|
| Retailer | Wanjiku Electronics | retailer123 |
| Dispatcher | James Dispatcher | dispatch123 |
| Rider | Brian Rider | rider123 |

On Render, the app auto-creates tables and seeds this same demo data on first boot if the database is empty — no manual shell access needed (see `render.yaml`).

---

## 8. Key Design Decisions

- **Public confirmation page** — real proof-of-delivery without forcing the customer to create an account.
- **Strict state machine on the server** — no invalid status jumps, enforced in code and the database `CHECK` constraints.
- **Socket.io** — every role stays in sync without polling the server.
- **Auto-seed on boot** — works on Render's free tier without needing shell access.
- **PostgreSQL over the earlier JSON/SQLite store** — Provides persistent storage for users and delivery records.
---
