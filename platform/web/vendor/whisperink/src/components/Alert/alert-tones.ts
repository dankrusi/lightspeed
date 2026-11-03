import { CheckCircle, type Icon, Info, Warning, XCircle } from "../../icons.js";
import type { Tone } from "../../tone.js";

export const alertTones: Record<Tone, { box: string; icon: Icon; iconClass: string }> = {
  neutral: { box: "border-border bg-subtle/60", icon: Info, iconClass: "text-fg-muted" },
  success: { box: "border-success/25 bg-success-soft", icon: CheckCircle, iconClass: "text-success" },
  warning: { box: "border-warning/30 bg-warning-soft", icon: Warning, iconClass: "text-warning" },
  danger: { box: "border-danger/25 bg-danger-soft", icon: XCircle, iconClass: "text-danger" },
  info: { box: "border-info/25 bg-info-soft", icon: Info, iconClass: "text-info" },
};
