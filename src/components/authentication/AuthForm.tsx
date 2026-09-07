// src/components/AuthForm.tsx
import React, { useState, useEffect, FormEvent } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Link,
  Grid,
  FormControlLabel,
  Checkbox,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { VisibilityOff, Visibility } from "@mui/icons-material";
import PersonIcon from "@mui/icons-material/Person";
import { useLocation, useNavigate } from "react-router-dom";
import { login, AuthState } from "../../store/slices/authSlice";
import { useDispatch, useSelector } from "react-redux";
import { enqueueNotification } from "../../store/slices/notificationSlice";
import { NotificationSeverity } from "../../valueObjects/Notification";
import LogoLong from "../common/LogoLong";

const AuthForm = () => {
  const [credentials, setCredentials] = useState({
    mail: "",
    password: "",
  });
  const dispatch = useDispatch<any>();
  const authState = useSelector((state: { auth: AuthState }) => state.auth);
  const [showAlert, setShowAlert] = useState(false);
  const [showPassword, setShowPassword] = React.useState(false);

  const handleClickShowPassword = () => setShowPassword((show) => !show);

  const handleMouseDownPassword = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
  };

  const navigate = useNavigate();
  const location = useLocation();
  const from = typeof location.state?.from === 'string' ? location.state.from : (location.state?.from?.pathname || "/dashboard");
  const handleLogin = () => {
    dispatch(login(credentials));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleLogin();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials((prevCredentials) => ({
      ...prevCredentials,
      [name]: value,
    }));
  };

  useEffect(() => {
    if (!authState.isLoading && authState.isConnected) {
      dispatch(
        enqueueNotification({
          message: "Connexion réussie",
          severity: NotificationSeverity.Success,
          duration: 2000,
        })
      );
      navigate(from);
    }
  }, [authState.isLoading, authState.isConnected]);

  useEffect(() => {
    if (authState.error) {
      setShowAlert(true);
      const timer = setTimeout(() => {
        setShowAlert(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [authState.error]);

  return (
    <Box height="100%" sx={{ p: "10%", m: "auto", borderRadius: 2 }}>
      <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }} 
      mb={3}
      >
        <LogoLong />
      </Box>
      <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
        <TextField
          margin="normal"
          required
          fullWidth
          id="email"
          placeholder="Email"
          name="mail"
          autoComplete="email"
          variant="standard"
          autoFocus
          onChange={handleInputChange}
          value={credentials.mail}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <PersonIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mb: "3%" }}
        />
        <TextField
          onChange={handleInputChange}
          margin="normal"
          required
          fullWidth
          name="password"
          value={credentials.password}
          placeholder="Mot de passe"
          type={showPassword ? "text" : "password"}
          id="password"
          variant="standard"
          autoComplete="current-password"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={handleClickShowPassword}
                  onMouseDown={handleMouseDownPassword}
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{ mb: "6%" }}
        />
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <FormControlLabel
            control={<Checkbox value="remember" color="secondary" />}
            label="Rester connecté"
          />
          <Link
            href="#"
            variant="body1"
            color="secondary"
            sx={{ display: "flex", alignItems: "center" }}
          >
            Mot de passe oublié?
          </Link>
        </Box>
        <Button
          type="submit"
          fullWidth
          color="success"
          variant="contained"
          sx={{ mt: 3, mb: 2 }}
        >
          Connexion
        </Button>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span>
            Pas encore inscrit?{" "}
            <Link
              component="button"
              type="button"
              variant="body2"
              color="secondary"
              onClick={(e) => {
                e.preventDefault();
                navigate("/register");
              }}
            >
              Créer un compte
            </Link>{" "}
          </span>
        </Box>
        <Button
            fullWidth
            variant="outlined"
            color="primary"
            sx={{ mt: 2 }}
          >
            Connexion avec Linkedin
          </Button>
          <Button
            fullWidth
            variant="outlined"
            color="secondary"
            sx={{ mt: 2 }}
          >
            Connexion avec Google
          </Button>
        {authState.isLoading && <CircularProgress size={24} sx={{ mt: 3 }} />}
        {showAlert && (
          <Alert severity="error" sx={{ mt: 3 }}>
            {authState.error}
          </Alert>
        )}
      </Box>
    </Box>
  );
};

export default AuthForm;
