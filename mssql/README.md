# Sakthi Auto Component Limited — MS SQL Server Database

## Single Common Database Script

- **`sacl_database.sql`**: The single unified MS SQL Server script for the entire project.
  - Safe to execute on a **brand-new** SQL Server instance (`CREATE DATABASE [SACL]` → all 15 tables → indexes → views → stored procedures → 8 core Sakthi Auto portal accounts with default password `password123`).
  - Equally safe to re-run on an **existing** `[SACL]` database during active development (idempotently adds any new columns, refreshes constraints/views/procedures, and preserves customized user profiles and real operational data).
  - Includes an optional commented-out `DROP DATABASE [SACL]` block at the top when you want a full clean rebuild during development.
