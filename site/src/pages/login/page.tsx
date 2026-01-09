import { LoginForm } from '@/components/login-form';
import { useAppDispatch } from '@/hooks/useAuth';
import { googleLoginUser, loginUser } from '@/lib/api/auth';
import type { ApiResponse } from '@/types/api';
import type { AuthResponse } from '@/types/auth';
import { useGoogleLogin } from '@react-oauth/google';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
export default function LoginPage() {
  const dispatch = useAppDispatch();
  const [error, setError] = useState('');

  const navigate = useNavigate();
  async function handleSubmit(userData: {
    email: string;
    password: string;
    remember?: boolean;
  }): Promise<
    | {
        data: ApiResponse<AuthResponse>;
        error: undefined;
      }
    | {
        error: unknown;
        data?: undefined;
      }
  > {
    const response = await dispatch(loginUser(userData));
    return response;
  }
  async function handleNavigate() {
    await toast.success('Logged in successfully');
    await navigate('/');
  }

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async ({ code }) => {
      const response = await dispatch(googleLoginUser({ code }));
      if (response.error instanceof Error) {
        setError(response.error.message);
      }
    },
    flow: 'auth-code',
  });

  return (
    <div className='bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10'>
      <div className='w-full max-w-sm md:max-w-4xl'>
        <LoginForm
          handleSubmitLogin={handleSubmit}
          handleNavigate={handleNavigate}
          handleGoogleLogin={handleGoogleLogin}
          error={error}
          setError={setError}
        />
      </div>
    </div>
  );
}
