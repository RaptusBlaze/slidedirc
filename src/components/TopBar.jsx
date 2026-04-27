export function TopBar({ folderA, folderB, matches, onReset }) {
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
      <button
        onClick={onReset}
        className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
      >
        Reset
      </button>
    </div>
  );
}
