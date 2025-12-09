'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState, type ChangeEvent } from 'react';

import { AuthShell } from '../../components/AuthShell';
import { InputField } from '../../components/InputField';
import { PrimaryButton } from '../../components/PrimaryButton';
import { accountApi } from '../../lib/api/account';
import type { VerifyPayload } from '../../lib/types';
import { otpSchema } from '../../lib/validators';

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialEmail = searchParams?.get('email') ?? '';
  const otpHint = searchParams?.get('hint') ?? undefined;
  const [form, setForm] = useState<VerifyPayload>({ email: initialEmail, code: otpHint ?? '' });
  const [error, setError] = useState<string | undefined>();
  const [feedback, setFeedback] = useState('');
  const [tokens, setTokens] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!initialEmail) {
      router.replace('/login');
    }
  }, [initialEmail, router]);

  const hintMessage = useMemo(() => {
    if (!otpHint) return undefined;
    return `Dev hint: ${otpHint}`;
  }, [otpHint]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = otpSchema.safeParse(form);
    if (!parsed.success) {
      setError(parsed.error.flatten().fieldErrors.code?.[0]);
      return;
    }
    setError(undefined);
    setLoading(true);
    setFeedback('');
    try {
      const result = await accountApi.verify(parsed.data);
      setFeedback('Authenticated. Tokens copied below for inspection.');
      setTokens(JSON.stringify(result, null, 2));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid OTP';
      setFeedback(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Verify OTP"
      subtitle={`Enter the 6-digit code sent to ${initialEmail || 'your email'}.`}
      footer={
        <p>
          Need to restart? <Link href="/login">Return to login</Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="form-grid">
        <InputField
          label="One-time password"
          placeholder="123456"
          inputMode="numeric"
          maxLength={6}
          value={form.code}
          hint={hintMessage}
          error={error}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            setForm((prev: VerifyPayload) => ({ ...prev, code: event.target.value }))
          }
        />
        {feedback ? <p className="feedback">{feedback}</p> : null}
        {tokens ? (
          <code className="token-block">
            <pre>{tokens}</pre>
          </code>
        ) : null}
        <PrimaryButton type="submit" loading={loading}>
          Verify & continue
        </PrimaryButton>
      </form>
    </AuthShell>
  );
}
