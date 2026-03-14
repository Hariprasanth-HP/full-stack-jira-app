import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';

import React, { useState } from 'react';
import type { ApiResponse } from '@/types/api';
import type { AuthResponse } from '@/types/auth';

type Props = React.ComponentPropsWithoutRef<'div'> & {
  error: string;
  setError: (err: string) => void;
  handleSubmitLogin?: (userData: {
    email: string;
    password: string;
    remember?: boolean;
  }) => Promise<
    | {
        data: ApiResponse<AuthResponse>;
        error: undefined;
      }
    | {
        error: unknown;
        data?: undefined;
      }
  >;
  handleGoogleLogin?: () => void;
  className?: string;
  handleNavigate?: () => void;
};
export function LoginForm({
  handleSubmitLogin,
  handleGoogleLogin,
  className,
  handleNavigate,
  error,
  setError,
  ...props
}: Props) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false,
  });

  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, type, value, checked } = e.target;
    const nextValue = type === 'checkbox' ? checked : value;

    setFormData((prev) => ({ ...prev, [id]: nextValue }));
    setFieldErrors((prev) => ({ ...prev, [id]: undefined }));
  };

  const validate = () => {
    const errs: { email?: string; password?: string } = {};
    const email = String(formData.email).trim();
    const password = String(formData.password);

    if (!email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) errs.email = 'Email is invalid';

    if (!password) errs.password = 'Password is required';
    else if (password.length < 6)
      errs.password = 'Password must be at least 6 characters';

    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errs = validate();
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      return;
    }

    setLoading(true);

    try {
      const payload = {
        email: formData.email.trim(),
        password: formData.password,
        remember: Boolean(formData.remember),
      };

      if (handleSubmitLogin) {
        const { data = undefined, error = undefined } = await Promise.resolve(
          handleSubmitLogin(payload)
        );
        if (!error && data) {
          setFormData((prev) => ({ ...prev, password: '' })); // keep email
          handleNavigate?.();
        }
      }
    } catch (err) {
      let errorRes: string = '';
      if (err instanceof Error) {
        const message = err.message;
        console.log(message);
        errorRes = message;
      } else {
        console.log('Unknown error', err);
        errorRes = String(err);
      }
      setError(errorRes);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card className='overflow-hidden p-0'>
        <CardContent className='grid p-0 md:grid-cols-2'>
          <form className='p-6 md:p-8' onSubmit={handleSubmit} noValidate>
            <FieldGroup>
              <div className='flex flex-col items-center gap-2 text-center'>
                <h1 className='text-2xl font-bold'>Welcome back</h1>
                <p className='text-muted-foreground text-balance'>
                  Login to your Sprinta account
                </p>
              </div>
              <Field>
                <FieldLabel htmlFor='email'>Email</FieldLabel>
                <Input
                  id='email'
                  name='email' // <- required for autofill
                  type='email'
                  placeholder='m@example.com'
                  required
                  autoComplete='email' // <- use proper token
                  value={formData.email}
                  onChange={handleChange}
                  aria-invalid={!!fieldErrors.email}
                  aria-describedby={
                    fieldErrors.email ? 'email-error' : undefined
                  }
                />
                {fieldErrors.email && (
                  <p id='email-error' className='mt-1 text-xs text-red-600'>
                    {fieldErrors.email}
                  </p>
                )}
              </Field>
              <Field>
                <div className='flex items-center'>
                  <FieldLabel htmlFor='password'>Password</FieldLabel>
                  <a
                    href='#'
                    className='ml-auto text-sm underline-offset-2 hover:underline'
                  >
                    Forgot your password?
                  </a>
                </div>
                <Input
                  id='password'
                  name='password' // <- required for autofill
                  type='password'
                  required
                  autoComplete='current-password' // <- correct token for sign-in
                  value={formData.password}
                  onChange={handleChange}
                  aria-invalid={!!fieldErrors.password}
                  aria-describedby={
                    fieldErrors.password ? 'password-error' : undefined
                  }
                />
                {fieldErrors.password && (
                  <p id='password-error' className='mt-1 text-xs text-red-600'>
                    {fieldErrors.password}
                  </p>
                )}
              </Field>
              <Field>
                <Button type='submit' disabled={loading}>
                  Login
                </Button>
              </Field>
              {error && (
                <Field>
                  <p id='signin-error' className='mt-1 text-xs text-red-600'>
                    {error}
                  </p>
                </Field>
              )}
              <FieldSeparator className='*:data-[slot=field-separator-content]:bg-card'>
                Or continue with
              </FieldSeparator>
              <Field className='grid grid-cols-3 gap-4'>
                <Button
                  variant='outline'
                  type='button'
                  onClick={handleGoogleLogin}
                >
                  <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'>
                    <path
                      d='M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z'
                      fill='currentColor'
                    />
                  </svg>
                  <span className='sr-only'>Login with Google</span>
                </Button>
              </Field>
              <FieldDescription className='text-center'>
                Don&apos;t have an account? <a href='/signup'>Sign up</a>
              </FieldDescription>
            </FieldGroup>
          </form>
          <div className='bg-muted relative hidden md:block'>
            <img
              src='/placeholder.svg'
              alt='Image'
              className='absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale'
            />
          </div>
        </CardContent>
      </Card>
      <FieldDescription className='px-6 text-center'>
        By clicking continue, you agree to our <a href='#'>Terms of Service</a>{' '}
        and <a href='#'>Privacy Policy</a>.
      </FieldDescription>
    </div>
  );
}
