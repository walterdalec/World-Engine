import React, { useMemo, useState } from 'react';

type ReplayEvent = { t: number; kind: string; payload: any };
interface Props { events: ReplayEvent[] }

export function ReplayViewer({ events }: Props) {
  const [time, setTime] = useState(0);
  const maxTime = events.at(-1)?.t ?? 0;
  const shown = useMemo(() => events.filter((event) => event.t <= time), [events, time]);

  return (
    <div className="p-4 space-y-3">
      <div className="font-mono text-sm">Time: {time} · Events: {shown.length}</div>
      <input type="range" min={0} max={maxTime} value={time} onChange={(e) => setTime(parseInt(e.target.value, 10))} />
      <div className="border rounded p-2 h-56 overflow-auto">
        {shown.slice(-120).map((event, index) => (
          <div key={index} className="text-xs font-mono">
            <strong>{event.t}</strong> · {event.kind} · {JSON.stringify(event.payload)}
          </div>
        ))}
      </div>
    </div>
  );
}
