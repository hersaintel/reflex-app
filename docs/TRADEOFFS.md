# Reflex – Trade-off Log

## 1. No live GPS tracking
**What:** Status transitions only (Assigned → Picked Up → Delivered). No map, no location pings.  
**Acceptable because:** 5-day freeze + group capacity. Real GPS needs mobile app permissions, background location, and a map provider.  
**With more time:** Rider app with background location + Mapbox/Leaflet live view for retailer and dispatcher.

## 2. Manual assignment only
**What:** Dispatcher selects a rider from a dropdown. No auto-dispatch or load balancing.  
**Acceptable because:** Preserves human judgment (important for small Kenyan shops that know their riders). Avoids brittle matching logic under edge cases.  
**With more time:** “Suggest nearest / least-loaded” button, then optional auto-assign for higher volume.

## 3. JSON file store (single process)
**What:** All data in one `reflex-data.json` file. Socket.io in the same Node process. No horizontal scale.  
**Acceptable because:** Zero ops overhead, trivial backup (copy one file), perfect for live demo and freeze.  
**With more time:** PostgreSQL + Redis adapter for Socket.io + multi-instance deployment.

## 4. No WhatsApp / SMS notifications yet
**What:** All visibility stays inside the app.  
**Acceptable because:** Core problem (no shared record of assignment/status) is solved first. External messaging is an additive.  
**With more time:** Africa’s Talking or Twilio for status SMS + WhatsApp Business API alerts to retailer and customer or USSD alerts for edge cases.
