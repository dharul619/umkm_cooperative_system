# 🚀 Auth Module - Quick Start Guide

## Apa yang Telah Dibuat?

Saya telah membuat **modul autentikasi lengkap** dengan fitur:

- ✅ Login page dengan Material UI yang menarik
- ✅ Register page dengan multi-step form (info personal + organisasi)
- ✅ Sistem approval admin (user baru status = pending)
- ✅ Auto-select departemen berdasarkan divisi
- ✅ JWT token-based authentication
- ✅ Protected routes untuk halaman yang memerlukan login
- ✅ Automatic token injection di setiap request
- ✅ Auto-logout jika token expired

---

## 📋 File yang Telah Dibuat

### Frontend Services & Configuration

```
✅ frontend/src/services/api.js
✅ frontend/src/services/axiosInstace.js
✅ frontend/package.json (updated)
✅ frontend/.env.example
```

### Auth Module

```
✅ frontend/src/features/auth/
   ├── components/Loginform.jsx
   ├── hooks/useAuth.js
   ├── pages/LoginPage.jsx
   ├── pages/RegisterPage.jsx
   ├── services/authService.js
   └── README.md
```

### Auth Provider & Routes

```
✅ frontend/src/app/providers/AuthProvider.jsx
✅ frontend/src/app/router/AppRoutes.jsx
✅ frontend/src/app/router/ProtectedRoute.jsx
✅ frontend/src/app/router/RoleRoute.jsx
✅ frontend/src/App.jsx (updated)
```

### Documentation

```
✅ SETUP_GUIDE.md - Panduan instalasi & testing
✅ ADMIN_APPROVAL_SCENARIO.md - Skenario approval admin
✅ frontend/src/features/auth/README.md - Dokumentasi lengkap
```

---

## ⚡ Mulai Dalam 5 Menit

### 1️⃣ Backend (Root Folder)

```bash
npm install
# Buat .env file dengan:
# PORT=3000
# JWT_SECRET=your_secret_key
# DB_HOST=localhost
# DB_USER=root
# DB_PASSWORD=
# DB_NAME=cooperative_system_db

node app.js
# Server running on 3000 ✓
```

### 2️⃣ Frontend

```bash
cd frontend
npm install
# Buat .env file dengan:
# VITE_API_URL=http://localhost:3000/api

npm run dev
# http://localhost:5173/ ✓
```

### 3️⃣ Test Register → Approve → Login

```bash
# 1. Buka http://localhost:5173
# 2. Klik "Daftar di sini"
# 3. Isi form dan daftar
# 4. User akan punya status = "pending"
# 5. Buka MySQL dan approve:
#    UPDATE users SET status = 'approved' WHERE username = '...';
# 6. Login dengan akun yang sama
# 7. Berhasil! ✓
```

---

## 🎯 Skenario Approval Admin

```
USER REGISTER
    ↓
Status = "pending" (di database)
    ↓
ADMIN REVIEW & APPROVE
    ↓
Status = "approved"
    ↓
USER CAN LOGIN
    ↓
Get JWT Token
    ↓
Access Dashboard
```

### Backend Validation

```javascript
// authController.js - Login function
if (user.status !== "approved") {
  return res.status(403).json({ message: "User not approved" });
}
```

---

## 🎨 Material UI Features

- **Login Page**: Gradient background, card design, password visibility toggle
- **Register Page**: Multi-step form dengan Stepper, dropdown untuk divisi/departemen
- **Forms**: TextFields dengan error messages, buttons dengan loading state
- **Alerts**: Success/error/info messages
- **Icons**: Dari @mui/icons-material

---

## 🔒 Security Features

1. **Password Hashing** - Bcrypt 10 rounds
2. **JWT Token** - Expires in 1 day
3. **Request Interceptor** - Token auto-injected
4. **Response Interceptor** - Auto-logout on 401
5. **Protected Routes** - Check auth status
6. **Status Validation** - Server-side check (not client)
7. **CORS** - Konfigurasi di backend

