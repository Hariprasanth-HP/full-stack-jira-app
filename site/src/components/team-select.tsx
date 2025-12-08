import * as React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppDispatch, useAppSelector } from '@/hooks/useAuth';
import { setTeam } from '@/slices/authSlice';
import { useFetchUserteams } from '@/lib/api/team';
import { useNavigate } from 'react-router-dom';
import type { Team } from '@/types/type';
export function TeamSelect() {
  const auth = useAppSelector((s) => s.auth);
  const fetchuserTeams = useFetchUserteams();
  const [selectedTeam, setSelectedTeam] = React.useState<Team | undefined>(
    undefined
  );
  const [teams, setTeams] = React.useState<Team[]>([]);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const handleChange = (value: string) => {
    const id = Number(value);
    if (Number.isNaN(id)) return;

    const foundTeam = teams.find((t) => Number(t.id) === id);
    if (!foundTeam) return;

    setSelectedTeam(foundTeam);
    dispatch(setTeam({ userTeam: foundTeam }));
    navigate(`/team/${foundTeam.id}`);
  };

  React.useEffect(() => {
    async function fetchUserTeamsData() {
      const { data } = await fetchuserTeams.mutateAsync({ user: auth.user });
      setTeams(data);
    }
    fetchUserTeamsData();
  }, []);

  React.useEffect(() => {
    if (auth.userTeam) {
      setSelectedTeam(auth.userTeam);
    }
  }, [auth.userTeam]);

  return (
    <Select onValueChange={handleChange} value={String(selectedTeam?.id)!}>
      <SelectTrigger className='w-auto border-0 focus:ring-0 focus:outline-none shadow-none'>
        <SelectValue placeholder='Select a Team' />
      </SelectTrigger>
      <SelectContent>
        {teams.map((team) => {
          return <SelectItem value={String(team.id)}>{team.name}</SelectItem>;
        })}
      </SelectContent>
    </Select>
  );
}
