# Three-Server Todo App

This project is designed to run on **three separate servers**:

1. Frontend server: static HTML, CSS and browser JavaScript.
2. Backend server: Node.js + Express REST API.
3. Database server: MySQL.

The browser calls the backend API. Only the backend connects to MySQL. Never connect to MySQL directly from browser JavaScript.

## Folder structure

```text
three-server-todo-app/
├── frontend/   # Deploy these static files to Nginx or another web server
├── backend/    # Deploy this Node.js API to the backend machine
├── database/   # SQL schema to run on the MySQL machine
└── README.md
```

## Example network plan

Replace these example addresses with your own server IP addresses.

| Role | Example IP | Service |
|---|---|---|
| Frontend | 192.168.1.10 | Nginx, HTTP 80 |
| Backend | 192.168.1.20 | Node.js, TCP 3000 |
| Database | 192.168.1.30 | MySQL, TCP 3306 |

Network rules:
- Browser/client machines must reach the frontend.
- Browser/client machines must reach the backend API (or an HTTPS reverse proxy).
- Backend server must reach the database on TCP 3306.
- MySQL port 3306 should accept connections only from the backend server's IP. Do not expose MySQL publicly.

## 1. Database server setup

Install MySQL Server on the database machine. Copy `database/schema.sql` there.

**Before running it, change `change_this_password` in `schema.sql` to a strong password.**

Run:

```bash
mysql -u root -p < schema.sql
```

This creates the `todo_db` database, `tasks` table and a limited `todo_user` account.

Configure MySQL to listen on its private network interface so the backend can connect. Configure the database firewall to allow TCP 3306 only from the backend server. For tighter account-level access, replace `'%'` in the `CREATE USER` line with the backend server's IP address, for example `'192.168.1.20'`.

## 2. Backend server setup

Copy the `backend/` folder to the backend machine. Install Node.js LTS, then:

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` with the real database server details:

```env
DB_HOST=192.168.1.30
DB_PORT=3306
DB_USER=todo_user
DB_PASSWORD=your_strong_password
DB_NAME=todo_db
PORT=3000
FRONTEND_ORIGIN=http://192.168.1.10
```

Use the exact frontend origin (scheme, hostname/IP and port if non-default). Start the API:

```bash
npm start
```

Test from the backend machine:

```bash
curl http://localhost:3000/api/health
```

Expected response:

```json
{"status":"ok","database":"connected"}
```

The API listens on `0.0.0.0` so the frontend server/client can reach it. Restrict inbound access with a firewall, or put the API behind an HTTPS reverse proxy.

## 3. Frontend server setup

Copy the contents of `frontend/` to your frontend web server's document root, for example `/var/www/html/` on Nginx.

Edit `frontend/config.js` and set the backend API URL:

```javascript
window.APP_CONFIG = {
  API_BASE_URL: "http://192.168.1.20:3000/api"
};
```

Example minimal Nginx server block:

```nginx
server {
    listen 80;
    server_name _;
    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }
}
```

Open the frontend server address in a browser, for example `http://192.168.1.10`. Serve the files through Nginx or another web server; do not open the page using a `file://` URL.

## API routes

| Method | Route | Purpose |
|---|---|---|
| GET | `/api/health` | Check API and database connection |
| GET | `/api/tasks` | List tasks |
| POST | `/api/tasks` | Create task, JSON: `{"title":"Study Docker"}` |
| PATCH | `/api/tasks/:id` | Update status, JSON: `{"completed":true}` |
| DELETE | `/api/tasks/:id` | Delete task |

## Important

- This is a learning/demo application and has no user authentication.
- Use HTTPS for the frontend and API in a real deployment. If the frontend uses HTTPS, the API must also use HTTPS to avoid browser mixed-content blocking.
- Do not commit `.env` or passwords to Git.
- Keep MySQL private and reachable only by the backend.
- For public production use, add authentication, rate limiting, secure headers, backups and secrets management.
- If the frontend IP changes, update `FRONTEND_ORIGIN` in backend `.env`.
- If the backend IP changes, update `API_BASE_URL` in frontend `config.js`.

## Local test

You can first test the three components on one computer:
1. Install MySQL and run `database/schema.sql`.
2. In backend `.env`, set `DB_HOST=127.0.0.1`.
3. Start backend with `npm start`.
4. Serve `frontend/` using a local static web server.
5. Keep `API_BASE_URL` as `http://localhost:3000/api`.

Tasks are stored in MySQL and remain after the Node.js process restarts.
