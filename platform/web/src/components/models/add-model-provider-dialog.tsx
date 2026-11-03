import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import type { SecretProvider, SubscriptionImportResult } from "@/api";
import { Button } from "@versavolta/whisperink/components/Button/Button.js";
import { IconButton } from "@versavolta/whisperink/components/Button/IconButton.js";
import { Modal } from "@versavolta/whisperink/components/Modal/Modal.js";
import { subscriptionBinding } from "@/lib/subscriptions";
import {
  MODEL_PROVIDER_CATALOG,
  modelProviderDefinition,
  type ModelProviderKind,
} from "./catalog";
import {
  ModelApiKeyForm,
  OpenAiCompatibleForm,
  ProviderModelList,
} from "./model-api-key";
import { SubscriptionForm } from "./subscription";
import type { ConnectedModelProvider } from "./use-model-providers";

/// Two-step dialog: pick a model provider from the catalog, then configure it.
export function AddModelProviderDialog({
  universeId,
  open,
  connected,
  initialKind = null,
  onOpenChange,
  onAdded,
  onChooseDefault,
}: {
  universeId: string;
  open: boolean;
  connected: ConnectedModelProvider[];
  /// Pre-select a catalog entry (deep links such as `?add=openAiApiKey`).
  initialKind?: ModelProviderKind | null;
  onOpenChange: (open: boolean) => void;
  onAdded: () => void;
  onChooseDefault?: () => void;
}) {
  const [selected, setSelected] = useState<ModelProviderKind | null>(initialKind);
  useEffect(() => {
    if (open && initialKind) setSelected(initialKind);
  }, [open, initialKind]);
  const [done, setDone] = useState<
    | { type: "subscription"; result: SubscriptionImportResult }
    | { type: "modelKey"; provider: SecretProvider }
    | null
  >(null);
  const alreadyConnected = (kind: ModelProviderKind) =>
    connected.some((c) => c.kind === kind);

  const close = () => {
    onOpenChange(false);
    setSelected(null);
    setDone(null);
  };
  const definition = selected ? modelProviderDefinition(selected) : null;

  return (
    <Modal
      open={open}
      onClose={close}
      title={definition ? definition.name : "Add model provider"}
      description={
        definition
          ? undefined
          : "Connect a model provider to this universe. Keys and logins are encrypted by Lightspeed and never returned."
      }
      footer={
        definition &&
        done && (
          <>
            {done.type === "modelKey" && onChooseDefault && <Button variant="outline" onClick={() => { close(); onChooseDefault(); }}>Choose default model</Button>}
            <Button onClick={close}>Done</Button>
          </>
        )
      }
    >
      <div className="grid gap-4">
        {definition && !done && (
          <div>
            <IconButton
              size="sm"
              label="Back to catalog"
              onClick={() => setSelected(null)}
            >
              <ArrowLeft />
            </IconButton>
          </div>
        )}

        {!definition && (
          <div className="grid gap-2 sm:grid-cols-2">
            {MODEL_PROVIDER_CATALOG.map((entry) => {
              const existing = !entry.multiple && alreadyConnected(entry.kind);
              return (
                <button
                  key={entry.kind}
                  type="button"
                  onClick={() => setSelected(entry.kind)}
                  className="flex items-start gap-3 rounded-xl border p-3 text-left transition-colors hover:bg-muted/40 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  <span className="mt-0.5 shrink-0 text-foreground">
                    <entry.Logo size={22} />
                  </span>
                  <span className="grid gap-0.5">
                    <span className="text-sm font-medium">
                      {entry.name}
                      {existing && (
                        <span className="ml-2 rounded-full border px-1.5 py-0.5 text-[10px] font-normal text-muted-foreground">
                          connected · replace
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {entry.tagline}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {definition && done && (
          <div className="grid gap-3 text-sm">
            {done.type === "modelKey" ? (
              <>
                <p>
                  Provider saved. Sessions using{" "}
                  <span className="font-mono">
                    model.providerId = {done.provider.providerId}
                  </span>{" "}
                  pick it up on their next model call.
                </p>
                <ProviderModelList
                  universeId={universeId}
                  providerId={done.provider.providerId}
                />
              </>
            ) : (
              <>
                <p>
                  Connected
                  {done.result.grant.displayName
                    ? ` as ${done.result.grant.displayName}`
                    : ""}
                  .
                </p>
                <p className="text-muted-foreground">
                  Bind it to environments as{" "}
                  <span className="font-mono">
                    {subscriptionBinding(done.result.grant)?.envName}
                  </span>
                  {done.result.shape === "codexTokenSet"
                    ? "; the value is Codex auth.json content — the bootstrap line is shown in the provider's details."
                    : "."}
                </p>
              </>
            )}
          </div>
        )}

        {definition &&
          !done &&
          (selected === "openAiApiKey" || selected === "anthropicApiKey") && (
            <ModelApiKeyForm
              universeId={universeId}
              provider={selected === "openAiApiKey" ? "openai" : "anthropic"}
              replace={alreadyConnected(selected)}
              onSaved={(provider) => {
                onAdded();
                setDone({ type: "modelKey", provider });
              }}
              onCancel={() => setSelected(null)}
            />
          )}
        {definition && !done && selected === "openAiCompatible" && (
          <OpenAiCompatibleForm
            universeId={universeId}
            onSaved={(provider) => {
              onAdded();
              setDone({ type: "modelKey", provider });
            }}
            onCancel={() => setSelected(null)}
          />
        )}
        {definition &&
          !done &&
          (selected === "anthropicSubscription" ||
            selected === "openAiSubscription") && (
            <SubscriptionForm
              universeId={universeId}
              provider={
                selected === "anthropicSubscription" ? "anthropic" : "openAi"
              }
              onConnected={(result) => {
                onAdded();
                setDone({ type: "subscription", result });
              }}
              onCancel={() => setSelected(null)}
            />
          )}
      </div>
    </Modal>
  );
}
