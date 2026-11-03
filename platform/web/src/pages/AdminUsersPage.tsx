import { ReadError } from "@/components/read-error";
import { useEffect, useId, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PencilSimple, Plus } from "@phosphor-icons/react";
import { authClient, useLoginConfig, type SessionUser } from "@/auth";
import { Modal } from "@versavolta/whisperink/components/Modal/Modal.js";
import { Select } from "@versavolta/whisperink/components/Select/Select.js";
import { Badge } from "@versavolta/whisperink/components/Badge/Badge.js";
import { Button } from "@versavolta/whisperink/components/Button/Button.js";
import { IconButton } from "@versavolta/whisperink/components/Button/IconButton.js";
import { Field } from "@versavolta/whisperink/components/Field/Field.js";
import { Input } from "@versavolta/whisperink/components/Input/Input.js";
import {
  Table,
  TableBody,
  TableCard,
  TableCell,
  TableActionsCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LoadingNote, PageHeader } from "@/components/page";

interface UserRow extends SessionUser {
  createdAt?: string | Date;
}

export function AdminUsersPage({ currentUser }: { currentUser: SessionUser }) {
  const config = useLoginConfig();
  const users = useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const result = await authClient.admin.listUsers({
        query: { limit: 200, sortBy: "createdAt" },
      });
      if (result.error) {
        throw new Error(result.error.message ?? "failed to load users");
      }
      return result.data.users as UserRow[];
    },
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);

  return (
    <>
      <PageHeader
        title="Users"
        description={config.data?.sso ? "Company users appear after their first admitted sign-in. Manage universe roles on Members." : "Platform accounts. Signup is closed — accounts are created here."}
        actions={
          config.data && config.data.password !== "off" && <Button onClick={() => setCreateOpen(true)}>
            <Plus data-icon="inline-start" />
            {config.data.sso ? "Create emergency admin" : "Create user"}
          </Button>
        }
      />
      <CreateUserDialog open={createOpen} onOpenChange={setCreateOpen} sso={config.data?.sso ?? false} />
      <EditUserDialog
        user={editing}
        currentUserId={currentUser.id}
        passwordMode={config.data?.password}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      />
      {users.isLoading && <LoadingNote />}
      {users.error && <ReadError error={users.error} loading={!users.data} />}
      {users.data && (
        <TableCard className="mb-8">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Access</TableHead>
                <TableHead>Last company check</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-0" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.data.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {user.role?.split(",").includes("admin") ? (
                      <Badge>admin</Badge>
                    ) : (
                      <span className="text-muted-foreground">user</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.banned ? "Suspended" : user.identitySource === "company" ? user.companyAdmitted ? "Company account" : "Company access absent" : user.emergencyAdmin ? "Emergency admin" : "Local account"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.providerCheckedAt ? new Date(user.providerCheckedAt).toLocaleString() : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString()
                      : "—"}
                  </TableCell>
                  <TableActionsCell>
                    <IconButton
                      size="sm"
                      label={`Edit ${user.email}`}
                      onClick={() => setEditing(user)}
                    >
                      <PencilSimple />
                    </IconButton>
                  </TableActionsCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableCard>
      )}
    </>
  );
}

