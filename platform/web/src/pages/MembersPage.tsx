import { useActionPermissions } from "@/lib/permissions";
import { ReadError } from "@/components/read-error";
import { useId, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PencilSimple, Plus, Trash } from "@phosphor-icons/react";
import { api, type Member } from "@/api";
import { UNIVERSE_ROLES, type UniverseRole } from "@lightspeed-ai/platform-shared";
import { Modal } from "@versavolta/whisperink/components/Modal/Modal.js";
import { Select } from "@versavolta/whisperink/components/Select/Select.js";
import { Button } from "@versavolta/whisperink/components/Button/Button.js";
import { IconButton } from "@versavolta/whisperink/components/Button/IconButton.js";
import { Field } from "@versavolta/whisperink/components/Field/Field.js";
import {
  Table,
  TableActionsCell,
  TableBody,
  TableCard,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LoadingNote,
  PageHeader,
  UniverseNotFound,
} from "@/components/page";
import { useActiveUniverse } from "@/lib/universes";

export function MembersPage({ admin: _admin }: { admin: boolean }) {
  const { universe, slug, isLoading } = useActiveUniverse();
  const permissions = useActionPermissions(universe?.id);

  if (isLoading) {
    return <LoadingNote />;
  }
  if (!universe || !permissions.can("read")) {
    return <UniverseNotFound slug={slug} />;
  }

  return <MemberList universeId={universe.id} writable={permissions.can("manage_access")} />;
}

/// What each role adds, in one line.
const ROLE_SUMMARY: Record<UniverseRole, string> = {
  viewer: "Reads shared work",
  contributor: "Starts and continues sessions, invokes bots",
  operator: "Also configures profiles, bots, environments and credentials",
  admin: "Also manages members, and reads and shares all work",
};

function roleOptions() {
  return UNIVERSE_ROLES.map((role) => (
    <option key={role} value={role}>{role}</option>
  ));
}

