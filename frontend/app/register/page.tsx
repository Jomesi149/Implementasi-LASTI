'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type ChangeEvent } from 'react';

import { AuthShell } from '../../components/AuthShell';
import { InputField } from '../../components/InputField';
import { PrimaryButton } from '../../components/PrimaryButton';
import { accountApi } from '../../lib/api/account';
import type { RegisterPayload } from '../../lib/types';
import { registerSchema } from '../../lib/validators';

const CHANNELS: RegisterPayload['channel'][] = ['email', 'sms', 'auth_app'];

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<RegisterPayload>({ email: '', password: '', channel: 'email', phoneNumber: '' });
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterPayload, string>>>({});
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback('');
    const parsed = registerSchema.safeParse(form);
    if (!parsed.success) {
      setErrors(parsed.error.flatten().fieldErrors as typeof errors);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const result = await accountApi.register(parsed.data);
      setFeedback(result.message);
      setTimeout(() => router.push('/login'), 800);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to register';
      setFeedback(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Create secure access"
      subtitle="Provision identity, set OTP preferences, and join the LASTI workspace."
      footer={
        <p>
          Already have access? <Link href="/login">Return to login</Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="form-grid">
        <InputField
          label="Work email"
          type="email"
          placeholder="you@company.id"
          value={form.email}
          error={errors.email}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setForm((prev: RegisterPayload) => ({ ...prev, email: event.target.value }))
          }
        />
        <InputField
          label="Phone number (optional)"
          placeholder="+62 812 1234 5678"
          value={form.phoneNumber ?? ''}
          hint="Needed if you select SMS"
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setForm((prev: RegisterPayload) => ({ ...prev, phoneNumber: event.target.value }))
          }
        />
        <InputField
          label="Password"
          type="password"
          placeholder="At least 8 characters"
          value={form.password}
          error={errors.password}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setForm((prev: RegisterPayload) => ({ ...prev, password: event.target.value }))
          }
        />
        <label className="channel-field">
          <span>OTP delivery channel</span>
          <div className="channel-group">
            {CHANNELS.map((channel) => (
              <button
                type="button"
                key={channel}
                className={channel === form.channel ? 'channel active' : 'channel'}
                onClick={() => setForm((prev: RegisterPayload) => ({ ...prev, channel }))}
              >
                {channel === 'auth_app' ? 'Authenticator app' : channel.toUpperCase()}
              </button>
            ))}
          </div>
        </label>
        {feedback ? <p className="feedback">{feedback}</p> : null}
        <PrimaryButton type="submit" loading={loading}>
          Create account
        </PrimaryButton>
      </form>
    </AuthShell>
  );
}
