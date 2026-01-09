import { SignupForm } from '@/components/signup-form';
import { useAppDispatch } from '@/hooks/useAuth';
import { googleSignupUser, signupUser } from '@/lib/api/auth';
import type { SignupPayload } from '@/types/auth';
import { useGoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';

export default function SignupPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  async function signup(userData: SignupPayload) {
    await dispatch(signupUser(userData));
    await navigate('/');
  }
  const handleGoogleSignup = useGoogleLogin({
    flow: 'auth-code',
    onSuccess: async ({ code }) => {
      await dispatch(googleSignupUser({ code }));
    },
  });
  return (
    <div className='bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10'>
      <div className='w-full max-w-sm md:max-w-4xl'>
        <SignupForm onSubmit={signup} handleGoogleSignup={handleGoogleSignup} />
      </div>
    </div>
  );
}
