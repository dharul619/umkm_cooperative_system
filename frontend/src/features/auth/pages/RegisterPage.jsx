import { useEffect, useState } from "react";
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
  MenuItem,
  Divider,
  Stepper,
  Step,
  StepLabel,
} from "@mui/material";
import {
  AppRegistrationRounded,
  StorageRounded,
  CheckCircleRounded,
} from "@mui/icons-material";
import { useAuth } from "../hooks/useAuth";
import { authService } from "../services/authService";

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [divisions, setDivisions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loadingDivisions, setLoadingDivisions] = useState(true);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    phone_number: "",
    username: "",
    password: "",
    confirmPassword: "",
    division_id: "",
    department_id: "",
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    const fetchDivisions = async () => {
      try {
        setLoadingDivisions(true);
        const data = await authService.getDivisions();
        setDivisions(data);
      } catch (err) {
        setError("Gagal mengambil data divisi");
      } finally {
        setLoadingDivisions(false);
      }
    };

    fetchDivisions();
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (formData.division_id) {
      const fetchDepartments = async () => {
        try {
          setLoadingDepartments(true);
          const data = await authService.getDepartmentsByDivision(
            formData.division_id,
          );
          if (cancelled) return;

          const filteredDepts = data.filter(
            (dept) => Number(dept.division_id) === Number(formData.division_id),
          );
          setDepartments(filteredDepts);
          setFormErrors((prev) => ({
            ...prev,
            department_id: "",
          }));
        } catch (err) {
          if (cancelled) return;
          setError("Gagal mengambil data departemen");
          setDepartments([]);
        } finally {
          if (!cancelled) {
            setLoadingDepartments(false);
          }
        }
      };

      fetchDepartments();
    } else {
      setDepartments([]);
      setLoadingDepartments(false);
    }

    return () => {
      cancelled = true;
    };
  }, [formData.division_id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "division_id" ? { department_id: "" } : {}),
    }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateStep = (step) => {
    const errors = {};

    if (step === 0) {
      if (!formData.name.trim()) errors.name = "Nama harus diisi";
      if (!formData.phone_number.trim()) errors.phone_number = "Nomor HP harus diisi";
      if (!formData.username.trim()) errors.username = "Username harus diisi";
      if (formData.username.trim().length < 3)
        errors.username = "Username minimal 3 karakter";
      if (!formData.password) errors.password = "Password harus diisi";
      if (formData.password.length < 6)
        errors.password = "Password minimal 6 karakter";
      if (formData.password !== formData.confirmPassword)
        errors.confirmPassword = "Password tidak cocok";
    } else if (step === 1) {
      if (!formData.division_id) errors.division_id = "Divisi harus dipilih";
      if (!formData.department_id)
        errors.department_id = "Departemen harus dipilih";
      if (formData.division_id && formData.department_id) {
        const selectedDept = departments.find(
          (dept) => Number(dept.id) === Number(formData.department_id),
        );
        if (
          !selectedDept ||
          Number(selectedDept.division_id) !== Number(formData.division_id)
        ) {
          errors.department_id =
            "Departemen tidak sesuai dengan divisi yang dipilih";
        }
      }
    }

    return errors;
  };

  const handleNext = () => {
    const errors = validateStep(activeStep);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
    setError("");
  };

  const handleSubmit = async () => {
    const errors = validateStep(activeStep);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const selectedDept = departments.find(
      (dept) => Number(dept.id) === Number(formData.department_id),
    );
    if (
      !selectedDept ||
      Number(selectedDept.division_id) !== Number(formData.division_id)
    ) {
      setError(
        "Departemen yang dipilih tidak valid untuk divisi ini. Silakan pilih kembali.",
      );
      setActiveStep(1);
      return;
    }

    setError("");
    setLoading(true);

    try {
      const registrationData = {
        name: formData.name,
        phone_number: formData.phone_number,
        username: formData.username,
        password: formData.password,
        division_id: parseInt(formData.division_id),
        department_id: parseInt(formData.department_id),
      };

      await register(registrationData);
      setSuccess(true);
      setActiveStep(2);
    } catch (err) {
      setError(err.message || "Pendaftaran gagal. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const steps = ["Informasi Personal", "Organisasi", "Konfirmasi"];

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
            {!success ? (
              <>
                <Typography
                  variant="h5"
                  fontWeight="bold"
                  sx={{ marginBottom: 1, color: "#7A2E3A" }}
                >
                  Daftar Akun Baru
                </Typography>
                <Typography
                  variant="body2"
                  color="textSecondary"
                  sx={{ marginBottom: 3, color: "#777" }}
                >
                  Isi formulir untuk membuat akun Anda
                </Typography>

                <Stepper
                  activeStep={activeStep}
                  sx={{
                    marginBottom: 3,
                    "& .MuiStepLabel-label.Mui-active": {
                      color: "#E85D75",
                      fontWeight: "bold",
                    },
                    "& .MuiStepIcon-root.Mui-active": {
                      color: "#E85D75",
                    },
                    "& .MuiStepIcon-root.Mui-completed": {
                      color: "#D84A63",
                    },
                  }}
                  alternativeLabel
                >
                  {steps.map((label) => (
                    <Step key={label}>
                      <StepLabel>{label}</StepLabel>
                    </Step>
                  ))}
                </Stepper>

                {error && (
                  <Alert severity="error" sx={{ marginBottom: 2 }}>
                    {error}
                  </Alert>
                )}

                {activeStep === 0 && (
                  <Box>
                    <TextField
                      fullWidth
                      label="Nama Lengkap"
                      name="name"
                      placeholder="Masukkan nama lengkap Anda"
                      variant="outlined"
                      value={formData.name}
                      onChange={handleChange}
                      disabled={loading}
                      error={!!formErrors.name}
                      helperText={formErrors.name}
                      sx={{ marginBottom: 2 }}
                    />

                    <TextField
                      fullWidth
                      label="Nomor HP"
                      name="phone_number"
                      placeholder="Masukkan nomor HP Anda"
                      variant="outlined"
                      value={formData.phone_number}
                      onChange={handleChange}
                      disabled={loading}
                      error={!!formErrors.phone_number}
                      helperText={formErrors.phone_number}
                      sx={{ marginBottom: 2 }}
                    />

                    <TextField
                      fullWidth
                      label="Username"
                      name="username"
                      placeholder="Masukkan username Anda"
                      variant="outlined"
                      value={formData.username}
                      onChange={handleChange}
                      disabled={loading}
                      error={!!formErrors.username}
                      helperText={formErrors.username}
                      sx={{ marginBottom: 2 }}
                    />

                    <TextField
                      fullWidth
                      label="Password"
                      name="password"
                      type="password"
                      placeholder="Minimal 6 karakter"
                      variant="outlined"
                      value={formData.password}
                      onChange={handleChange}
                      disabled={loading}
                      error={!!formErrors.password}
                      helperText={formErrors.password}
                      sx={{ marginBottom: 2 }}
                    />

                    <TextField
                      fullWidth
                      label="Konfirmasi Password"
                      name="confirmPassword"
                      type="password"
                      placeholder="Ulangi password Anda"
                      variant="outlined"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      disabled={loading}
                      error={!!formErrors.confirmPassword}
                      helperText={formErrors.confirmPassword}
                      sx={{}}
                    />
                  </Box>
                )}

                {activeStep === 1 && (
                  <Box>
                    <TextField
                      fullWidth
                      select
                      label="Divisi"
                      name="division_id"
                      value={formData.division_id}
                      onChange={handleChange}
                      disabled={loading || loadingDivisions}
                      error={!!formErrors.division_id}
                      helperText={formErrors.division_id}
                      sx={{ marginBottom: 2 }}
                    >
                      <MenuItem value="">
                        <em>Pilih Divisi</em>
                      </MenuItem>
                      {divisions.map((division) => (
                        <MenuItem key={division.id} value={division.id}>
                          {division.name}
                        </MenuItem>
                      ))}
                    </TextField>

                    <TextField
                      fullWidth
                      select
                      label="Departemen"
                      name="department_id"
                      value={formData.department_id}
                      onChange={handleChange}
                      disabled={
                        loading ||
                        loadingDepartments ||
                        !formData.division_id ||
                        departments.length === 0
                      }
                      error={!!formErrors.department_id}
                      helperText={
                        formErrors.department_id ||
                        (loadingDepartments
                          ? "Memuat departemen..."
                          : formData.division_id && departments.length === 0
                            ? "Tidak ada departemen untuk divisi ini"
                            : "")
                      }
                      sx={{}}
                    >
                      <MenuItem value="">
                        <em>Pilih Departemen</em>
                      </MenuItem>
                      {departments.map((dept) => (
                        <MenuItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Box>
                )}

                <Box
                  sx={{
                    display: "flex",
                    gap: 2,
                    marginTop: 3,
                  }}
                >
                  <Button
                    onClick={handleBack}
                    disabled={activeStep === 0 || loading}
                    sx={{
                      flex: 1,
                      color: "#C93F58",
                      borderColor: "#F9D5DC",
                      border: "2px solid",
                      "&:hover": {
                        backgroundColor: "#FFF1F3",
                      },
                    }}
                  >
                    Kembali
                  </Button>
                  {activeStep < steps.length - 1 ? (
                    <Button
                      onClick={handleNext}
                      variant="contained"
                      disabled={loading || loadingDepartments}
                      sx={{
                        flex: 1,
                        backgroundColor: "#E85D75",
                        "&:hover": {
                          backgroundColor: "#C93F58",
                        },
                      }}
                    >
                      Lanjut
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmit}
                      variant="contained"
                      disabled={loading}
                      sx={{
                        flex: 1,
                        background:
                          "linear-gradient(135deg, #F27B8D 0%, #E85D75 100%)",
                        "&:hover": {
                          background:
                            "linear-gradient(135deg, #E85D75 0%, #C93F58 100%)",
                        },
                      }}
                      startIcon={
                        loading ? (
                          <CircularProgress size={20} />
                        ) : (
                          <AppRegistrationRounded />
                        )
                      }
                    >
                      {loading ? "Mendaftar..." : "Daftar"}
                    </Button>
                  )}
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ textAlign: "center" }}>
                  <Typography variant="body2" color="textSecondary">
                    Sudah memiliki akun?{" "}
                    <Link
                      to="/login"
                      style={{
                        color: "#C93F58",
                        textDecoration: "none",
                        fontWeight: "bold",
                      }}
                    >
                      Masuk di sini
                    </Link>
                  </Typography>
                </Box>
              </>
            ) : (
              <Box sx={{ textAlign: "center", py: 3 }}>
                <CheckCircleRounded
                  sx={{
                    fontSize: 60,
                    color: "#E85D75",
                    marginBottom: 2,
                  }}
                />
                <Typography
                  variant="h5"
                  fontWeight="bold"
                  sx={{ marginBottom: 1, color: "#7A2E3A" }}
                >
                  Pendaftaran Berhasil!
                </Typography>
                <Typography
                  variant="body2"
                  color="textSecondary"
                  sx={{ marginBottom: 3, color: "#777" }}
                >
                  Akun Anda telah dibuat dengan status pending. Silakan tunggu
                  approval dari administrator sebelum dapat masuk ke sistem.
                </Typography>
                <Button
                  component={Link}
                  to="/login"
                  fullWidth
                  variant="contained"
                  sx={{
                    background:
                      "linear-gradient(135deg, #F27B8D 0%, #E85D75 100%)",
                    "&:hover": {
                      background:
                        "linear-gradient(135deg, #E85D75 0%, #C93F58 100%)",
                    },
                  }}
                >
                  Kembali ke Login
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default RegisterPage;
