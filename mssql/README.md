# Sakthi Auto Component Limited — MSSQL Database & Queries (`/mssql`)

This folder contains all Microsoft SQL Server (T-SQL) setup scripts and operational reporting queries for the `SACL` database.

## Files
1. `01_schema.sql` — Creates the `SACL` database, all 15 tables (`Companies`, `Users`, `Departments`, `Customers`, `Parts`, `ChangeRequests`, `Form1_PCRF` through `Form7_PPAP`, `Notifications`, `AuditLogs`), foreign keys, and indexes.
2. `02_seed_master_data.sql` — Idempotent `MERGE` statements to populate Sakthi Auto companies/plants, departments, customers, parts, and default portal roles (`password123` default hash).
3. `03_queries_reports.sql` — Management & engineering reporting queries joining `ChangeRequests` with Forms 1–7, risk escalations, PTR/PPAP status, company breakdown, and immutable audit logs.

## Setup via `sqlcmd` or SSMS
Run the scripts in order inside SQL Server Management Studio (SSMS) or via CLI:

```bash
sqlcmd -S localhost -U sa -P "YourStrongPassword123!" -i mssql/01_schema.sql
sqlcmd -S localhost -U sa -P "YourStrongPassword123!" -i mssql/02_seed_master_data.sql
```

Then configure `/backend/.env`:
```env
PORT=5000
DB_USER=sa
DB_PASSWORD=YourStrongPassword123!
DB_SERVER=localhost
DB_DATABASE=SACL
JWT_SECRET=super_secret_jwt_key_2026
```