function EditUserDialog({
  user,
  currentUserId,
  passwordMode,
  onOpenChange,
}: {
  user: UserRow | null;
  currentUserId: string;
  passwordMode?: "local" | "break-glass" | "off";
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("user");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const formId = useId();

  const open = user !== null;
  const isCurrentUser = user?.id === currentUserId;
  const company = user?.identitySource === "company";
  const passwordAllowed = !company && passwordMode !== "off" && (passwordMode === "local" || user?.emergencyAdmin === true);

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setEmail(user.email);
    setRole(user.role?.split(",").includes("admin") ? "admin" : "user");
    setPassword("");
    setConfirm("");
    setError(null);
  }, [user]);

  const reset = () => {
    setName("");
    setEmail("");
    setRole("user");
    setPassword("");
    setConfirm("");
    setError(null);
  };

  const close = () => {
    onOpenChange(false);
    reset();
  };

  const accessChange = useMutation({
    mutationFn: async (action: "suspend" | "reinstate" | "revoke") => {
      if (!user) return;
      const result = action === "revoke" ? await authClient.admin.revokeUserSessions({ userId: user.id })
        : action === "reinstate" ? await authClient.admin.unbanUser({ userId: user.id })
        : await authClient.admin.banUser({ userId: user.id });
      if (result.error) throw new Error(result.error.message ?? "Access change failed");
    },
    onSuccess: () => { void queryClient.invalidateQueries({ queryKey: ["admin"] }); close(); },
    onError: (err) => setError(err.message),
  });

  const edit = useMutation({
    mutationFn: async () => {
      if (!user) return;

      const data: Record<string, unknown> = {};
      const nextName = name.trim();
      const nextEmail = email.trim().toLowerCase();
      const currentRole = user.role?.split(",").includes("admin") ? "admin" : "user";
      if (nextName !== user.name) data.name = nextName;
      if (nextEmail !== user.email.toLowerCase()) {
        data.email = nextEmail;
        // Platform accounts are provisioned and maintained by a trusted admin.
        data.emailVerified = true;
      }
      if (!isCurrentUser && role !== currentRole) data.role = role;

      if (Object.keys(data).length > 0) {
        const result = await authClient.admin.updateUser({ userId: user.id, data });
        if (result.error) {
          throw new Error(result.error.message ?? "failed to update user");
        }
      }

      if (password) {
        const result = await authClient.admin.setUserPassword({
          userId: user.id,
          newPassword: password,
        });
        if (result.error) {
          throw new Error(result.error.message ?? "failed to set password");
        }

      }
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
      const signedOutSelf = isCurrentUser && Boolean(password);
      const refreshedSelf = isCurrentUser && hasProfileChanges;
      close();
      if (signedOutSelf) {
        window.location.assign(`${import.meta.env.BASE_URL}login`);
      } else if (refreshedSelf) {
        window.location.reload();
      }
    },
    onError: (err) => setError(err.message),
  });

  const currentRole = user?.role?.split(",").includes("admin") ? "admin" : "user";
  const hasProfileChanges = Boolean(
    user &&
      (name.trim() !== user.name ||
        email.trim().toLowerCase() !== user.email.toLowerCase() ||
        (!isCurrentUser && role !== currentRole)),
  );
  const hasChanges = hasProfileChanges || Boolean(password);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("New passwords do not match.");
      return;
    }
    edit.mutate();
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Edit user"
      description={company ? `Identity and platform role for ${user?.email} are managed by the company. Universe roles are managed on Members.` : `Update the platform account for ${user?.email}. A password reset signs the user out of every session.`}
      footer={<>
        <Button type="button" variant="outline" onClick={close}>
          Cancel
        </Button>
        <Button
          type="submit"
          form={formId}
          disabled={edit.isPending || !hasChanges || !name.trim() || !email.trim()}
        >
          {edit.isPending ? "Saving…" : "Save changes"}
        </Button>
      </>}
    >
      <form id={formId} onSubmit={submit} className="grid gap-5">
        <div className="grid gap-4">
          <Field id="edit-user-name" label="Name">
            {(field) => (
              <Input
                {...field.control}
                value={name}
                disabled={company}
                onChange={(event) => setName(event.target.value)}
                required
                autoFocus
              />
            )}
          </Field>
          <Field
            id="edit-user-email"
            label="Email"
            hint="Admin-managed addresses are treated as verified sign-in addresses."
          >
            {(field) => (
              <Input
                {...field.control}
                type="email"
                value={email}
                disabled={company}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            )}
          </Field>
          <Field
            id="edit-user-role"
            label="Platform role"
            hint={isCurrentUser
              ? "Another platform admin must change your role, preventing accidental self-lockout."
              : undefined}
          >
            {(field) => (
              <Select
                {...field.control}
                className="w-full"
                value={role}
                onChange={(event) => setRole(event.target.value)}
                disabled={isCurrentUser || company || user?.emergencyAdmin === true}
              >
                <option value="user">user</option>
                <option value="admin">admin</option>
              </Select>
            )}
          </Field>
        </div>

        {passwordAllowed && <div className="grid gap-4 border-t pt-5">
          <div>
            <p className="font-medium">Reset password</p>
            <p className="text-sm text-muted-foreground">
              Leave these fields empty to keep the current password.
              {isCurrentUser ? " You will be signed out if you reset your own password." : ""}
            </p>
          </div>
          <Field id="edit-user-password" label="New password">
            {(field) => (
              <Input
                {...field.control}
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={8}
                autoComplete="new-password"
              />
            )}
          </Field>
          <Field id="edit-user-confirm" label="Repeat new password">
            {(field) => (
              <Input
                {...field.control}
                type="password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                minLength={8}
                autoComplete="new-password"
                required={Boolean(password)}
              />
            )}
          </Field>
        </div>}

        <div className="grid gap-2 border-t pt-5">
          <p className="text-sm text-muted-foreground">Suspension blocks Platform access and signs out every device. Core API keys must be revoked separately.</p>
          {!isCurrentUser && <Button type="button" variant="outline" disabled={accessChange.isPending} onClick={() => accessChange.mutate(user?.banned ? "reinstate" : "suspend")}>
            {user?.banned ? "Reinstate access" : "Suspend access"}
          </Button>}
          <Button type="button" variant="outline" disabled={accessChange.isPending} onClick={() => accessChange.mutate("revoke")}>Sign out all sessions</Button>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
      </form>
    </Modal>
  );
}

