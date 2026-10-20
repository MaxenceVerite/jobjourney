

import { 
  register as registerApi,
  login as loginApi,
  refresh as refreshTokenApi,
  checkSession as checkSessionApi

} from "../api/myJobBoard/authentication/authenticationApi"
import Token from '../models/authentication/Token';

interface LoginData {
  mail: string;
  password: string;
}

interface RegisterData {
  mail: string;
  password: string;
  tel: string;
}

const login = async (data: LoginData): Promise<void> => {
  try {
    const response = await loginApi(data.mail, data.password);

    return response;
  } catch (error) {
    throw error;
  }
};



const logout = async () => {
  localStorage.removeItem('user'); 
};

const register = async (registerData: RegisterData): Promise<void> => {
    return await registerApi(registerData.mail, registerData.password, registerData.tel);
}

const checkSession = async (): Promise<void> => {
  return await checkSessionApi();
}


export default {
  login,
  logout,
  register,
  checkSession
};
