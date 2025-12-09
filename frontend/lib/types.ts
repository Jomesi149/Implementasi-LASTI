export type RegisterPayload = {
  email: string;
  password: string;
  channel: 'email' | 'sms' | 'auth_app';
  phoneNumber?: string;
};

export type RegisterResponse = {
  userId: string;
  message: string;
  otpDebug?: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginResponse = {
  message: string;
  otpDebug?: string;
};

export type VerifyPayload = {
  email: string;
  code: string;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};
