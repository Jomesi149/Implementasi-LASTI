'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type ChangeEvent } from 'react';

import { AuthShell } from '../../components/AuthShell';
import { InputField } from '../../components/InputField';
import { PrimaryButton } from '../../components/PrimaryButton';
import { accountApi } from '../../lib/api/account';
import type { LoginPayload } from '../../lib/types';
import { loginSchema } from '../../lib/validators';
import { getUserIdFromToken } from '../../lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState<LoginPayload>({ email: '', password: '' });
  const [errors, setErrors] = useState<Partial<Record<keyof LoginPayload, string>>>({});
  const [feedback, setFeedback] = useState<string>('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback('');
    const parsed = loginSchema.safeParse(form);
    if (!parsed.success) {
      setErrors(parsed.error.flatten().fieldErrors as typeof errors);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const response = await accountApi.login(parsed.data);
      setFeedback(response.message);
      
      // Jika dapat tokens langsung (no OTP), simpan dan redirect
      if (response.accessToken) {
        localStorage.setItem('accessToken', response.accessToken);
        localStorage.setItem('refreshToken', response.refreshToken || '');
        
        // Extract dan simpan userId dari token
        const userId = getUserIdFromToken();
        if (userId) {
          localStorage.setItem('userId', userId);
          console.log('✓ Login berhasil! User ID:', userId);
        }
        
        console.log('✓ Redirecting to dashboard...');
        router.push('/dashboard');
      } else {
        // Fallback ke OTP flow jika masih ada
        if (response.otpDebug) {
          console.log('🔐 DEV OTP CODE:', response.otpDebug);
        }
        const params = new URLSearchParams({ email: parsed.data.email });
        if (response.otpDebug) {
          params.set('hint', response.otpDebug);
        }
        router.push(`/verify-otp?${params.toString()}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to login';
      setFeedback(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Login to your Budgetin account"
      footer={
        <p>
          Need an account? <Link href="/register">Create one</Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="form-grid">
        <InputField
          label="Email"
          placeholder="alex@lasti.id"
          type="email"
          value={form.email}
          error={errors.email}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setForm((prev: LoginPayload) => ({ ...prev, email: event.target.value }))
          }
        />
        <InputField
          label="Password"
          type="password"
          placeholder="••••••••"
          value={form.password}
          error={errors.password}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setForm((prev: LoginPayload) => ({ ...prev, password: event.target.value }))
          }
        />
        {feedback ? <p className="feedback">{feedback}</p> : null}
        <PrimaryButton type="submit" loading={loading}>
          Continue
        </PrimaryButton>
      </form>
    </AuthShell>
  );
}
