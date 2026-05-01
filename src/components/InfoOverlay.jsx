import { useEffect, useState } from 'react';

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

export function InfoOverlay({ currentPair, matches, expanded, onExpandedChange }) {
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
      <span className={`${monoCls} inline-flex flex-wrap items-baseline gap-x-1`}>
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
    <div className="absolute top-3 left-3 z-20 select-none flex flex-col items-start gap-2 max-w-[min(28rem,calc(100%-9rem))]">
      <button
        onClick={() => onExpandedChange(e => !e)}
        title={expanded ? 'Collapse info' : 'Expand info'}
        aria-expanded={expanded}
        aria-label="Toggle info panel"
        className="h-6 px-2 flex items-center gap-1.5 rounded bg-black/60 backdrop-blur-sm text-white text-xs hover:bg-black/75 transition-colors border border-white/10 shadow-lg"
      >
        <span className="font-serif italic text-xs leading-none">i</span>
        <span className="font-medium leading-none">Info</span>
      </button>

      {expanded && (
        <div className="rounded-lg bg-black/55 backdrop-blur-sm border border-white/10 px-3 py-2 text-sm shadow-lg flex flex-col gap-1.5 min-w-[16rem] max-w-full">
          {currentPair && (
            <>
              <div className="text-white font-medium break-all leading-snug" title={titleAttr}>
                {renderField({
                  orig: origName,
                  edit: editName,
                  kind: 'name',
                  baseClass: 'text-white font-medium',
                })}
              </div>
              <div className="text-xs leading-none">
                {renderField({
                  orig: origDate,
                  edit: editDate,
                  kind: 'date',
                  mono: true,
                  baseClass: 'text-gray-300',
                })}
              </div>
              <div className="text-xs leading-none">
                {renderField({
                  orig: origRes,
                  edit: editRes,
                  kind: 'res',
                  mono: true,
                  baseClass: 'text-gray-400',
                })}
              </div>
              <div className="border-t border-white/10 mt-1 pt-1.5 flex items-center gap-2 text-xs">
                <span className="text-green-400 font-medium tabular-nums">{matchedCount} matched</span>
                {unmatchedCount > 0 && (
                  <span className="text-yellow-400 tabular-nums">· {unmatchedCount} unmatched</span>
                )}
              </div>
            </>
          )}
          {!currentPair && (
            <div className="text-xs flex items-center gap-2">
              <span className="text-green-400 font-medium tabular-nums">{matchedCount} matched</span>
              {unmatchedCount > 0 && (
                <span className="text-yellow-400 tabular-nums">· {unmatchedCount} unmatched</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
