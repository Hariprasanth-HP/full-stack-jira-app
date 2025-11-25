import { GalleryVerticalEnd, Loader2 } from "lucide-react";

import { CompanyForm } from "@/components/company-form";
import { useEffect, useState } from "react";
import { useCreateteam, useFetchteams } from "@/lib/api/team";
import { useAppSelector } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { setTeam } from "@/slices/authSlice";
import { useDispatch } from "react-redux";

export default function TeamPage() {
  const auth = useAppSelector((s) => s.auth);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const dispatch = useDispatch();
  const [teamName, setTeamName] = useState("");
  const createTeam = useCreateteam();
  const { data, isLoading, error } = useFetchteams(auth.user?.id);
  async function handleSubmit() {
    const { data } = await createTeam.mutateAsync({
      name: teamName,
      creatorId: auth.user?.id,
    });
    await dispatch(setTeam({ team: data }));
    await navigate("/");
  }
  async function handleSelectTeam(selectedTeam) {
    await dispatch(setTeam({ team: selectedTeam }));
    await navigate("/");
  }

  useEffect(() => {
    if (data && data.length) {
      const parsedTeam = JSON.parse(localStorage.getItem("team") || "null");
      if (parsedTeam && data.find((dat) => dat.id === parsedTeam.id)) {
        handleSelectTeam(parsedTeam);
      }
      console.log(localStorage.getItem("team"));
    } else {
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    }
  }, [data]);

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <GalleryVerticalEnd className="size-4" />
          </div>
          Sprinta
        </a>
        {isLoading || loading ? (
          <div className="bg-primary text-primary-foreground flex size-6 w-[100%] items-center justify-center rounded-md">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <CompanyForm
            onSubmit={handleSubmit}
            setTeamName={setTeamName}
            teamName={teamName}
            teams={data}
            handleSelectTeam={handleSelectTeam}
          />
        )}
      </div>
    </div>
  );
}
