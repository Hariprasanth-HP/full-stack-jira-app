import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { googleLoginUser } from "@/features/auth/api/auth";
import { useAppDispatch } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
	const navigate = useNavigate();
	const dispatch = useAppDispatch();
	useEffect(() => {
		const getSession = async () => {
			const {
				data: { session },
			} = await supabase.auth.getSession();

			if (session) {
				const res = await dispatch(googleLoginUser(session));

				if (res?.data) {
					toast.success("Google login successful");

					navigate("/");
				}

				if (res?.error) {
					toast.error("Login failed");
				}
			}
		};

		getSession();
	}, []);

	return <p>Loading...</p>;
}
