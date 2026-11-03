import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";
import { usePlatformAdmin } from "@/lib/permissions";
import { Checkbox } from "@versavolta/whisperink/components/Checkbox/Checkbox.js";
import { ConfirmDialog } from "@versavolta/whisperink/components/Modal/ConfirmDialog.js";

/** Mount for one deletion attempt; keep a failed purge retryable after soft deletion. */
export function DeleteSessionDialog({ universeId, sessionId, onCancel, onDeleted }: {
  universeId: string;
  sessionId: string;
  onCancel: () => void;
  onDeleted: () => void | Promise<void>;
}) {
  const platformAdmin = usePlatformAdmin();
  const queryClient = useQueryClient();
  const [cascade, setCascade] = useState(false);
  const [permanent, setPermanent] = useState(false);
  const [softDeleted, setSoftDeleted] = useState(false);
  // The dialog closes itself once the deletion settles, possibly before a
  // render has caught up with it: read progress from refs, not render state.
  const progress = useRef({ softDeleted: false, finished: false });
  const deletion = useMutation({
    mutationFn: async () => {
      if (permanent && !platformAdmin) throw new Error("Platform admin access is required for permanent deletion.");
      if (!softDeleted) {
        await api("DELETE", `/api/v1/universes/${encodeURIComponent(universeId)}/sessions/${encodeURIComponent(sessionId)}${cascade ? "?cascade=true" : ""}`);
        progress.current.softDeleted = true;
        setSoftDeleted(true);
      }
      if (permanent) {
        // Use the same server-side authorization and audit path as the admin page.
        await api("POST", `/api/v1/admin/universes/${encodeURIComponent(universeId)}/sessions/${encodeURIComponent(sessionId)}/purge`, {});
        void queryClient.invalidateQueries({ queryKey: ["admin", "audit"] });
        void queryClient.invalidateQueries({ queryKey: ["admin", "deleted-sessions", universeId] });
      }
    },
  });
  const confirm = async () => {
    await deletion.mutateAsync();
    await onDeleted();
    progress.current.finished = true;
  };
  const dismiss = () => {
    if (progress.current.finished) return;
    if (progress.current.softDeleted) void onDeleted();
    else onCancel();
  };
  return <ConfirmDialog
    open
    onClose={dismiss}
    onConfirm={confirm}
    title={permanent ? "Permanently delete this session?" : "Delete this session?"}
    description={permanent
      ? "This removes the session and its retained history subtree permanently. This cannot be undone. Attached workspaces and environments are separate resources."
      : "This hides the session and its history from all universe members, including admins. History is retained until a platform admin permanently deletes it."}
    confirmLabel={permanent ? softDeleted ? "Retry permanent deletion" : "Permanently delete" : "Delete session"}
    cancelLabel={softDeleted ? "Done" : undefined}
  >
    <div className="grid gap-3">
      <label className="flex min-w-0 items-start gap-2 rounded-lg border p-3 text-sm">
        <Checkbox checked={cascade} onChange={(event) => setCascade(event.target.checked)} disabled={deletion.isPending || softDeleted} />
        <span className="min-w-0">
          <span className="block font-medium">Also delete forks and delegated children</span>
          <span className="block text-xs text-muted-foreground">Required if the session has history forks or delegated children. Every selected session must already be closed. Config-only clones are not included.</span>
        </span>
      </label>
      {platformAdmin && <label className="flex min-w-0 items-start gap-2 rounded-lg border p-3 text-sm">
        <Checkbox checked={permanent} onChange={(event) => setPermanent(event.target.checked)} disabled={deletion.isPending || softDeleted} />
        <span className="min-w-0">
          <span className="block font-medium">Also permanently delete retained history</span>
          <span className="block text-xs text-muted-foreground">Platform admins only. Permanent deletion is recorded in the audit log.</span>
        </span>
      </label>}
      {deletion.error && softDeleted && <p className="text-sm text-destructive">
        The session is already soft-deleted. You can retry permanent deletion here or later from Platform → Universes → Deleted sessions.
      </p>}
    </div>
  </ConfirmDialog>;
}
