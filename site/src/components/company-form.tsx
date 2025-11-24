import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export function CompanyForm({
  className,
  onSubmit,
  teamName,
  setTeamName,
  teams,
  handleSelectTeam,
  ...props
}: React.ComponentProps<"div">) {
  const [team, setTeam] = useState(undefined);
  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {!teams || !teams.length ? (
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Create Team</CardTitle>
            <CardDescription>
              Create Team Members for the project
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
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
