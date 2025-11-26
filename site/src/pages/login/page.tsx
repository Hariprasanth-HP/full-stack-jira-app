import { LoginForm } from "@/components/login-form";
import { useAppDispatch } from "@/hooks/useAuth";
import { loginUser } from "@/lib/api/auth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
export default function LoginPage() {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();
  async function handleSubmit(userData) {
    const response = await dispatch(loginUser(userData));
    return response;
  }
  async function handleNavigate() {
    await toast.success("Logged in successfully");
    await navigate("/");
  }
  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm md:max-w-4xl">
        <LoginForm
          onSubmit={handleSubmit}
          handleNavigate={handleNavigate}
          navigate={navigate}
        />
      </div>
    </div>
  );
}
