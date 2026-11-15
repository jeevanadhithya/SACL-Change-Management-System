# Deployment Guide — Sakthi Auto Component Limited Change Management System

Vercel only hosts the static React frontend (`frontend/`). For login, forms, approvals, and SQL Server persistence to work in production, the **Backend (`backend/`)** and **MSSQL (`mssql/`)** containers must be running and reachable over **HTTPS**.

---

## Option 1: All-in-One Docker Stack on Your Custom Domain (Recommended)

Everything (`mssql` + auto schema seed + `backend` + `frontend` + automatic Let's Encrypt HTTPS via `caddy`) runs from one command on your cloud VPS (Ubuntu/Debian/EC2/DigitalOcean/Render/Railway):

1. Point your domain DNS `A` record (`pcms.yourdomain.com`) to your server's public IP, and open firewall ports `80` and `443`.
2. Start all containers with the `domain` profile:
   ```bash
   APP_DOMAIN=pcms.yourdomain.com \
   API_DOMAIN=api.yourdomain.com \
   DB_PASSWORD='YourStrongPassword123!' \
   JWT_SECRET='replace_with_long_random_secret' \
   docker compose --profile domain up -d --build
   ```
3. Open **`https://pcms.yourdomain.com`** — Nginx automatically proxies `/api/*` to the Node/MSSQL backend on the same domain, and Caddy automatically provisions free SSL certificates.

---

## Option 2: Keep Frontend on Vercel + Connect to Docker Backend/MSSQL

If you want to keep `https://sacl-frontend.vercel.app` (or a Vercel custom domain) hosting the UI while Docker hosts the API + MSSQL:

1. Point `api.yourdomain.com` DNS `A` record to your Docker server IP and start the backend/database + Caddy HTTPS proxy:
   ```bash
   APP_DOMAIN=pcms.yourdomain.com \
   API_DOMAIN=api.yourdomain.com \
   CORS_ORIGIN=https://sacl-frontend.vercel.app \
   DB_PASSWORD='YourStrongPassword123!' \
   JWT_SECRET='replace_with_long_random_secret' \
   docker compose --profile domain up -d --build
   ```
2. In your **Vercel Project Dashboard → Settings → Environment Variables**, add:
   - **Root Directory**: `frontend`
   - **Key**: `REACT_APP_API_URL`
   - **Value**: `https://api.yourdomain.com` *(must be `https://`, never `http://localhost:5000`)*
3. Trigger **Redeploy** in Vercel so Vite bundles the `REACT_APP_API_URL` into the static build.

---

## Option 3: Local Docker Test (No Domain Needed)

Run on your local computer or server IP:
```bash
docker compose up -d --build
```
- Frontend (with `/api` proxy): `http://localhost:8080`
- Backend API directly: `http://localhost:5000/health`
- Default seed login password for all portal IDs (`ADM001`, `EMP401`, `HOD201`, etc.): `password123`
