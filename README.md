# Campus Connect — Full Setup Guide

## Project Structure
```
campus-connect/
├── database/
│   └── schema.sql
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── .env.example
│   ├── config/db.js
│   ├── middleware/auth.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── eventsController.js
│   │   ├── registrationsController.js
│   │   ├── certificatesController.js
│   │   └── userController.js
│   └── routes/
│       ├── auth.js
│       ├── events.js
│       ├── registrations.js
│       ├── certificates.js
│       └── users.js
├── frontend/
│   └── index.html
└── thunder-client-collection.json
```

---

## Step 1 — Oracle Database

1. Open SQL Developer, connect to your Oracle instance
2. Open and run database/schema.sql (press F5)
3. It creates all 4 tables and seeds admin + student accounts

Common Oracle connect strings:
  localhost/XEPDB1   (Oracle XE pluggable - recommended)
  localhost/XE       (Oracle XE classic)
  localhost/ORCLPDB1 (Oracle 19c+)

---

## Step 2 — Backend

```
cd backend
npm install
cp .env.example .env
```

Fill in your .env:
```
PORT=5500
DB_USER=your_oracle_username
DB_PASSWORD=your_oracle_password
DB_CONNECT_STRING=localhost/XEPDB1
JWT_SECRET=campus_connect_super_secret_key
JWT_EXPIRES_IN=8h
```

Then start the server:
```
npm run dev
```

Expected output:
```
Oracle DB connection pool created
Campus Connect server running at http://localhost:5500
```

---

## Step 3 — Thunder Client

1. Open Thunder Client sidebar in VS Code
2. Click Collections -> Import
3. Select thunder-client-collection.json
4. Set the base_url environment variable to http://localhost:5500

### Testing order:

1.  Health Check              - confirm server is up
2.  Register Student          - create johndoe account
3.  Login (Admin)             - copy token, paste into admin_token variable
4.  Login (Student)           - copy token, paste into token variable
5.  Create Event (Admin)      - auto-approved
6.  Create Event (Student)    - goes to pending
7.  Get Pending Events        - note the event id
8.  Approve Event             - change :id in URL to match step 7
9.  Get Approved Events       - student now sees the event
10. Register for Event        - student registers (use approved event id)
11. My Registrations          - confirm registration
12. Request Certificate       - student requests cert
13. All Certificates (Admin)  - admin sees pending cert, note id
14. Approve Certificate       - admin approves
15. My Certificates           - student sees approved cert
16. Admin Stats               - summary numbers
17. Student Leaderboard       - ranked by engagement points

---

## API Reference

Base URL: http://localhost:5500
All protected routes need: Authorization: Bearer token

### Auth
POST   /auth/register          { name, username, email, password }
POST   /auth/login             { username, password }
GET    /auth/me                (protected)

### Events
GET    /events                 All approved events
POST   /events                 Create event (admin = auto-approved)
GET    /events/pending         Admin only
GET    /events/all             Admin only
PUT    /events/:id             Admin - { status: "approved" or "rejected" }
DELETE /events/:id             Admin

### Registrations
POST   /register-event         { event_id }
GET    /my-registrations
GET    /registrations/all      Admin only
DELETE /registrations/:id

### Certificates
POST   /request-certificate    { event_id }
GET    /my-certificates
GET    /certificates/all       Admin only
POST   /certificates/approve   Admin - { cert_id }
POST   /certificates/reject    Admin - { cert_id }

### Admin
GET    /admin/stats
GET    /admin/dashboard
GET    /admin/students
GET    /admin/profile

---

## Default Accounts

Admin:   username=admin    password=admin123
Student: username=johndoe  password=test123

---

## Common Oracle Errors

ORA-12541  Oracle service not running - start Oracle
ORA-01017  Wrong credentials - check DB_USER and DB_PASSWORD in .env
ORA-12514  Wrong service name - try localhost/XE or localhost/XEPDB1
ORA-00001  Duplicate entry - already registered or cert already requested


(this is the progress, i have hosted server and its running,npm is installed, and data is created in SQL*plus - oracle express - yet to fill my .env 

sqlplus system/Harry459@localhost/XEPDB1