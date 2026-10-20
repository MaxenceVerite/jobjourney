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
  Alert,
  CircularProgress,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { register } from "../../store/slices/authSlice";
import { useDispatch, useSelector } from "react-redux";
import { enqueueNotification } from "../../store/slices/notificationSlice";
import { NotificationSeverity } from "../../valueObjects/Notification";
import { RootState } from "../../store/store";

export default function RegisterForm() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dispatch = useDispatch<any>();
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    if (!email.trim() || !password) {
      setFormError("Veuillez renseigner votre email et un mot de passe.");
      return;
    }

    if (password.length < 4) {
      setFormError("Le mot de passe doit contenir au moins 4 caractères.");
      return;
    }

    if (password !== confirmPassword) {
      setFormError("Les mots de passe ne correspondent pas.");
      return;
    }

    setIsSubmitting(true);
    try {
      const resultAction = await dispatch(
        register({ mail: email.trim(), password: password, tel: phone.trim() })
      );

      if (register.fulfilled.match(resultAction)) {
        dispatch(
          enqueueNotification({
            message: "Compte JobJourney créé avec succès ! Connectez-vous.",
            severity: NotificationSeverity.Success,
            duration: 4000,
          })
        );
        navigate("/login");
      } else {
        const errorMsg =
          (resultAction.payload as string) ||
          "Erreur lors de la création du compte. Vérifiez les informations saisies.";
        setFormError(errorMsg);
        dispatch(
          enqueueNotification({
            message: errorMsg,
            severity: NotificationSeverity.Error,
            duration: 5000,
          })
        );
      }
    } catch (err: any) {
      const message = err.message || "Une erreur inattendue est survenue.";
      setFormError(message);
      dispatch(
        enqueueNotification({
          message,
          severity: NotificationSeverity.Error,
        })
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box height="100%" sx={{ p: "10%", maxWidth: "50vw", borderRadius: 2 }}>
      <Typography component="h1" variant="h5" mb={3} textAlign="center">
        Créer un compte JobJourney
      </Typography>
      <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
        <Stack spacing={2}>
          {formError && (
            <Alert severity="error" onClose={() => setFormError(null)}>
              {formError}
            </Alert>
          )}
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
            autoComplete="tel"
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
            autoComplete="new-password"
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
            autoComplete="new-password"
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
            disabled={isSubmitting}
            sx={{ mb: 2, minHeight: 42 }}
          >
            {isSubmitting ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Créer un compte"
            )}
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
