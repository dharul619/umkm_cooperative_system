import { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { Visibility, VisibilityOff, LoginRounded } from "@mui/icons-material";

const LoginForm = ({ onSubmit, loading = false, error = "", success = "" }) => {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData.username, formData.password);
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
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
                onClick={() => setShowPassword(!showPassword)}
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
          backgroundColor: "#E85D75",
          padding: '10px',
          fontSize: '16px',
          fontWeight: 'bold',
          '&:hover': {
            backgroundColor: '#C93F58',
          },
        }}
        startIcon={loading ? <CircularProgress size={20} /> : <LoginRounded />}
      >
        {loading ? "Sedang masuk..." : "Masuk"}
      </Button>
    </Box>
  );
};

export default LoginForm;
