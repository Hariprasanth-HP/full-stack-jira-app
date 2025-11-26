
import { Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { BrowserRouter, Routes, Route } from "react-router-dom";

export default function teamRoutes() {
  const navigate = useNavigate();
  
  return (
    <BrowserRouter>
        <Suspense fallback={<div className="p-8 text-center">Loading…</div>}>
          <Routes>
            <Route
              path="/:id"
              element={
                <RedirectIfAuth>
                  <SignupPage />
                </RedirectIfAuth>
              }
            />
           
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
  );
}
