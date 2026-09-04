# Reflex – The Readiness Sprint

Delivery coordination for small **Kenyan** retailers (electronics shops, pharmacies, hardware stores).

Reflex replaces WhatsApp and phone-call chaos with one system where every delivery is **logged, assigned, tracked, and confirmed**.

---

## Problem

Small Kenyan retailers coordinate deliveries over WhatsApp and calls. That means:

- No shared record of who was assigned  
- No live status visibility  
- No proof of delivery  

## Who it is for

| Role | Responsibility |
|------|----------------|
| **Retailer staff** | Logs a delivery request (customer, phone, address, item) |
| **Dispatcher** | Sees open requests and assigns each to a rider |
| **Rider** | Sees assigned jobs and updates status (Assigned → Picked Up → Delivered) |
| **Customer** | Can confirm receipt via QR (proof of delivery) |

---

## Current stack

| Layer | Technology | Notes |
|-------|------------|--------|
| Frontend | Vanilla HTML / CSS / JS | Zero build step |
| Real-time | Socket.io | Live updates on create / status change |
| Backend | Node.js + Express | REST API + WebSockets |
| Database | JSON file store (`reflex-data.json`) | No external DB, easy demo |
| Auth | JWT | Role-based (retailer / dispatcher / rider) |
| QR | `qrcode` | Proof-of-delivery codes |

**Status machine:** `pending → assigned → picked_up → delivered`  
Only legal transitions are allowed.

---

## Quick start

```bash
cd reflex-app
npm install
npm run init-db
npm run seed
npm run dev
```

Open: **http://localhost:3000** - Local host demo

Open: **https://reflex-app-otd4.onrender.com** - Live demo

The app seeds demo users on first start.

### Demo accounts

| Role       | Name                 | Password     |
|------------|----------------------|--------------|
| Retailer   | Wanjiku Electronics  | retailer123  |
| Dispatcher | James Dispatcher     | dispatch123  |
| Rider      | Brian Rider          | rider123     |

---

## Project structure

```text
reflex-app/
├── public/
│   └── index.html          # Full SPA (all roles)
├── db.js                   # JSON store + seed data
├── server.js               # Express + Socket.io API
├── seed.js                 # Optional seed helper
├── package.json
├── README.md
└── docs/
    ├── DOCUMENTATION.md    # Overview + API summary
    ├── ERD.md              # Data model
    ├── SYSTEM_DESIGN.md    # Workflow
    ├── TRADEOFFS.md        # One-page trade-off log
    ├── DEMO_SCRIPT.md      # Timed demo + handoffs
    └── TIMING_LOG.md       # Dry-run timing template
```

---

## Trade-offs (summary)

Full write-up: [`docs/TRADEOFFS.md`](docs/TRADEOFFS.md)

1. **No live GPS** — status-only solves core visibility; GPS needs mobile app + map API  
2. **Manual assignment** — preserves human judgment for small shops  
3. **JSON file store** — zero ops, perfect for freeze; not for multi-instance scale  
4. **No WhatsApp / SMS yet** — in-app visibility first; messaging is additive  

---

## API overview

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/login` | — | Login, returns JWT |
| GET | `/api/deliveries` | any role | List deliveries (scoped) |
| POST | `/api/deliveries` | retailer | Create request |
| POST | `/api/deliveries/:id/assign` | dispatcher | Assign rider |
| POST | `/api/deliveries/:id/status` | rider | Advance status |
| GET | `/api/deliveries/:id/qr` | any | Generate QR |
| POST | `/api/deliveries/confirm-scan` | rider | Confirm via scan |

---

## Design docs

| Doc | Purpose |
|-----|---------|
| [docs/DOCUMENTATION.md](docs/DOCUMENTATION.md) | System overview |
| [docs/ERD.md](docs/ERD.md) | Entity relationship diagram |
| [docs/SYSTEM_DESIGN.md](docs/SYSTEM_DESIGN.md) | End-to-end workflow |
| [docs/TRADEOFFS.md](docs/TRADEOFFS.md) | Trade-off log |
| [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md) | Live demo script |
| [docs/TIMING_LOG.md](docs/TIMING_LOG.md) | Dry-run timing log |


---

## Roadmap (next)

- **Next 2 weeks:** SMS / WhatsApp alerts, “suggest rider” button, audit log  
- **Month 1–2:** Rider PWA + GPS, live map, photo proof of delivery  
- **Quarter:** Multi-store, PostgreSQL + Redis, auto-dispatch  

---