import { ReadError } from "@/components/read-error";
import { useId, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowClockwise, Key as KeyIcon, Plus, ShieldSlash } from "@phosphor-icons/react";
import type { DeploymentApiKeyCreateResponse, DeploymentApiKeyView, MethodGroup } from "@lightspeed-ai/sdk";
import { GroupSummary, KeyPresetField, MethodGroupPicker } from "@/components/api-keys/method-group-picker";
import { RotateKeyDialog } from "@/components/api-keys/rotate-key-dialog";
import { API_KEY_SECRET_DESCRIPTION, API_KEY_SECRET_TITLE, ApiKeySecret, ApiKeySecretDone } from "@/components/api-keys/secret-once";
import { Modal } from "@versavolta/whisperink/components/Modal/Modal.js";
import { api } from "@/api";
import { Badge } from "@versavolta/whisperink/components/Badge/Badge.js";
import { Button } from "@versavolta/whisperink/components/Button/Button.js";
import { IconButton } from "@versavolta/whisperink/components/Button/IconButton.js";
import { Field } from "@versavolta/whisperink/components/Field/Field.js";
import { Input } from "@versavolta/whisperink/components/Input/Input.js";
import { Table } from "@versavolta/whisperink/components/Table/Table.js";
import { TableActionsCell, TableCard, TableTitleCell } from "@/components/table-layout";
import { TBody } from "@versavolta/whisperink/components/Table/TBody.js";
import { TD } from "@versavolta/whisperink/components/Table/TD.js";
import { TH } from "@versavolta/whisperink/components/Table/TH.js";
import { THead } from "@versavolta/whisperink/components/Table/THead.js";
import { TR } from "@versavolta/whisperink/components/Table/TR.js";
import { EmptyState, LoadingNote, PageHeader, UniverseNotFound, ShowHiddenToggle } from "@/components/page";
import { useActiveUniverse } from "@/lib/universes";
import { useActionPermissions } from "@/lib/permissions";
import { DEFAULT_UNIVERSE_KEY_GROUPS, groupSummary, groupsFor } from "@/lib/method-groups";

export function ApiKeysPage({ admin: _admin }: { admin: boolean }) {
  const { universe, slug, isLoading } = useActiveUniverse();
  const permissions = useActionPermissions(universe?.id);

  if (isLoading) {
    return <LoadingNote />;
  }
  if (!universe || !permissions.can("manage_access")) {
    return <UniverseNotFound slug={slug} />;
  }

  return <ApiKeyList universeId={universe.id} />;
}

