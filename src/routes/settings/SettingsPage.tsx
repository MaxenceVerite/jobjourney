import React, { useEffect, useState } from "react";
import { Box, Typography, Paper, TextField, Switch, FormControlLabel, Button, CircularProgress, Divider } from "@mui/material";
import { UserSettings, getSettings, updateSettings } from "../../api/myJobBoard/features/settings/settingsApi";
import { useDispatch } from "react-redux";
import { enqueueNotification } from "../../store/slices/notificationSlice";

const SettingsPage = () => {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await getSettings();
        setSettings(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked, type } = e.target;
    setSettings((prev) => prev ? {
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    } : null);
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await updateSettings(settings);
      dispatch(enqueueNotification({
        message: "Paramètres sauvegardés avec succès",
        severity: "success",
      }));
    } catch (err) {
      dispatch(enqueueNotification({
        message: "Erreur lors de la sauvegarde",
        severity: "error",
      }));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <CircularProgress />;

  return (
    <Box sx={{ p: 3, maxWidth: 600, mx: "auto" }}>
      <Typography variant="h4" gutterBottom>
        Paramètres
      </Typography>
      <Paper sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Typography variant="h6">Configuration de l'IA</Typography>
        
        <TextField
          label="Clé API Gemini (Google)"
          name="aiApiKey"
          type="password"
          fullWidth
          value={settings?.aiApiKey || ""}
          onChange={handleChange}
          helperText="Si renseignée, l'application utilisera votre propre quota pour les requêtes."
        />

        <Divider sx={{ my: 2 }} />
        <Typography variant="h6">Préférences</Typography>

        <FormControlLabel
          control={
            <Switch
              name="notificationsEnabled"
              checked={settings?.notificationsEnabled ?? true}
              onChange={handleChange}
            />
          }
          label="Activer les notifications intelligentes (Rappels, etc.)"
        />

        <Box mt={2}>
          <Button variant="contained" color="primary" onClick={handleSave} disabled={saving}>
            {saving ? "Sauvegarde..." : "Enregistrer"}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};
export default SettingsPage;
