import { MenuItem } from "@versavolta/whisperink/components/Menu/MenuItem.js";
import { useUserPreferences } from "@/lib/user-preferences";

/** Shared account-wide display controls in session and bot conversation menus. */
export function SessionMenuPreferences() {
  const preferences = useUserPreferences();
  return (
    <>
      <MenuItem
        checked={preferences.collapseCompletedRuns}
        onClick={() => preferences.setCollapseCompletedRuns(!preferences.collapseCompletedRuns)}
      >
        Collapse completed runs
      </MenuItem>
      <MenuItem
        checked={preferences.showRunStatistics}
        onClick={() => preferences.setShowRunStatistics(!preferences.showRunStatistics)}
      >
        Show run statistics
      </MenuItem>
      <MenuItem
        checked={preferences.showSessionResources}
        onClick={() => preferences.setShowSessionResources(!preferences.showSessionResources)}
      >
        Show session resources
      </MenuItem>
    </>
  );
}
