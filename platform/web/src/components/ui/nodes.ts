import { Children, isValidElement, type ReactElement, type ReactNode } from "react"

export function textOf(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return ""
  if (typeof node === "string" || typeof node === "number") return String(node)
  if (Array.isArray(node)) return node.map(textOf).join("")
  if (isValidElement<{ children?: ReactNode }>(node)) return textOf(node.props.children)
  return ""
}

export function named(node: ReactElement<any>): string | undefined {
  const type = node.type as { displayName?: string }
  return type.displayName
}

export function elements(node: ReactNode): ReactElement<any>[] {
  const found: ReactElement<any>[] = []
  Children.forEach(node, (child) => {
    if (isValidElement(child)) found.push(child)
  })
  return found
}
