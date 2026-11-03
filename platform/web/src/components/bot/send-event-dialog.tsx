import { useId, useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useActionPermissions } from "@/lib/permissions";
import { api } from "@/api";
import { Modal } from "@versavolta/whisperink/components/Modal/Modal.js";
import { Button } from "@versavolta/whisperink/components/Button/Button.js";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@versavolta/whisperink/components/Input/Input.js";
import { Textarea } from "@versavolta/whisperink/components/Textarea/Textarea.js";

export function SendEventDialog({
  universeId,
  botId,
  open,
  onOpenChange,
}: {
  universeId: string;
  botId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const permissions = useActionPermissions(universeId);
  const invoke = permissions.can("invoke_bot");
  const queryClient = useQueryClient();
  const [kind, setKind] = useState("operator.requested");
  const [summary, setSummary] = useState("");
  const [data, setData] = useState("");
  const [error, setError] = useState<string | null>(null);
  const formId = useId();
  const send = useMutation({
    mutationFn: () => {
      if (!invoke) throw new Error("You do not have permission to invoke this bot.");
      let parsed: unknown = undefined;
      if (data.trim()) parsed = JSON.parse(data);
      return api("POST", `/api/v1/universes/${universeId}/bots/${botId}/events`, {
        event: {
          kind: kind.trim(),
          summary: summary.trim(),
          ...(parsed === undefined ? {} : { data: parsed }),
        },
      });
    },
    onSuccess: async () => {
      setSummary("");
      setData("");
      setError(null);
      onOpenChange(false);
      await queryClient.invalidateQueries({ queryKey: ["bot-state", universeId, botId] });
      await queryClient.invalidateQueries({ queryKey: ["bot-events", universeId, botId] });
    },
    onError: (err) => setError(err instanceof Error ? err.message : String(err)),
  });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    send.mutate();
  };
  return (
    <Modal
      open={open && invoke}
      onClose={() => onOpenChange(false)}
      title="Send event"
      description="Queue a durable event for this bot. It is delivered to the bot's session as untrusted input."
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form={formId} disabled={!invoke || send.isPending || !kind.trim() || !summary.trim()}>
            {send.isPending ? "Sending…" : "Send event"}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={submit} className="grid gap-4">
        <Field>
          <FieldLabel htmlFor="bot-event-kind">Kind</FieldLabel>
          <Input id="bot-event-kind" value={kind} onChange={(event) => setKind(event.target.value)} />
        </Field>
        <Field>
          <FieldLabel htmlFor="bot-event-summary">Summary</FieldLabel>
          <Textarea
            id="bot-event-summary"
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            rows={4}
            data-autofocus
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="bot-event-data">Data (optional JSON)</FieldLabel>
          <Textarea
            id="bot-event-data"
            value={data}
            onChange={(event) => setData(event.target.value)}
            rows={5}
            className="font-mono text-xs"
          />
        </Field>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </form>
    </Modal>
  );
}
