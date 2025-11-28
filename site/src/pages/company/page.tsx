import { GalleryVerticalEnd, Loader2 } from "lucide-react";

import { CompanyForm } from "@/components/company-form";
import { useEffect, useState } from "react";
import { useCreateteam, useFetchUserteams } from "@/lib/api/team";
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
  const [teams, setTeams] = useState([]);
  const [newTeam, setNewTeam] = useState(true);
  const createTeam = useCreateteam();
  const fetchUserTeams = useFetchUserteams(auth.user);
  async function handleSubmit() {
    const { data } = await createTeam.mutateAsync({
      name: teamName,
      creatorId: auth.user?.id,
    });
    await dispatch(setTeam({ team: data }));
    await navigate(`/team/${data.id}`);
  }
  async function handleSelectTeam(selectedTeam) {
    await dispatch(setTeam({ team: selectedTeam }));
    setTimeout(() => {
       navigate(`/team/${selectedTeam.id}`);
    }, 3000);
  }

  useEffect(() => {
    async function fetchUserTeamsData() {
      const {data,isLoading} = await fetchUserTeams.mutateAsync({user: auth.user});
      setLoading(true);
      if (data && data.length) {
        setTeams(data);
        const parsedTeam = JSON.parse(localStorage.getItem("team") || "null");
        if (parsedTeam && data.find((dat) => dat.id === parsedTeam.id)) {
          handleSelectTeam(parsedTeam);
        }
        setNewTeam(false)
        setTimeout(() => {
          setLoading(false);
        }, 3000);
      } else {
        setTimeout(() => {
          setLoading(false);
        }, 3000);
      }
    }
    fetchUserTeamsData();
  }, []);

  return (
    <div className="bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <a href="#" className="flex items-center gap-2 self-center font-medium">
          <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
            <GalleryVerticalEnd className="size-4" />
          </div>
          Sprinta
        </a>
        { loading ? (
          <div className="bg-primary text-primary-foreground flex size-6 w-[100%] items-center justify-center rounded-md">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <CompanyForm
            onSubmit={handleSubmit}
            setTeamName={setTeamName}
            teamName={teamName}
            teams={teams}
            handleSelectTeam={handleSelectTeam}
            newTeam={newTeam}
            setNewTeam={setNewTeam}
          />
        )}
      </div>
    </div>
  );
}
