import { useActionPermissions } from "@/lib/permissions";
import { ConfirmDangerButton } from "@/components/confirm-danger-button";
import { ResourceIdentityCell, ResourceRow, ResourceStatus, ResourceTable, ResourceValue } from "@/components/resource-table";
import { ResourceActions, ResourceDetail, ResourceDetailsDialog, ResourceDetailsGrid } from "@/components/resource-details-dialog";
import { mcpServerStatus, resourceTimestamp } from "@/lib/resource-status";
import { ReadError } from "@/components/read-error";
import { McpToolPicker } from "@/components/mcp/tool-picker";
import { useMcpToolDiscoverySource } from "@/lib/mcp/tool-discovery";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { slugify } from "@lightspeed-ai/platform-shared";
import { ArrowCounterClockwise, ArrowSquareOut, CheckCircle, CircleNotch, HardDrives, Plus, SignIn } from "@phosphor-icons/react";
import {
  api,
  type AuthGrantOption,
  type McpOAuthFlow,
  type McpOAuthFlowStart,
  type McpServer,
  type McpServerAuthDiscovery,
} from "@/api";
import { Button } from "@versavolta/whisperink/components/Button/Button.js";
import { Checkbox } from "@versavolta/whisperink/components/Checkbox/Checkbox.js";
import { Field } from "@versavolta/whisperink/components/Field/Field.js";
import { SettingsDisclosure, SettingsGroup } from "@/components/settings-disclosure";
import { Switch } from "@versavolta/whisperink/components/Switch/Switch.js";
import { Input } from "@versavolta/whisperink/components/Input/Input.js";
import { Modal } from "@versavolta/whisperink/components/Modal/Modal.js";
import { Select } from "@versavolta/whisperink/components/Select/Select.js";
import { TD } from "@versavolta/whisperink/components/Table/TD.js";
import { EmptyState, LoadingNote, PageHeader, UniverseNotFound } from "@/components/page";
import { ProgressSteps } from "@/components/progress-steps";
import { useActiveUniverse } from "@/lib/universes";

const MCP_CREATE_STEPS = [
  { id: 1 as const, label: "Server" },
  { id: 2 as const, label: "Connection" },
];

/// U5a: the universe's MCP server registry — what the profile editor's
/// server picker links against. Full-document saves mirror the engine's
/// put-with-revision catalog semantics.
export function McpServersPage({ admin: _admin }: { admin: boolean }) {
  const { universe, slug, isLoading } = useActiveUniverse();
  const permissions = useActionPermissions(universe?.id);

  if (isLoading) {
    return <LoadingNote />;
  }
  if (!universe || !permissions.can("read")) {
    return <UniverseNotFound slug={slug} />;
  }

  return <ServerList key={universe.id} universeId={universe.id} />;
}

const APPROVALS = ["always", "never"] as const;

function ServerList({ universeId }: { universeId: string }) {
  const writable = useActionPermissions(universeId).can("configure_resource");
  const queryClient = useQueryClient();
  const servers = useQuery({
    queryKey: ["mcp-servers", universeId],
    queryFn: () => api<McpServer[]>("GET", `/api/v1/universes/${universeId}/mcp-servers`),
  });
  const authGrants = useQuery({
    queryKey: ["auth-grants", universeId],
    queryFn: () => api<AuthGrantOption[]>("GET", `/api/v1/universes/${universeId}/auth-grants`),
  });
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["mcp-servers", universeId] });
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const detailsTriggerRef = useRef<HTMLElement | null>(null);
  const [oauthServer, setOAuthServer] = useState<McpServer | null>(null);
  const selected = servers.data?.find((server) => server.serverId === selectedId);
  const rows = (servers.data ?? []).slice().sort((a, b) =>
    serverName(a).localeCompare(serverName(b)) || a.serverId.localeCompare(b.serverId),
  );
  const changed = () => {
    void invalidate();
    void queryClient.invalidateQueries({ queryKey: ["auth-grants", universeId] });
  };

  return (
    <>
      <PageHeader title="MCP servers" description="Remote tools available to profiles and sessions in this universe."
        actions={writable && <Button onClick={() => setCreateOpen(true)}><Plus data-icon="inline-start" />Add server</Button>} />
      {servers.isLoading && <LoadingNote />}
      {servers.error && <ReadError error={servers.error} loading={!servers.data} prefix="MCP servers unavailable" />}
      {authGrants.error && <ReadError error={authGrants.error} loading={!authGrants.data} prefix="Access credentials unavailable" />}
      {servers.data && rows.length === 0 && (
        <EmptyState icon={HardDrives} title="No MCP servers yet">
          Connect a remote tool server, then make its tools available to profiles and sessions.
        </EmptyState>
      )}
      {rows.length > 0 && (
        <ResourceTable label="MCP servers" columns={["Server", "URL", "Authentication", "Status"]}>
          {rows.map((server) => (
            <ResourceRow key={server.serverId} name={serverName(server)} onOpen={(trigger) => {
              detailsTriggerRef.current = trigger;
              setSelectedId(server.serverId);
            }}>
              <ResourceIdentityCell name={serverName(server)} subtitle={server.serverId} mono compactDescription={server.serverUrl} />
              <TD className="hidden max-w-64 sm:table-cell"><ResourceValue mono>{server.serverUrl}</ResourceValue></TD>
              <TD className="hidden max-w-56 sm:table-cell"><ResourceValue
                description={server.authPolicy.type.startsWith("optional") ? "Optional" : server.authPolicy.type.startsWith("required") ? "Required" : undefined}>
                {mcpAuthKind(server.authPolicy.type) === "oauth" ? "OAuth" : mcpAuthKind(server.authPolicy.type) === "bearer" ? "Bearer token" : "No authentication"}
              </ResourceValue></TD>
              <TD><ResourceStatus status={mcpServerStatus(server)} /></TD>
            </ResourceRow>
          ))}
        </ResourceTable>
      )}
      <ResourceDetailsDialog open={selected !== undefined}
        onOpenChange={(open) => { if (!open) setSelectedId(null); }}
        title={selected ? serverName(selected) : "MCP server"}
        description={selected?.description || "Connection settings and tool access."} finalFocus={detailsTriggerRef}>
        {selected && <ServerDetails key={selected.serverId} universeId={universeId} server={selected}
          authGrants={authGrants.data ?? []} authGrantsLoading={authGrants.isLoading}
          onChanged={changed} onDeleted={() => setSelectedId(null)} />}
      </ResourceDetailsDialog>
      {writable && <ServerDialog key={createOpen ? "create-open" : "create-closed"}
        universeId={universeId} open={createOpen} server={null}
        authGrants={authGrants.data ?? []} authGrantsLoading={authGrants.isLoading}
        onOpenChange={setCreateOpen} onDone={(server, connectOAuth) => {
          changed();
          if (connectOAuth) setOAuthServer(server);
        }} />}
      <OAuthDialog key={oauthServer?.serverId ?? "closed"} universeId={universeId}
        server={writable ? oauthServer : null} onOpenChange={(open) => { if (!open) setOAuthServer(null); }} onDone={changed} />
    </>
  );
}

