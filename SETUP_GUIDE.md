# Setup dan Instalasi Auth Module

## Prerequisites

- Node.js (v16 atau lebih tinggi)
- npm atau yarn
- MySQL Server
- Postman atau similar tool (untuk testing API)

## 1. Backend Setup

### Step 1: Database Setup

```bash
# Buka MySQL dan jalankan:
mysql -u root -p
```

```sql
-- Copy-paste dari assets/cooperative_system_db.sql
-- Atau gunakan command:
```

```bash
mysql -u root -p cooperative_system_db < cooperative_system_db.sql
```

### Step 2: Install Backend Dependencies

```bash
# Di root folder (cooperative_system)
npm install
```

### Step 3: Konfigurasi Environment

Buat file `.env` di root folder:

```
PORT=3000
JWT_SECRET=your_super_secret_key_123456
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=cooperative_system_db
```

### Step 4: Test Backend

```bash
node app.js
```

Output yang diharapkan:

```
Server running on 3000
```

Test endpoint di Postman:

- POST http://localhost:3000/api/auth/register
- POST http://localhost:3000/api/auth/login
- GET http://localhost:3000/api/divisions

---

## 2. Frontend Setup

### Step 1: Install Dependencies

```bash
cd frontend
npm install
```

### Step 2: Setup Environment

Buat file `.env` di folder `frontend`:

```
VITE_API_URL=http://localhost:3000/api
```

Atau copy dari .env.example:

```bash
cp .env.example .env
```

### Step 3: Start Development Server

```bash
npm run dev
```

Output yang diharapkan:

```
VITE v8.0.10 ready in XXX ms

➜  Local:   http://localhost:5173/
➜  press h to show help
```

### Step 4: Testing di Browser

Buka http://localhost:5173/

Anda akan diarahkan ke halaman login (karena belum login).

---

## 3. Testing Auth Flow

### Test 1: Register User Baru

**Langkah:**

1. Klik "Daftar di sini" di halaman login
2. Isi form dengan data:
   - Nama: Test User
   - Username: testuser123
   - Password: test123456
   - Konfirmasi Password: test123456
   - Divisi: Supporting Unit
   - Departemen: Expeditor
3. Klik Lanjut dan Daftar

**Expected Output:**

- Berhasil register dengan status pending
- Halaman menampilkan pesan success
- User belum bisa login

### Test 2: Admin Approval (Backend)

**Langkah:**

1. Buka MySQL client
2. Update status user:

```sql
UPDATE users SET status = 'approved' WHERE username = 'testuser123';
```

3. Verify:

```sql
SELECT id, username, status FROM users WHERE username = 'testuser123';
```

### Test 3: Login User

**Langkah:**

1. Refresh halaman atau kembali ke login
2. Masukkan:
   - Username: testuser123
   - Password: test123456
3. Klik "Masuk"

**Expected Output:**

- Login berhasil
- Redirect ke dashboard
- Token tersimpan di localStorage

### Test 4: Verify Token

**Langkah:**

1. Buka Browser DevTools (F12)
2. Go to Application > Local Storage
3. Lihat value dari key "token"
4. Decode di jwt.io untuk verify

---

## 4. File Structure yang Sudah Dibuat

```
frontend/
├── .env.example
├── src/
│   ├── App.jsx (UPDATED)
│   ├── main.jsx (UNCHANGED)
│   ├── services/
│   │   ├── api.js (CREATED)
│   │   └── axiosInstace.js (CREATED)
│   ├── app/
│   │   ├── providers/
│   │   │   └── AuthProvider.jsx (CREATED)
│   │   └── router/
│   │       ├── AppRoutes.jsx (CREATED)
│   │       ├── ProtectedRoute.jsx (CREATED)
│   │       └── RoleRoute.jsx (CREATED)
│   └── features/
│       └── auth/
│           ├── README.md (CREATED)
│           ├── components/
│           │   └── Loginform.jsx (CREATED)
│           ├── hooks/
│           │   └── useAuth.js (CREATED)
│           ├── pages/
│           │   ├── LoginPage.jsx (CREATED)
│           │   └── RegisterPage.jsx (CREATED)
│           └── services/
│               └── authService.js (CREATED)
```

