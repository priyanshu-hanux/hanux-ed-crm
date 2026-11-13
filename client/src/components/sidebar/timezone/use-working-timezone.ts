import { useCallback, useEffect, useState } from "react";
import { DEFAULT_TIMEZONE_ID, TIMEZONES, type TimezoneOption } from "./timezones";

const STORAGE_KEY = "crm:working-timezone";

const findById = (id: string | null) => TIMEZONES.find((tz) => tz.id === id);

/**
 * Selected working timezone, remembered across reloads.
 * First visit: picks the option matching the browser's timezone, else the default.
 * Lift this into a context if other components (e.g. the activity calendar) need it.
 */
export function useWorkingTimezone() {
  const [id, setId] = useState(DEFAULT_TIMEZONE_ID);

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
    } catch {
      /* storage blocked: fall through to detection */
    }
    if (findById(saved)) {
      setId(saved!);
      return;
    }
    const local = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const match = TIMEZONES.find((tz) => tz.timeZone === local);
    if (match) setId(match.id);
  }, []);

  const select = useCallback((nextId: string) => {
    setId(nextId);
    try {
      localStorage.setItem(STORAGE_KEY, nextId);
    } catch {
      /* non-fatal */
    }
  }, []);

  const timezone: TimezoneOption = findById(id) ?? TIMEZONES[0];
  return { timezone, select };
}
