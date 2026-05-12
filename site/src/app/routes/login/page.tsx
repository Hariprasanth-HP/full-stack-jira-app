import { LoginForm } from '@/features/auth/components/login-form';
import { useAppDispatch } from '@/hooks/useAuth';
import { loginUser } from '@/features/auth/api/auth';
import type { ApiResponse } from '@/types/api';
import type { AuthResponse } from '@/types/auth';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
export default function LoginPage() {

  const dispatch = useAppDispatch()

  const [error, setError] = useState('')

  const navigate = useNavigate()

  // Email Login
  async function handleSubmit(userData: {
    email: string
    password: string
    remember?: boolean
  }): Promise<
    | {
      data: ApiResponse<AuthResponse>
      error: undefined
    }
    | {
      error: unknown
      data?: undefined
    }
  > {

    const response = await dispatch(
      loginUser(userData)
    )

    return response

  }

  const handleGoogleLogin = async () => {

    const { error } =
      await supabase.auth.signInWithOAuth({

        provider: 'google',

        options: {

          redirectTo: 'http://localhost:5173/callback',

          queryParams: {
            prompt: 'select_account'
          }

        }

      })

    if (error) {
      toast.error(error.message)
    }

  }
  async function handleNavigate() {
    await toast.success('Logged in successfully');
    await navigate('/');
  }

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

  )

}