function serverName(server: McpServer) {
  return server.displayName?.trim() || server.serverId;
}

function ServerDetails({ universeId, server, authGrants, authGrantsLoading, onChanged, onDeleted }: {
  universeId: string;
  server: McpServer;
  authGrants: AuthGrantOption[];
  authGrantsLoading: boolean;
  onChanged: () => void;
  onDeleted: () => void;
}) {
  const writable = useActionPermissions(universeId).can("configure_resource");
  const [editing, setEditing] = useState<McpServer | null>(null);
  const [oauthOpen, setOAuthOpen] = useState(false);
  const remove = useMutation({
    mutationFn: () => api("DELETE", `/api/v1/universes/${universeId}/mcp-servers/${encodeURIComponent(server.serverId)}`),
    onSuccess: () => { onChanged(); onDeleted(); },
  });
  const grant = authGrants.find((candidate) => candidate.grantId === server.credential?.grantId);
  return (
    <>
      <ResourceDetailsGrid>
        <ResourceDetail label="Server ID" mono>{server.serverId}</ResourceDetail>
        <ResourceDetail label="Status"><ResourceStatus status={mcpServerStatus(server)} /></ResourceDetail>
        <ResourceDetail label="URL" mono>{server.serverUrl}</ResourceDetail>
        <ResourceDetail label="Authentication">{authPolicyLabel(server.authPolicy.type)}</ResourceDetail>
        {server.authPolicy.type !== "none" && <ResourceDetail label="Credential">
          {grant ? authGrantLabel(grant) : server.credential?.grantId ?? "No credential connected"}
        </ResourceDetail>}
        <ResourceDetail label="Connection handled by">{server.execution === "native" ? "Lightspeed" : "Model provider"}</ResourceDetail>
        <ResourceDetail label="Tool access">{server.allowedTools?.length ? `${server.allowedTools.length} selected tools` : "All advertised tools"}</ResourceDetail>
        <ResourceDetail label="Approval">{server.approval === "always" ? "Ask before each call" : "No approval required"}</ResourceDetail>
        {server.execution === "native" && <ResourceDetail label="Tool discovery">{server.exposure === "search" ? "Search when needed" : "Available directly"}</ResourceDetail>}
        <ResourceDetail label="Private network">{server.allowPrivateNetwork ? "Allowed" : "Blocked"}</ResourceDetail>
        <ResourceDetail label="Created">{resourceTimestamp(server.createdAtMs)}</ResourceDetail>
        <ResourceDetail label="Updated">{resourceTimestamp(server.updatedAtMs)}</ResourceDetail>
      </ResourceDetailsGrid>
      {Boolean(server.allowedTools?.length) && (
        <details className="rounded-lg border p-4">
          <summary className="cursor-pointer text-sm font-medium">View selected tools</summary>
          <ul className="mt-3 grid max-h-64 gap-2 overflow-y-auto">
            {server.allowedTools!.slice().sort((a, b) => a.localeCompare(b)).map((tool) => <li key={tool} className="break-words font-mono text-xs [overflow-wrap:anywhere]">{tool}</li>)}
          </ul>
        </details>
      )}
      {writable && <ResourceActions>
        <ConfirmDangerButton label="Delete server" title={`Delete ${serverName(server)}?`}
          description={<>Profiles referencing <code>{server.serverId}</code> will lose access to this server in new sessions.</>}
          pending={remove.isPending} onConfirm={() => remove.mutateAsync()} />
        <div className="ml-auto flex flex-wrap gap-2">
          {isOAuthPolicy(server.authPolicy.type) && <Button variant="outline" size="sm" onClick={() => setOAuthOpen(true)}>
            <SignIn data-icon="inline-start" />{server.credential ? "Reconnect" : "Connect"}
          </Button>}
          <Button size="sm" onClick={() => setEditing(server)}>Edit server</Button>
        </div>
      </ResourceActions>}
      <ServerDialog key={`edit-${editing?.serverId ?? "closed"}`} universeId={universeId}
        open={writable && editing !== null} server={writable ? editing : null}
        authGrants={authGrants} authGrantsLoading={authGrantsLoading}
        onOpenChange={(open) => { if (!open) setEditing(null); }} onDone={(_saved, connectOAuth) => {
          onChanged();
          if (connectOAuth) setOAuthOpen(true);
        }} />
      <OAuthDialog key={oauthOpen ? "open" : "closed"} universeId={universeId}
        server={writable && oauthOpen ? server : null} onOpenChange={setOAuthOpen} onDone={onChanged} />
    </>
  );
}

