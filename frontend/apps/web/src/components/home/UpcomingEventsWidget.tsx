export interface UpcomingEventItem {
  id: string;
  title: string;
  category: string;
}

export function UpcomingEventsWidget({ events }: { events: UpcomingEventItem[] }) {
  if (events.length === 0) {
    return (
      <div className="mt-8 border border-yuni-wheat-200 bg-yuni-wheat-50/50 p-4">
        <h3 className="font-display text-base font-bold text-yuni-slate-900">
          À venir
        </h3>
        <p className="mt-2 text-sm text-yuni-slate-500">
          Aucun événement mis en avant pour le moment.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 border border-yuni-wheat-200 bg-white p-4 shadow-yuni-sm">
      <h3 className="font-display text-base font-bold text-yuni-slate-900">
        Événements · extraits
      </h3>
      <ul className="mt-3 space-y-3">
        {events.map((e) => (
          <li key={e.id} className="border-b border-yuni-wheat-100 pb-3 last:border-0">
            <p className="font-body text-sm font-medium text-yuni-slate-900">
              {e.title}
            </p>
            <p className="text-xs text-yuni-slate-500">{String(e.category)}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
