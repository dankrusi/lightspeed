import { useId, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AGENT_MODEL_API_KINDS, modelDefaultsPutSchema } from "@lightspeed-ai/platform-shared";
import { api, ApiError, type ModelConfig, type ModelDefaults, type ModelDefaultsPutParams } from "@/api";
import { modelDefaultsKey, modelLabel, useModelDefaults, useModelDiscovery } from "@/lib/model-defaults";
import { summarizeProviderReadiness } from "@/lib/provider-readiness";
import { Button } from "@versavolta/whisperink/components/Button/Button.js";
import { Input } from "@versavolta/whisperink/components/Input/Input.js";
import { Field } from "@versavolta/whisperink/components/Field/Field.js";
import { Modal } from "@versavolta/whisperink/components/Modal/Modal.js";
import { Select } from "@versavolta/whisperink/components/Select/Select.js";
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from "@/components/ui/combobox";

const apiLabels: Record<string, string> = {
  "openai:responses": "OpenAI Responses",
  "openai:completions": "OpenAI Chat Completions",
  "anthropic:messages": "Anthropic Messages",
  "openai:audio-transcriptions": "OpenAI Audio Transcriptions",
};

export type DefaultSlot = ModelDefaultsPutParams["slot"];
const slots = [
  { slot: "agentRun", label: "Agent runs", description: "Used when a new session and its profile leave the model unset. Existing sessions keep their model." },
  { slot: "speechToText", label: "Speech-to-text", description: "Used for audio transcription and web dictation. Dictation is disabled until a default is selected." },
] as const;

export function ModelDefaultsSection({ universeId, writable, onEdit }: { universeId: string; writable: boolean; onEdit: (defaults: ModelDefaults, slot: DefaultSlot) => void }) {
  const defaults = useModelDefaults(universeId);
  const discovery = useModelDiscovery(universeId);
  const queryClient = useQueryClient();
  const clear = useMutation({
    mutationFn: ({ revision, slot }: { revision: number; slot: DefaultSlot }) => api<ModelDefaults>("PUT", `/api/v1/universes/${universeId}/models/defaults`, {
      slot, model: null, expectedRevision: revision,
    } satisfies ModelDefaultsPutParams),
    onSuccess: (value) => queryClient.setQueryData(modelDefaultsKey(universeId), value),
    onError: () => { void queryClient.invalidateQueries({ queryKey: modelDefaultsKey(universeId) }); },
  });

  return (
    <section aria-labelledby="model-defaults-heading" className="mt-8">
      <div className="mb-3">
        <h2 id="model-defaults-heading" className="text-sm font-semibold">Defaults</h2>
      </div>
      <div className="divide-y rounded-xl border">
        {slots.map(({ slot, label, description }) => {
          const model = defaults.data?.[slot];
          const readiness = summarizeProviderReadiness(model, discovery.error ? undefined : discovery.data?.providers, slot);
          return (
            <div key={slot} role="group" aria-label={label} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
              <div className="min-w-0 space-y-1">
                <h3 className="text-sm font-medium">{label}</h3>
                <p className="text-xs text-muted-foreground">{description}</p>
                <p className="break-words text-sm">{defaults.isLoading ? "Loading…" : defaults.error ? "Default unavailable" : model ? modelLabel(model) : "No default selected"}</p>
                {model && <p className="text-xs text-muted-foreground">{apiLabels[model.apiKind] ?? model.apiKind}</p>}
                {model && <p role="status" className={`text-xs ${readiness.blocked ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground"}`}>
                  {discovery.isLoading ? "Checking provider…" : readiness.message}
                </p>}
              </div>
              {writable && defaults.data && !defaults.error && <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={clear.isPending} onClick={() => { clear.reset(); onEdit(defaults.data!, slot); }}>{model ? "Change" : "Choose model"}</Button>
                {model && <Button variant="ghost" size="sm" disabled={clear.isPending} onClick={() => clear.mutate({ revision: defaults.data!.revision, slot })}>{clear.isPending ? "Clearing…" : "Clear"}</Button>}
              </div>}
            </div>
          );
        })}
        {defaults.error && <div className="flex items-center gap-3 px-5 pb-4 text-sm text-destructive" role="alert">
          <span>Could not load defaults: {defaults.error.message}</span>
          <Button variant="outline" size="sm" onClick={() => void defaults.refetch()}>Retry</Button>
        </div>}
        {clear.error && <p role="alert" className="px-5 pb-4 text-sm text-destructive">{clear.error instanceof ApiError && clear.error.status === 409 ? "Defaults changed elsewhere. Review the current selection before clearing it." : clear.error.message}</p>}
      </div>
    </section>
  );
}

