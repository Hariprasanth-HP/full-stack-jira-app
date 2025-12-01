"use client";

import { useContext, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@radix-ui/react-dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "./ui/sidebar";
import {
  IconCreditCard,
  IconDotsVertical,
  IconLogout,
  IconUserCircle,
} from "@tabler/icons-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { SideBarContext } from "@/contexts/sidebar-context";
import { useAppSelector } from "@/hooks/useAuth";
import { TabsContent } from "@radix-ui/react-tabs";
import { useCreatemembers } from "@/lib/api/member";
import { ManageMembers } from "./manage-members";
import { useDispatch } from "react-redux";
import { clearTeamAndProject } from "@/slices/authSlice";
import { useNavigate } from "react-router-dom";
export function NavTeam() {
  const [showTeamDialog, setShowTeamDialog] = useState(false);
  const { team, usersList } = useContext(SideBarContext);
  if (!team) return null;
  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <Avatar className="h-8 w-8 rounded-lg grayscale">
                  <AvatarImage src={team?.avatar} alt={team.name} />
                  <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{team.name}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {team.email}
                  </span>
                </div>
                <IconDotsVertical className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
              //   side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={team?.avatar} alt={team.name} />
                    <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{team.name}</span>
                    <span className="text-muted-foreground truncate text-xs">
                      {team.email}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onSelect={() => setShowTeamDialog(true)}>
                  <IconUserCircle />
                  Account
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <IconCreditCard />
                  Billing
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <IconLogout />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
      <Dialog open={showTeamDialog} onOpenChange={setShowTeamDialog}>
        <DialogContent className="sm:max-w-[90%] sm:max-h-[95%] h-[85%]: overflow-auto ">
          <DialogHeader>
            <DialogTitle>Manage team</DialogTitle>
          </DialogHeader>
          <ManageTeam />
        </DialogContent>
      </Dialog>
    </>
  );
}

type Row = {
  id: string; // local key
  email: string;
  name?: string;
  role: string;
};

type RowErrors = {
  email?: string;
  role?: string;
};

type Props = {
  teamId: number;
  addedById?: number | null; // optional - backend can fill if you prefer
  onDone?: (result: any) => void;
};