function authPolicyLabel(type: string): string {
  switch (type) {
    case "none":
      return "No authentication";
    case "optionalBearer":
      return "Bearer token (optional)";
    case "requiredBearer":
      return "Bearer token (required)";
    case "optionalOAuth":
      return "OAuth (optional)";
    case "requiredOAuth":
      return "OAuth (required)";
    default:
      return type;
  }
}

/// One dialog for both modes: `server === null` creates; otherwise edits by
/// replacing the loaded document with its revision as the CAS guard.
type McpAuthKind = "none" | "bearer" | "oauth";

function ServerDialog({
  universeId,
  open,
  server,
  authGrants,
  authGrantsLoading,
  onOpenChange,
  onDone,
}: {
  universeId: string;
  open: boolean;
  server: McpServer | null;
  authGrants: AuthGrantOption[];
  authGrantsLoading: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: (server: McpServer, connectOAuth: boolean) => void;
}) {
  const editing = server !== null;
  const formId = useId();
  const [step, setStep] = useState<1 | 2>(editing ? 2 : 1);
  const [displayName, setDisplayName] = useState(server?.displayName ?? "");
  const [serverId, setServerId] = useState(server?.serverId ?? "");
  const [idTouched, setIdTouched] = useState(false);
  const [serverUrl, setServerUrl] = useState(server?.serverUrl ?? "");
  const [execution, setExecution] = useState<McpServer["execution"]>(
    server?.execution ?? "provider",
  );
  const [exposure, setExposure] = useState<McpServer["exposure"]>(
    server?.exposure ?? "inject",
  );
  const [allowPrivateNetwork, setAllowPrivateNetwork] = useState(
    server?.allowPrivateNetwork ?? false,
  );
  const [approval, setApproval] = useState<string>(
    server?.approval ?? "never",
  );
  const [allowedTools, setAllowedTools] = useState<string[] | undefined>(server?.allowedTools ?? undefined);
  const toolDiscoverySource = useMcpToolDiscoverySource(universeId);
  const [description, setDescription] = useState(server?.description ?? "");
  const [authPolicy, setAuthPolicy] = useState<string>(server?.authPolicy.type ?? "none");
  const [authTouched, setAuthTouched] = useState(Boolean(server));
  const [oauthResource, setOAuthResource] = useState(
    oauthPolicyString(server?.authPolicy, "resource"),
  );
  const [oauthScopes, setOAuthScopes] = useState(
    oauthPolicyScopes(server?.authPolicy).join(", "),
  );
  const [oauthMetadataUrl, setOAuthMetadataUrl] = useState(
    oauthPolicyString(server?.authPolicy, "protectedResourceMetadataUrl"),
  );
  const [oauthAuthorizationServer, setOAuthAuthorizationServer] = useState(
    oauthPolicyString(server?.authPolicy, "authorizationServer"),
  );
  const [credentialGrantId, setCredentialGrantId] = useState(
    server?.credential?.grantId ?? "",
  );
  const [status, setStatus] = useState<McpServer["status"]>(server?.status ?? "active");
  const [discovery, setDiscovery] = useState<McpServerAuthDiscovery | null>(null);
  const [lastProbedUrl, setLastProbedUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const authKind = mcpAuthKind(authPolicy);
  const compatibleGrants = authGrants
    .filter((grant) => mcpGrantCompatible(authPolicy, grant.providerKind))
    .slice()
    .sort((left, right) => authGrantLabel(left).localeCompare(authGrantLabel(right)));
  const boundGrantAvailable = compatibleGrants.some(
    (grant) => grant.grantId === credentialGrantId,
  );
  const currentOAuthScopes = oauthScopes.split(",").map((scope) => scope.trim()).filter(Boolean);
  const connectionSettingsDirty = Boolean(server && (
    serverUrl.trim() !== server.serverUrl ||
    authPolicy !== server.authPolicy.type ||
    credentialGrantId !== (server.credential?.grantId ?? "") ||
    status !== server.status ||
    allowPrivateNetwork !== server.allowPrivateNetwork ||
    (isOAuthPolicy(authPolicy) && (
      oauthResource.trim() !== oauthPolicyString(server.authPolicy, "resource") ||
      JSON.stringify(currentOAuthScopes) !== JSON.stringify(oauthPolicyScopes(server.authPolicy)) ||
      oauthMetadataUrl.trim() !== oauthPolicyString(server.authPolicy, "protectedResourceMetadataUrl") ||
      oauthAuthorizationServer.trim() !== oauthPolicyString(server.authPolicy, "authorizationServer")
    ))
  ));
  const parsedTools = [...new Set((allowedTools ?? []).map((tool) => tool.trim()).filter(Boolean))]
    .sort((left, right) => left.localeCompare(right));

  const probe = useMutation({
    mutationFn: (url: string) => api<McpServerAuthDiscovery>(
      "POST",
      `/api/v1/universes/${universeId}/mcp-servers/discover-auth`,
      { serverUrl: url },
    ),
    onSuccess: (result, url) => {
      setDiscovery(result);
      setLastProbedUrl(url);
      if (result.oauth && !authTouched) {
        setAuthPolicy("requiredOAuth");
        setOAuthResource(result.oauth.resource);
      }
    },
    onError: (_probeError, url) => {
      setDiscovery(null);
      setLastProbedUrl(url);
    },
  });

  const discoverAuth = async () => {
    const url = serverUrl.trim();
    if (editing || !isValidMcpUrl(url) || url === lastProbedUrl || probe.isPending) return;
    try {
      await probe.mutateAsync(url);
    } catch {
      // Detection is advisory. Step two always keeps the manual choices.
    }
  };

  const save = useMutation({
    mutationFn: () => {
      const credential = authPolicy === "none" || !credentialGrantId
        ? null
        : { type: "authGrant" as const, grantId: credentialGrantId };
      const nextStatus = mcpServerStatusForCredential(
        authPolicy,
        editing ? status : "active",
        credentialGrantId,
      );
      const policy = mcpAuthPolicyInput({
        type: authPolicy,
        serverUrl,
        resource: oauthResource,
        scopes: oauthScopes,
        metadataUrl: oauthMetadataUrl,
        authorizationServer: oauthAuthorizationServer,
      });
      if (!editing) {
        return api<McpServer>("POST", `/api/v1/universes/${universeId}/mcp-servers`, {
          serverId,
          serverUrl,
          defaultServerLabel: serverId,
          execution,
          exposure: execution === "native" ? exposure : "inject",
          approval: approval,
          allowPrivateNetwork,
          authPolicy: policy,
          credential,
          status: nextStatus,
          displayName: displayName.trim(),
          ...(description.trim() ? { description: description.trim() } : {}),
          allowedTools: null,
        });
      }
      return api<McpServer>(
        "PUT",
        `/api/v1/universes/${universeId}/mcp-servers/${server.serverId}`,
        {
          serverId: server.serverId,
          serverUrl,
          defaultServerLabel: server.defaultServerLabel,
          execution,
          exposure: execution === "native" ? exposure : "inject",
          revision: server.revision,
          approval: approval,
          authPolicy: policy,
          credential,
          status: nextStatus,
          displayName: displayName.trim() || null,
          description: description.trim() || null,
          allowedTools: allowedTools === undefined ? null : parsedTools,
          deferLoading: server.deferLoading ?? null,
          allowPrivateNetwork,
        },
      );
    },
    onSuccess: (savedServer) => {
      const connectOAuth = isOAuthPolicy(savedServer.authPolicy.type) &&
        !savedServer.credential;
      onOpenChange(false);
      onDone(savedServer, connectOAuth);
    },
    onError: (saveError) => setError(saveError.message),
  });

  const continueToConnection = async () => {
    if (!displayName.trim()) {
      setError("Give this server a name.");
      return;
    }
    if (!serverId.trim()) {
      setError("The server needs an ID.");
      return;
    }
    if (!isValidMcpUrl(serverUrl.trim())) {
      setError("Enter a valid http:// or https:// MCP server URL.");
      return;
    }
    setError(null);
    await discoverAuth();
    setStep(2);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!editing && step === 1) {
      void continueToConnection();
      return;
    }
    const credentialError = mcpServerCredentialError(authPolicy, credentialGrantId);
    if (credentialError) {
      setError(credentialError);
      return;
    }
    if (editing && allowedTools !== undefined && parsedTools.length === 0) {
      setError("Select at least one tool, or choose all advertised tools.");
      return;
    }
    save.mutate();
  };

  const chooseAuth = (kind: McpAuthKind) => {
    setAuthTouched(true);
    setCredentialGrantId("");
    setAuthPolicy(kind === "oauth" ? "requiredOAuth" : kind === "bearer" ? "requiredBearer" : "none");
    if (kind === "oauth" && !oauthResource) {
      setOAuthResource(discovery?.oauth?.resource ?? serverUrl.trim());
    }
  };

  const discoveryCurrent = lastProbedUrl === serverUrl.trim();
  const detectedOAuth = discoveryCurrent ? discovery?.oauth : null;
  // The id is derived from the name; it opens on its own when it ends up empty.
  const idMissing = !editing && Boolean(error) && Boolean(displayName.trim()) && !serverId.trim();
  const customOAuthSettings = authKind !== "oauth" ? 0 : [
    oauthResource.trim() &&
      oauthResource.trim() !== serverUrl.trim() &&
      oauthResource.trim() !== (discovery?.oauth?.resource ?? ""),
    currentOAuthScopes.length > 0,
    oauthMetadataUrl.trim(),
    oauthAuthorizationServer.trim(),
  ].filter(Boolean).length;

  const serverFields = (
    <>
      <Field
        id="mcp-name"
        label="Name"
        hint={editing ? (
          <>Profiles reference it as <code className="font-mono">{server.serverId}</code>.</>
        ) : undefined}
      >
        {(field) => (
          <>
            <Input
              {...field.control}
              value={displayName}
              onChange={(event) => {
                setDisplayName(event.target.value);
                if (!editing) {
                  if (!idTouched) setServerId(slugify(event.target.value));
                  setError(null);
                }
              }}
              placeholder="GitHub"
              autoFocus={!editing}
            />
            {!editing && (
              <SettingsDisclosure
                summary={serverId ? (
                  <>Profiles reference it as <code className="font-mono">{serverId}</code></>
                ) : (
                  "Profiles reference the server by an id derived from this name"
                )}
                action="Change"
                label="Change server ID"
                forceOpen={idMissing}
              >
                <Field id="mcp-id" label="Server ID" hint="Stable identifier used by profiles and sessions.">
                  {(idField) => (
                    <Input
                      {...idField.control}
                      value={serverId}
                      onChange={(event) => {
                        setServerId(event.target.value);
                        setIdTouched(true);
                      }}
                      className="font-mono"
                    />
                  )}
                </Field>
              </SettingsDisclosure>
            )}
          </>
        )}
      </Field>
      <Field
        id="mcp-url"
        label="Server URL"
        hint={editing ? undefined : (
          <AuthDiscoveryNote
            pending={probe.isPending}
            checked={discoveryCurrent}
            oauth={detectedOAuth}
            error={probe.error?.message}
          />
        )}
      >
        {(field) => (
          <Input
            {...field.control}
            value={serverUrl}
            onChange={(event) => {
              setServerUrl(event.target.value);
              if (editing) return;
              setDiscovery(null);
              setLastProbedUrl("");
              if (!authTouched) {
                setAuthPolicy("none");
                setOAuthResource("");
              }
              setError(null);
            }}
            onBlur={() => void discoverAuth()}
            placeholder="https://mcp.example.com/mcp"
            className="font-mono"
          />
        )}
      </Field>
      <Field id="mcp-description" label="Description" optional>
        {(field) => (
          <Input
            {...field.control}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="What this server offers"
          />
        )}
      </Field>
    </>
  );

  const connectionFields = (
    <>
      <Field
        label="Authentication"
        hint={authKind === "oauth"
          ? credentialGrantId
            ? "An existing OAuth connection is selected."
            : "After saving, Lightspeed will open the provider sign-in and finish setup automatically."
          : authKind === "bearer"
            ? "Choose a universe credential to send as a bearer token."
            : detectedOAuth
              ? "The server advertises OAuth, so unauthenticated access may fail."
              : "Use this for public MCP servers."}
      >
        {(field) => (
          <>
            {detectedOAuth && (
              <div className="mb-2 flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
                <CheckCircle className="size-4" />
                OAuth sign-in detected from the server
              </div>
            )}
            <Select {...field.control} className="w-full" aria-label="Authentication" value={authKind} onChange={(event) => chooseAuth(event.target.value as McpAuthKind)}>
              <option value="none">No authentication</option>
              <option value="bearer">Bearer token</option>
              <option value="oauth">OAuth sign-in</option>
            </Select>
          </>
        )}
      </Field>

      {authKind === "bearer" && (
        <CredentialSelect
          grants={compatibleGrants}
          loading={authGrantsLoading}
          value={credentialGrantId}
          boundAvailable={boundGrantAvailable}
          onChange={setCredentialGrantId}
          emptyCopy="Create a bearer credential on the Credentials page, then return here."
        />
      )}
      {authKind === "oauth" && (
        <CredentialSelect
          grants={compatibleGrants}
          loading={authGrantsLoading}
          value={credentialGrantId}
          boundAvailable={boundGrantAvailable}
          onChange={setCredentialGrantId}
          emptyCopy="Leave blank to start a new OAuth sign-in after saving."
          optional
        />
      )}

      {editing ? (
        <McpToolPicker
          scope="server"
          serverId={server.serverId}
          revision={server.revision}
          source={toolDiscoverySource}
          value={allowedTools}
          onChange={setAllowedTools}
          discoveryDisabledReason={connectionSettingsDirty
            ? "Save connection or credential changes before loading its tools."
            : undefined}
        />
      ) : (
        <p className="text-xs text-muted-foreground">
          This server will initially allow every advertised tool. After adding it and completing any
          authentication, edit the server and select its allowed tools to restrict access.
        </p>
      )}

      <SettingsDisclosure
        summary={mcpConnectionSummary({
          execution,
          exposure,
          approval,
          allowPrivateNetwork,
          customOAuthSettings,
        })}
        action="Customize"
        label="Customize connection options"
        contentClassName="gap-6"
      >
        <SettingsGroup title="Tools">
          <Field
            label="Execution"
            hint={execution === "native"
              ? "Use this for private servers and models without provider-hosted MCP. Credentials and tool traffic stay between Lightspeed and the server."
              : "The model provider lists and calls the server directly. The endpoint must be publicly reachable."}
          >
            {(field) => (
              <Select
                {...field.control}
                className="w-full"
                aria-label="MCP execution"
                value={execution}
                onChange={(event) => {
                  const value = event.target.value;
                  setExecution(value as McpServer["execution"]);
                  if (value === "provider") setExposure("inject");
                }}
              >
                <option value="provider">Model provider connects directly</option>
                <option value="native">Lightspeed connects</option>
              </Select>
            )}
          </Field>
          {execution === "native" && (
            <Field
              label="Tool exposure"
              hint={exposure === "search"
                ? "Recommended for large or frequently changing servers. Only two stable search and call tools are shown up front."
                : "Best for a small, stable inventory or a selected allowlist. The live tools are injected as ordinary function tools."}
            >
              {(field) => (
                <Select
                  {...field.control}
                  className="w-full"
                  aria-label="MCP tool exposure"
                  value={exposure}
                  onChange={(event) => setExposure(event.target.value as McpServer["exposure"])}
                >
                  <option value="inject">Show tools to the model up front</option>
                  <option value="search">Let the model search on demand</option>
                </Select>
              )}
            </Field>
          )}
          <Field label="Tool approval">
            {(field) => (
              <Select {...field.control} className="w-full" aria-label="Tool approval" value={approval} onChange={(event) => setApproval(event.target.value)}>
                {APPROVALS.map((value) => (
                  <option key={value} value={value}>{approvalLabel(value)}</option>
                ))}
              </Select>
            )}
          </Field>
        </SettingsGroup>
        <SettingsGroup title="Network">
          <Checkbox
            label="Allow private-network egress"
            description="Enables live discovery and native execution only for hosts or CIDRs in the deployment-level MCP private-network allowlist."
            checked={allowPrivateNetwork}
            onChange={(event) => setAllowPrivateNetwork(event.target.checked)}
          />
        </SettingsGroup>
        {authKind === "oauth" && (
          <SettingsGroup title="OAuth">
            <Field id="mcp-oauth-resource" label="OAuth resource">
              {(field) => (
                <Input
                  {...field.control}
                  value={oauthResource}
                  onChange={(event) => setOAuthResource(event.target.value)}
                  placeholder={serverUrl}
                  className="font-mono"
                />
              )}
            </Field>
            <Field
              id="mcp-oauth-scopes"
              label="Requested scopes"
              hint={discovery?.oauth?.scopesSupported.length ? (
                <>
                  Server advertises: {discovery.oauth.scopesSupported.join(", ")}. Add
                  scopes deliberately; discovery never expands consent.
                </>
              ) : undefined}
            >
              {(field) => (
                <Input
                  {...field.control}
                  value={oauthScopes}
                  onChange={(event) => setOAuthScopes(event.target.value)}
                  placeholder="Use server defaults"
                />
              )}
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="mcp-oauth-metadata" label="Resource metadata URL">
                {(field) => (
                  <Input
                    {...field.control}
                    value={oauthMetadataUrl}
                    onChange={(event) => setOAuthMetadataUrl(event.target.value)}
                    placeholder="Discover automatically"
                    className="font-mono"
                  />
                )}
              </Field>
              <Field id="mcp-oauth-issuer" label="Authorization server">
                {(field) => (
                  <Input
                    {...field.control}
                    value={oauthAuthorizationServer}
                    onChange={(event) => setOAuthAuthorizationServer(event.target.value)}
                    placeholder="Discover automatically"
                    className="font-mono"
                  />
                )}
              </Field>
            </div>
          </SettingsGroup>
        )}
      </SettingsDisclosure>
    </>
  );

  return (
    <Modal
      open={open}
      onClose={() => onOpenChange(false)}
      title={editing ? `Edit ${server.displayName || server.serverId}` : "Add MCP server"}
      description={editing
        ? "Update how Lightspeed connects to this server."
        : step === 1
          ? "Start with the server address. Lightspeed will check how it expects you to connect."
          : "Confirm the connection. Everything else is optional."}
      footer={<>
        {!editing && step === 2 && (
          <Button type="button" variant="outline" onClick={() => setStep(1)}>Back</Button>
        )}
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button type="submit" form={formId} disabled={save.isPending || probe.isPending}>
          {save.isPending
            ? "Saving…"
            : !editing && step === 1
              ? probe.isPending ? "Checking…" : "Continue"
              : !credentialGrantId && authKind === "oauth"
                ? editing ? "Save and connect" : "Add and connect"
                : editing ? "Save" : "Add server"}
        </Button>
      </>}
    >
      <div className="grid gap-5">
        {!editing && (
          <ProgressSteps
            steps={MCP_CREATE_STEPS}
            current={step}
            onSelect={setStep}
            label="MCP server creation progress"
          />
        )}

        <form id={formId} onSubmit={submit} className="grid gap-5">
          <div className="grid content-start gap-5">
          {editing ? (
            <>
              <div className="flex items-start justify-between gap-4">
                <div className="grid min-w-0 gap-0.5">
                  <p className="truncate text-sm font-medium">{server.displayName || server.serverId}</p>
                  <p id="mcp-status" className="text-xs text-muted-foreground">
                    {mcpStatusText(status)}
                  </p>
                </div>
                <Switch
                  id="mcp-enabled"
                  aria-label="Enabled"
                  aria-describedby="mcp-status"
                  checked={status === "active"}
                  onChange={(event) => setStatus(event.target.checked ? "active" : "disabled")}
                />
              </div>
              {serverFields}
              {connectionFields}
            </>
          ) : step === 1 ? (
            serverFields
          ) : (
            <>
              <div className="flex items-start justify-between gap-4 rounded-lg border bg-muted/15 p-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{displayName}</p>
                  <p className="truncate font-mono text-xs text-muted-foreground">{serverUrl}</p>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => setStep(1)}>
                  Change
                </Button>
              </div>
              {connectionFields}
            </>
          )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </form>
      </div>
    </Modal>
  );
}

