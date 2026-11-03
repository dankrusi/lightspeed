import { Segmented } from "@versavolta/whisperink/components/Tabs/Segmented.js";

const views = [
  { value: "source", label: "Source" },
  { value: "preview", label: "Preview" },
] as const;

export function MarkdownViewToggle({ preview, onPreviewChange }: {
  preview: boolean;
  onPreviewChange: (preview: boolean) => void;
}) {
  return (
    <Segmented
      label="Markdown view"
      size="sm"
      items={views}
      value={preview ? "preview" : "source"}
      onChange={(value) => onPreviewChange(value === "preview")}
    />
  );
}