function MemberList({ universeId, writable }: { universeId: string; writable: boolean }) {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [removing, setRemoving] = useState<Member | null>(null);
  const members = useQuery({
    queryKey: ["members", universeId],
    queryFn: () => api<Member[]>("GET", `/api/v1/universes/${universeId}/members`),
  });
  const invalidate = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ["members", universeId] }),
    queryClient.invalidateQueries({ queryKey: ["universes"] }),
    queryClient.invalidateQueries({ queryKey: ["me"] }),
  ]);

  const remove = useMutation({
    mutationFn: (memberId: string) =>
      api("DELETE", `/api/v1/universes/${universeId}/members/${memberId}`),
    onSuccess: () => void invalidate(),
  });

  return (
    <>
      <PageHeader
        title="Members"
        description="Who can see and manage this universe."
        actions={
          writable ? (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus data-icon="inline-start" />
              Add member
            </Button>
          ) : undefined
        }
      />
      {members.isLoading && <LoadingNote />}
      {remove.error && <p className="mb-3 text-sm text-destructive">{remove.error.message}</p>}
      {members.error && <ReadError error={members.error} loading={!members.data} />}
      {members.data && (
        <TableCard className="mb-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                {writable && <TableHead>Email</TableHead>}
                <TableHead>Role</TableHead>
                {writable && (
                  <TableHead className="w-0" />
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.data.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>{member.name}</TableCell>
                  {writable && <TableCell>{member.email}</TableCell>}
                  <TableCell>
                    {member.role}
                    <span className="mt-1 block text-xs text-muted-foreground">{ROLE_SUMMARY[member.role]}</span>
                  </TableCell>
                  {writable && (
                    <TableActionsCell>
                      <IconButton
                        size="sm"
                        label={`Edit role for ${member.name || member.email}`}
                        onClick={() => setEditing(member)}
                      >
                        <PencilSimple />
                      </IconButton>
                      <IconButton
                        size="sm"
                        className="text-destructive"
                        label={`Remove ${member.name || member.email}`}
                        onClick={() => setRemoving(member)}
                      >
                        <Trash />
                      </IconButton>
                    </TableActionsCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableCard>
      )}
      <Modal
        role="alertdialog"
        size="sm"
        open={removing !== null}
        onClose={() => setRemoving(null)}
        title={`Remove ${removing?.email ?? ""}?`}
        description="They lose access to this universe on their next request. Their sessions stay."
        footer={<>
          <Button type="button" variant="outline" onClick={() => setRemoving(null)}>Cancel</Button>
          <Button
            type="button"
            variant="danger"
            onClick={() => {
              if (removing) remove.mutate(removing.id);
              setRemoving(null);
            }}
          >
            Remove
          </Button>
        </>}
      >
        {null}
      </Modal>
      {writable && (
        <AddMemberDialog
          universeId={universeId}
          open={createOpen}
          onOpenChange={setCreateOpen}
          onDone={invalidate}
        />
      )}
      {writable && editing && (
        <EditMemberRoleDialog
          key={editing.id}
          universeId={universeId}
          member={editing}
          onClose={() => setEditing(null)}
          onDone={invalidate}
        />
      )}
    </>
  );
}

function EditMemberRoleDialog({ universeId, member, onClose, onDone }: {
  universeId: string;
  member: Member;
  onClose: () => void;
  onDone: () => Promise<unknown>;
}) {
  const [role, setRole] = useState<UniverseRole>(member.role);
  const formId = useId();
  const edit = useMutation({
    mutationFn: () => api("PATCH", `/api/v1/universes/${universeId}/members/${member.id}`, { role }),
    onSuccess: async () => {
      onClose();
      await onDone();
    },
    onError: () => { void onDone(); },
  });

  return (
    <Modal
      open
      onClose={onClose}
      title="Edit universe role"
      description={`Change the role of ${member.name || member.email} in this universe. A universe keeps at least one admin.`}
      footer={<>
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" form={formId} disabled={edit.isPending || role === member.role}>
          {edit.isPending ? "Saving…" : "Save role"}
        </Button>
      </>}
    >
      <form id={formId} className="grid gap-3" onSubmit={(event) => { event.preventDefault(); edit.mutate(); }}>
        <Field id="edit-member-role" label="Role" hint={ROLE_SUMMARY[role]}>
          {(field) => (
            <Select
              {...field.control}
              value={role}
              onChange={(event) => setRole(event.target.value as UniverseRole)}
              disabled={edit.isPending}
            >
              {roleOptions()}
            </Select>
          )}
        </Field>
        {edit.error && <p role="alert" className="text-sm text-destructive">{edit.error.message}</p>}
      </form>
    </Modal>
  );
}

function AddMemberDialog({
  universeId,
  open,
  onOpenChange,
  onDone,
}: {
  universeId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
}) {
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<UniverseRole>("contributor");
  const [error, setError] = useState<string | null>(null);
  const formId = useId();

  const users = useQuery({
    queryKey: ["users"],
    queryFn: () => api<PlatformUser[]>("GET", "/api/v1/users"),
  });
  const members = useQuery({
    queryKey: ["members", universeId],
    queryFn: () => api<Member[]>("GET", `/api/v1/universes/${universeId}/members`),
    enabled: open,
  });
  const candidates = (users.data ?? []).filter((user) => !members.data?.some((member) => member.userId === user.id));

  const add = useMutation({
    mutationFn: () =>
      api("POST", `/api/v1/universes/${universeId}/members`, { userId, role }),
    onSuccess: () => {
      setUserId("");
      setError(null);
      onOpenChange(false);
      onDone();
    },
    onError: (err) => setError(err.message),
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!userId) {
      setError("pick a user to add");
      return;
    }
    add.mutate();
  };

  const userLabel = (user: PlatformUser) =>
    user.name ? `${user.name} (${user.email})` : user.email;

  return (
    <Modal
      open={open}
      onClose={() => onOpenChange(false)}
      title="Add member"
      description="Give an account access to this universe."
      footer={<>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button type="submit" form={formId} disabled={add.isPending || !userId}>
          Add member
        </Button>
      </>}
    >
      <form id={formId} onSubmit={submit} className="grid gap-3">
        <Field id="member-user" label="Account">
          {(field) => (
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <Select
                {...field.control}
                aria-describedby="member-user-note"
                className="w-full"
                value={userId}
                onChange={(event) => setUserId(event.target.value)}
              >
                <option value="" disabled>
                  {candidates.length === 0 ? "No accounts left to add" : "Pick a user…"}
                </option>
                {candidates.map((user) => (
                  <option key={user.id} value={user.id}>
                    {userLabel(user)}
                  </option>
                ))}
              </Select>
              <Select
                aria-label="Role"
                aria-describedby="member-role-summary"
                className="w-full sm:w-32"
                value={role}
                onChange={(event) => setRole(event.target.value as UniverseRole)}
              >
                {roleOptions()}
              </Select>
            </div>
          )}
        </Field>
        <p id="member-role-summary" className="text-sm text-fg-muted">{ROLE_SUMMARY[role]}</p>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <p id="member-user-note" className="text-sm text-fg-muted">
          Accounts are created by platform admins under Admin → Users.
        </p>
      </form>
    </Modal>
  );
}

interface PlatformUser {
  id: string;
  name: string | null;
  email: string;
}