function AuthDiscoveryNote({
  pending,
  checked,
  oauth,
  error,
}: {
  pending: boolean;
  checked: boolean;
  oauth: McpServerAuthDiscovery["oauth"];
  error?: string;
}) {
  if (pending) {
    return (
      <span className="flex items-center gap-1.5">
        <CircleNotch className="size-3.5 animate-spin" /> Checking for OAuth sign-in…
      </span>
    );
  }
  if (checked && oauth) {
    return (
      <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
        <CheckCircle className="size-3.5" /> OAuth sign-in detected
      </span>
    );
  }
  if (checked) {
    return error
      ? "Automatic detection was unavailable. You can choose authentication on the next step."
      : "No standard OAuth metadata was found. You can choose authentication on the next step.";
  }
  return "Lightspeed will check the server without saving it.";
}

function CredentialSelect({
  grants,
  loading,
  value,
  boundAvailable,
  onChange,
  emptyCopy,
  optional = false,
}: {
  grants: AuthGrantOption[];
  loading: boolean;
  value: string;
  boundAvailable: boolean;
  onChange: (value: string) => void;
  emptyCopy: string;
  optional?: boolean;
}) {
  return (
    <Field
      label="Credential"
      hint={loading
        ? "Loading credentials…"
        : grants.length === 0 && !value
          ? emptyCopy
          : optional
            ? "Reuse a compatible connection, or start a new sign-in."
            : "This credential will be used whenever the server is selected."}
    >
      {(field) => (
        <Select
          {...field.control}
          className="w-full"
          aria-label="Credential"
          value={value || "none"}
          onChange={(event) => onChange(event.target.value === "none" ? "" : event.target.value)}
        >
          <option value="none">{optional ? "Start a new sign-in" : "Choose a credential"}</option>
          {value && !boundAvailable && (
            <option value={value}>{`${value} (unavailable)`}</option>
          )}
          {grants.map((grant) => (
            <option key={grant.grantId} value={grant.grantId}>
              {authGrantLabel(grant)}
            </option>
          ))}
        </Select>
      )}
    </Field>
  );
}

