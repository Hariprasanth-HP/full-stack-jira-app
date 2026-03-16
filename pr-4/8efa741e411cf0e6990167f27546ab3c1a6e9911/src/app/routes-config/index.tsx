// src/AppRoutes.tsx
import { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { RedirectIfAuth } from './RedirectIfAuthenticated';
import SignupPage from '@/app/routes/signup/signup';
import LoginPage from '@/app/routes/login/page';
import NotFoundPage from '@/components/not-found';
import ProtectedRoutes from './protectedRoutes';
import { RequireAuth } from './RequireAuth';
import TeamPage from '@/app/routes/company/page';

// Lazy pages

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className='p-8 text-center'>Loading…</div>}>
        <Routes>
          <Route path='/' element={<Navigate to='/team' replace />} />

          <Route
            path='/signup'
            element={
              <RedirectIfAuth>
                <SignupPage />
              </RedirectIfAuth>
            }
          />
          <Route
            path='/login'
            element={
              <RedirectIfAuth>
                <LoginPage />
              </RedirectIfAuth>
            }
          />
          <Route
            path='/team'
            element={
              <RequireAuth>
                <TeamPage />
              </RequireAuth>
            }
          />
          <Route
            path='/team/*'
            element={
              <RequireAuth>
                <ProtectedRoutes />
              </RequireAuth>
            }
          />

          <Route path='*' element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
