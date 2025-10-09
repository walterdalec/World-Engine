import React from 'react';

export function AILearningTelemetry({ world }: { world: any }) {
  const learn = world?.learn;
  if (!learn) return null;
  const keys = Object.keys(learn.planBias ?? {});
  return (
    <div className="p-3 grid gap-2 text-sm">
      <h3 className="font-semibold">AI Learning — Scenarios</h3>
      {keys.length === 0 && <p className="opacity-70">No learned biases yet.</p>}
      {keys.map(key => (
        <div key={key} className="rounded border border-slate-600/60 p-2">
          <div className="text-xs mb-1 opacity-70">{key}</div>
          <div className="grid grid-cols-2 gap-1">
            {Object.entries(learn.planBias[key] ?? {}).map(([plan, value]: any) => (
              <div key={plan} className="flex justify-between">
                <span>{plan}</span>
                <span>{Number(value).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
