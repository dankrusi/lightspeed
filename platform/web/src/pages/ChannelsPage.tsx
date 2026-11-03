import { useActionPermissions } from "@/lib/permissions";
import { ReadError } from "@/components/read-error";
import { useId, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Broadcast, Plugs, Plus } from "@phosphor-icons/react";
import {
  api,
  type ChannelAccountInput,
  type ChannelAccountListResponse,
  type ChannelAccountView,
  type ChannelConnectorHealth,
  type ChannelPairingListResponse,
  type ChannelPairingView,
  type UniverseChannelStatus,
} from "@/api";
import { Modal } from "@versavolta/whisperink/components/Modal/Modal.js";
import { Select } from "@versavolta/whisperink/components/Select/Select.js";
import { Badge } from "@versavolta/whisperink/components/Badge/Badge.js";
import { Button } from "@versavolta/whisperink/components/Button/Button.js";
import { IconButton } from "@versavolta/whisperink/components/Button/IconButton.js";
import { buttonClasses } from "@versavolta/whisperink/components/Button/button-classes.js";
import { Card } from "@versavolta/whisperink/components/Card/Card.js";
import { CardContent } from "@versavolta/whisperink/components/Card/CardContent.js";
import { CardHeader } from "@versavolta/whisperink/components/Card/CardHeader.js";
import { Checkbox } from "@versavolta/whisperink/components/Checkbox/Checkbox.js";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@versavolta/whisperink/components/Input/Input.js";
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
import { EmptyState, LoadingNote, PageHeader, UniverseNotFound } from "@/components/page";
import { useActiveUniverse } from "@/lib/universes";

export function ChannelsPage({ admin: _admin }: { admin: boolean }) {
  const { universe, slug, isLoading } = useActiveUniverse();
  const permissions = useActionPermissions(universe?.id);
  if (isLoading) return <LoadingNote />;
  if (!universe || !permissions.can("configure_resource")) return <UniverseNotFound slug={slug} />;
  return <Channels universeId={universe.id} slug={universe.slug} />;
}

