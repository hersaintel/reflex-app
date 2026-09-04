# Reflex – Entity Relationship Diagram

```
┌─────────────────────┐         ┌──────────────────────────────┐
│       USERS         │         │         DELIVERIES           │
├─────────────────────┤         ├──────────────────────────────┤
│ id          PK TEXT │◄──┐     │ id              PK TEXT      │
│ name           TEXT │   │     │ retailer_id     FK → users   │
│ phone          TEXT │   │     │ customer_name      TEXT      │
│ role           TEXT │   │     │ customer_phone     TEXT      │
│   (retailer|        │   │     │ address            TEXT      │
│    dispatcher|      │   │     │ item_description   TEXT      │
│    rider)           │   │     │ status             TEXT      │
│ password       TEXT │   │     │   (pending|assigned|         │
│ created_at  TIMESTAMPTZ│  │     │    picked_up|delivered)     │
└─────────────────────┘   │     │ rider_id        FK → users   │
                          │     │ assigned_at     TIMESTAMPTZ  │
                          │     │ picked_up_at    TIMESTAMPTZ  │
                          └─────│ delivered_at    TIMESTAMPTZ  │
                                │ notes              TEXT      │
                                │ created_at      TIMESTAMPTZ  │
                                │ updated_at      TIMESTAMPTZ  │
                                └──────────────────────────────┘
```

## Relationships
- One **retailer** (users) → many deliveries
- One **rider** (users) → many deliveries (nullable until assigned)
- **Dispatcher** is a user role that never owns a delivery row; they only update `rider_id` + `status`

## Constraints
- `role` CHECK IN ('retailer', 'dispatcher', 'rider')
- `status` CHECK IN ('pending', 'assigned', 'picked_up', 'delivered', 'cancelled')
- Foreign keys on `retailer_id` and `rider_id` → `users.id`
