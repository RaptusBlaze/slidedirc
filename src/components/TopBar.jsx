import { useEffect, useState } from 'react';

const hasFsApi = typeof window !== 'undefined' && 'showDirectoryPicker' in window;

// Clockwise: L→R → T→B → R→L → B→T
const AXIS_LABELS = ['↔ L→R', '↕ T→B', '↔ R→L', '↕ B→T'];

function stripExtension(name) {
  if (!name) return '';
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(0, dot) : name;
}

function formatDate(ts) {
  if (!ts) return null;
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return null;
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const FIELD_SPLITTERS = {
  name: /([_\-. ])/,
  date: /([-: ])/,
  res: /(\s*×\s*)/,
};

function tokenize(value, kind) {
  if (!value) return [];
  return value.split(FIELD_SPLITTERS[kind] ?? /(\s+)/);
}

function isSeparator(token, kind) {
  const re = FIELD_SPLITTERS[kind];
  return re ? re.test(token) && /^[\s_\-.:×]+$/.test(token) : /^\s+$/.test(token);
}

function renderTokens(tokens, otherTokens, kind, diffClass) {
  return tokens.map((tok, idx) => {
    if (isSeparator(tok, kind)) {
      return <span key={idx} className="text-gray-600">{tok}</span>;
    }
    const counterpart = otherTokens[idx];
    const differs = counterpart === undefined || counterpart !== tok;
    return <span key={idx} className={differs ? diffClass : ''}>{tok}</span>;
  });
}

export function TopBar({
  currentPair,
  matches,
  onReset,
  hoverMode,
  onHoverModeToggle,
  axisMode,
  onAxisCycle,
  liveReload,
  onLiveReloadToggle,
  onHelpToggle,
}) {
  const matchedCount = matches?.matched?.length ?? 0;
  const unmatchedCount = (matches?.unmatchedA?.length ?? 0) + (matches?.unmatchedB?.length ?? 0);

  const original = currentPair?.original;
  const edited = currentPair?.edited;

  const [origDims, setOrigDims] = useState(null);
  const [editDims, setEditDims] = useState(null);

  useEffect(() => {
    setOrigDims(null);
    if (!original?.url) return;
    let cancelled = false;
    const img = new Image();
    img.onload = () => { if (!cancelled) setOrigDims({ w: img.naturalWidth, h: img.naturalHeight }); };
    img.onerror = () => { if (!cancelled) setOrigDims(null); };
    img.src = original.url;
    return () => { cancelled = true; };
  }, [original?.url]);

  useEffect(() => {
    setEditDims(null);
    if (!edited?.url) return;
    let cancelled = false;
    const img = new Image();
    img.onload = () => { if (!cancelled) setEditDims({ w: img.naturalWidth, h: img.naturalHeight }); };
    img.onerror = () => { if (!cancelled) setEditDims(null); };
    img.src = edited.url;
    return () => { cancelled = true; };
  }, [edited?.url]);

  const origName = stripExtension(original?.name);
  const editName = stripExtension(edited?.name);
  const origDate = formatDate(original?.lastModified);
  const editDate = formatDate(edited?.lastModified);
  const origRes = origDims ? `${origDims.w} × ${origDims.h}` : null;
  const editRes = editDims ? `${editDims.w} × ${editDims.h}` : null;

  const renderField = ({ orig, edit, kind, mono = false, baseClass, origDiffClass = 'text-amber-300', editDiffClass = 'text-emerald-300', placeholder = '—' }) => {
    if (!orig && !edit) return <span className={`${baseClass} opacity-40`}>{placeholder}</span>;
    const same = orig === edit;
    const monoCls = mono ? 'tabular-nums font-mono' : '';
    if (same) {
      return <span className={`${baseClass} ${monoCls}`}>{orig}</span>;
    }
    const origTokens = tokenize(orig, kind);
    const editTokens = tokenize(edit, kind);
    return (
      <span className={`${monoCls} inline-flex items-baseline gap-1`}>
        <span className={baseClass}>
          {orig ? renderTokens(origTokens, editTokens, kind, origDiffClass) : <span className="opacity-40">—</span>}
        </span>
        <span className="text-gray-600">→</span>
        <span className={baseClass}>
          {edit ? renderTokens(editTokens, origTokens, kind, editDiffClass) : <span className="opacity-40">—</span>}
        </span>
      </span>
    );
  };

  const titleAttr = currentPair
    ? `${original?.name ?? ''}${edited && edited.name !== original?.name ? `  →  ${edited.name}` : ''}`
    : undefined;

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-700 gap-4">
      <div className="flex items-center gap-6 min-w-0 flex-1">
        {currentPair && (
          <div className="flex items-baseline gap-5 min-w-0">
            <div
              className="text-sm leading-none truncate min-w-0"
              style={{ flex: '0 1 28rem', minWidth: '12rem' }}
              title={titleAttr}
            >
              {renderField({
                orig: origName,
                edit: editName,
                kind: 'name',
                baseClass: 'text-white font-medium',
              })}
            </div>
            <div className="text-xs leading-none whitespace-nowrap" style={{ minWidth: '11rem' }}>
              {renderField({
                orig: origDate,
                edit: editDate,
                kind: 'date',
                mono: true,
                baseClass: 'text-gray-400',
              })}
            </div>
            <div className="text-xs leading-none whitespace-nowrap" style={{ minWidth: '8rem' }}>
              {renderField({
                orig: origRes,
                edit: editRes,
                kind: 'res',
                mono: true,
                baseClass: 'text-gray-500',
              })}
            </div>
          </div>
        )}
        <div className="flex items-center gap-3 ml-auto pl-4 whitespace-nowrap">
          <span className="text-green-400 text-sm font-medium tabular-nums">{matchedCount} Pairs Matched</span>
          {unmatchedCount > 0 && (
            <span className="text-yellow-400 text-sm tabular-nums">{unmatchedCount} Unmatched</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Hover-mode toggle */}
        <button
          onClick={onHoverModeToggle}
          title={hoverMode ? 'Switch to click mode' : 'Switch to hover mode'}
          className={`px-3 py-1.5 text-white text-xs rounded-lg transition-colors ${
            hoverMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-500'
          }`}
        >
          {hoverMode ? '🖱️ Hover' : '✋ Click'}
        </button>

        {/* Axis cycle */}
        <button
          onClick={onAxisCycle}
          title={`Cycle axis (R) — currently ${AXIS_LABELS[axisMode]}`}
          className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded-lg transition-colors"
        >
          {AXIS_LABELS[axisMode]}
        </button>

        {/* Live reload — only shown when the File System Access API is available */}
        {hasFsApi && (
          <button
            onClick={onLiveReloadToggle}
            title={liveReload ? 'Stop live reload' : 'Start live folder reload'}
            className={`px-3 py-1.5 text-white text-xs rounded-lg transition-colors ${
              liveReload
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            {liveReload ? '🟢 Live' : '⚫ Live'}
          </button>
        )}

        <button
          onClick={onReset}
          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
        >
          Reset
        </button>

        {/* Help */}
        <button
          onClick={onHelpToggle}
          title="Keyboard shortcuts (?)"
          className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded-lg transition-colors font-bold"
        >
          ?
        </button>
      </div>
    </div>
  );
}
