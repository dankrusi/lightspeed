import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UNIVERSE_ICONS, UNIVERSE_ICON_COLORS, type UniverseIconName, type UniverseIconColor } from "@lightspeed-ai/platform-shared";
import { api, type Universe } from "@/api";
import { Button } from "@versavolta/whisperink/components/Button/Button.js";
import { IconButton } from "@versavolta/whisperink/components/Button/IconButton.js";
import { Card } from "@versavolta/whisperink/components/Card/Card.js";
import { CardHeader } from "@versavolta/whisperink/components/Card/CardHeader.js";
import { CardContent } from "@versavolta/whisperink/components/Card/CardContent.js";
import { UniverseIcon } from "@/components/universe-icon";

export function UniverseAppearanceCard({ universe }: { universe: Universe }) {
  const queryClient = useQueryClient();
  const [icon, setIcon] = useState<UniverseIconName>(universe.icon ?? "orbit");
  const [iconColor, setIconColor] = useState<UniverseIconColor>(universe.iconColor ?? "default");
  const changed = icon !== (universe.icon ?? "orbit") || iconColor !== (universe.iconColor ?? "default");
  const save = useMutation({
    mutationFn: () => api<Universe>("PATCH", `/api/v1/universes/${universe.id}`, { icon, iconColor }),
    onSuccess: (updated) => {
      queryClient.setQueryData<Universe[]>(["universes"], rows => rows?.map(row => row.id === updated.id ? updated : row));
      void queryClient.invalidateQueries({ queryKey: ["universes"] });
    },
  });
  function submit(event: FormEvent) {
    event.preventDefault();
    if (changed && !save.isPending) save.mutate();
  }
  return (
    <Card>
      <CardHeader title="Appearance" description="The icon and color shown in the universe switcher for everyone." />
      <CardContent>
        <form onSubmit={submit} className="grid max-w-md gap-5">
          <div className="flex items-center gap-3" aria-label="Universe appearance preview">
            <UniverseIcon icon={icon} iconColor={iconColor} />
            <span className="truncate text-sm font-medium">{universe.name}</span>
          </div>
          <fieldset disabled={save.isPending} className="grid gap-2">
            <legend className="mb-2 text-sm font-medium">Icon</legend>
            <div className="flex flex-wrap gap-2">
              {UNIVERSE_ICONS.map(choice => (
                <IconButton key={choice} variant="outline" label={`${label(choice)} icon`}
                  aria-pressed={icon === choice}
                  className={icon === choice ? "ring-2 ring-ring" : undefined}
                  onClick={() => setIcon(choice)}>
                  <UniverseIcon icon={choice} iconColor={iconColor} className="size-7 rounded-md" />
                </IconButton>
              ))}
            </div>
          </fieldset>
          <fieldset disabled={save.isPending} className="grid gap-2">
            <legend className="mb-2 text-sm font-medium">Color</legend>
            <div className="flex flex-wrap gap-2">
              {UNIVERSE_ICON_COLORS.map(choice => (
                <IconButton key={choice} variant="outline" label={`${label(choice)} color`}
                  aria-pressed={iconColor === choice}
                  className={iconColor === choice ? "ring-2 ring-ring" : undefined}
                  onClick={() => setIconColor(choice)}>
                  <UniverseIcon icon={icon} iconColor={choice} className="size-7 rounded-md" />
                </IconButton>
              ))}
            </div>
          </fieldset>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={!changed || save.isPending}>{save.isPending ? "Saving…" : "Save appearance"}</Button>
            <Button type="button" variant="outline" disabled={save.isPending || (icon === "orbit" && iconColor === "default")}
              onClick={() => { setIcon("orbit"); setIconColor("default"); }}>Reset to default</Button>
          </div>
          {save.error && <p role="alert" className="text-sm text-destructive">{save.error.message}</p>}
        </form>
      </CardContent>
    </Card>
  );
}

function label(value: string) { return value.charAt(0).toUpperCase() + value.slice(1); }
