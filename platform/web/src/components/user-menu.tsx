import { useNavigate } from "react-router-dom";
import { LogOut, Monitor, Moon, ShieldCheck, Sun, UserRound } from "lucide-react";
import { MenuItem } from "@versavolta/whisperink/components/Menu/MenuItem.js";
import { MenuLabel } from "@versavolta/whisperink/components/Menu/MenuLabel.js";
import { MenuSeparator } from "@versavolta/whisperink/components/Menu/MenuSeparator.js";
import type { SessionUser } from "@/auth";
import { authClient } from "@/auth";
import { useTheme, type Theme } from "@/lib/theme";

export function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

const THEMES: Array<{ value: Theme; label: string; icon: typeof Sun }> = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

/// Account entries for the Whisperink header menu.
export function UserMenu({ user, admin }: { user: SessionUser; admin: boolean }) {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  return (
    <>
      <MenuLabel>{user.email}</MenuLabel>
      <MenuItem icon={<UserRound />} onClick={() => navigate("/account")}>Account</MenuItem>
      <MenuSeparator />
      <MenuLabel>Theme</MenuLabel>
      {THEMES.map(({ value, label, icon: Icon }) => (
        <MenuItem key={value} icon={<Icon />} checked={theme === value} onClick={() => setTheme(value)}>
          {label}
        </MenuItem>
      ))}
      {admin && (
        <>
          <MenuSeparator />
          <MenuItem icon={<ShieldCheck />} onClick={() => navigate("/admin/users")}>
            Platform admin
          </MenuItem>
        </>
      )}
      <MenuSeparator />
      <MenuItem
        icon={<LogOut />}
        onClick={() => {
          void authClient.signOut().then(() =>
            window.location.assign(`${import.meta.env.BASE_URL}login`),
          );
        }}
      >
        Sign out
      </MenuItem>
    </>
  );
}
