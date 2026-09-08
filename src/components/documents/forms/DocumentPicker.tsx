import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchDocuments, uploadDocument } from "../../../store/slices/documentSlice";
import { RootState } from "../../../store/store";
import {
  Button,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  alpha,
  useTheme,
  CircularProgress
} from "@mui/material";
import { CheckCircleRounded, CloudUploadRounded } from "@mui/icons-material";
import { Document, DocumentType } from "../../../models/document";
import { getIconSvg } from "../../utils/AssetsUtils";
import { useTranslation } from "react-i18next";

interface DocumentPickerProps {
  preselectedDocumentIds?: string[];
  multipleSelection: boolean;
  notifyOnCommit: boolean;
  onSelectionChange: (selectedIds: string[]) => void;
}

const DocumentPicker = ({
  preselectedDocumentIds,
  multipleSelection,
  notifyOnCommit,
  onSelectionChange,
}: DocumentPickerProps) => {
  const dispatch = useDispatch<any>();
  const theme = useTheme();
  const documents = useSelector(
    (state: RootState) => state.documents.documents
  );
  const isLoading = useSelector(
    (state: RootState) => state.documents.isLoading
  );
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>(
    preselectedDocumentIds ?? []
  );
  const [isUploading, setIsUploading] = useState(false);
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    dispatch(fetchDocuments());
  }, [dispatch]);

  const handleToggleCheckbox = (docId: string) => {
    const newSelectedDocumentIds = !multipleSelection
      ? [docId]
      : selectedDocumentIds.includes(docId)
      ? selectedDocumentIds.filter((id) => id !== docId)
      : [...selectedDocumentIds, docId];

    setSelectedDocumentIds(newSelectedDocumentIds);
    if (!notifyOnCommit) onSelectionChange(newSelectedDocumentIds);
  };

  const getDocumentTypeIcon = (type: DocumentType): React.ReactNode => {
    return getIconSvg(type, undefined, "40px");
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading(true);
      // Par défaut, on l'uploade comme CV.
      const resultAction = await dispatch(uploadDocument({ type: DocumentType.CV, file }));
      setIsUploading(false);

      if (uploadDocument.fulfilled.match(resultAction)) {
        const newDoc = resultAction.payload;
        handleToggleCheckbox(newDoc.id);
      }
    }
  };

  return (
    <Box sx={{ width: "100%", mt: 1 }}>
      {/* Zone d'Upload Stylisée */}
      <Box 
        sx={{ 
          border: `2px dashed ${alpha(theme.palette.primary.main, 0.4)}`,
          borderRadius: 3,
          p: 3,
          mb: 3,
          textAlign: "center",
          bgcolor: alpha(theme.palette.primary.main, 0.02),
          transition: "0.2s",
          cursor: "pointer",
          "&:hover": {
            bgcolor: alpha(theme.palette.primary.main, 0.05),
            borderColor: theme.palette.primary.main,
          }
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        {isUploading ? (
          <CircularProgress size={30} />
        ) : (
          <>
            <CloudUploadRounded color="primary" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="body1" fontWeight={600} color="primary.main">
              Uploader un nouveau document
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Formats acceptés : PDF, DOCX
            </Typography>
          </>
        )}
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: "none" }} 
          onChange={handleFileUpload} 
        />
      </Box>

      {/* Grille des Documents */}
      <Grid container spacing={2}>
        {documents.map((doc) => {
          const isSelected = selectedDocumentIds.includes(doc.id);
          return (
            <Grid item xs={12} sm={6} key={doc.id}>
              <Card 
                elevation={0}
                sx={{
                  border: `2px solid ${isSelected ? theme.palette.primary.main : theme.palette.divider}`,
                  borderRadius: 3,
                  position: "relative",
                  transition: "0.2s",
                  bgcolor: isSelected ? alpha(theme.palette.primary.main, 0.05) : "transparent",
                }}
              >
                <CardActionArea 
                  onClick={() => handleToggleCheckbox(doc.id)}
                  sx={{ height: "100%", p: 2 }}
                >
                  {isSelected && (
                    <CheckCircleRounded 
                      color="primary" 
                      sx={{ position: "absolute", top: 8, right: 8, fontSize: 20 }} 
                    />
                  )}
                  <Box display="flex" alignItems="center" gap={2}>
                    <Box 
                      display="flex" 
                      alignItems="center" 
                      justifyContent="center"
                      sx={{ 
                        width: 50, 
                        height: 50, 
                        borderRadius: 2, 
                        bgcolor: alpha(theme.palette.primary.main, 0.1) 
                      }}
                    >
                      {getDocumentTypeIcon(doc.type)}
                    </Box>
                    <Box flex={1} overflow="hidden">
                      <Typography variant="subtitle2" fontWeight={600} noWrap>
                        {doc.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {t(`documentType.${doc.type.toString()}`)}
                      </Typography>
                      <Typography variant="caption" color="text.disabled">
                        {new Date(doc.uploadedDate).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Box>
                </CardActionArea>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {notifyOnCommit && (
        <Box display="flex" justifyContent="center" marginTop={4}>
          <Button
            variant="contained"
            size="large"
            onClick={() => onSelectionChange(selectedDocumentIds)}
            sx={{ fontWeight: 600, borderRadius: 2, px: 4 }}
          >
            Valider la sélection ({selectedDocumentIds.length})
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default DocumentPicker;
