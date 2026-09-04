# Reflex – Timing Log

**Target pitch length:** 10 minutes exactly  
**Target demo length:** ~4–5 minutes inside the pitch

Record at least **two dry runs** before the panel.

---

## Dry runs

| Dry run | Date       | Total pitch time | Demo time | Over / under | Notes  |
|---------|------------|------------------|-----------|--------------|-----------------------------------------------------|
| 1       | 2026-08-28 |  11:20      |  5:10 | +1:20        |  Database failure                                                  |
| 2       | 2026-08-30 | 7:20                 | 5:00          | -1:50             | Smooth run everything was okay at this point                                                    |
| 3 (mock)| 2026-09-01 | 6:50                 |  4:50         |   -1:20           |                                                     |

---



---



## Actions after each dry run

| Run | What to fix before next run |
|-----|-----------------------------|
| 1   | Switch from SQLite to Postgresql to avoid db failures and survive Render restarting                            |
| 2   | Ensure the database + app is running before demo                            |