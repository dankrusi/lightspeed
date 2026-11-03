import { useId, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowClockwise, Key as KeyIcon, Plus, ShieldSlash } from "@phosphor-icons/react";
import type { DeploymentApiKeyCreateResponse, DeploymentApiKeyView, MethodGroup } from "@lightspeed-ai/sdk";
import { api, type Universe } from "@/api";
import { GroupSummary, MethodGroupPicker } from "@/components/api-keys/method-group-picker";
import { RotateKeyDialog } from "@/components/api-keys/rotate-key-dialog";
import { API_KEY_SECRET_DESCRIPTION, API_KEY_SECRET_TITLE, ApiKeySecret, ApiKeySecretDone } from "@/components/api-keys/secret-once";
import { Modal } from "@versavolta/whisperink/components/Modal/Modal.js";
import { Select } from "@versavolta/whisperink/components/Select/Select.js";
import { ReadError } from "@/components/read-error";
import { Badge } from "@versavolta/whisperink/components/Badge/Badge.js";
import { Button } from "@versavolta/whisperink/components/Button/Button.js";
import { IconButton } from "@versavolta/whisperink/components/Button/IconButton.js";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@versavolta/whisperink/components/Input/Input.js";
import { Label } from "@/components/ui/label";
import { Switch } from "@versavolta/whisperink/components/Switch/Switch.js";
import {
  Table,
  TableActionsCell,
  TableBody,
  TableCard,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableTitleCell,
} from "@/components/ui/table";
import { EmptyState, LoadingNote, PageHeader, ShowHiddenToggle } from "@/components/page";
import { groupSummary, groupsFor } from "@/lib/method-groups";
import { useUniverses } from "@/lib/universes";

const DEPLOYMENT = "deployment";

