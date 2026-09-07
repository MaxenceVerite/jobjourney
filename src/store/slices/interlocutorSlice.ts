
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

import * as interlocutorService from '../../services/interlocutorService';
import Interlocutor from '../../models/opportunities/Interlocutor';


interface InterlocutorState {
    interlocutors: Interlocutor[],
    isLoading: boolean,
    error?: string 
}

const initialState: InterlocutorState = {
    interlocutors: [],
    isLoading: false
}

export const getInterlocutors = createAsyncThunk(
    'interlocutor/getInterlocutors',
    async (_, { rejectWithValue }) => {
      try {
        const companies = await interlocutorService.getInterlocutors();
        return companies;
      } catch (error) {
        return rejectWithValue('Erreur lors de la récupération des interlocuteurs de l\'utilisateur');
      }
    }
  );


interface CreateInterlocutorPayload{
    interlocutor: Interlocutor
}

  export const createInterlocutor = createAsyncThunk(
    'interlocutor/createInterlocutor',
    async (payload: CreateInterlocutorPayload, { rejectWithValue }) => {
      try {
        var result = await interlocutorService.createInterlocutor(payload.interlocutor);

        return result;
      } catch (error) {
        return rejectWithValue('Erreur lors de la création de l\'interlocuteur');
      }
    }
  );


interface UpdateInterlocutorPayload {
  interlocutor: Interlocutor;
}

export const updateInterlocutor = createAsyncThunk(
  "interlocutor/updateInterlocutor",
  async (payload: UpdateInterlocutorPayload, { rejectWithValue }) => {
    try {
      var result = await interlocutorService.updateInterlocutor(payload.interlocutor);
      return result;
    } catch (error) {
      return rejectWithValue("Erreur lors de la modification de l'interlocuteur");
    }
  }
);

interface DeleteInterlocutorPayload {
  id: string;
}

export const deleteInterlocutor = createAsyncThunk(
  "interlocutor/deleteInterlocutor",
  async (payload: DeleteInterlocutorPayload, { rejectWithValue }) => {
    try {
      await interlocutorService.deleteInterlocutor({ id: payload.id } as any);
      return payload.id;
    } catch (error) {
      return rejectWithValue("Erreur lors de la suppression de l'interlocuteur");
    }
  }
);

const interlocutorSlice = createSlice({
  name: 'interlocutors',
  initialState,
  reducers: {
  },
  extraReducers: (builder) => {
    builder
    .addCase(
        getInterlocutors.fulfilled, 
        (state, action: PayloadAction<Interlocutor[]>) => {
            state.interlocutors = action.payload;
            state.isLoading = false;
        }
    )
    .addCase(
        getInterlocutors.pending, 
        (state) => {
            state.isLoading = true;
        }
    )
    .addCase(
        getInterlocutors.rejected,
        (state, action: PayloadAction<any>) => {
            state.isLoading = false;
            state.error = action.payload
        }
    )
    .addCase(
        createInterlocutor.fulfilled, 
        (state, action: PayloadAction<Interlocutor>) => {
            state.interlocutors.push(action.payload);
            state.isLoading = false;
        }
    )
    .addCase(
        createInterlocutor.pending, 
        (state) => {
            state.isLoading = true;
        }
    )
    .addCase(
        createInterlocutor.rejected,
        (state, action: PayloadAction<any>) => {
            state.isLoading = false;
            state.error = action.payload
        }
    )
    .addCase(
        updateInterlocutor.fulfilled,
        (state, action: PayloadAction<Interlocutor>) => {
            state.interlocutors = state.interlocutors.map((i) =>
                i.id === action.payload.id ? action.payload : i
            );
            state.isLoading = false;
        }
    )
    .addCase(
        deleteInterlocutor.fulfilled,
        (state, action: PayloadAction<string>) => {
            state.interlocutors = state.interlocutors.filter((i) => i.id !== action.payload);
            state.isLoading = false;
        }
    );
  },
});

export const { } = interlocutorSlice.actions;
export default interlocutorSlice.reducer;
