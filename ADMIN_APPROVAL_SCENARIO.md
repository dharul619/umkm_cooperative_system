# Auth Module - Skenario Approval Admin

## Deskripsi

Modul auth ini menerapkan skenario di mana setiap user baru yang mendaftar harus mendapatkan approval dari System Administrator sebelum dapat menggunakan sistem.

## User Status Flow

```
┌─────────────────────────────────────────────────────────┐
│                     USER STATUS FLOW                    │
└─────────────────────────────────────────────────────────┘

[PENDING] ─ Admin Review ─> [APPROVED] ─ User Login ─> [ACTIVE]
   ▲                              │
   │                              │
   └──── Admin Reject ───────> [REJECTED]
```

## Skenario 1: User Baru Mendaftar

### Langkah-Langkah:

1. User mengakses halaman `/register`
2. User mengisi form dengan data:
   - Nama Lengkap
   - Username (harus unik)
   - Password (minimal 6 karakter)
   - Divisi (pilih dari dropdown)
   - Departemen (berdasarkan divisi yang dipilih)
3. User klik tombol "Daftar"
4. Backend membuat user dengan **status = "pending"**
5. Frontend menampilkan pesan sukses:
   ```
   "Pendaftaran Berhasil!
    Akun Anda telah dibuat dengan status pending.
    Silakan tunggu approval dari administrator..."
   ```

### Respons Backend:

```json
{
  "message": "Register success, waiting for admin approval"
}
```

## Skenario 2: Admin Approve User

### Backend Endpoint (untuk admin panel):

```
PATCH /api/users/:id/status
Body: { "status": "approved" }
```

### Setelah Approval:

- User status di database berubah dari "pending" menjadi "approved"
- User menerima notifikasi (opsional: email)
- User dapat melakukan login ke sistem

## Skenario 3: User Login

### Langkah-Langkah:

1. User mengakses halaman `/login`
2. User memasukkan username dan password
3. Backend melakukan pengecekan:
   - Username ada di database? ✓
   - Password benar? ✓
   - **Status user = "approved"?** ✓ (PENTING!)
4. Jika semua valid → Generate JWT token
5. Token disimpan di localStorage
6. User redirect ke `/dashboard`

### Validasi Backend di Controller:

```javascript
// authController.js - login function

// Check if user exists
const user = await db.query("SELECT * FROM users WHERE username = ?", [username]);

// Check if status is approved
if (user.status !== "approved") {
  return res.status(403).json({
    message: "User not approved"
  });
}

// Check password
const match = await bcrypt.compare(password, user.password);

// Generate token
const token = jwt.sign({...}, JWT_SECRET);
return res.json({ token });
```

### Error Messages:

- **"User not found"** - Username tidak terdaftar
- **"User not approved"** - Status masih pending atau rejected
- **"Wrong password"** - Password tidak sesuai

## Skenario 4: Admin Reject User

### Backend Endpoint (untuk admin panel):

```
PATCH /api/users/:id/status
Body: { "status": "rejected" }
```

### Setelah Rejection:

- User status di database berubah menjadi "rejected"
- User tidak dapat login ke sistem
- Login akan menampilkan pesan:
  ```
  "User not approved"
  ```
- Admin dapat memberikan alasan rejection (opsional)

## Database Implementation

### Users Table

```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role_id INT DEFAULT 4 -- Default role = "Anggota"
  division_id INT,
  department_id INT,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL
);
```

### Roles Table

```sql
CREATE TABLE roles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  role_name VARCHAR(50) NOT NULL,
  description TEXT
);

INSERT INTO roles VALUES
(1, 'System Administrator', 'Admin penuh sistem'),
(2, 'Divisi Head', 'Kepala Divisi'),
(3, 'Manager', 'Manajer Departemen'),
(4, 'Anggota', 'Member biasa');
```

## Admin Panel Requirements (Untuk Implementasi Selanjutnya)

### Fitur yang Dibutuhkan:

1. **Daftar User Pending**
   - Tampilkan semua user dengan status "pending"
   - Informasi: Nama, Username, Divisi, Departemen, Tanggal Daftar
   - Action: Approve / Reject / Delete

2. **Detail User**
   - Tampilkan semua informasi user
   - History approval
   - Alasan rejection (jika ada)

3. **Approve User**
   - Button "Approve"
   - Konfirmasi sebelum approval
   - Log activity

4. **Reject User**
   - Button "Reject"
   - Field untuk alasan rejection
   - Opsional: Send email notification

5. **Dashboard Admin**
   - Total pending users
   - Total approved users
   - Recent activities

## Frontend Implementation Details

### LoginPage.jsx

```jsx
// Login validation
if (user.status !== "approved") {
  // Backend akan return 403 error
  throw { message: "User not approved" };
}
```

### RegisterPage.jsx

```jsx
// Register success flow
if (response.message.includes("waiting for admin approval")) {
  // Tampilkan success screen
  setSuccess(true);
}
```

### AuthProvider.jsx

```jsx
// Decode JWT token untuk ambil user info
const token = response.token;
const userData = decodeJWT(token); // {id, role_name}
setUser(userData);
```

## API Response Examples

### Register Success

```json
{
  "message": "Register success, waiting for admin approval"
}
```

### Register Error - Username Exists

```json
{
  "message": "Username already exists",
  "status": 409
}
```

### Login Success

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Login Error - Not Approved

```json
{
  "message": "User not approved",
  "status": 403
}
```

### Login Error - User Not Found

```json
{
  "message": "User not found",
  "status": 404
}
```

## Code Implementation - Backend

### Tambahkan endpoint untuk admin approval:

```javascript
// backend/routes/userRoutes.js
router.patch("/approve/:id", authMiddleware, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role_name !== "System Administrator") {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const { id } = req.params;
    const { status, reason } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    await db
      .promise()
      .query("UPDATE users SET status = ?, updated_at = NOW() WHERE id = ?", [
        status,
        id,
      ]);

    res.json({ message: `User ${status} successfully` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## Keamanan (Security)

1. **Password Hashing** - Bcrypt 10 rounds
2. **JWT Secret** - Simpan di .env (jangan commit!)
3. **Status Validation** - Check di backend (client-side bisa dimanipulasi)
4. **Token Expiry** - 1 hari (configurable)
5. **Request Validation** - Validasi semua input

## Testing Checklist

- [ ] User dapat register
- [ ] Status user baru = "pending"
- [ ] User pending tidak bisa login
- [ ] Admin dapat approve user
- [ ] Setelah approve, user bisa login
- [ ] Login generate valid JWT token
- [ ] Admin dapat reject user
- [ ] User rejected tidak bisa login
- [ ] Token auto-refresh (optional)
- [ ] Logout menghapus token

## Troubleshooting

### "User not approved" saat login

- Pastikan admin sudah approve user
- Check status user di database: `SELECT status FROM users WHERE username = '...'`

### User pending bisa login

- Frontend tidak cek status (cek server response)
- Backend tidak cek status di login function

### Token tidak tersimpan

- Check localStorage: `localStorage.getItem('token')`
- Check browser console untuk error

### Login gagal random

- Check JWT_SECRET di .env match antara backend dan frontend decode
- Token sudah expired? Check token expiry: `jwt_decode(token)`

---

**Versi Dokumen:** 1.0  
**Terakhir Diupdate:** 3 Mei 2026  
**Status:** Ready for Implementation