function OAuthDialog({
  universeId,
  server,
  onOpenChange,
  onDone,
}: {
  universeId: string;
  server: McpServer | null;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
}) {
  const [attempt, setAttempt] = useState<McpOAuthFlowStart | null>(null);
  const [authorizationOpened, setAuthorizationOpened] = useState(false);
  const started = useRef(false);
  const finishStarted = useRef<string | null>(null);

  const start = useMutation({
    mutationFn: () => api<McpOAuthFlowStart>(
      "POST",
      `/api/v1/universes/${universeId}/mcp-servers/${server!.serverId}/oauth/start`,
      {},
    ),
    onSuccess: (nextAttempt) => setAttempt(nextAttempt),
  });
  const flow = useQuery({
    queryKey: ["mcp-oauth-flow", universeId, server?.serverId, attempt?.flowId],
    enabled: Boolean(server && attempt),
    queryFn: () => api<McpOAuthFlow>(
      "GET",
      `/api/v1/universes/${universeId}/mcp-servers/${server!.serverId}/oauth/flows/${attempt!.flowId}`,
    ),
    refetchInterval: (query) => query.state.data?.status === "pending" ? 1_500 : false,
  });
  const complete = useMutation({
    mutationFn: (flowId: string) => api<McpServer>(
      "POST",
      `/api/v1/universes/${universeId}/mcp-servers/${server!.serverId}/oauth/flows/${flowId}/complete`,
      { expectedRevision: attempt!.serverRevision },
    ),
    onSuccess: onDone,
  });

  useEffect(() => {
    if (server && !started.current) {
      started.current = true;
      start.mutate();
    }
  }, [server?.serverId]);

  useEffect(() => {
    const current = flow.data;
    if (
      current?.status === "completed" &&
      current.grantId &&
      finishStarted.current !== current.flowId
    ) {
      finishStarted.current = current.flowId;
      complete.mutate(current.flowId);
    }
  }, [flow.data?.status, flow.data?.flowId, flow.data?.grantId]);

  const retry = () => {
    finishStarted.current = null;
    setAttempt(null);
    setAuthorizationOpened(false);
    start.reset();
    complete.reset();
    start.mutate();
  };

  const terminalError = flow.data?.status === "failed"
    ? flow.data.error || "The provider refused the sign-in."
    : flow.data?.status === "expired"
      ? "This sign-in attempt expired — start it again."
      : null;

  return (
    <Modal
      open={server !== null}
      onClose={() => onOpenChange(false)}
      title={`Connect ${server?.displayName ?? server?.serverId} with OAuth`}
      description="Sign in with the provider once; Lightspeed keeps the connection for this universe and every session that uses the server."
      footer={
        <Button type="button" variant={complete.data ? "primary" : "outline"} onClick={() => onOpenChange(false)}>
          {complete.data ? "Done" : "Close"}
        </Button>
      }
    >
      <div className="grid gap-4">

        {(start.isPending || (attempt && flow.isLoading)) && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <CircleNotch className="size-4 animate-spin" /> Preparing the sign-in…
          </p>
        )}
        {attempt && flow.data?.status === "pending" && (
          <div className="grid gap-3 rounded-lg border p-4">
            <p className="text-sm">
              Sign in with the provider in the tab that opens and approve access, then come back —
              this dialog finishes on its own.
            </p>
            <Button
              type="button"
              className="w-fit"
              onClick={() => {
                window.open(attempt.authorizeUrl, "_blank", "noopener,noreferrer");
                setAuthorizationOpened(true);
              }}
            >
              <ArrowSquareOut data-icon="inline-start" />
              {authorizationOpened ? "Open the sign-in again" : "Open the sign-in"}
            </Button>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <CircleNotch className="size-3 animate-spin" /> Waiting for you to approve access…
            </p>
          </div>
        )}
        {flow.data?.status === "completed" && complete.isPending && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <CircleNotch className="size-4 animate-spin" /> Access approved — connecting the server…
          </p>
        )}
        {complete.data && (
          <div className="grid gap-1 rounded-lg border border-emerald-500/40 bg-emerald-500/5 p-4">
            <p className="text-sm font-medium">Connected</p>
            <p className="text-sm text-muted-foreground">
              {complete.data.displayName || complete.data.serverId} is signed in; profiles that link it
              get its tools in their next sessions.
            </p>
          </div>
        )}
        {(start.error || flow.error || complete.error || terminalError) && (
          <div className="grid gap-3">
            <p className="text-sm text-destructive">
              {terminalError || start.error?.message || flow.error?.message || complete.error?.message}
            </p>
            <Button type="button" variant="outline" className="w-fit" onClick={retry}>
              <ArrowCounterClockwise data-icon="inline-start" />
              Try again
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}

export function isOAuthPolicy(authPolicy: string): boolean {
  return authPolicy === "optionalOAuth" || authPolicy === "requiredOAuth";
}

export function mcpAuthKind(authPolicy: string): McpAuthKind {
  if (isOAuthPolicy(authPolicy)) return "oauth";
  if (authPolicy === "optionalBearer" || authPolicy === "requiredBearer") return "bearer";
  return "none";
}

export function isValidMcpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return (url.protocol === "http:" || url.protocol === "https:") &&
      Boolean(url.hostname) && !url.username && !url.password && !url.hash;
  } catch {
    return false;
  }
}

