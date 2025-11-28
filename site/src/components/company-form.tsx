import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export function CompanyForm({
  className,
  onSubmit,
  teamName,
  setTeamName,
  teams,
  handleSelectTeam,
  newTeam,
  setNewTeam,
  ...props
}: React.ComponentProps<"div">) {
  const [team, setTeam] = useState(undefined);
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {!teams || !teams.length||newTeam ? (
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Create Team</CardTitle>
            <CardDescription>
              You are not associated with any teams yet .Please create a team to
              proceed further
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();

                onSubmit();
              }}
            >
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="name">Team name</FieldLabel>
                  <Input
                    id="name"
                    type="name"
                    placeholder="m@example.com"
                    required
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                  />
                </Field>

                <Field>
                  <Button type="submit">Create</Button>
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Select Team</CardTitle>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="team-select">Choose a team</FieldLabel>
                <select
                  id="team-select"
                  className="border rounded-md p-2 w-full"
                  onChange={(e) => {
                    const selected = teams.find(
                      (t) => t.id.toString() === e.target.value
                    );
                    setTeam(selected);
                  }}
                >
                  <option value="">Select a team</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field>
                <Button
                  onClick={() => {
                    handleSelectTeam(team);
                  }}
                >
                  Select
                </Button>
                <Button
                  onClick={() => {
                    setNewTeam(true);
                  }}
                >
                  Add
                </Button>
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>
      )}
      
    </div>
  );
}
