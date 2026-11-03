/** Diagnostic identity, independent of DOM IDs and accessibility naming. */
export type UiMetadataProps = {
  uiId?: string;
  uiDescription?: string;
  uiComponentId?: string;
  uiComponentDescription?: string;
};

function identifier(value: string | undefined): string | undefined {
  return value?.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 160).replace(/^-|-$/g, "") || undefined;
}

function brief(value: string | undefined): string | undefined {
  return value?.trim().split(/\s+/u).slice(0, 10).join(" ").slice(0, 500) || undefined;
}

/**
 * The metadata a descriptor carries (a tab, a sidebar entry, a page action),
 * picked out so it can go on to the component that renders the item.
 */
export function itemMetadata(item: UiMetadataProps): UiMetadataProps {
  return { uiId: item.uiId, uiDescription: item.uiDescription, uiComponentId: item.uiComponentId, uiComponentDescription: item.uiComponentDescription };
}

/** Resolve metadata once per component without adding layout wrappers. */
export function uiMetadata(componentId: string, description: string, props: UiMetadataProps) {
  const uiId = identifier(props.uiId);
  const uiDescription = brief(props.uiDescription);
  const resolved = {
    ...(uiId ? { uiId } : {}),
    ...(uiDescription ? { uiDescription } : {}),
    uiComponentId: identifier(props.uiComponentId) ?? identifier(componentId) ?? "component",
    uiComponentDescription: brief(props.uiComponentDescription) ?? brief(description) ?? "User interface component",
  };
  return {
    props: resolved,
    attributes: {
      ...(resolved.uiId ? { "data-ui-id": resolved.uiId } : {}),
      ...(resolved.uiDescription ? { "data-ui-description": resolved.uiDescription } : {}),
      "data-ui-component-id": resolved.uiComponentId,
      "data-ui-component-description": resolved.uiComponentDescription,
    },
  };
}