function Channels({ universeId, slug }: { universeId: string; slug: string }) {
  const queryClient = useQueryClient();
  const [connectOpen, setConnectOpen] = useState(false);
  const [unpairing, setUnpairing] = useState<ChannelPairingView | null>(null);
  const accounts = useQuery({
    queryKey: ["channel-accounts", universeId],
    queryFn: () => api<ChannelAccountListResponse>(
      "GET",
      `/api/v1/universes/${universeId}/channel-accounts`,
    ),
  });
  const pairings = useQuery({
    queryKey: ["channel-pairings", universeId],
    queryFn: () => api<ChannelPairingListResponse>(
      "GET",
      `/api/v1/universes/${universeId}/channel-pairings`,
    ),
  });
  const status = useQuery({
    queryKey: ["channel-status", universeId],
    queryFn: () => api<UniverseChannelStatus>(
      "GET",
      `/api/v1/universes/${universeId}/channel-status`,
    ),
    refetchInterval: 10_000,
  });
  const healthByAccount = useMemo(() => new Map(
    (status.data?.accounts ?? [])
      .map((health) => [health.accountId, health]),
  ), [status.data]);
  const accountRows = accounts.data?.accounts ?? [];
  const pairingRows = pairings.data?.pairings ?? [];

  const toggle = useMutation({
    mutationFn: (account: ChannelAccountView) =>
      api("PUT", `/api/v1/universes/${universeId}/channel-accounts/${account.accountId}`, {
        account: { ...accountInputOf(account), enabled: !(account.enabled ?? true) },
        expectedRevision: account.revision,
      }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["channel-accounts", universeId] }),
        queryClient.invalidateQueries({ queryKey: ["channel-status", universeId] }),
      ]);
    },
  });
  const unpair = useMutation({
    mutationFn: (pairing: ChannelPairingView) => api(
      "DELETE",
      `/api/v1/universes/${universeId}/channel-pairings/${encodeURIComponent(pairing.accountId)}/${encodeURIComponent(pairing.chatId)}`,
    ),
    onSuccess: () => queryClient.invalidateQueries({
      queryKey: ["channel-pairings", universeId],
    }),
  });

  return (
    <>
      <PageHeader
        title="Channels"
        description="Connect messaging accounts to this universe, then route conversations from your bots."
        actions={
          <Button onClick={() => setConnectOpen(true)}>
            <Plus data-icon="inline-start" />
            Connect channel
          </Button>
        }
      />
      <Modal
        role="alertdialog"
        size="sm"
        open={unpairing !== null}
        onClose={() => setUnpairing(null)}
        title="Unpair this conversation?"
        description={`It stops routing to ${unpairing?.botId ?? ""}. The conversation must connect or present a pairing code again.`}
        footer={<>
          <Button type="button" variant="outline" onClick={() => setUnpairing(null)}>Cancel</Button>
          <Button
            type="button"
            variant="danger"
            onClick={() => {
              if (unpairing) unpair.mutate(unpairing);
              setUnpairing(null);
            }}
          >
            Unpair
          </Button>
        </>}
      >
        {null}
      </Modal>
      <ConnectChannelDialog
        universeId={universeId}
        open={connectOpen}
        onOpenChange={setConnectOpen}
      />
      {(accounts.isLoading || pairings.isLoading) && <LoadingNote />}
      {accounts.error && <ReadError error={accounts.error} loading={!accounts.data} className="mb-4" />}
      {status.error && (
        <ReadError error={status.error} loading={!status.data} prefix="Connector health unavailable" className="mb-4" />
      )}
      {toggle.error && <p className="mb-4 text-sm text-destructive">{toggle.error.message}</p>}

      {accounts.data && accountRows.length === 0 ? (
        <EmptyState icon={Broadcast} title="No messaging accounts yet">
          Telegram bots and WhatsApp numbers that bots talk through; their credentials are kept for
          you.
        </EmptyState>
      ) : (
        <div className="grid gap-6">
          <Card>
            <CardHeader
              title="Messaging accounts"
              description="Credentials are encrypted automatically. Add a chat trigger on a bot to start routing messages."
            />
            <CardContent>
              {accounts.data && (
                <TableCard>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Account</TableHead>
                        <TableHead>Provider</TableHead>
                        <TableHead>Connection</TableHead>
                        <TableHead>Conversations</TableHead>
                        <TableHead className="w-0" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {accountRows.map((account) => (
                        <TableRow key={account.accountId}>
                          <TableTitleCell title={account.displayName} subtitle={account.accountId} />
                          <TableCell>
                            <span className="capitalize">{account.provider}</span>
                            <span className="block text-xs text-muted-foreground">
                              {providerAccountLabel(account)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <AccountStatusBadge
                              account={account}
                              health={healthByAccount.get(account.accountId)}
                            />
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {pairingRows.filter((pairing) => pairing.accountId === account.accountId).length}
                          </TableCell>
                          <TableActionsCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={toggle.isPending}
                              onClick={() => toggle.mutate(account)}
                            >
                              {(account.enabled ?? true) ? "Disable" : "Enable"}
                            </Button>
                          </TableActionsCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableCard>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              title="Connected conversations"
              description="Pairings bind one provider conversation to one bot trigger. Unpairing makes that conversation connect again."
              action={
                <Link to={`/u/${slug}/bots`} className={buttonClasses("outline", "sm")}>
                  View bots
                </Link>
              }
            />
            <CardContent>
              {pairings.error && <ReadError error={pairings.error} loading={!pairings.data} />}
              {pairings.data && pairingRows.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No conversations have connected yet.
                </p>
              )}
              {pairings.data && pairingRows.length > 0 && (
                <TableCard>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Account</TableHead>
                        <TableHead>Bot trigger</TableHead>
                        <TableHead>Conversation</TableHead>
                        <TableHead>Connected</TableHead>
                        <TableHead className="w-0" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pairingRows.map((pairing) => (
                        <TableRow key={`${pairing.accountId}/${pairing.chatId}`}>
                          <TableCell>{accountName(accountRows, pairing.accountId)}</TableCell>
                          <TableCell>
                            {pairing.botId}
                            <span className="block text-xs text-muted-foreground">{pairing.triggerId}</span>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{pairing.chatId}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(pairing.pairedAtMs).toLocaleString()}
                          </TableCell>
                          <TableActionsCell>
                            <IconButton
                              size="sm"
                              className="text-destructive"
                              label={`Unpair conversation ${pairing.chatId}`}
                              onClick={() => setUnpairing(pairing)}
                            >
                              <Plugs />
                            </IconButton>
                          </TableActionsCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableCard>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

function ConnectChannelDialog({
  universeId,
  open,
  onOpenChange,
}: {
  universeId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [provider, setProvider] = useState<"telegram" | "whatsapp">("telegram");
  const [token, setToken] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [printQr, setPrintQr] = useState(true);
  const formId = useId();

  const connect = useMutation({
    mutationFn: () => api(
      "POST",
      `/api/v1/universes/${universeId}/channel-accounts/connect`,
      provider === "telegram"
        ? {
            provider,
            token: token.trim(),
            ...(displayName.trim() ? { displayName: displayName.trim() } : {}),
          }
        : {
            provider,
            phoneNumber: phoneNumber.trim(),
            printQr,
            ...(displayName.trim() ? { displayName: displayName.trim() } : {}),
          },
    ),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["channel-accounts", universeId] }),
        queryClient.invalidateQueries({ queryKey: ["channel-status", universeId] }),
        queryClient.invalidateQueries({ queryKey: ["secrets", universeId] }),
      ]);
      setToken("");
      setPhoneNumber("");
      setDisplayName("");
      onOpenChange(false);
    },
  });
  const reset = () => {
    setProvider("telegram");
    setToken("");
    setPhoneNumber("");
    setDisplayName("");
    setPrintQr(true);
    connect.reset();
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    connect.mutate();
  };
  const incomplete = provider === "telegram" ? !token.trim() : !phoneNumber.trim();

  return (
    <Modal
      open={open}
      onClose={() => {
        onOpenChange(false);
        reset();
      }}
      title="Connect a channel"
      description="Add the provider credential here. Lightspeed creates and manages the encrypted access grant automatically."
      footer={<>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            onOpenChange(false);
            reset();
          }}
        >
          Cancel
        </Button>
        <Button type="submit" form={formId} disabled={connect.isPending || incomplete}>
          {connect.isPending
            ? "Connecting…"
            : provider === "telegram"
              ? "Connect Telegram"
              : "Connect WhatsApp"}
        </Button>
      </>}
    >
      <form id={formId} onSubmit={submit} className="grid gap-4">
        <Field>
          <FieldLabel>Provider</FieldLabel>
          <Select
            className="w-full"
            aria-label="Channel provider"
            value={provider}
            onChange={(event) => setProvider(event.target.value as typeof provider)}
          >
            <option value="telegram">Telegram</option>
            <option value="whatsapp">WhatsApp</option>
          </Select>
        </Field>

        {provider === "telegram" ? (
          <Field>
            <FieldLabel htmlFor="telegram-bot-token">Bot token</FieldLabel>
            <Input
              id="telegram-bot-token"
              type="password"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              autoComplete="new-password"
              spellCheck={false}
              className="font-mono"
              placeholder="Paste the token from BotFather"
              autoFocus
            />
            <FieldDescription>
              Lightspeed checks the token with Telegram and fills in the bot username for you. The token is encrypted and never shown again.
            </FieldDescription>
          </Field>
        ) : (
          <>
            <Field>
              <FieldLabel htmlFor="whatsapp-phone">Phone number</FieldLabel>
              <Input
                id="whatsapp-phone"
                value={phoneNumber}
                onChange={(event) => setPhoneNumber(event.target.value)}
                placeholder="+41 79 123 45 67"
                autoFocus
              />
              <FieldDescription>
                After connecting, scan the QR code printed by the connector host.
              </FieldDescription>
            </Field>
            <label className="flex items-start gap-3 rounded-lg border bg-muted/15 p-3">
              <Checkbox
                checked={printQr}
                onChange={(event) => setPrintQr(event.target.checked)}
              />
              <span className="grid gap-1">
                <span className="text-sm font-medium">Print pairing QR code</span>
                <span className="text-xs text-muted-foreground">
                  Show the QR code in the connector process output until this account is paired.
                </span>
              </span>
            </label>
          </>
        )}

        <Field>
          <FieldLabel htmlFor="channel-display-name">Display name (optional)</FieldLabel>
          <Input
            id="channel-display-name"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder={provider === "telegram" ? "Defaults to the Telegram bot name" : "Support WhatsApp"}
          />
        </Field>
        {connect.error && <p className="text-sm text-destructive">{connect.error.message}</p>}
      </form>
    </Modal>
  );
}

function accountInputOf(account: ChannelAccountView): ChannelAccountInput {
  return {
    accountId: account.accountId,
    provider: account.provider,
    providerAccountId: account.providerAccountId,
    displayName: account.displayName,
    credentialGrantId: account.credentialGrantId ?? null,
    enabled: account.enabled ?? true,
    settings: account.settings ?? {},
  };
}

function providerAccountLabel(account: ChannelAccountView): string {
  return account.provider === "telegram"
    ? `@${account.providerAccountId.replace(/^@/, "")}`
    : account.providerAccountId;
}

function accountName(accounts: ChannelAccountView[], accountId: string): string {
  return accounts.find((account) => account.accountId === accountId)?.displayName ?? accountId;
}

export function channelAccountConnectionState(
  account: Pick<ChannelAccountView, "enabled">,
  health: Pick<ChannelConnectorHealth, "state" | "detail" | "lastError"> | undefined,
): { label: string; detail?: string; healthy: boolean } {
  if (account.enabled === false) return { label: "Disabled", healthy: false };
  if (!health) return { label: "Waiting for connector", healthy: false };
  if (health.state === "ready") return { label: "Connected", healthy: true };
  const label = health.state === "starting"
    ? "Connecting"
    : health.state === "disconnected"
      ? "Disconnected"
      : health.state === "failed"
        ? "Failed"
        : health.state[0]!.toUpperCase() + health.state.slice(1);
  return { label, detail: health.lastError ?? health.detail, healthy: false };
}

function AccountStatusBadge({
  account,
  health,
}: {
  account: ChannelAccountView;
  health: ChannelConnectorHealth | undefined;
}) {
  const status = channelAccountConnectionState(account, health);
  return (
    <div className="grid gap-1">
      <Badge tone={!status.healthy && status.label === "Failed" ? "danger" : "neutral"} outline={!status.healthy && status.label !== "Failed"}>
        {status.label}
      </Badge>
      {status.detail && (
        <span className="max-w-64 truncate text-xs text-muted-foreground" title={status.detail}>
          {status.detail}
        </span>
      )}
    </div>
  );
}