const EMAIL_RE = /^\S+@\S+\.\S+$/;
export function ManageTeam() {
  const auth = useAppSelector((s) => s.auth);
  const team = auth.userTeam;
  const [rows, setRows] = useState<Row[]>(() => [
    { id: cryptoRandomId(), email: "", name: "", role: "member" },
    { id: cryptoRandomId(), email: "", name: "", role: "member" },
    { id: cryptoRandomId(), email: "", name: "", role: "member" },
  ]);

  const [errors, setErrors] = useState<Record<string, RowErrors>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  function cryptoRandomId() {
    // small helper for unique ids (works in modern browsers)
    return Math.random().toString(36).slice(2, 9);
  }

  function updateRow(id: string, patch: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    // clear error for field being updated
    setErrors((prev) => {
      const copy = { ...prev };
      if (!copy[id]) return copy;
      if (patch.email) copy[id] = { ...copy[id], email: undefined };
      if (patch.role) copy[id] = { ...copy[id], role: undefined };
      return copy;
    });
  }

  function addRow() {
    setRows((p) => [
      ...p,
      { id: cryptoRandomId(), email: "", name: "", role: "member" },
    ]);
  }

  function removeRow(id: string) {
    setRows((p) => p.filter((r) => r.id !== id));
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  }

  function validateRows(rowsToValidate: Row[]) {
    const e: Record<string, RowErrors> = {};
    let valid = true;
    rowsToValidate.forEach((r, idx) => {
      const rowErr: RowErrors = {};
      const email = (r.email ?? "").trim();
      if (!email) {
        rowErr.email = "Email is required.";
        valid = false;
      } else if (!EMAIL_RE.test(email)) {
        rowErr.email = "Invalid email address.";
        valid = false;
      }
      const role = (r.role ?? "").trim();
      if (!role) {
        rowErr.role = "Role is required.";
        valid = false;
      }
      if (Object.keys(rowErr).length > 0) {
        e[r.id] = rowErr;
      }
    });

    return { valid, errors: e };
  }
  const createmembers = useCreatemembers();
  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    setGlobalError(null);
    setSuccessMsg(null);

    // trim out completely empty rows (where email is empty)
    const meaningfulRows = rows.filter(
      (r) => (r.email ?? "").trim().length > 0
    );

    if (meaningfulRows.length === 0) {
      setGlobalError("Please add at least one member email.");
      return;
    }

    const { valid, errors: validationErrors } = validateRows(meaningfulRows);
    if (!valid) {
      setErrors(validationErrors);
      setGlobalError("Fix the errors before submitting.");
      return;
    }

    // Build payload aligned with TeamMember model
    const membersPayload = meaningfulRows.map((r) => ({
      email: r.email.trim().toLowerCase(),
      name: r.name?.trim() || null,
      role: r.role.trim(),
      // teamId and addedById are sent by the route itself or the server expects teamId in URL
    }));

    setLoading(true);

    try {
      const { data = undefined, error } = await createmembers.mutateAsync({
        members: membersPayload,
        teamId: team.id,
      });

      if (error) {
        setGlobalError("Failed to add members.");
        setLoading(false);
        return;
      }

      setSuccessMsg(
        `Added ${
          Array.isArray(data.added) ? data.added : membersPayload.length
        } member(s).`
      );
      setRows(() => [
        { id: cryptoRandomId(), email: "", name: "", role: "member" },
        { id: cryptoRandomId(), email: "", name: "", role: "member" },
        { id: cryptoRandomId(), email: "", name: "", role: "member" },
      ]);
      setErrors({});
    } catch (err: any) {
      console.error(err);
      setGlobalError(err?.message ?? "Failed to add members.");
    } finally {
      setLoading(false);
    }
  }
  const dispatch = useDispatch();
  const navigate = useNavigate();
  async function handleCreateWorkspace() {
    await dispatch(clearTeamAndProject());
    navigate("/team");
  }
  return (
    <>
      <div className="flex h-full ">
        <div className="flex-1 px-8 overflow-auto">
          <div className="flex flex-col  gap-4">
            <h2 className="text-2xl font-semibold">{team.name}</h2>
            <Tabs defaultValue="add" className="ml-6">
              <TabsList className="bg-transparent p-0">
                <TabsTrigger value="add" className="text-sm">
                  Add Members
                </TabsTrigger>
                <TabsTrigger value="members" className="text-sm">
                  Manage Members (1)
                </TabsTrigger>
              </TabsList>
              <TabsContent value="add">
                <form
                  onSubmit={(e) => handleSubmit(e)}
                  className="mt-6 border-t border-slate-700 pt-6"
                >
                  <h3 className="text-xs uppercase text-slate-300 font-semibold">
                    Add people to your workspace
                  </h3>

                  <div className="grid grid-cols-12 gap-4 mt-4 items-start">
                    {/* Emails column */}
                    <div className="col-span-6">
                      <Label className="text-slate-300">Email Address</Label>
                      <div className="space-y-3 mt-2">
                        {rows.map((r) => (
                          <div key={`email-${r.id}`} className="relative">
                            <Input
                              value={r.email}
                              onChange={(ev) =>
                                updateRow(r.id, { email: ev.target.value })
                              }
                              placeholder="email@example.com"
                              aria-invalid={Boolean(errors[r.id]?.email)}
                            />
                            {errors[r.id]?.email && (
                              <div className="text-sm text-destructive mt-1">
                                {errors[r.id]?.email}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Name column */}
                    <div className="col-span-3">
                      <Label className="text-slate-300">Name (optional)</Label>
                      <div className="space-y-3 mt-2">
                        {rows.map((r) => (
                          <Input
                            key={`name-${r.id}`}
                            value={r.name ?? ""}
                            onChange={(ev) =>
                              updateRow(r.id, { name: ev.target.value })
                            }
                            placeholder=""
                          />
                        ))}
                      </div>
                    </div>

                    {/* Role column */}
                    <div className="col-span-3">
                      <Label className="text-slate-300">Role</Label>
                      <div className="space-y-3 mt-2">
                        {rows.map((r) => (
                          <div key={`role-${r.id}`}>
                            <Select
                            // simple uncontrolled Select - we manage value via change handler
                            >
                              <SelectTrigger
                                className="w-full"
                                onClick={(ev) => ev.stopPropagation()}
                              >
                                <SelectValue placeholder={r.role} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem
                                  value="owner"
                                  onClick={() =>
                                    updateRow(r.id, { role: "owner" })
                                  }
                                >
                                  Owner
                                </SelectItem>
                                <SelectItem
                                  value="admin"
                                  onClick={() =>
                                    updateRow(r.id, { role: "admin" })
                                  }
                                >
                                  Admin
                                </SelectItem>
                                <SelectItem
                                  value="member"
                                  onClick={() =>
                                    updateRow(r.id, { role: "member" })
                                  }
                                >
                                  Member
                                </SelectItem>
                                <SelectItem
                                  value="guest"
                                  onClick={() =>
                                    updateRow(r.id, { role: "guest" })
                                  }
                                >
                                  Guest
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            {errors[r.id]?.role && (
                              <div className="text-sm text-destructive mt-1">
                                {errors[r.id]?.role}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <Button type="submit" variant="default" disabled={loading}>
                      {loading ? "Adding…" : "Add to Workspace"}
                    </Button>
                  </div>

                  {globalError && (
                    <div className="mt-4 text-sm text-destructive">
                      {globalError}
                    </div>
                  )}
                  {successMsg && (
                    <div className="mt-4 text-sm text-green-500">
                      {successMsg}
                    </div>
                  )}

                  {/* spacer */}
                  <div className="h-10" />
                </form>
              </TabsContent>
              <TabsContent value="members">
                <ManageMembers teamId={team.id} />
              </TabsContent>
            </Tabs>
            <Button
              variant="default"
              disabled={loading}
              onClick={handleCreateWorkspace}
            >
              Create a workspace
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
