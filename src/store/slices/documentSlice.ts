import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Document, DocumentType } from '../../models/document';
import * as documentService from '../../services/documentService';

interface DocumentState {
  documents: Document[];
  isLoading: boolean;
  error: string | null;
}

const initialState: DocumentState = {
  documents: [],
  isLoading: false,
  error: null,
};

export const fetchDocuments = createAsyncThunk(
  'documents/fetchDocuments',
  async (_, { rejectWithValue }) => {
    try {
      const documents = await documentService.getAllDocuments();
      return documents;
    } catch (error) {
      return rejectWithValue('Erreur lors de la récupération des documents');
    }
  }
);

export const getDocumentsByIds = createAsyncThunk(
  'documents/getDocumentsByIds',
  async (_, { rejectWithValue }) => {
    try {
      const documents = await documentService.getAllDocuments();
      return documents;
    } catch (error) {
      return rejectWithValue('Erreur lors de la récupération des documents par IDs');
    }
  }
);

export const uploadDocument = createAsyncThunk(
  'documents/uploadDocument',
  async (payload: { type: DocumentType; file: File; customName?: string }, thunkAPI) => {
    try {
      const document = await documentService.uploadDocument(payload.file, payload.type, payload.customName);
      return document;
    } catch (error) {
      return thunkAPI.rejectWithValue('Erreur lors du téléversement du document');
    }
  }
);

export const downloadDocument = createAsyncThunk(
  'documents/downloadDocument',
  async (documentId: string, { rejectWithValue }) => {
    try {
      const blob = await documentService.downloadDocument(documentId);
      return blob;
    } catch (error) {
      return rejectWithValue('Erreur lors du téléchargement du document');
    }
  }
);

export const deleteDocument = createAsyncThunk(
  'documents/deleteDocument',
  async (documentId: string, { rejectWithValue }) => {
    try {
     return await documentService.deleteDocument(documentId);
    } catch (error) {
      return rejectWithValue('Erreur lors de la suppression du document');
    }
  }
);

export const updateDocument = createAsyncThunk(
  'documents/updateDocument',
  async (document: Document, { rejectWithValue }) => {
    try {
     return await documentService.updateDocument(document);
    } catch (error) {
      return rejectWithValue('Erreur lors de la mise à jour du document');
    }
  }
);

const documentSlice = createSlice({
  name: 'documents',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDocuments.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchDocuments.fulfilled, (state, action: PayloadAction<Document[]>) => {
        state.isLoading = false;
        state.documents = action.payload ?? [];
        state.error = null;
      })
      .addCase(fetchDocuments.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(getDocumentsByIds.fulfilled, (state, action: PayloadAction<Document[]>) => {
        state.isLoading = false;
        state.documents = action.payload
        state.error = null;
      })
      .addCase(deleteDocument.fulfilled, (state, action: PayloadAction<string>) => {

        state.documents = state.documents.filter(doc => doc.id !== action.payload);
      })
      .addCase(uploadDocument.fulfilled, (state, action: PayloadAction<Document>) => {
        state.documents.push(action.payload);
      })
      .addCase(updateDocument.fulfilled, (state, action: PayloadAction<Document>) => {
        state.documents = state.documents.map(doc => doc.id === action.payload.id? action.payload : doc);
      })
      .addCase(updateDocument.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
    }
});

export default documentSlice.reducer;
