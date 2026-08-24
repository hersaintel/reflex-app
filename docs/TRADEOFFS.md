# Reflex – One-Page Trade-off Log

## 1. No live GPS tracking
**What**: Status transitions only (Assigned → Picked Up → Delivered). No map, no location pings.  
**Acceptable because**: 5-day freeze + group capacity. Real GPS needs mobile app permissions, background location, and a map provider.  
**With more time**: Rider app with background location + Mapbox/Leaflet live view for retailer & dispatcher.

## 2. Manual assignment only
**What**: Dispatcher selects rider from a dropdown. No auto-dispatch or load balancing.  
**Acceptable because**: Preserves human judgment (critical for small shops that know their riders). Avoids brittle matching logic under edge cases.  
**With more time**: “Suggest nearest / least-loaded” button + optional auto-assign for high volume.

## 3. SQLite + single process
**What**: File-based DB, Socket.io in the same Node process. No horizontal scale.  
**Acceptable because**: Zero ops overhead, trivial backup (copy `reflex.db`), perfect for live demo and freeze.  
**With more time**: Postgres + Redis adapter for Socket.io + proper multi-instance deployment.

## 4. No WhatsApp / SMS notifications
**What**: All visibility stays inside the app.  
**Acceptable because**: Core problem (no shared record of assignment/status) is solved first. External messaging is additive.  
**With more time**: Africa’s Talking or Twilio for status SMS + WhatsApp Business API alerts to retailer & customer.
