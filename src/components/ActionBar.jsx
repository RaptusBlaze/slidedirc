const hasFsApi = typeof window !== 'undefined' && 'showDirectoryPicker' in window;

// Clockwise: L→R → T→B → R→L → B→T
const AXIS_LABELS = ['↔ L→R', '↕ T→B', '↔ R→L', '↕ B→T'];

export function ActionBar({
  onReset,
  hoverMode,
  onHoverModeToggle,
  axisMode,
  onAxisCycle,
  liveReload,
  onLiveReloadToggle,
  onHelpToggle,
  sideLabel,
}) {
  return (
    <div className="absolute top-3 right-3 z-20 flex items-center gap-4">
      {sideLabel && (
        <div className="bg-black/60 text-white text-xs font-semibold px-2 py-1 rounded pointer-events-none select-none">
          {sideLabel}
        </div>
      )}

      <div
        data-testid="action-bar"
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-black/55 backdrop-blur-sm border border-white/10 shadow-lg"
      >
        <button
          onClick={onHoverModeToggle}
          title={hoverMode ? 'Switch to click mode' : 'Switch to hover mode'}
          className={`px-3 py-1.5 text-white text-xs rounded-lg transition-colors ${
            hoverMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-500'
          }`}
        >
          {hoverMode ? '🖱️ Hover' : '✋ Click'}
        </button>

        <button
          onClick={onAxisCycle}
          title={`Cycle axis (R) — currently ${AXIS_LABELS[axisMode]}`}
          className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded-lg transition-colors"
        >
          {AXIS_LABELS[axisMode]}
        </button>

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
