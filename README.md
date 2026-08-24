# Reflex – The Readiness Sprint

Delivery coordination for small Kenyan retailers (electronics, pharmacies, hardware).

## Quick Start

```bash
cd reflex-app
npm install
npm run init-db
npm run seed
npm run dev
```

Open http://localhost:3000

### Demo Accounts

| Role       | Name                 | Password     |
|------------|----------------------|--------------|
| Retailer   | Wanjiku Electronics  | retailer123  |
| Dispatcher | James Dispatcher     | dispatch123  |
| Rider      | Brian Rider          | rider123     |

## Architecture (Defendable)

- **Frontend**: Vanilla HTML/JS + Socket.io client (zero build step for the freeze)
- **Backend**: Express + Socket.io
- **DB**: SQLite (better-sqlite3) – single file, no external service
- **Auth**: JWT, role-based (retailer / dispatcher / rider)
- **Real-time**: Socket.io broadcasts `delivery:new` and `delivery:updated`
- **Scanning**: QR generated per delivery; rider can confirm status via scan endpoint

### Data Model

**users**: id, name, phone, role, password  
**deliveries**: id, retailer_id, customer_*, address, item_description, status, rider_id, timestamps

Status machine: `pending → assigned → picked_up → delivered`

## Trade-offs (see TRADEOFFS.md)

1. No GPS / live map  
2. Manual assignment only  
3. SQLite single-process  
4. No WhatsApp/SMS yet  

## Demo Script

See `docs/DEMO_SCRIPT.md`
# reflex
