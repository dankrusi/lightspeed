import { slugify, universeSlugSchema } from "@lightspeed-ai/platform-shared";
import { useId, useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { UniverseIcon } from "@/components/universe-icon";
import { api, type Universe } from "@/api";
import { Menu } from "@versavolta/whisperink/components/Menu/Menu.js";
import { MenuItem } from "@versavolta/whisperink/components/Menu/MenuItem.js";
import { MenuLabel } from "@versavolta/whisperink/components/Menu/MenuLabel.js";
import { MenuSeparator } from "@versavolta/whisperink/components/Menu/MenuSeparator.js";
import { Modal } from "@versavolta/whisperink/components/Modal/Modal.js";
import { Button } from "@versavolta/whisperink/components/Button/Button.js";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@versavolta/whisperink/components/Input/Input.js";
import { memberships, universeHome, useUniverses } from "@/lib/universes";

/// Top-of-sidebar universe switcher. Lists memberships only; platform
/// admins reach the full inventory via Admin → Universes. Creation lives
/// here (permission-gated) so users find it where they already look.
export function UniverseSwitcher({
  active,
  admin,
}: {
  active: Universe | undefined;
  admin: boolean;
}) {
  const universes = useUniverses();
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);
  const mine = memberships(universes.data);
  // Universe creation is platform-admin-only today; the plan is to open
  // this up — flip this gate, nothing else moves.
  const canCreate = admin;

  return (
    <>
        <Menu align="start" className="min-w-56" trigger={({ open, toggle }) => (
          <button
            type="button"
            className="focus-ring flex max-w-64 items-center gap-2 rounded px-1 py-1 text-left hover:bg-subtle"
            aria-haspopup="menu"
            aria-expanded={open}
            onClick={toggle}
          >
            <UniverseIcon icon={active?.icon} iconColor={active?.iconColor} />
            <div className="grid flex-1 text-left leading-tight">
              <span className="truncate text-sm font-medium">
                {active?.name ?? "Select universe"}
              </span>
              <span className="truncate text-xs text-fg-muted">
                {active
                  ? active.status === "archived"
                    ? "archived"
                    : "universe"
                  : "Lightspeed"}
              </span>
            </div>
            <ChevronsUpDown className="ml-auto size-4" />
          </button>
        )}>
          <MenuLabel>Universes</MenuLabel>
          {mine.map((universe) => (
            <MenuItem
              key={universe.id}
              icon={<UniverseIcon icon={universe.icon} iconColor={universe.iconColor} className="size-6 rounded-md" />}
              onClick={() => navigate(universeHome(universe))}
            >
              <span className="flex items-center gap-2">
                <span className="truncate">{universe.name}</span>
                {universe.id === active?.id && <Check className="ml-auto size-4" />}
              </span>
            </MenuItem>
          ))}
          {mine.length === 0 && (
            <MenuItem disabled>No universes yet</MenuItem>
          )}
          {canCreate && (
            <>
              <MenuSeparator />
              <MenuItem icon={<Plus />} onClick={() => setCreateOpen(true)}>
                New universe
              </MenuItem>
            </>
          )}
        </Menu>
        <NewUniverseDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}

export function NewUniverseDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const formId = useId();

  const create = useMutation({
    mutationFn: (input: { name: string; slug: string }) =>
      api<Universe>("POST", "/api/v1/universes", input),
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({ queryKey: ["universes"] });
      onOpenChange(false);
      setName("");
      setSlug("");
      setSlugEdited(false);
      navigate(universeHome(created));
    },
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!universeSlugSchema.safeParse(slug.trim()).success) return;
    create.mutate({ name: name.trim(), slug: slug.trim() });
  };

  return (
    <Modal
      open={open}
      onClose={() => onOpenChange(false)}
      title="New universe"
      description="Universes start blank — connect chats and configure them afterwards."
      footer={<>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button type="submit" form={formId} disabled={create.isPending || !name.trim() || !universeSlugSchema.safeParse(slug.trim()).success}>
          {create.isPending ? "Creating…" : "Create"}
        </Button>
      </>}
    >
      <form id={formId} onSubmit={submit} className="grid gap-4">
        <Field>
          <FieldLabel htmlFor="new-universe-name">Name</FieldLabel>
          <Input
            id="new-universe-name"
            value={name}
            onChange={(e) => { setName(e.target.value); if (!slugEdited) setSlug(slugify(e.target.value)); }}
            placeholder="My Universe"
            autoFocus
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="new-universe-slug">Slug</FieldLabel>
          <Input id="new-universe-slug" value={slug} required maxLength={128}
            onChange={(e) => { setSlug(e.target.value); setSlugEdited(true); }} placeholder="my-universe" />
          <p className="text-sm text-muted-foreground">Unique in runtime and used in Platform URLs.</p>
        </Field>
        {create.error && (
          <p className="text-sm text-destructive">{create.error.message}</p>
        )}
      </form>
    </Modal>
  );
}
