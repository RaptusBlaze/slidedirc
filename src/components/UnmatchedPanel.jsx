import { useState } from 'react';

export function UnmatchedPanel({ unmatchedA, unmatchedB }) {
  const [open, setOpen] = useState(false);
  const total = unmatchedA.length + unmatchedB.length;

  if (total === 0) return null;

  return (
    <div className="bg-gray-900 border-t border-gray-700">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 w-full px-4 py-2 text-yellow-400 text-sm hover:bg-gray-800 transition-colors"
      >
        <span>{open ? '▾' : '▸'}</span>
        <span>{total} Unmatched File{total !== 1 ? 's' : ''}</span>
      </button>
      {open && (
        <div className="px-4 pb-3 flex gap-8 flex-wrap">
          {unmatchedA.length > 0 && (
            <div>
              <div className="text-gray-400 text-xs uppercase mb-1">Original — No match</div>
              <ul className="space-y-0.5">
                {unmatchedA.map((f, i) => (
                  <li key={i} className="text-gray-300 text-xs">{f.name}</li>
                ))}
              </ul>
            </div>
          )}
          {unmatchedB.length > 0 && (
            <div>
              <div className="text-gray-400 text-xs uppercase mb-1">Edited — No match</div>
              <ul className="space-y-0.5">
                {unmatchedB.map((f, i) => (
                  <li key={i} className="text-gray-300 text-xs">{f.name}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