function approvalLabel(value: string): string {
  if (value === "always") return "Always require approval";
  return "Never require approval";
}

/// The closed connection options in words; every choice has a default, and a
/// changed one is named.
export function mcpConnectionSummary({
  execution,
  exposure,
  approval,
  allowPrivateNetwork,
  customOAuthSettings,
}: {
  execution: McpServer["execution"];
  exposure: McpServer["exposure"];
  approval: string;
  allowPrivateNetwork: boolean;
  /** How many OAuth details differ from what discovery supplies. */
  customOAuthSettings: number;
}): string {
  return [
    execution === "native" ? "Lightspeed connects" : "Model provider connects",
    execution === "native" &&
      (exposure === "search" ? "tools searched on demand" : "tools shown up front"),
    approval === "always" ? "approval: always ask" : "no approval",
    allowPrivateNetwork && "private network allowed",
    customOAuthSettings > 0 &&
      `${customOAuthSettings} custom OAuth ${customOAuthSettings === 1 ? "setting" : "settings"}`,
  ]
    .filter(Boolean)
    .join(" · ");
}

function mcpStatusText(status: McpServer["status"]): string {
  switch (status) {
    case "active":
      return "Enabled. Profiles and sessions can link it.";
    case "needsAuthConfig":
      return "Needs a credential before sessions can link it; it activates once one is connected.";
    case "unverified":
      return "Unverified: enable it once you have confirmed the connection.";
    default:
      return "Disabled. It stays configured but cannot be linked into new sessions.";
  }
}

