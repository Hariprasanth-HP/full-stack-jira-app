import { SignupForm } from "@/components/signup-form";
import { useAppDispatch } from "@/hooks/useAuth";
import { signupUser } from "@/lib/api/auth";
import { useNavigate } from "react-router-dom";

export default function SignupPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  async function signup(userData) {
    await dispatch(signupUser(userData));
    await navigate("/");
  }
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <SignupForm onSubmit={signup} />
      </div>
    </div>
  );
}
