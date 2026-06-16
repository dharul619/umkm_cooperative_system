import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Container,
  Box,
  TextField,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Divider,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  LoginRounded,
  StorageRounded,
} from "@mui/icons-material";
import { useAuth } from "../hooks/useAuth";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (!formData.username || !formData.password) {
        throw { message: "Username dan password harus diisi" };
      }

      await login(formData.username, formData.password);
      setSuccess("Login berhasil! Mengalihkan...");
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (err) {
      setError(err.message || "Login gagal. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FFFFFF",
        padding: 2,
      }}
    >
      <Container maxWidth="sm">
        <Card
          elevation={2}
          sx={{
            borderRadius: 2,
            overflow: "hidden",
            border: "1px solid #F9D5DC",
            boxShadow: "0 18px 48px rgba(201, 63, 88, 0.14)",
          }}
        >
          <Box
            sx={{
              background:
                "linear-gradient(135deg, #F27B8D 0%, #E85D75 52%, #D84A63 100%)",
              padding: 3,
              textAlign: "center",
              color: "white",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 1,
                marginBottom: 1,
              }}
            >
              <StorageRounded sx={{ fontSize: 32 }} />
              <Typography variant="h4" fontWeight="bold">
                Koperasi 245
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Platform Manajemen Koperasi Terintegrasi
            </Typography>
          </Box>

          <CardContent sx={{ padding: 4 }}>
            <Typography
              variant="h5"
              fontWeight="bold"
              sx={{ marginBottom: 1, color: "#7A2E3A" }}
            >
              Masuk ke Akun Anda
            </Typography>
            <Typography
              variant="body2"
              color="textSecondary"
              sx={{ marginBottom: 3 }}
            >
              Silakan masukkan kredensial login Anda
            </Typography>

            {error && (
              <Alert severity="error" sx={{ marginBottom: 2 }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ marginBottom: 2 }}>
                {success}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Username"
                name="username"
                placeholder="Masukkan username Anda"
                variant="outlined"
                value={formData.username}
                onChange={handleChange}
                disabled={loading}
                sx={{ marginBottom: 2 }}
              />

              <TextField
                fullWidth
                label="Password"
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="Masukkan password Anda"
                variant="outlined"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
                sx={{ marginBottom: 2 }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handleTogglePassword}
                        edge="end"
                        disabled={loading}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                fullWidth
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  marginTop: 2,
                  marginBottom: 2,
                  backgroundColor: "#E85D75",
                  padding: "10px",
                  fontSize: "16px",
                  fontWeight: "bold",
                  "&:hover": {
                    backgroundColor: "#C93F58",
                  },
                }}
                startIcon={
                  loading ? <CircularProgress size={20} /> : <LoginRounded />
                }
              >
                {loading ? "Sedang masuk..." : "Masuk"}
              </Button>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ textAlign: "center" }}>
                <Typography variant="body2" color="textSecondary">
                  Belum memiliki akun?{" "}
                  <Link
                    to="/register"
                    style={{
                      color: "#C93F58",
                      textDecoration: "none",
                      fontWeight: "bold",
                    }}
                  >
                    Daftar di sini
                  </Link>
                </Typography>
              </Box>
            </Box>

            <Alert severity="info" sx={{ marginTop: 3 }}>
              <Typography variant="body2">
                <strong>Note:</strong> Akun baru memerlukan approval dari
                administrator sebelum dapat masuk ke sistem.
              </Typography>
            </Alert>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default LoginPage;