export function mcpAuthPolicyInput({
  type,
  serverUrl,
  resource,
  scopes,
  metadataUrl,
  authorizationServer,
}: {
  type: string;
  serverUrl: string;
  resource: string;
  scopes: string;
  metadataUrl: string;
  authorizationServer: string;
}): McpServer["authPolicy"] {
  if (!isOAuthPolicy(type)) return { type };
  const scopesDefault = Array.from(new Set(
    scopes
      .split(",")
      .map((scope) => scope.trim())
      .filter(Boolean),
  ));
  return {
    type,
    resource: resource.trim() || serverUrl.trim(),
    ...(scopesDefault.length > 0 ? { scopesDefault } : {}),
    ...(metadataUrl.trim()
      ? { protectedResourceMetadataUrl: metadataUrl.trim() }
      : {}),
    ...(authorizationServer.trim()
      ? { authorizationServer: authorizationServer.trim() }
      : {}),
  };
}

function oauthPolicyString(
  policy: McpServer["authPolicy"] | undefined,
  field: string,
): string {
  const value = policy?.[field];
  return typeof value === "string" ? value : "";
}

function oauthPolicyScopes(policy: McpServer["authPolicy"] | undefined): string[] {
  const value = policy?.scopesDefault;
  return Array.isArray(value) ? value.filter((scope): scope is string => typeof scope === "string") : [];
}

export function mcpGrantCompatible(authPolicy: string, providerKind: string): boolean {
  if (authPolicy === "optionalBearer" || authPolicy === "requiredBearer") {
    return providerKind === "staticBearer";
  }
  if (authPolicy === "optionalOAuth" || authPolicy === "requiredOAuth") {
    return providerKind === "mcpOAuth";
  }
  return false;
}

export function mcpServerCredentialError(
  authPolicy: string,
  grantId: string,
): string | null {
  if (authPolicy === "none" && grantId) {
    return "A server with no authentication policy cannot have an access credential.";
  }
  return null;
}

export function mcpServerStatusForCredential(
  authPolicy: string,
  status: McpServer["status"],
  grantId: string,
): McpServer["status"] {
  const required = authPolicy === "requiredBearer" || authPolicy === "requiredOAuth";
  if (grantId && status === "needsAuthConfig") return "active";
  if (!grantId && required) return "needsAuthConfig";
  if (!required && status === "needsAuthConfig") return "active";
  return status;
}


function authGrantLabel(grant: AuthGrantOption): string {
  const name = grant.displayName || grant.subjectHint || grant.grantId;
  return `${name} (${grant.providerId})`;
}
