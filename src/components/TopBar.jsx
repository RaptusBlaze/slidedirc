const hasFsApi = typeof window !== 'undefined' && 'showDirectoryPicker' in window;

export function TopBar({
  folderA,
  folderB,
  matches,
  onReset,
  hoverMode,
  onHoverModeToggle,
  vertical,
  onVerticalToggle,
  liveReload,
  onLiveReloadToggle,
}) {
  const matchedCount = matches?.matched?.length ?? 0;
  const unmatchedCount = (matches?.unmatchedA?.length ?? 0) + (matches?.unmatchedB?.length ?? 0);

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-700 gap-4 flex-wrap">
      <div className="flex items-center gap-6 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-xs uppercase tracking-wide">Original</span>
          <span className="text-white font-medium text-sm">{folderA?.name}</span>
          <span className="text-gray-500 text-xs">({folderA?.files?.length} files)</span>
        </div>
        <div className="text-gray-600">→</div>
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-xs uppercase tracking-wide">Edited</span>
          <span className="text-white font-medium text-sm">{folderB?.name}</span>
          <span className="text-gray-500 text-xs">({folderB?.files?.length} files)</span>
        </div>
        <div className="flex items-center gap-3 ml-4">
          <span className="text-green-400 text-sm font-medium">{matchedCount} Pairs Matched</span>
          {unmatchedCount > 0 && (
            <span className="text-yellow-400 text-sm">{unmatchedCount} Unmatched</span>
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

        {/* Axis toggle */}
        <button
          onClick={onVerticalToggle}
          title={`Toggle axis (R) — currently ${vertical ? 'vertical' : 'horizontal'}`}
          className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded-lg transition-colors"
        >
          {vertical ? '↕ Vertical' : '↔ Horizontal'}
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
      </div>
    </div>
  );
}
