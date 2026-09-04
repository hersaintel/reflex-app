# Reflex Demo Script (≈ 4–5 min)

**Goal**: Show the full loop in under 5 minutes.

### Setup 
- Browser tabs open: Retailer, Dispatcher, Rider (three different accounts).
- Seed data already loaded.

### Flow

1. **Retailer (30s)**  
   “Wanjiku needs to send a phone to a customer in Westlands.”  
   → Fill form → Log Request.  
   → Show it appears in “My Deliveries” as **Pending**.

2. **Dispatcher (45s)**  
   Switch to dispatcher view.  
   “New request appears in real time (Socket.io).”  
   → Select Brian Rider → Assign.  
   → Status becomes **Assigned**. Rider name shows.

3. **Rider (60s)**  
   Switch to rider view.  
   “Brian sees the assignment.”  
   → Mark Picked Up.  
   → Scan QR auto-completes from **Picked** to **Delivered**
   → Retailer & dispatcher see live updates without refresh.

4. **Close the loop (20s)**  
   Back to retailer: status is Delivered.  
   “Retailer always knows where the delivery stands – no WhatsApp chaos.”



