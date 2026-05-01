export function HelpOverlay({ onClose }) {
  const rows = [
    { key: '← / →', desc: 'Previous / next image' },
    { key: 'Scroll', desc: 'Navigate to previous / next image' },
    { key: 'Ctrl + Scroll', desc: 'Zoom in / out (toward cursor)' },
    { key: 'I', desc: 'Toggle the info panel' },
    { key: 'R', desc: 'Cycle axis clockwise (L→R → T→B → R→L → B→T)' },
    { key: 'Space', desc: 'Tap to toggle pan mode · Hold to pan while pressed (move mouse to pan when zoomed in)' },
    { key: '?', desc: 'Toggle this help screen' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold text-base">Keyboard shortcuts</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-lg leading-none"
            aria-label="Close help"
          >
            ✕
          </button>
        </div>
        <table className="w-full text-sm border-separate border-spacing-y-1">
          <tbody>
            {rows.map(({ key, desc }) => (
              <tr key={key}>
                <td className="pr-4 whitespace-nowrap">
                  {key.split(' + ').map((k, i, arr) => (
                    <span key={k}>
                      <kbd className="bg-gray-700 text-white text-xs px-1.5 py-0.5 rounded font-mono">
                        {k}
                      </kbd>
                      {i < arr.length - 1 && <span className="text-gray-500 mx-0.5">+</span>}
                    </span>
                  ))}
                </td>
                <td className="text-gray-300">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-gray-500 text-xs mt-4 text-center">Click outside or press <kbd className="bg-gray-700 text-white px-1 rounded font-mono">?</kbd> to close</p>
      </div>
    </div>
  );
}
