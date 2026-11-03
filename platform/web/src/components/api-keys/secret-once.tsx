import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@versavolta/whisperink/components/Button/Button.js";
import { FieldLabel } from "@/components/ui/field";
import { Input } from "@versavolta/whisperink/components/Input/Input.js";

/** Title and description of a create dialog once it shows the new key's secret. */
export const API_KEY_SECRET_TITLE = "Copy your API key";
export const API_KEY_SECRET_DESCRIPTION =
  "This secret is shown once. Store it in the client's secret manager before closing this dialog.";

/** A newly minted key's secret, shown once inside its create dialog. */
export function ApiKeySecret({ secret, keyPrefix }: { secret: string; keyPrefix: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(secret);
    setCopied(true);
  };
  return (
    <div className="grid gap-2">
      <FieldLabel htmlFor="api-key-secret">API key</FieldLabel>
      <div className="flex gap-2">
        <Input
          id="api-key-secret"
          value={secret}
          readOnly
          className="font-mono text-xs"
          onFocus={(event) => event.currentTarget.select()}
        />
        <Button type="button" variant="outline" onClick={() => void copy()}>
          {copied ? <Check data-icon="inline-start" /> : <Copy data-icon="inline-start" />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Identifier: <span className="font-mono">{keyPrefix}</span>
      </p>
    </div>
  );
}

/** The footer action that dismisses a shown secret. */
export function ApiKeySecretDone({ onDone }: { onDone: () => void }) {
  return <Button type="button" onClick={onDone}>I saved the key</Button>;
}