function ApiKeyList({ universeId }: { universeId: string }) {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [rotatingKey, setRotatingKey] = useState<DeploymentApiKeyView | null>(null);
  const [revokingKey, setRevokingKey] = useState<DeploymentApiKeyView | null>(null);
  const keys = useQuery({
    queryKey: ["api-keys", universeId],
    queryFn: () =>
      api<DeploymentApiKeyView[]>("GET", `/api/v1/universes/${universeId}/api-keys`),
  });
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["api-keys", universeId] });

  const revoke = useMutation({
    mutationFn: (keyPrefix: string) =>
      api<DeploymentApiKeyView>(
        "DELETE",
        `/api/v1/universes/${universeId}/api-keys/${encodeURIComponent(keyPrefix)}`,
      ),
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
        description="Universe credentials for remote agents and the public Configurator MCP endpoint."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus data-icon="inline-start" />
            Create key
          </Button>
        }
      />
      {keys.isLoading && <LoadingNote />}
      {keys.error && <ReadError error={keys.error} loading={!keys.data} />}
      {revoke.error && (
        <p className="mb-3 text-sm text-destructive">{revoke.error.message}</p>
      )}
      {keys.data && allRows.length === 0 && (
        <EmptyState icon={KeyIcon} title="No API keys yet">
          Keys let external agents and clients reach this universe and call the method groups
          they were minted with. A key's secret is shown only once.
        </EmptyState>
      )}
      {rows.length > 0 && (
        <TableCard>
          <Table>
            <THead>
              <TR>
                <TH>Key</TH>
                <TH>May call</TH>
                <TH>Created</TH>
                <TH>Last used</TH>
                <TH>Status</TH>
                <TH className="w-0" />
              </TR>
            </THead>
            <TBody>
              {rows.map((key) => {
                const revoked = key.revokedAtMs != null;
                return (
                  <TR key={key.keyPrefix}>
                    <TableTitleCell
                      title={key.displayName ?? "Unnamed key"}
                      subtitle={key.keyPrefix}
                    />
                    <TD className="text-xs text-muted-foreground">
                      <GroupSummary summary={groupSummary("universe", key.groups)} />
                      {key.assertActor && (
                        <span className="mt-1 block">Speaks for people</span>
                      )}
                    </TD>
                    <TD className="text-muted-foreground">
                      {formatTimestamp(key.createdAtMs)}
                    </TD>
                    <TD className="text-muted-foreground">
                      {key.lastUsedAtMs == null ? "Never" : formatTimestamp(key.lastUsedAtMs)}
                    </TD>
                    <TD>
                      {revoked ? (
                        <Badge outline>revoked</Badge>
                      ) : (
                        <Badge>active</Badge>
                      )}
                    </TD>
                    <TableActionsCell>
                      {!revoked && !key.assertActor && (
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
                  </TR>
                );
              })}
            </TBody>
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
      <p className="mt-4 text-sm text-muted-foreground">
        Use a key as <code className="font-mono text-xs">Authorization: Bearer lsk_…</code>.
        Keys reach this universe only. Rotate a secret to replace it immediately, or revoke
        the key and create another to change what it may call.
      </p>
      <Modal
        role="alertdialog"
        size="sm"
        open={revokingKey !== null}
        onClose={() => setRevokingKey(null)}
        title="Revoke this API key?"
        description={`${revokingKey?.displayName ?? revokingKey?.keyPrefix ?? ""} will stop working immediately. This cannot be undone; create a replacement key if needed.`}
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
        basePath={`/api/v1/universes/${universeId}/api-keys`}
        onClose={() => setRotatingKey(null)}
        onRotated={() => void invalidate()}
      />}
      <CreateApiKeyDialog
        universeId={universeId}
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={invalidate}
      />
    </>
  );
}

function CreateApiKeyDialog({
  universeId,
  open,
  onOpenChange,
  onCreated,
}: {
  universeId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const [displayName, setDisplayName] = useState("");
  const [groups, setGroups] = useState<Set<MethodGroup>>(() => new Set(DEFAULT_UNIVERSE_KEY_GROUPS));
  const [created, setCreated] = useState<DeploymentApiKeyCreateResponse | null>(null);
  const formId = useId();
  const allowed = groupsFor("universe");

  const create = useMutation({
    mutationFn: () =>
      api<DeploymentApiKeyCreateResponse>("POST", `/api/v1/universes/${universeId}/api-keys`, {
        displayName: displayName.trim(),
        groups: allowed.filter((group) => groups.has(group)),
      }),
    onSuccess: (result) => {
      setCreated(result);
      onCreated();
    },
  });

  const close = () => {
    onOpenChange(false);
    setDisplayName("");
    setGroups(new Set(DEFAULT_UNIVERSE_KEY_GROUPS));
    setCreated(null);
    create.reset();
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (displayName.trim() && groups.size > 0) {
      create.mutate();
    }
  };

  return (
    <Modal
      open={open}
      onClose={close}
      dismissible={!created}
      title={created ? API_KEY_SECRET_TITLE : "Create API key"}
      description={created
        ? API_KEY_SECRET_DESCRIPTION
        : "Name the client or agent that will use this key and choose what it may call. A key never changes; revoke it and create another to change it."}
      footer={created ? <ApiKeySecretDone onDone={close} /> : <>
        <Button type="button" variant="outline" onClick={close}>Cancel</Button>
        <Button type="submit" form={formId} disabled={create.isPending || !displayName.trim() || groups.size === 0}>
          {create.isPending ? "Creating…" : "Create key"}
        </Button>
      </>}
    >
      {created ? (
        <ApiKeySecret secret={created.secret} keyPrefix={created.apiKey.keyPrefix} />
      ) : (
        <form id={formId} onSubmit={submit} className="grid gap-4">
          <Field id="api-key-name" label="Name" hint="Shown in this list; it is not part of the secret.">
            {(field) => (
              <Input
                {...field.control}
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Production coding agent"
                maxLength={120}
                autoFocus
                required
              />
            )}
          </Field>
          <KeyPresetField groups={groups} onChange={setGroups} />
          <MethodGroupPicker idPrefix="api-key" allowed={allowed} chosen={groups} onChange={setGroups} />
          {create.error && (
            <p className="text-sm text-destructive">{create.error.message}</p>
          )}
        </form>
      )}
    </Modal>
  );
}

function formatTimestamp(value: number): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
