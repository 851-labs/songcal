import { ChevronDown, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { api } from "@/lib/api";

interface CalendarInfo {
  id: string;
  name: string;
  primary: boolean;
}

interface CalendarPickerProps {
  initialCalendarId: string | null;
  initialCalendarName: string | null;
}

function CalendarPicker({ initialCalendarId, initialCalendarName }: CalendarPickerProps) {
  const [calendars, setCalendars] = useState<CalendarInfo[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(initialCalendarId);
  const [selectedName, setSelectedName] = useState<string | null>(initialCalendarName);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadCalendars() {
      setIsLoading(true);
      try {
        const data = await api.calendars.list();
        // Filter out "Apple Music" calendar since it's covered by the default option
        const filteredCalendars = data.calendars.filter((c) => c.name !== "Apple Music");
        setCalendars(filteredCalendars);
        if (data.selectedCalendarId) {
          setSelectedId(data.selectedCalendarId);
          const cal = data.calendars.find((c) => c.id === data.selectedCalendarId);
          if (cal) setSelectedName(cal.name);
        }
      } catch (error) {
        console.error("Failed to load calendars:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (isOpen && calendars.length === 0) {
      loadCalendars();
    }
  }, [isOpen, calendars.length]);

  async function handleSelect(calendar: CalendarInfo | null) {
    setIsSaving(true);
    try {
      await api.calendars.select({ data: { calendarId: calendar?.id ?? null } });
      setSelectedId(calendar?.id ?? null);
      setSelectedName(calendar?.name ?? null);
    } catch (error) {
      console.error("Failed to save calendar selection:", error);
    } finally {
      setIsSaving(false);
      setIsOpen(false);
    }
  }

  const displayName = selectedName ?? "Apple Music";

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isSaving}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted border border-border hover:border-primary/50 transition-colors text-sm w-full justify-between disabled:opacity-50"
      >
        <span className="truncate text-foreground">{displayName}</span>
        {isSaving ? (
          <Loader2 className="w-4 h-4 text-muted-foreground animate-spin shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-2 py-1 rounded-lg bg-popover border border-border shadow-xl z-20 max-h-64 overflow-y-auto">
            {isLoading ? (
              <div className="px-3 py-4 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
              </div>
            ) : (
              <>
                <button
                  onClick={() => handleSelect(null)}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors ${
                    selectedId === null ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  Apple Music
                </button>
                {calendars.map((calendar) => (
                  <button
                    key={calendar.id}
                    onClick={() => handleSelect(calendar)}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-accent transition-colors ${
                      selectedId === calendar.id ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {calendar.name}
                    {calendar.primary && (
                      <span className="text-muted-foreground ml-2">(Primary)</span>
                    )}
                  </button>
                ))}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export { CalendarPicker };
