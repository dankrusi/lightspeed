import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LockKeyhole, Users } from "lucide-react";
import type { ResourceAccessSummary } from "@lightspeed-ai/sdk";
import { api } from "@/api";
import { Modal } from "@versavolta/whisperink/components/Modal/Modal.js";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@versavolta/whisperink/components/Tooltip/Tooltip.js";
import { usePermissionIdentity, useUniverseRole } from "@/lib/permissions";

/**
 * Who sees a session. Work is private until shared: the header marks both
 * (a lock, or people once shared); lists pass `quiet` to mark only shared
 * work.
 */
export function SharingMark({
  access,
  quiet = false,
}: {
  access: ResourceAccessSummary | undefined;
  quiet?: boolean;
}) {
  if (!access) return null;
  const shared = access.visibility === "universe";
  if (quiet && !shared) return null;
  const Icon = shared ? Users : LockKeyhole;
  return (
    <Tooltip
      content={shared
        ? "Shared — every member of the universe sees this"
        : "Private — only its creator and admins see this"}
    >
      <span
        className="flex shrink-0 text-muted-foreground"
        aria-label={shared ? "Shared" : "Private"}
      >
        <Icon className="size-3.5" />
      </span>
    </Tooltip>
  );
}

/**
 * Whether the signed-in user created this work or administers the universe:
 * who may share or delete a session. The server decides again.
 */
export function useSessionOwner(universeId: string, access: ResourceAccessSummary | undefined): boolean {
  const userId = usePermissionIdentity();
  const role = useUniverseRole(universeId);
  if (role === "admin") return true;
  return access?.createdBy?.kind === "actor" && access.createdBy.id === userId;
}

/**
 * Whether this session can be shared by the signed-in user: a private
 * root session they own. A sub-agent's session follows its root.
 */
export function useCanShareSession(
  universeId: string,
  access: ResourceAccessSummary | undefined,
  delegated: boolean,
): boolean {
  const owner = useSessionOwner(universeId, access);
  return Boolean(access) && access?.visibility !== "universe" && !delegated && owner;
}

/** The one sharing action, confirmed: shared with the universe once and for good. */
export function ShareSessionDialog({
  universeId,
  sessionId,
  open,
  onOpenChange,
}: {
  universeId: string;
  sessionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const share = useMutation({
    mutationFn: () => api<{ access: ResourceAccessSummary }>("POST", `/api/v1/universes/${universeId}/sessions/${sessionId}/share`),
    onSuccess: async () => {
      onOpenChange(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["session", universeId, sessionId] }),
        queryClient.invalidateQueries({ queryKey: ["sessions", universeId] }),
      ]);
    },
  });
  const close = () => {
    onOpenChange(false);
    share.reset();
  };
  return (
    <Modal
      role="alertdialog"
      size="sm"
      open={open}
      onClose={close}
      title="Share with the universe?"
      description="Every member will see this session and its sub-agents, and continue it according to their role. Sharing cannot be undone."
      footer={
        <>
          <Button type="button" variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" disabled={share.isPending} onClick={() => share.mutate()}>
            Share
          </Button>
        </>
      }
    >
      {share.error && <p className="text-sm text-destructive">{share.error.message}</p>}
    </Modal>
  );
}
