
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

import * as companyService from '../../services/companyService';
import Company from '../../models/opportunities/Company';


interface CompanyState {
    companies: Company[],
    isLoading: boolean,
    error?: string 
}

const initialState: CompanyState = {
    companies: [],
    isLoading: false
}

export const getCompanies = createAsyncThunk(
    'company/getCompanies',
    async (_, { rejectWithValue }) => {
      try {
        const companies = await companyService.getCompanies();
        return companies;
      } catch (error) {
        return rejectWithValue('Erreur lors de la récupération des entreprises de l\'utilisateur');
      }
    }
  );


interface CreateCompanyPayload {
  company: Company;
}

export const createCompany = createAsyncThunk(
  "company/createCompany",
  async (payload: CreateCompanyPayload, { rejectWithValue }) => {
    try {
      var result = await companyService.createCompany(payload.company);
      return result;
    } catch (error) {
      return rejectWithValue("Erreur lors de la création de l'entreprise");
    }
  }
);

interface UpdateCompanyPayload {
  company: Company;
}

export const updateCompany = createAsyncThunk(
  "company/updateCompany",
  async (payload: UpdateCompanyPayload, { rejectWithValue }) => {
    try {
      var result = await companyService.updateCompany(payload.company);
      return result;
    } catch (error) {
      return rejectWithValue("Erreur lors de la modification de l'entreprise");
    }
  }
);

interface DeleteCompanyPayload {
  id: string;
}

export const deleteCompany = createAsyncThunk(
  "company/deleteCompany",
  async (payload: DeleteCompanyPayload, { rejectWithValue }) => {
    try {
      await companyService.deleteCompany(payload.id);
      return payload.id;
    } catch (error) {
      return rejectWithValue("Erreur lors de la suppression de l'entreprise");
    }
  }
);


const companySlice = createSlice({
  name: 'companies',
  initialState,
  reducers: {
  },
  extraReducers: (builder) => {
    builder
    .addCase(
        getCompanies.fulfilled, 
        (state, action: PayloadAction<Company[]>) => {
            state.companies = action.payload;
            state.isLoading = false;
        }
    )
    .addCase(
        getCompanies.pending, 
        (state) => {
            state.isLoading = true;
        }
    )
    .addCase(
        getCompanies.rejected,
        (state, action: PayloadAction<any>) => {
            state.isLoading = false;
            state.error = action.payload
        }
    )
    .addCase(
        createCompany.fulfilled, 
        (state, action: PayloadAction<Company>) => {
            state.companies.push(action.payload);
            state.isLoading = false;
        }
    )
    .addCase(
        createCompany.pending, 
        (state) => {
            state.isLoading = true;
        }
    )
    .addCase(
        createCompany.rejected,
        (state, action: PayloadAction<any>) => {
            state.isLoading = false;
            state.error = action.payload
        }
    )
    .addCase(
        updateCompany.fulfilled,
        (state, action: PayloadAction<Company>) => {
            state.companies = state.companies.map((c) =>
                c.id === action.payload.id ? action.payload : c
            );
            state.isLoading = false;
        }
    )
    .addCase(
        deleteCompany.fulfilled,
        (state, action: PayloadAction<string>) => {
            state.companies = state.companies.filter((c) => c.id !== action.payload);
            state.isLoading = false;
        }
    );
  },
});

export const { } = companySlice.actions;
export default companySlice.reducer;
