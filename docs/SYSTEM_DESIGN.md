# Reflex – System Design & Workflow

## Purpose
Give small Kenyan retailers a single place to log a delivery, assign a rider, track status, and get customer proof of receipt — replacing WhatsApp/phone chaos.

## Personas
| Role | Responsibility |
|------|----------------|
| Retailer staff | Creates the delivery request |
| Dispatcher | Assigns open requests to riders |
| Rider | Advances status and shows QR to customer |
| Customer | Scans QR and confirms receipt (no login) |

## Final Stack
- **Frontend**: Vanilla JS + Socket.io client
- **Backend**: Node.js + Express + Socket.io
- **Database**: PostgreSQL (Render)
- **Auth**: JWT, role-based
- **Hosting**: Render (HTTPS, auto-seed on first boot)

## Status Machine
```
pending → assigned → picked_up → delivered
```
Illegal transitions are rejected by the API.

## End-to-End Workflow

1. **Retailer logs request**  
   `POST /api/deliveries` → status = `pending` → Socket.io `delivery:new`

2. **Real-time push**  
   Dispatcher (and others) receive the new request without refresh

3. **Dispatcher assigns**  
   `POST /api/deliveries/:id/assign` → status = `assigned`, `rider_id` set

4. **Rider advances status**  
   - Button: `POST /api/deliveries/:id/status`  
   - Or scan: `POST /api/deliveries/confirm-scan`  
   → `picked_up` then later `delivered`

5. **Rider shows QR**  
   QR encodes `https://<host>/confirm/{deliveryId}`

6. **Customer confirms**  
   Opens public page (no login) → `POST /api/public/confirm/:id`  
   → status = `delivered` → Socket.io broadcast to all clients

## Key Design Decisions
- Public confirmation page = real proof-of-delivery without forcing the customer to create an account
- Strict state machine on the server = no invalid jumps
- Socket.io = all roles stay in sync without polling
- Auto-seed on boot = works on Render free tier (no Shell needed)
- PostgreSQL = data survives restarts (unlike the earlier JSON file store)

## Trade-offs We Own
1. **No live GPS** – status-only is enough for the core visibility problem  
2. **Manual assignment** – preserves human judgment for small shops  
3. **Single free-tier instance** – sleeps after inactivity; acceptable for sprint scale  
4. **No WhatsApp/SMS yet** – in-app visibility first