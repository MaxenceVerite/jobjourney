import React, { useState } from "react";
import {
  Button,
  TextField,
  Grid,
  Typography,
  Link,
  Container,
  Checkbox,
  FormControlLabel,
  Paper,
  Box,
  Stack,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { register } from "../../store/slices/authSlice";
import { useDispatch } from "react-redux";
import { unwrapResult } from "@reduxjs/toolkit";
import { enqueueNotification } from "../../store/slices/notificationSlice";
import { NotificationSeverity } from "../../valueObjects/Notification";

export default function RegisterForm() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const dispatch = useDispatch<any>();
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    dispatch(register({ mail: email, password: password, tel: phone }))
      .then(unwrapResult)
      .then(() => {
        enqueueNotification({
          message: "Compte JobJourney crée avec succès",
          severity: NotificationSeverity.Success,
        });
        navigate("/login");
      });
  };

  return (
    <Box height="100%"  sx={{ p: "10%", maxWidth: "50vw", borderRadius: 2 }}>
      <Typography component="h1" variant="h5" mb={3} textAlign="center">
        Créer un compte JobJourney
      </Typography>
      <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
        <Stack spacing={2}>
          <TextField
            variant="standard"
            required
            fullWidth
            id="email"
            placeholder="Adresse Email*"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            variant="standard"
            fullWidth
            id="phone"
            placeholder="Numéro de téléphone (SMS)"
            name="phone"
            autoComplete="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <TextField
            variant="standard"
            required
            fullWidth
            name="password"
            placeholder="Mot de passe*"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <TextField
            variant="standard"
            required
            fullWidth
            name="confirmPassword"
            placeholder="Confirmez le mot de passe*"
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <FormControlLabel
            control={<Checkbox value="allowExtraEmails" color="primary" />}
            label="Je souhaite recevoir des promotions par e-mail."
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="success"
            sx={{ mb: 2 }}
          >
            Créer un compte
          </Button>
          <Box display="flex" justifyContent="center" alignContent="center">
          <span>Déjà un compte? 
          {"  "}
          <Link
            component="button"
            variant="body2"
            color="secondary"
            onClick={() => navigate("/login")}
          >
            Se connecter
          </Link>
          </span>
          </Box>
         
          <Button
            fullWidth
            variant="outlined"
            color="primary"
            sx={{ mt: 2 }}
          >
            Inscription avec LinkedIn
          </Button>
          <Button
            fullWidth
            variant="outlined"
            color="secondary"
            sx={{ mt: 2 }}
          >
            Inscription avec Google
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
