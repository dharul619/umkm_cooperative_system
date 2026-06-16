import { BrowserRouter as Router } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { AuthProvider } from "./app/providers/AuthProvider";
import AppRoutes from "./app/router/AppRoutes";

const theme = createTheme({
  palette: {
    primary: {
      main: "#E85D75",
      light: "#FFF1F3",
      dark: "#C93F58",
    },
    secondary: {
      main: "#7A2E3A",
      light: "#FFE4E8",
      dark: "#5C1F29",
    },
    background: {
      default: "#FFF8F9",
      paper: "#FFFFFF",
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

function App() {
  return (
    <Router>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;