/// Every core key of the deployment: what it reaches, the method groups it
/// may call, and whether it may assert actors. Rotation preserves authority.
export function AdminApiKeysPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [rotatingKey, setRotatingKey] = useState<DeploymentApiKeyView | null>(null);
  const [revokingKey, setRevokingKey] = useState<DeploymentApiKeyView | null>(null);
  const keys = useQuery({
    queryKey: ["admin-api-keys"],
    queryFn: () => api<DeploymentApiKeyView[]>("GET", "/api/v1/admin/api-keys"),
  });
  const universes = useUniverses();
  const universeName = (lightspeedUniverseId: string) =>
    universes.data?.find((universe) => universe.lightspeedUniverseId === lightspeedUniverseId)?.name ?? lightspeedUniverseId;
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-api-keys"] });
  const revoke = useMutation({
    mutationFn: (keyPrefix: string) =>
      api<DeploymentApiKeyView>("DELETE", `/api/v1/admin/api-keys/${encodeURIComponent(keyPrefix)}`),
    onSuccess: () => void invalidate(),
  });
  const [showRevoked, setShowRevoked] = useState(false);
  const allRows = [...(keys.data ?? [])].sort((a, b) =>
    Number(a.revokedAtMs != null) - Number(b.revokedAtMs != null) || b.createdAtMs - a.createdAtMs);
  const revokedCount = allRows.filter((key) => key.revokedAtMs != null).length;
  const rows = showRevoked ? allRows : allRows.filter((key) => key.revokedAtMs == null);

  return (
    <>
      <PageHeader
        title="API keys"
        description="Every key of this deployment: what it reaches, which methods it may call, and whether it speaks for people."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus data-icon="inline-start" />
            Create key
          </Button>
        }
      />
      {keys.isLoading && <LoadingNote />}
      {keys.error && <ReadError error={keys.error} loading={!keys.data} />}
      {revoke.error && <p className="mb-3 text-sm text-destructive">{revoke.error.message}</p>}
      {keys.data && allRows.length === 0 && (
        <EmptyState icon={KeyIcon} title="No API keys yet">
          Keys reach the deployment or one universe and call the method groups they were minted
          with.
        </EmptyState>
      )}
      {rows.length > 0 && (
        <TableCard>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Key</TableHead>
                <TableHead>Reaches</TableHead>
                <TableHead>May call</TableHead>
                <TableHead>Last used</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-0" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((key) => {
                const revoked = key.revokedAtMs != null;
                return (
                  <TableRow key={key.keyPrefix}>
                    <TableTitleCell title={key.displayName ?? "Unnamed key"} subtitle={key.keyPrefix} />
                    <TableCell>
                      {key.scope.kind === "deployment" ? "Deployment" : universeName(key.scope.universeId)}
                      {key.assertActor && (
                        <span className="mt-1 block text-xs text-muted-foreground">Asserts people</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <GroupSummary summary={groupSummary(key.scope.kind, key.groups)} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {key.lastUsedAtMs == null ? "Never" : formatTimestamp(key.lastUsedAtMs)}
                    </TableCell>
                    <TableCell>
                      {revoked ? <Badge outline>revoked</Badge> : <Badge>active</Badge>}
                    </TableCell>
                    <TableActionsCell>
                      {!revoked && (
                        <IconButton size="sm" label={`Rotate ${key.displayName ?? key.keyPrefix}`} onClick={() => setRotatingKey(key)}>
                          <ArrowClockwise />
                        </IconButton>
                      )}
                      {!revoked && (
                        <IconButton
                          size="sm"
                          className="text-destructive"
                          label={`Revoke ${key.displayName ?? key.keyPrefix}`}
                          onClick={() => setRevokingKey(key)}
                        >
                          <ShieldSlash />
                        </IconButton>
                      )}
                    </TableActionsCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableCard>
      )}
      {keys.data && allRows.length > 0 && rows.length === 0 && (
        <p className="text-sm text-muted-foreground">Every key here is revoked.</p>
      )}
      <div className="mt-3">
        <ShowHiddenToggle
          label="Show revoked keys"
          count={revokedCount}
          checked={showRevoked}
          onCheckedChange={setShowRevoked}
        />
      </div>
      <Modal
        role="alertdialog"
        size="sm"
        open={revokingKey !== null}
        onClose={() => setRevokingKey(null)}
        title="Revoke this API key?"
        description={`${revokingKey?.displayName ?? revokingKey?.keyPrefix ?? ""} stops working immediately. This cannot be undone; mint a replacement if needed.`}
        footer={<>
          <Button type="button" variant="outline" onClick={() => setRevokingKey(null)}>Cancel</Button>
          <Button
            type="button"
            variant="danger"
            onClick={() => {
              if (revokingKey) revoke.mutate(revokingKey.keyPrefix);
              setRevokingKey(null);
            }}
          >
            Revoke key
          </Button>
        </>}
      >
        {null}
      </Modal>
      {rotatingKey && <RotateKeyDialog
        apiKey={rotatingKey}
        basePath={"/api/v1/admin/api-keys"}
        onClose={() => setRotatingKey(null)}
        onRotated={() => void invalidate()}
      />}
      <CreateKeyDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        universes={universes.data ?? []}
        onCreated={() => void invalidate()}
      />
    </>
  );
}

function CreateKeyDialog({
  open,
  onOpenChange,
  universes,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  universes: Universe[];
  onCreated: () => void;
}) {
  const [displayName, setDisplayName] = useState("");
  const [scope, setScope] = useState<string>(DEPLOYMENT);
  const [groups, setGroups] = useState<Set<MethodGroup> | null>(null);
  const [assertActor, setAssertActor] = useState(false);
  const [created, setCreated] = useState<DeploymentApiKeyCreateResponse | null>(null);
  const formId = useId();
  const kind = scope === DEPLOYMENT ? "deployment" : "universe";
  const allowed = groupsFor(kind);
  // Null means every group the scope allows, which a new key starts with.
  const chosen = groups ?? new Set(allowed);

  const create = useMutation({
    mutationFn: () =>
      api<DeploymentApiKeyCreateResponse>("POST", "/api/v1/admin/api-keys", {
        displayName: displayName.trim(),
        scope: kind === "deployment" ? { kind } : { kind, universeId: scope },
        ...(groups ? { groups: allowed.filter((group) => groups.has(group)) } : {}),
        assertActor,
      }),
    onSuccess: (result) => {
      setCreated(result);
      onCreated();
    },
  });

  const close = () => {
    onOpenChange(false);
    setDisplayName("");
    setScope(DEPLOYMENT);
    setGroups(null);
    setAssertActor(false);
    setCreated(null);
    create.reset();
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (displayName.trim() && chosen.size > 0) create.mutate();
  };

  return (
    <Modal
      open={open}
      onClose={close}
      dismissible={!created}
      title={created ? API_KEY_SECRET_TITLE : "Create API key"}
      description={created
        ? API_KEY_SECRET_DESCRIPTION
        : "Choose what the key reaches and which methods it may call. A key never changes; revoke it and mint another to change it."}
      footer={created ? <ApiKeySecretDone onDone={close} /> : <>
        <Button type="button" variant="outline" onClick={close}>Cancel</Button>
        <Button type="submit" form={formId} disabled={create.isPending || !displayName.trim() || chosen.size === 0}>
          {create.isPending ? "Creating…" : "Create key"}
        </Button>
      </>}
    >
      {created ? (
        <ApiKeySecret secret={created.secret} keyPrefix={created.apiKey.keyPrefix} />
      ) : (
        <form id={formId} onSubmit={submit} className="grid gap-4">
          <Field>
            <FieldLabel htmlFor="admin-key-name">Name</FieldLabel>
            <Input
              id="admin-key-name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Telegram connector"
              maxLength={120}
              autoFocus
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="admin-key-scope">Reaches</FieldLabel>
            <Select
              id="admin-key-scope"
              className="w-full"
              value={scope}
              onChange={(event) => { setScope(event.target.value); setGroups(null); }}
            >
              <option value={DEPLOYMENT}>The deployment</option>
              {universes.map((universe) => (
                <option key={universe.id} value={universe.id}>{universe.name}</option>
              ))}
            </Select>
            <FieldDescription>
              {kind === "deployment"
                ? "A deployment key names the universe of each call and may hold deployment groups."
                : "A universe key reaches only this universe."}
            </FieldDescription>
          </Field>
          <MethodGroupPicker idPrefix="admin-key" allowed={allowed} chosen={chosen} onChange={setGroups} />
          <div className="flex items-center justify-between gap-3 rounded-md border p-3">
            <Label htmlFor="admin-key-assert-actor" className="min-w-0 text-sm">
              Speaks for people
              <span className="block text-xs font-normal text-muted-foreground">
                May name the person a call is for. Give it only to a gate that signs people in,
                like this Platform.
              </span>
            </Label>
            <Switch id="admin-key-assert-actor" checked={assertActor} onChange={(event) => setAssertActor(event.target.checked)} />
          </div>
          {create.error && <p className="text-sm text-destructive">{create.error.message}</p>}
        </form>
      )}
    </Modal>
  );
}

function formatTimestamp(value: number): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
