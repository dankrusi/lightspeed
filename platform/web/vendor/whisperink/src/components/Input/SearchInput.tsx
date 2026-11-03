import type { ComponentProps } from "react";
import { MagnifyingGlass } from "../../icons.js";
import { useText } from "../../text.js";
import { uiMetadata, type UiMetadataProps } from "../../metadata.js";
import { Input } from "./Input.js";

/**
 * `Input` of type search with a magnifier icon and the kit's search placeholder.
 * @category forms
 */
export function SearchInput(props: (Omit<ComponentProps<"input">, "size"> & { size?: "sm" | "md" | "lg" }) & UiMetadataProps) {
  const _ui = uiMetadata("search-input", "Enter a search query", props);
  const text = useText();
  return <Input type="search" leading={<MagnifyingGlass />} placeholder={text.search.placeholder} {...props} {..._ui.props} />;
}