export function DefaultModelDialog({ universeId, initial, slot, onClose }: { universeId: string; initial: ModelDefaults; slot: DefaultSlot; onClose: () => void }) {
  const apiKinds = slot === "agentRun" ? AGENT_MODEL_API_KINDS : ["openai:audio-transcriptions"] as const;
  const emptyModel = { providerId: "", apiKind: apiKinds[0], model: "" };
  const [revision, setRevision] = useState(initial.revision);
  const [model, setModel] = useState<ModelConfig>(initial[slot] ?? emptyModel);
  const [reloadError, setReloadError] = useState<string | null>(null);
  const [reloading, setReloading] = useState(false);
  const discovery = useModelDiscovery(universeId);
  const queryClient = useQueryClient();
  const id = useId();
  const [search, setSearch] = useState("");
  const routes = (discovery.data?.models ?? []).filter((route) => (apiKinds as readonly string[]).includes(route.apiKind));
  const choices = routes.map((route) => JSON.stringify([route.providerId, route.apiKind, route.model]));
  const routeFor = (key: string) => routes[choices.indexOf(key)];
  const clean = { providerId: model.providerId.trim(), apiKind: model.apiKind, model: model.model.trim() };
  const params: ModelDefaultsPutParams = { slot, model: clean, expectedRevision: revision };
  const valid = modelDefaultsPutSchema.safeParse(params).success;
  const save = useMutation({
    mutationFn: () => api<ModelDefaults>("PUT", `/api/v1/universes/${universeId}/models/defaults`, params),
    onSuccess: (value) => { queryClient.setQueryData(modelDefaultsKey(universeId), value); onClose(); },
  });
  const conflict = save.error instanceof ApiError && save.error.status === 409;
  const reload = async () => {
    setReloading(true);
    setReloadError(null);
    try {
      const latest = await api<ModelDefaults>("GET", `/api/v1/universes/${universeId}/models/defaults`);
      queryClient.setQueryData(modelDefaultsKey(universeId), latest);
      setRevision(latest.revision);
      setModel(latest[slot] ?? emptyModel);
      save.reset();
    } catch (error) { setReloadError(error instanceof Error ? error.message : "Could not reload defaults."); }
    finally { setReloading(false); }
  };
  const formId = `${id}-form`;
  return <Modal open onClose={() => { if (!save.isPending) onClose(); }}
    title={`Default model for ${slot === "agentRun" ? "agent runs" : "speech-to-text"}`}
    description="Choose a discovered model or enter your provider and model below."
    footer={<>
      <Button type="button" variant="outline" disabled={save.isPending} onClick={onClose}>Cancel</Button>
      {conflict ? <Button type="button" disabled={reloading} onClick={() => void reload()}>{reloading ? "Reloading…" : "Reload saved default"}</Button>
        : <Button type="submit" form={formId} disabled={!valid || save.isPending}>{save.isPending ? "Saving…" : "Save default"}</Button>}
    </>}>
      <form id={formId} className="grid gap-4" onSubmit={(event) => { event.preventDefault(); if (valid && !conflict && !save.isPending) save.mutate(); }}>
        <fieldset className="grid gap-4" disabled={save.isPending || reloading}>
        <Field id={`${id}-search`} label="Find a model" hint={discovery.isLoading ? "Loading suggestions…" : discovery.error ? "Suggestions are unavailable. You can still enter and save a model." : "Manual models do not need to appear in discovery."}>
          {(field) => (
            <Combobox<string> items={choices} value={null} inputValue={search} onInputValueChange={setSearch}
              itemToStringLabel={(key) => { const route = routeFor(key); return route ? `${modelLabel(route)} · ${apiLabels[route.apiKind]}` : key; }}
              filter={(key, query) => key.toLowerCase().includes(query.toLowerCase())}
              onValueChange={(key) => { const route = key ? routeFor(key) : undefined; if (route) { setModel({ providerId: route.providerId, apiKind: route.apiKind, model: route.model }); setSearch(""); } }}>
              <ComboboxInput {...field.control} placeholder="Search discovered models…" />
              <ComboboxContent><ComboboxEmpty>No matching models. Enter a model below.</ComboboxEmpty><ComboboxList>{(key: string) => {
                const route = routeFor(key);
                return <ComboboxItem key={key} value={key}><span>{route ? modelLabel(route) : key}<span className="block text-xs text-muted-foreground">{route && apiLabels[route.apiKind]}</span></span></ComboboxItem>;
              }}</ComboboxList></ComboboxContent>
            </Combobox>
          )}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id={`${id}-provider`} label="Provider">{(field) => <Input {...field.control} value={model.providerId} list={`${id}-providers`} placeholder="Provider ID" onChange={(event) => setModel({ ...model, providerId: event.target.value })} />}</Field>
          <datalist id={`${id}-providers`}>{discovery.data?.providers?.map((provider) => <option key={provider.providerId} value={provider.providerId} />)}</datalist>
          <Field id={`${id}-api`} label="API">{(field) => <Select {...field.control} className="w-full" value={model.apiKind} onChange={(event) => { const value = event.target.value; if (value) setModel({ ...model, apiKind: value }); }}>
            {apiKinds.map((kind) => <option key={kind} value={kind}>{apiLabels[kind]}</option>)}
          </Select>}</Field>
        </div>
        <Field id={`${id}-model`} label="Model">{(field) => <Input {...field.control} value={model.model} placeholder="Model name" onChange={(event) => setModel({ ...model, model: event.target.value })} />}</Field>
        </fieldset>
        {save.error && <p role="alert" className="text-sm text-destructive">{conflict ? "Defaults changed elsewhere. Reload and review the saved default before making another change." : save.error.message}</p>}
        {reloadError && <p role="alert" className="text-sm text-destructive">{reloadError}</p>}
      </form>
  </Modal>;
}