---

## 5. Common Issues & Troubleshooting

### Issue 1: "Cannot find module 'react-router-dom'"

**Solusi:**

```bash
cd frontend
npm install react-router-dom axios
```

### Issue 2: "CORS error"

**Solusi:**

- Pastikan backend punya CORS enabled
- Cek app.js sudah punya `app.use(cors())`
- Pastikan API_URL di .env sudah benar

### Issue 3: "400 Invalid division" saat register

**Solusi:**

- Divisi ID yang dipilih mungkin tidak ada di database
- Check database: `SELECT * FROM divisions`
- Pilih divisi yang ada di list

### Issue 4: "User not approved" saat login

**Solusi:**

- User belum di-approve oleh admin
- Update status di database: `UPDATE users SET status = 'approved' WHERE id = X`
- Coba login lagi

### Issue 5: "JWT token is not defined" error

**Solusi:**

- Pastikan JWT_SECRET di .env backend ada
- Pastikan login berhasil dan return token
- Check browser console untuk response error

---

## 6. Database Seeding (Optional)

Untuk testing dengan data yang sudah ada:

```sql
-- User sudah ada di database:
-- username: dharul123, password: (hashed)
-- username: Via123, password: (hashed)
-- Semua sudah approved, bisa langsung login
```

---

## 7. Next Steps - Implementasi Admin Panel

Untuk melengkapi sistem approval, buat admin panel dengan fitur:

### 1. Daftar Pending Users

```jsx
// features/admin/pages/PendingUsers.jsx
GET /api/users?status=pending
```

### 2. Approve User

```jsx
// features/admin/pages/ApproveUser.jsx
PATCH /api/users/:id/status
Body: { status: 'approved' }
```

### 3. Reject User

```jsx
// features/admin/pages/RejectUser.jsx
PATCH /api/users/:id/status
Body: { status: 'rejected', reason: '...' }
```

---

## 8. Performance Tips

1. **Lazy Loading Routes**

```jsx
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));

// Di AppRoutes.jsx
<Suspense fallback={<Loading />}>
  <Route path="/login" element={<LoginPage />} />
</Suspense>;
```

2. **Optimize Axios Calls**

- Cache divisions list
- Implement request debouncing untuk department fetch

3. **Token Refresh**

- Implement refresh token untuk extend session
- Refresh sebelum token expire

---

## 9. Deployment

### Frontend (Vercel/Netlify)

```bash
# Build
npm run build

# Deploy
# Hubungkan repo ke Vercel/Netlify
# Set environment variable: VITE_API_URL=https://api.yourdomain.com
```

### Backend (Heroku/Railway)

```bash
# Ensure package.json ada script start
# Deploy & set environment variables di hosting
```

---

## 10. Documentation Files

- `frontend/src/features/auth/README.md` - Dokumentasi lengkap auth module
- `ADMIN_APPROVAL_SCENARIO.md` - Skenario approval admin
- `.env.example` - Template environment variables

---

## 11. Security Checklist

- [ ] JWT_SECRET sudah di .env (tidak di-commit)
- [ ] Password di-hash dengan bcrypt
- [ ] Status validation di backend (tidak client-side saja)
- [ ] Token expiry sudah set
- [ ] Protected routes sudah implemented
- [ ] CORS hanya dari domain yang authorized
- [ ] Input validation di backend
- [ ] Error messages tidak expose sensitive info

---

## Support & Contact

Jika ada pertanyaan atau masalah:

1. Check README files
2. Search error message di Google
3. Check network request di DevTools
4. Verify database dengan SELECT queries
5. Check console logs di terminal

---

**Status:** ✅ Ready to Use  
**Versi:** 1.0  
**Last Updated:** 3 Mei 2026

Selamat menggunakan Auth Module! 🚀
