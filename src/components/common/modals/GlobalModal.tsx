// GlobalModal.js
import React, { useEffect } from "react";
import { useModal } from "../../../contexts/ModalContext";
import { Dialog, DialogContent, DialogTitle, IconButton } from "@mui/material";
import { Close } from "@mui/icons-material";

const CustomModal = ({ title, isOpen, onClose, children }) => {
  return (
    <Dialog
      fullWidth
      maxWidth="md"
      open={isOpen}
      onClose={onClose}
    componentsProps={{
        backdrop: {
          sx: {
            backgroundColor: 'rgba(255, 255, 255, 0.2)', 
            backdropFilter: 'blur(4px)', 
          }
        }
      }}
    >
      <DialogTitle
        sx={{
          backgroundColor: "secondary.main",
          color: "white",
          m: 0,
          p: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {title}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: "absolute",
            right: 10,
            top: 10,
            color: "white",
          }}
        >
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{p: 2}} dividers>{children}</DialogContent>
    </Dialog>
  );
};

const GlobalModal = () => {
  const { modalOpen, modalContent, modalTitle, closeModal } = useModal();

  return (
    <CustomModal title={modalTitle} isOpen={modalOpen} onClose={closeModal}>
      {modalContent}
    </CustomModal>
  );
};

export default GlobalModal;
