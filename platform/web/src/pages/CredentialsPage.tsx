import { useActionPermissions } from "@/lib/permissions";
import { ReadError } from "@/components/read-error";
import { useId, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, KeyRound, LockKeyhole, Plus, ShieldOff } from "lucide-react";
import {
  api,
  type GitHubApp,
  type GitHubIntegration,
  type SecretGrant,
  type SecretsInventory,
} from "@/api";
import { Menu } from "@versavolta/whisperink/components/Menu/Menu.js";
import { MenuItem } from "@versavolta/whisperink/components/Menu/MenuItem.js";
import { Modal } from "@versavolta/whisperink/components/Modal/Modal.js";
import { Select } from "@versavolta/whisperink/components/Select/Select.js";
import { Badge } from "@versavolta/whisperink/components/Badge/Badge.js";
import { Button } from "@versavolta/whisperink/components/Button/Button.js";
import { IconButton } from "@versavolta/whisperink/components/Button/IconButton.js";
import { Checkbox } from "@versavolta/whisperink/components/Checkbox/Checkbox.js";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@versavolta/whisperink/components/Input/Input.js";
import { SettingsDisclosure } from "@/components/ui/settings-disclosure";
import { Textarea } from "@versavolta/whisperink/components/Textarea/Textarea.js";
import {
  IdText,
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
import { EmptyState, LoadingNote, PageHeader, SectionHeader, ShowHiddenToggle, UniverseNotFound } from "@/components/page";
import {
  GitHubAppDetails,
  GitHubAppForm,
  GitHubAppStatusBadge,
} from "@/components/credentials/github-app";
import { GitHubLogo } from "@/components/icons/logos";
import { isSubscriptionGrant } from "@/lib/subscriptions";
import { useActiveUniverse } from "@/lib/universes";

type SecretKind = "bearer" | "environment";

/// Grant kinds listed as reusable credentials: pasted tokens and secrets,
/// GitHub App installations and custom OAuth.
const REUSABLE_CREDENTIAL_KINDS = new Set(["staticBearer", "gitHubApp", "customOAuth"]);

/// A credential made for exactly one thing lives on that thing's page: model
/// keys and subscription logins on Models, MCP server logins on MCP servers,
/// channel bot tokens on Channels. Credential pickers elsewhere still offer
/// every grant.
export function isReusableCredential(
  grant: Pick<SecretGrant, "providerKind" | "providerId" | "metadata">,
): boolean {
  return REUSABLE_CREDENTIAL_KINDS.has(grant.providerKind)
    && !isSubscriptionGrant(grant)
    && grant.providerId !== "telegram";
}

export function CredentialsPage({ admin: _admin }: { admin: boolean }) {
  const { universe, slug, isLoading } = useActiveUniverse();
  const permissions = useActionPermissions(universe?.id);

  if (isLoading) {
    return <LoadingNote />;
  }
  if (!universe || !permissions.can("configure_resource")) {
    return <UniverseNotFound slug={slug} />;
  }

  return <CredentialList universeId={universe.id} slug={universe.slug} />;
}

function CredentialList({ universeId, slug }: { universeId: string; slug: string }) {
  const queryClient = useQueryClient();
  const [pasteOpen, setPasteOpen] = useState(false);
  const [gitHubOpen, setGitHubOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [revokingGrant, setRevokingGrant] = useState<SecretGrant | null>(null);
  const inventory = useQuery({
    queryKey: ["secrets", universeId],
    queryFn: () =>
      api<SecretsInventory>("GET", `/api/v1/universes/${universeId}/secrets`),
  });
  const github = useQuery({
    queryKey: ["integrations", "github", universeId],
    queryFn: () =>
      api<GitHubIntegration>("GET", `/api/v1/universes/${universeId}/integrations/github`),
  });
  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["secrets", universeId] }),
      queryClient.invalidateQueries({ queryKey: ["auth-grants", universeId] }),
      queryClient.invalidateQueries({ queryKey: ["models", universeId] }),
      queryClient.invalidateQueries({ queryKey: ["integrations"] }),
    ]);

  const revokeGrant = useMutation({
    mutationFn: (grantId: string) =>
      api<SecretGrant>(
        "DELETE",
        `/api/v1/universes/${universeId}/secrets/grants/${encodeURIComponent(grantId)}`,
      ),
    onSuccess: () => void invalidate(),
  });

  const [showRevoked, setShowRevoked] = useState(false);
  const allGrants = inventory.data?.grants ?? [];
  const reusable = allGrants
    .filter(isReusableCredential)
    .sort((a, b) => b.createdAtMs - a.createdAtMs);
  const revokedCount = reusable.filter((grant) => grant.status === "revoked").length;
  const grants = showRevoked ? reusable : reusable.filter((grant) => grant.status !== "revoked");
  const apps = github.data?.apps ?? [];
  const appGrants = (app: GitHubApp) =>
    (github.data?.grants ?? []).filter((grant) => grant.providerId === app.providerId);
  const openApp = apps.find((app) => app.providerId === selectedApp) ?? null;

  return (
    <>
      <PageHeader
        title="Credentials"
        description="Reusable tokens and secrets owned by this universe. Environments, MCP servers and bot triggers reference them without exposing their values; retrievable credentials may be leased by trusted services."
        actions={
          <Menu align="end" trigger={({ open, toggle }) => (
            <Button aria-haspopup="menu" aria-expanded={open} onClick={toggle}>
              <Plus data-icon="inline-start" />
              Add credential
            </Button>
          )}>
            <MenuItem icon={<KeyRound />} onClick={() => setPasteOpen(true)}>
              Paste a token or secret
            </MenuItem>
            <MenuItem icon={<GitHubLogo />} onClick={() => setGitHubOpen(true)}>
              Connect a GitHub App
            </MenuItem>
          </Menu>
        }
      />
      <p className="mb-4 text-sm text-muted-foreground">
        Model keys and subscription logins are managed on{" "}
        <Link to={`/u/${slug}/models`} className="underline underline-offset-2">Models</Link>, MCP
        server logins on{" "}
        <Link to={`/u/${slug}/mcp-servers`} className="underline underline-offset-2">MCP servers</Link>.
      </p>
      {inventory.isLoading && <LoadingNote />}
      {inventory.error && (
        <ReadError error={inventory.error} loading={!inventory.data} />
      )}
      {revokeGrant.error && (
        <p className="mb-4 text-sm text-destructive">{revokeGrant.error.message}</p>
      )}
      {inventory.data && reusable.length === 0 && (
        <EmptyState icon={LockKeyhole} title="No credentials yet">
          Tokens, environment secrets and GitHub App installations live here, bound to
          environments, MCP servers and bot triggers without exposing their values.
        </EmptyState>
      )}
      {grants.length > 0 && (
        <TableCard>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Credential</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Exposure</TableHead>
                <TableHead>Last leased</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-0" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {grants.map((grant) => (
                <TableRow key={grant.grantId}>
                  <TableTitleCell
                    title={grant.displayName ?? grant.subjectHint ?? "Unnamed credential"}
                    subtitle={grant.grantId}
                  />
                  <TableCell className="max-w-48 text-muted-foreground">
                    <IdText>{grant.providerId}</IdText>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {grantTypeLabel(grant)}
                    {managedBy(grant) && (
                      <Badge outline className="ml-2 font-normal">
                        {managedBy(grant)}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge outline={grant.exposure !== "retrievable"}>
                      {grant.exposure}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {grant.lastLeasedAtMs ? formatTimestamp(grant.lastLeasedAtMs) : "Never"}
                    {grant.leaseCount > 0 && (
                      <span className="ml-1 text-xs">({grant.leaseCount})</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <GrantStatusBadge status={grant.status} />
                  </TableCell>
                  <TableActionsCell>
                    {grant.status !== "revoked" && (
                      <IconButton
                        size="sm"
                        className="text-destructive"
                        label={`Revoke ${grant.displayName ?? grant.grantId}`}
                        onClick={() => setRevokingGrant(grant)}
                      >
                        <ShieldOff />
                      </IconButton>
                    )}
                  </TableActionsCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableCard>
      )}
      {inventory.data && reusable.length > 0 && grants.length === 0 && (
        <p className="text-sm text-muted-foreground">Every credential here is revoked.</p>
      )}
      <div className="mt-3">
        <ShowHiddenToggle
          label="Show revoked credentials"
          count={revokedCount}
          checked={showRevoked}
          onCheckedChange={setShowRevoked}
        />
      </div>

      {github.error && (
        <ReadError error={github.error} loading={!github.data} prefix="GitHub Apps unavailable" className="mt-8" />
      )}
      {apps.length > 0 && (
        <section className="mt-8">
          <SectionHeader
            title="GitHub Apps"
            description="Open an App to grant its installations; each granted installation is listed above as a credential."
          />
          <TableCard>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>App</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-0" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {apps.map((app) => {
                  const granted = appGrants(app).filter((grant) => grant.status === "active").length;
                  return (
                    <TableRow
                      key={app.providerId}
                      className="cursor-pointer"
                      onClick={() => setSelectedApp(app.providerId)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <GitHubLogo className="shrink-0" />
                          <div className="grid gap-0.5">
                            <span className="font-medium">
                              {app.displayName ?? `GitHub App ${app.config.appId}`}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              App ID {app.config.appId} · {granted} installation{granted === 1 ? "" : "s"} granted
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <GitHubAppStatusBadge app={app} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <ChevronRight className="size-4" />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableCard>
        </section>
      )}

      <p className="mt-6 text-sm text-muted-foreground">
        GitHub App installations and OAuth connections appear here automatically; revoking one
        here disconnects it there.
      </p>
      <PasteCredentialDialog
        universeId={universeId}
        open={pasteOpen}
        onOpenChange={setPasteOpen}
        onCreated={invalidate}
        existingGrants={allGrants}
      />
      <AddGitHubAppDialog
        universeId={universeId}
        open={gitHubOpen}
        onOpenChange={setGitHubOpen}
        onCreated={invalidate}
      />
      <Modal
        role="alertdialog"
        size="sm"
        open={revokingGrant !== null}
        onClose={() => setRevokingGrant(null)}
        title="Revoke this credential?"
        description={`Anything referencing ${revokingGrant?.grantId ?? ""} will stop receiving its token. This cannot be undone.`}
        footer={<>
          <Button type="button" variant="outline" onClick={() => setRevokingGrant(null)}>Cancel</Button>
          <Button
            type="button"
            variant="danger"
            onClick={() => {
              if (revokingGrant) revokeGrant.mutate(revokingGrant.grantId);
              setRevokingGrant(null);
            }}
          >
            Revoke credential
          </Button>
        </>}
      >
        {null}
      </Modal>
      <Modal
        open={openApp !== null}
        onClose={() => setSelectedApp(null)}
        size="lg"
        title={openApp ? openApp.displayName ?? `GitHub App ${openApp.config.appId}` : ""}
      >
        {openApp && (
          <GitHubAppDetails
            universeId={universeId}
            app={openApp}
            grants={appGrants(openApp)}
            onChanged={() => void invalidate()}
            onRemoved={() => {
              void invalidate();
              setSelectedApp(null);
            }}
          />
        )}
      </Modal>
    </>
  );
}

/// Register a GitHub App; its installations are granted from its details.
function AddGitHubAppDialog({
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
  const [done, setDone] = useState(false);
  const close = () => {
    onOpenChange(false);
    setDone(false);
  };
  return (
    <Modal
      open={open}
      onClose={close}
      title="GitHub App"
      footer={done ? <Button onClick={close}>Done</Button> : undefined}
    >
      {done ? (
        <p className="text-sm">
          GitHub App added. Open it under GitHub Apps to grant installations once the App is
          installed on your GitHub accounts.
        </p>
      ) : (
        <GitHubAppForm
          universeId={universeId}
          onCreated={() => {
            onCreated();
            setDone(true);
          }}
          onCancel={close}
        />
      )}
    </Modal>
  );
}

function PasteCredentialDialog({
  universeId,
  open,
  onOpenChange,
  onCreated,
  existingGrants,
}: {
  universeId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
  existingGrants: SecretGrant[];
}) {
  const [kind, setKind] = useState<SecretKind>("environment");
  const [displayName, setDisplayName] = useState("");
  const [grantId, setGrantId] = useState("");
  const [secret, setSecret] = useState("");
  const [retrievable, setRetrievable] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formId = useId();

  const reset = () => {
    setKind("environment");
    setDisplayName("");
    setGrantId("");
    setSecret("");
    setRetrievable(false);
    setError(null);
    create.reset();
  };

  const create = useMutation<SecretGrant, Error, void>({
    mutationFn: () => {
      if (kind === "environment") {
        return api<SecretGrant>(
          "POST",
          `/api/v1/universes/${universeId}/secrets/environment`,
          {
            value: secret,
            ...(grantId.trim() ? { grantId: grantId.trim() } : {}),
            ...(displayName.trim() ? { displayName: displayName.trim() } : {}),
          },
        );
      }
      return api<SecretGrant>(
        "POST",
        `/api/v1/universes/${universeId}/secrets/grants`,
        {
          token: secret,
          exposure: retrievable ? "retrievable" : "brokered",
          ...(grantId.trim() ? { grantId: grantId.trim() } : {}),
          ...(displayName.trim() ? { displayName: displayName.trim() } : {}),
        },
      );
    },
    onSuccess: () => {
      onCreated();
      onOpenChange(false);
      reset();
    },
    onError: (reason) => setError(reason.message),
  });

  const idConflict = existingGrants.find(
    (candidate) => candidate.grantId === grantId.trim(),
  );

  const changeKind = (nextKind: SecretKind) => {
    setKind(nextKind);
    setGrantId("");
    setSecret("");
    setRetrievable(false);
    setError(null);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!secret) {
      setError("a secret value is required");
      return;
    }
    if (idConflict) {
      setError(credentialIdConflictMessage(idConflict));
      return;
    }
    create.mutate();
  };

  const close = () => {
    onOpenChange(false);
    reset();
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Paste a token or secret"
      description="The value is sent once to Lightspeed, encrypted, and never returned to this browser."
      footer={<>
        <Button type="button" variant="outline" onClick={close}>
          Cancel
        </Button>
        <Button type="submit" form={formId} disabled={create.isPending}>
          {create.isPending ? "Encrypting…" : "Add credential"}
        </Button>
      </>}
    >
      <form id={formId} onSubmit={submit} className="grid gap-4">
        <Field>
          <FieldLabel>Secret type</FieldLabel>
          <Select
            className="w-full"
            aria-label="Secret type"
            value={kind}
            onChange={(event) => changeKind(event.target.value as SecretKind)}
          >
            <option value="environment">Environment secret</option>
            <option value="bearer">Bearer token</option>
          </Select>
          <FieldDescription>
            {kind === "environment"
              ? "Stores an opaque value for injection into an environment variable. Multiline values such as SSH private keys are preserved."
              : "Creates a revocable access credential that MCP servers or environments can reference."}
          </FieldDescription>
        </Field>
        {kind === "bearer" && (
          <Field className="rounded-lg border bg-muted/15 p-3">
            <label className="flex items-start gap-3">
              <Checkbox
                checked={retrievable}
                onChange={(event) => setRetrievable(event.target.checked)}
                aria-label="Allow trusted services to retrieve this credential"
              />
              <span className="grid gap-1">
                <span className="text-sm font-medium">Retrievable by trusted services</span>
                <span className="text-xs text-muted-foreground">
                  Required for Bot webhook signatures and authenticated HTTP polls. Trusted
                  service workers can lease the plaintext into memory; every lease is audited.
                  This choice cannot be changed later.
                </span>
              </span>
            </label>
          </Field>
        )}
        <Field>
          <FieldLabel htmlFor="secret-name">Display name</FieldLabel>
          <Input
            id="secret-name"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder={kind === "environment" ? "px-dev SSH private key" : "GitHub deploy token"}
            autoFocus
          />
        </Field>
        {/* Keyed by type: changing the type clears the ID and closes its field. */}
        <SettingsDisclosure
          key={kind}
          summary={grantId.trim() ? `Credential ID ${grantId.trim()}` : "Generated credential ID"}
          action="Change"
          label="Change credential ID"
          forceOpen={Boolean(error) && idConflict !== undefined}
        >
          <Field>
            <FieldLabel htmlFor="secret-grant-id">Custom credential ID</FieldLabel>
            <Input
              id="secret-grant-id"
              value={grantId}
              onChange={(event) => {
                setGrantId(event.target.value);
                setError(null);
              }}
              placeholder="Generated automatically when blank"
              className="font-mono"
            />
            <FieldDescription>
              Useful for automation and stable references. It must be unique and cannot be
              changed or reused after this credential is revoked.
            </FieldDescription>
          </Field>
        </SettingsDisclosure>
        <Field>
          <FieldLabel htmlFor="secret-value">Secret value</FieldLabel>
          {kind === "environment" ? (
            <Textarea
              id="secret-value"
              value={secret}
              onChange={(event) => setSecret(event.target.value)}
              autoComplete="off"
              spellCheck={false}
              className="min-h-36 resize-y font-mono"
              placeholder="Paste the value exactly, including any line breaks"
            />
          ) : (
            <Input
              id="secret-value"
              type="password"
              value={secret}
              onChange={(event) => setSecret(event.target.value)}
              autoComplete="new-password"
              spellCheck={false}
              className="font-mono"
            />
          )}
          <FieldDescription>
            {kind === "environment"
              ? "Line breaks and surrounding whitespace are preserved exactly. The value is cleared from this form after creation."
              : "Whitespace is preserved. Paste the value exactly as issued."}
          </FieldDescription>
        </Field>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </form>
    </Modal>
  );
}

function credentialIdConflictMessage(grant: SecretGrant): string {
  return grant.status === "revoked"
    ? `Credential ID "${grant.grantId}" belongs to a revoked access credential and cannot be reused. Leave it blank to generate a new ID or choose another.`
    : `Credential ID "${grant.grantId}" already belongs to a ${grant.status} access credential. Leave it blank to generate a new ID or choose another.`;
}

function GrantStatusBadge({ status }: { status: SecretGrant["status"] }) {
  if (status === "active") {
    return <Badge>active</Badge>;
  }
  if (status === "needsReauth" || status === "failed") {
    return (
      <Badge outline className="border-destructive/50 text-destructive">
        {status === "needsReauth" ? "needs reauth" : status}
      </Badge>
    );
  }
  return <Badge outline>revoked</Badge>;
}

/// What created a grant, for the list tag; null for plain tokens and secrets.
function managedBy(grant: SecretGrant): string | null {
  return grant.providerKind === "gitHubApp" ? "GitHub App" : null;
}

function grantTypeLabel(grant: SecretGrant): string {
  if (grant.providerId === "environment-secret") return "Environment secret";
  if (grant.providerKind === "staticBearer") return "Bearer token";
  if (grant.hasRefreshToken) return "OAuth (refreshable)";
  return grant.providerKind;
}

function formatTimestamp(timestampMs: number): string {
  if (!timestampMs) return "—";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestampMs));
}
