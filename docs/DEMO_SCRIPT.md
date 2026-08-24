# Reflex Demo Script (≈ 4–5 min)

**Goal**: Show the full loop in under 5 minutes. One person drives, others narrate.

### Setup (before panel)
- Browser tabs open: Retailer, Dispatcher, Rider (three different accounts or incognito).
- Seed data already loaded.

### Flow

1. **Retailer (30s)**  
   “Wanjiku needs to send a phone to a customer in Westlands.”  
   → Fill form → Log Request.  
   → Show it appears in “My Deliveries” as Pending.  
   → Optional: Show QR.

2. **Dispatcher (45s)**  
   Switch to dispatcher view.  
   “New request appears in real time (Socket.io).”  
   → Select Brian Rider → Assign.  
   → Status becomes Assigned. Rider name shows.

3. **Rider (60s)**  
   Switch to rider view.  
   “Brian sees the assignment.”  
   → Mark Picked Up (or Scan QR).  
   → Later: Mark Delivered.  
   → Retailer & dispatcher see live updates without refresh.

4. **Close the loop (20s)**  
   Back to retailer: status is Delivered.  
   “Retailer always knows where the delivery stands – no WhatsApp chaos.”

### Handoff notes
- Person A owns Problem + Solution slides + Retailer demo.
- Person B owns Architecture + Dispatcher/Rider demo.
- Person C owns Trade-offs + Roadmap + answers first hard question.

### Timing log template
| Dry run | Date | Total time | Notes |
|---------|------|------------|-------|
| 1       |      |            |       |
| 2       |      |            |       |
