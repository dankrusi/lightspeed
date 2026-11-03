import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  api,
  connectorAccountHealth,
  type ChannelConnectorHealth,
  type ChannelConnectorStatus,
  type ChannelsStatus,
  type DeploymentChannelAccountListResponse,
} from "@/api";
import { Badge } from "@versavolta/whisperink/components/Badge/Badge.js";
import { Card } from "@versavolta/whisperink/components/Card/Card.js";
import { CardContent } from "@versavolta/whisperink/components/Card/CardContent.js";
import { CardHeader } from "@versavolta/whisperink/components/Card/CardHeader.js";
import { Table } from "@versavolta/whisperink/components/Table/Table.js";
import { TBody } from "@versavolta/whisperink/components/Table/TBody.js";
import { TableCard, TableTitleCell } from "@/components/table-layout";
import { TD } from "@versavolta/whisperink/components/Table/TD.js";
import { TH } from "@versavolta/whisperink/components/Table/TH.js";
import { THead } from "@versavolta/whisperink/components/Table/THead.js";
import { TR } from "@versavolta/whisperink/components/Table/TR.js";
import { LoadingNote, PageHeader } from "@/components/page";
import { useUniverses } from "@/lib/universes";

/** Deployment-wide diagnostics. Account configuration belongs to each universe. */
export function AdminChannelsPage() {
  const accounts = useQuery({
    queryKey: ["admin-channel-accounts"],
    queryFn: () => api<DeploymentChannelAccountListResponse>("GET", "/api/v1/channel-accounts"),
  });
  const universes = useUniverses();
  const status = useQuery({
    queryKey: ["channels-status"],
    queryFn: () => api<ChannelsStatus>("GET", "/api/v1/status/channels"),
    refetchInterval: 10_000,
  });
  const universeByCoreId = useMemo(
    () => new Map((universes.data ?? []).map((universe) => [universe.lightspeedUniverseId, universe])),
    [universes.data],
  );
  const healthRows: Array<{
    connector: ChannelConnectorStatus;
    health: ChannelConnectorHealth | null;
  }> = [];
  for (const connector of status.data?.connectors ?? []) {
    const rows = connectorAccountHealth(connector);
    if (rows.length === 0) {
      healthRows.push({ connector, health: null });
    } else {
      healthRows.push(...rows.map((health) => ({ connector, health })));
    }
  }

  return (
    <>
      <PageHeader
        title="Channels"
        description="Deployment-wide connector health and account inventory. Universe owners manage their connections from Channels."
      />
      <div className="grid gap-6">
        <Card>
          <CardHeader
            title="Connector health"
            description="Runtime diagnostics from each configured connector host, refreshed every ten seconds."
          />
          <CardContent>
            {status.isLoading && <LoadingNote />}
            {status.error && <p className="text-sm text-destructive">{status.error.message}</p>}
            {status.data && healthRows.length === 0 && (
              <p className="text-sm text-muted-foreground">No connector hosts are configured.</p>
            )}
            {status.data && healthRows.length > 0 && (
              <TableCard>
                <Table>
                  <THead>
                    <TR>
                      <TH>Account</TH>
                      <TH>Universe</TH>
                      <TH>State</TH>
                      <TH>Ingress</TH>
                      <TH>Activities</TH>
                      <TH>Last error</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {healthRows.map(({ connector, health }, index) => (
                      <TR key={`${connector.url}/${health?.accountId ?? index}`}>
                        <TD className="font-medium">
                          {health ? `${health.provider} / ${health.accountId}` : connector.url}
                        </TD>
                        <TD className="text-muted-foreground">
                          {health?.universeId
                            ? universeByCoreId.get(health.universeId)?.name ?? health.universeId
                            : "—"}
                        </TD>
                        <TD>
                          <Badge tone={health?.state === "ready" ? "neutral" : "danger"}>
                            {health?.state ?? (connector.reachable ? "no accounts" : "unreachable")}
                          </Badge>
                        </TD>
                        <TD>{yesNo(health?.ingressConnected)}</TD>
                        <TD>{yesNo(health?.activityWorkerReady)}</TD>
                        <TD className="max-w-sm text-sm text-muted-foreground">
                          {health?.lastError ?? connector.error ?? health?.detail ?? "—"}
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              </TableCard>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            title="Account inventory"
            description="Read-only deployment view. Open the owning universe to connect, enable, or disable an account."
          />
          <CardContent>
            {accounts.isLoading && <LoadingNote />}
            {accounts.error && <p className="text-sm text-destructive">{accounts.error.message}</p>}
            {accounts.data && (
              <TableCard>
                <Table>
                  <THead>
                    <TR>
                      <TH>Account</TH>
                      <TH>Provider</TH>
                      <TH>Universe</TH>
                      <TH>Status</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {(accounts.data.accounts ?? []).map((account) => (
                      <TR key={`${account.universeId}/${account.accountId}`}>
                        <TableTitleCell title={account.displayName} subtitle={account.accountId} />
                        <TD>
                          {account.provider}
                          <span className="block text-xs text-muted-foreground">{account.providerAccountId}</span>
                        </TD>
                        <TD className="text-muted-foreground">
                          {universeByCoreId.get(account.universeId)?.name ?? account.universeId}
                        </TD>
                        <TD>
                          <Badge outline={!(account.enabled ?? true)}>
                            {(account.enabled ?? true) ? "enabled" : "disabled"}
                          </Badge>
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              </TableCard>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function yesNo(value: boolean | undefined): string {
  return value === undefined ? "—" : value ? "yes" : "no";
}