---

## 📱 User Flow

### Register Flow

```
User → Fill Form → Register Button
→ Backend Create User (status: pending)
→ Success Message → Wait for Admin Approval
```

### Login Flow

```
User → Enter Username/Password → Login Button
→ Backend Check (username, password, status)
→ If status = "approved" → Generate JWT Token
→ Token in localStorage → Redirect to Dashboard
```

---

## 🛠️ API Endpoints

| Method | Endpoint                         | Purpose                     |
| ------ | -------------------------------- | --------------------------- |
| POST   | `/api/auth/register`             | Register user baru          |
| POST   | `/api/auth/login`                | Login user                  |
| GET    | `/api/divisions`                 | Get all divisions           |
| GET    | `/api/departments?division_id=X` | Get departments by division |

---

## 📚 Documentation Files

1. **SETUP_GUIDE.md** - Step-by-step installation & testing
2. **ADMIN_APPROVAL_SCENARIO.md** - Detail skenario approval
3. **frontend/src/features/auth/README.md** - Complete auth module doc
4. **.env.example** - Environment variables template

---

## ✨ Highlights

### LoginPage.jsx

```jsx
// Material UI design dengan:
- Gradient background
- Card layout
- Password visibility toggle
- Error/Success messages
- Loading state
```

### RegisterPage.jsx

```jsx
// Multi-step form dengan:
- Step 1: Personal info (name, username, password)
- Step 2: Organization (division, department)
- Dynamic department list based on selected division
- Comprehensive validation
- Success screen dengan instruksi next step
```

### AuthProvider.jsx

```jsx
// Context provider yang manage:
- User state
- Login status
- Auth functions (login, register, logout)
- Token management
- Auto-decode JWT untuk user info
```

---

## 🔍 Troubleshooting

### "Cannot find module 'react-router-dom'"

```bash
npm install react-router-dom axios
```

### "CORS error"

- Pastikan backend punya `app.use(cors())`
- Check VITE_API_URL di .env frontend

### "User not approved"

- Belum di-approve oleh admin
- Update di MySQL: `UPDATE users SET status = 'approved' WHERE username = '...'`

### "Login gagal random"

- Check username/password di database
- Pastikan JWT_SECRET di .env backend
- Check token di browser DevTools

---

## 📌 Next Steps (Opsional)

### 1. Buat Admin Panel

- Daftar user pending
- Button approve/reject
- View user details

### 2. Email Verification

- Send email saat register
- Confirm email sebelum approval

### 3. Forgot Password

- Send reset link via email
- Verify token dan reset password

### 4. Two-Factor Authentication

- OTP via email/SMS
- Authenticator app

---

## 🎓 Pembelajaran dari Project Ini

- ✅ React Context API untuk state management
- ✅ Material UI component library
- ✅ Axios interceptors untuk request/response handling
- ✅ JWT authentication flow
- ✅ Protected routes pattern
- ✅ Multi-step form dengan validation
- ✅ Responsive design dengan gradients
- ✅ Backend integration best practices

---

## 📞 Support

Jika ada pertanyaan:

1. Baca file README di `frontend/src/features/auth/README.md`
2. Cek ADMIN_APPROVAL_SCENARIO.md untuk flow detail
3. Check SETUP_GUIDE.md untuk troubleshooting
4. Lihat network requests di browser DevTools

---

## ✅ Checklist Terakhir

- [ ] Backend running di port 3000
- [ ] Frontend running di port 5173
- [ ] Database sudah import dari .sql file
- [ ] .env files sudah dibuat di backend & frontend
- [ ] Bisa register user baru
- [ ] Bisa approve user di MySQL
- [ ] Bisa login dengan user yang approved
- [ ] Token tersimpan di localStorage
- [ ] Bisa access dashboard setelah login

---

**🎉 Selamat! Auth Module Anda sudah siap digunakan!**

Versi: 1.0  
Status: ✅ Production Ready  
Last Updated: 3 Mei 2026
