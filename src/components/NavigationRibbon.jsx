import { useEffect, useRef } from 'react';

export function NavigationRibbon({ matched, currentIndex, onNavigate }) {
  const containerRef = useRef(null);
  const thumbRefs = useRef([]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowRight') onNavigate(1);
      if (e.key === 'ArrowLeft') onNavigate(-1);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onNavigate]);

  useEffect(() => {
    const el = thumbRefs.current[currentIndex];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [currentIndex]);

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-gray-900 border-t border-gray-700">
      <button
        onClick={() => onNavigate(-1)}
        disabled={currentIndex === 0}
        className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm rounded transition-colors shrink-0"
      >
        ← Prev
      </button>
      <div
        ref={containerRef}
        className="flex gap-2 overflow-x-auto flex-1 scroll-smooth"
        style={{ scrollbarWidth: 'thin' }}
      >
        {matched.map((pair, idx) => (
          <button
            key={idx}
            ref={el => (thumbRefs.current[idx] = el)}
            onClick={() => onNavigate(idx - currentIndex)}
            className={`shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-all ${
              idx === currentIndex ? 'border-blue-400 ring-2 ring-blue-400/50' : 'border-gray-600 hover:border-gray-400'
            }`}
          >
            <img
              src={pair.original.url}
              alt={pair.original.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </button>
        ))}
      </div>
      <button
        onClick={() => onNavigate(1)}
        disabled={currentIndex === matched.length - 1}
        className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm rounded transition-colors shrink-0"
      >
        Next →
      </button>
      <span className="text-gray-400 text-xs shrink-0">
        {currentIndex + 1} / {matched.length}
      </span>
    </div>
  );
}
