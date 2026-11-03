import { useMutation } from "@tanstack/react-query";
import type { DeploymentApiKeyCreateResponse, DeploymentApiKeyView } from "@lightspeed-ai/sdk";
import { Modal } from "@versavolta/whisperink/components/Modal/Modal.js";
import { api } from "@/api";
import { API_KEY_SECRET_DESCRIPTION, API_KEY_SECRET_TITLE, ApiKeySecret, ApiKeySecretDone } from "./secret-once";
import { Button } from "@/components/ui/button";

export function RotateKeyDialog({ apiKey, basePath, onClose, onRotated }: {
  apiKey: DeploymentApiKeyView;
  basePath: string;
  onClose: () => void;
  onRotated: () => void;
}) {
  const rotate = useMutation({
    mutationFn: () => api<DeploymentApiKeyCreateResponse>("POST", `${basePath}/${encodeURIComponent(apiKey.keyPrefix)}/rotate`),
    retry: false,
    gcTime: 0,
    onSuccess: onRotated,
  });
  const close = () => {
    if (rotate.isPending) return;
    rotate.reset();
    onClose();
  };
  if (rotate.data) {
    return <Modal
      open
      onClose={close}
      title={API_KEY_SECRET_TITLE}
      description={API_KEY_SECRET_DESCRIPTION}
      footer={<ApiKeySecretDone onDone={close} />}
    >
      <ApiKeySecret secret={rotate.data.secret} keyPrefix={rotate.data.apiKey.keyPrefix} />
    </Modal>;
  }
  return <Modal
    open
    onClose={close}
    title="Rotate this API key?"
    description={`The current secret for ${apiKey.displayName ?? apiKey.keyPrefix} will stop working immediately. Update every client using this key with the new secret. Its permissions stay the same.`}
    footer={<>
      <Button variant="outline" disabled={rotate.isPending} onClick={close}>Cancel</Button>
      <Button disabled={rotate.isPending} onClick={() => rotate.mutate()}>{rotate.isPending ? "Rotating…" : "Rotate key"}</Button>
    </>}
  >
    {rotate.error && <p role="alert" className="text-sm text-destructive">{rotate.error.message}</p>}
  </Modal>;
}