function CreateUserDialog({
  open,
  onOpenChange,
  sso,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sso: boolean;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [error, setError] = useState<string | null>(null);
  const formId = useId();

  const reset = () => {
    setName("");
    setEmail("");
    setPassword("");
    setRole("user");
    setError(null);
  };

  const create = useMutation({
    mutationFn: async () => {
      const result = await authClient.admin.createUser({
        name,
        email,
        password,
        role: sso ? "admin" : role as "user" | "admin",
        ...(sso ? { data: { emergencyAdmin: true } } : {}),
      });
      if (result.error) {
        throw new Error(result.error.message ?? "failed to create user");
      }
      return result.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
      onOpenChange(false);
      reset();
    },
    onError: (err) => setError(err.message),
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    create.mutate();
  };

  return (
    <Modal
      open={open}
      onClose={() => { onOpenChange(false); reset(); }}
      title={sso ? "Create emergency admin" : "Create user"}
      description={sso ? "Creates a separate local administrator for emergency access. Use an email distinct from company sign-in accounts and store the password securely." : "Creates a platform account. Share the password out of band — users can change it under Account."}
      footer={<>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button type="submit" form={formId} disabled={create.isPending}>
          {create.isPending ? "Creating…" : "Create user"}
        </Button>
      </>}
    >
      <form id={formId} onSubmit={submit} className="grid gap-4">
        <div className="grid gap-4">
          <Field id="user-name" label="Name">
            {(field) => (
              <Input
                {...field.control}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            )}
          </Field>
          <Field id="user-email" label="Email">
            {(field) => (
              <Input
                {...field.control}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            )}
          </Field>
          <Field id="user-password" label="Password">
            {(field) => (
              <Input
                {...field.control}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
            )}
          </Field>
          <Field id="user-role" label="Role">
            {(field) => (
              <Select
                {...field.control}
                className="w-full"
                value={sso ? "admin" : role}
                disabled={sso}
                onChange={(event) => setRole(event.target.value)}
              >
                <option value="user">user</option>
                <option value="admin">admin</option>
              </Select>
            )}
          </Field>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </form>
    </Modal>
  );
}
