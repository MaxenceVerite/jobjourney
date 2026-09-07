import React, { useEffect, useState, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Grid, Box } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchDocuments, uploadDocument } from "../../store/slices/documentSlice";
import { RootState, AppDispatch } from "../../store/store";
import { Document, DocumentType } from "../../models/document";
import DocumentCardList from "../../components/documents/DocumentCardList";
import DocumentCardSkeleton from "../../components/common/skeletons/DocumentCardSkeleton";
import DocumentForm from "../../components/documents/forms/DocumentForm";
import { useModal } from "../../contexts/ModalContext";

const LAST_DOCUMENT_DISPLAYED_ITEM_NUMBER = 3;

const DocumentPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();
  const { openModal, closeModal } = useModal();
  const fileUploadInputRef = useRef<HTMLInputElement | null>(null);

  const { documents, isLoading } = useSelector(
    (state: RootState) => state.documents
  );

  const cvs = useMemo(
    () => documents.filter((doc) => doc.type === DocumentType.CV),
    [documents]
  );
  const motivationLetters = useMemo(
    () =>
      documents.filter((doc) => doc.type === DocumentType.MOTIVATION_LETTER),
    [documents]
  );
  const [lastDocuments, setLastDocuments] = useState<Document[]>([]);

  useEffect(() => {
    dispatch(fetchDocuments());
  }, [dispatch]);

  useEffect(() => {
    const combinedDocuments = [...cvs, ...motivationLetters].sort((a, b) => {
      return (
        new Date(b.uploadedDate).getTime() - new Date(a.uploadedDate).getTime()
      );
    });
    setLastDocuments(
      combinedDocuments.slice(0, LAST_DOCUMENT_DISPLAYED_ITEM_NUMBER)
    );
  }, [cvs, motivationLetters]);

  const navigate = useNavigate();
  const openedDocRef = useRef<string | null>(null);
  const hasTriggeredUploadRef = useRef<boolean>(false);

  // Handle deep action: open document modal if openDocId is passed in state
  useEffect(() => {
    const targetId = location.state?.openDocId;
    if (targetId && documents.length > 0 && openedDocRef.current !== targetId) {
      const targetDoc = documents.find((d) => d.id === targetId);
      if (targetDoc) {
        openedDocRef.current = targetId;
        openModal(
          "Modifier le document",
          <DocumentForm document={targetDoc} onSubmit={closeModal} />
        );
        navigate(location.pathname, { replace: true, state: {} });
      }
    }
  }, [location.state?.openDocId, documents, openModal, closeModal, navigate, location.pathname]);

  // Handle deep action: trigger upload dialog if uploadType is passed
  useEffect(() => {
    if (location.state?.uploadType && !hasTriggeredUploadRef.current) {
      hasTriggeredUploadRef.current = true;
      if (fileUploadInputRef.current) {
        fileUploadInputRef.current.click();
      }
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state?.uploadType, navigate, location.pathname]);

  const handleHiddenFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const type = (location.state?.uploadType as DocumentType) || DocumentType.CV;
      dispatch(uploadDocument({ file, type }));
    }
  };

  if (isLoading && documents.length === 0) {
    return (
      <Box sx={{ width: "100%", mt: 1 }}>
        <DocumentCardSkeleton count={4} />
      </Box>
    );
  }

  return (
    <Grid container xs={12} spacing={2}>
      <input
        type="file"
        ref={fileUploadInputRef}
        onChange={handleHiddenFileInputChange}
        style={{ display: "none" }}
        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
      />
      <DocumentCardList
        title="Mes derniers documents"
        documents={lastDocuments}
        isExpanded={false}
      />
      <DocumentCardList
        title="Mes CV"
        documentType={DocumentType.CV}
        documents={cvs}
        isExpanded
      />
      <DocumentCardList
        title="Mes lettres de motivations"
        documentType={DocumentType.MOTIVATION_LETTER}
        documents={motivationLetters}
        isExpanded
      />
    </Grid>
  );
};

export default DocumentPage;
