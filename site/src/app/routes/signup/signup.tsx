import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { signupUser } from "@/features/auth/api/auth";
import { SignupForm } from "@/features/auth/components/signup-form";
import { useAppDispatch } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import type { SignupPayload } from "@/types/auth";

export default function SignupPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  async function signup(userData: SignupPayload) {
    await dispatch(signupUser(userData));
    await navigate("/");
  }
  const handleGoogleSignup = async () => {
    console.log('import.meta.env.VITE_BASE_PATHimport.meta.env.VITE_BASE_PATH', import.meta.env.VITE_BASE_PATH)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}${import.meta.env.VITE_BASE_PATH}/callback`,
        queryParams: {
          prompt: "select_account",
        },
      },
    });

    if (error) {
      toast.error("Google signup failed");
      return;
    }
  };
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <SignupForm onSubmit={signup} handleGoogleSignup={handleGoogleSignup} />
      </div>
    </div>
  );
}
