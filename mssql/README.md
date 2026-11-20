# Sakthi Auto Component Limited — MSSQL Database Script (`/mssql`)

This folder contains the single, complete, idempotent Microsoft SQL Server (T-SQL) master script for the entire **Sakthi Auto Component Limited — Change Management System** (`SACL` database).

## File
- **`sacl_change_management_complete.sql`** — Runs end-to-end safely on SQL Server 2019, 2022, and 2025:
  1. Creates the `SACL` database.
  2. Creates all **15 tables** (`Companies`, `Users`, `Departments`, `Customers`, `Parts`, `ChangeRequests`, `Form1_PCRF` through `Form7_PPAP`, `Notifications`, `AuditLogs`) with primary keys, foreign keys, `CHECK` constraints, and `ISJSON` checks.
  3. Creates performance indexes on workflow stages, companies, risk levels, PPAP status, notifications, and audit logs.
  4. Creates **3 management views** (`vw_ChangeRequestOverview`, `vw_CompanyUnitKPI`, `vw_PendingApprovalsQueue`).
  5. Creates **3 stored procedures** (`sp_GetChangeRequestBundle`, `sp_GetDashboardSummary`, `sp_RecordAuditEvent`).
  6. Seeds master data (`MERGE`): 3 Companies/Units, 6 Departments, 6 OEM Customers, 6 Parts, all 8 RBAC Portal Users (`ADM001`, `EMP101`, `HOD201`, `HOF301`, `COF302`, `CFT401`, `CFTL01`, `PH001` — default password `password123`), plus a complete sample `PCRF-2026-041` across all 7 consultancy forms.
  7. Runs a verification health-check query across all 15 tables and management views.

## How to Run

### Option 1: Docker (`sacl-sql2025` from `docker-compose.yml`)
```bash
docker cp mssql/sacl_change_management_complete.sql sacl-sql2025:/tmp/sacl_complete.sql
docker exec -it sacl-sql2025 /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P "$SA_PASSWORD" -C -i /tmp/sacl_complete.sql
```

### Option 2: SQL Server Management Studio (SSMS) / Local `sqlcmd`
```bash
sqlcmd -S localhost -U sa -P "YourStrongPassword123!" -C -i mssql/sacl_change_management_complete.sql
```
