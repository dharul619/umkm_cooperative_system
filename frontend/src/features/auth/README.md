# Auth Module Documentation

## Overview

Modul auth menyediakan sistem login dan registrasi lengkap dengan approval dari administrator. Sistem ini menggunakan Material UI untuk tampilan yang menarik dan JWT untuk autentikasi.

## Fitur

### 1. Registrasi (Register)

- User dapat mendaftar dengan informasi:
  - Nama lengkap
  - Username
  - Password (minimal 6 karakter)
  - Divisi (dropdown)
  - Departemen (dropdown berdasarkan divisi yang dipilih)

- Alur registrasi:
  1. User mengisi form registrasi (2 step)
  2. Backend membuat user dengan status `pending`
  3. Admin akan melihat user pending di dashboard admin
  4. Admin melakukan approval
  5. Status user berubah menjadi `approved`

### 2. Login

- User hanya bisa login jika status mereka adalah `approved`
- Login memerlukan:
  - Username
  - Password
- Backend akan return JWT token jika login sukses
- Token disimpan di localStorage

### 3. Token Management

- JWT token tersimpan di localStorage
- Token otomatis dikirim di setiap request (Authorization header)
- Jika token expired (401), user akan di-redirect ke login page

## Struktur File

```
frontend/src/
├── services/
│   ├── api.js                          # API configuration
│   └── axiosInstace.js                 # Axios instance dengan interceptor
├── app/
│   ├── providers/
│   │   └── AuthProvider.jsx            # Auth context provider
│   └── router/
│       ├── AppRoutes.jsx               # Route definitions
│       ├── ProtectedRoute.jsx          # Protected route wrapper
│       └── RoleRoute.jsx               # Role-based route (opsional)
└── features/
    └── auth/
        ├── components/
        │   └── Loginform.jsx           # Reusable login form component
        ├── hooks/
        │   └── useAuth.js              # Custom hook untuk auth
        ├── pages/
        │   ├── LoginPage.jsx           # Login page
        │   └── RegisterPage.jsx        # Register page
        └── services/
            └── authService.js          # Auth API calls
```

## Cara Penggunaan

### 1. Setup di App.jsx

```jsx
import { BrowserRouter as Router } from "react-router-dom";
import { AuthProvider } from "./app/providers/AuthProvider";
import AppRoutes from "./app/router/AppRoutes";

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}
```

### 2. Menggunakan useAuth Hook

```jsx
import { useAuth } from "../hooks/useAuth";

function MyComponent() {
  const { user, isLoggedIn, login, logout } = useAuth();

  if (!isLoggedIn) {
    return <div>Please login</div>;
  }

  return <div>Welcome, {user.id}</div>;
}
```

### 3. Protected Routes

```jsx
import ProtectedRoute from "./ProtectedRoute";

<Routes>
  <Route path="/login" element={<LoginPage />} />
  <Route
    path="/dashboard"
    element={
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    }
  />
</Routes>;
```

## API Endpoints

### Register

- **URL:** `POST /api/auth/register`
- **Body:**

```json
{
  "name": "string",
  "username": "string",
  "password": "string",
  "division_id": "number",
  "department_id": "number"
}
```

- **Response:**

```json
{
  "message": "Register success, waiting for admin approval"
}
```

### Login

- **URL:** `POST /api/auth/login`
- **Body:**

```json
{
  "username": "string",
  "password": "string"
}
```

- **Response:**

```json
{
  "token": "jwt_token_here"
}
```

### Get Divisions

- **URL:** `GET /api/divisions`
- **Response:**

```json
[
  { "id": 1, "name": "Division 1" },
  { "id": 2, "name": "Division 2" }
]
```

### Get Departments by Division

- **URL:** `GET /api/departments?division_id=1`
- **Response:**

```json
[
  { "id": 1, "name": "Department 1", "division_id": 1 },
  { "id": 2, "name": "Department 2", "division_id": 1 }
]
```

## Backend Setup (Node.js/Express)

### Environment Variables (.env)

```
PORT=3000
JWT_SECRET=your_secret_key_here
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=cooperative_system_db
```

### Running Backend

```bash
# Install dependencies
npm install

# Run server
node app.js
```

## Frontend Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Create .env file

```
VITE_API_URL=http://localhost:3000/api
```

### 3. Run Development Server

```bash
npm run dev
```

## Database Schema

### Users Table

```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100),
  username VARCHAR(50) UNIQUE,
  password VARCHAR(255),
  role_id INT,
  division_id INT,
  department_id INT,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL
);
```

## Alur Login/Register dengan Admin Approval

### Flow Registrasi

```
User Register → Backend Create User (status: pending)
→ Success Message → Admin Review → Admin Approve
→ Status Changed to approved → User Can Login
```

### Flow Login

```
User Login → Check Status (must be 'approved')
→ Check Password → Generate JWT Token
→ Return Token → Redirect to Dashboard
```

## Material UI Components Used

- `Container` - Layout container
- `Card` - Card container
- `TextField` - Input field
- `Button` - Action button
- `Alert` - Error/Success messages
- `Stepper` - Multi-step form
- `MenuItem` - Dropdown option
- `InputAdornment` - Icon inside input
- `CircularProgress` - Loading indicator
- Icons dari `@mui/icons-material`

## Error Handling

### Login Errors

- Username atau password kosong
- User tidak ditemukan
- Password salah
- User belum di-approve (status pending)
- User rejected

### Register Errors

- Username sudah terdaftar
- Divisi/Departemen tidak valid
- Departemen tidak termasuk dalam divisi yang dipilih
- Password tidak cocok
- Form data tidak lengkap

## Security Features

1. **Password Hashing** - Menggunakan bcrypt
2. **JWT Token** - Token expires dalam 1 hari
3. **Request Interceptor** - Token otomatis dikirim di setiap request
4. **Response Interceptor** - Automatic logout jika 401 error
5. **Protected Routes** - Routes yang require login
6. **Status Validation** - Only approved users dapat login

## Customization

### Mengubah Warna Theme

Edit `App.jsx`:

```jsx
const theme = createTheme({
  palette: {
    primary: {
      main: "#your_color_here",
    },
  },
});
```

### Menambah Field Registrasi

1. Tambah field di `RegisterPage.jsx`
2. Update form validation di `validateStep()`
3. Kirim field ke backend di `handleSubmit()`
4. Update backend model untuk menerima field baru

### Menambah Role-Based Routes

```jsx
// Gunakan RoleRoute.jsx untuk route berdasarkan role
<Route
  path="/admin"
  element={
    <RoleRoute requiredRole="admin">
      <AdminDashboard />
    </RoleRoute>
  }
/>
```

## Troubleshooting

### "Module not found" Error

```bash
npm install react-router-dom axios
```

### CORS Error

Pastikan backend CORS sudah di-enable:

```js
app.use(cors());
```

### Token Undefined

Pastikan axios interceptor berjalan dengan baik. Check localStorage di browser console:

```js
localStorage.getItem("token");
```

### Login Gagal

1. Check username/password di database
2. Pastikan status user adalah 'approved'
3. Check backend JWT_SECRET di .env
4. Check network request di browser DevTools

## Next Steps

1. Buat Admin Panel untuk approval users
2. Tambah email verification untuk registrasi
3. Implementasi forgot password
4. Tambah two-factor authentication
5. User profile management
6. Role-based access control

## Support

Untuk bantuan, hubungi admin sistem.
