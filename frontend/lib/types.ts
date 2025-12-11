export type RegisterPayload = {
  email: string;
  username: string;
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
  accessToken?: string;
  refreshToken?: string;
  expiresIn?: number;
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

export type Wallet = {
  id: string;
  user_id: string;
  type: string;
  name: string;
  balance: string;
};

export type Category = {
  id: string;
  user_id: string;
  name: string;
  kind: string;
};

export type Transaction = {
  id: string;
  user_id: string;
  wallet_id: string;
  category_id?: string | null;
  amount: string;
  kind: string;
  note?: string | null;
  occurred_at: string;
  created_at: string;
};

export type CreateTransactionPayload = {
  userId: string;
  wallet_id: string;
  category_id?: string | null;
  amount: string;
  kind: 'in' | 'out';
  note?: string | null;
  occurred_at?: string | null;
};
