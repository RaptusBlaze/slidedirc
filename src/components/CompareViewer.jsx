import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';
import { useRef, useState, useEffect, useCallback } from 'react';

export function CompareViewer({ pair, hoverMode, vertical }) {
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef(null);

  // Reset zoom whenever the displayed pair changes
  useEffect(() => {
    setZoom(1);
  }, [pair]);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom(prev => Math.min(Math.max(prev * factor, 0.5), 4));
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  if (!pair) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900 text-gray-500">
        No pair selected
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden">
      <div
        style={{
          width: '100%',
          height: '100%',
          transform: `scale(${zoom})`,
          transformOrigin: 'center center',
        }}
      >
        <ReactCompareSlider
          // key forces a remount (and position reset to 50%) when the axis changes.
          // This is intentional: a 60%-horizontal position is meaningless as a vertical one.
          key={vertical ? 'portrait' : 'landscape'}
          changePositionOnHover={hoverMode}
          portrait={vertical}
          keyboardIncrement="0%"
          style={{ width: '100%', height: '100%' }}
          itemOne={
            <div className="relative w-full h-full">
              <ReactCompareSliderImage
                src={pair.original.url}
                alt="Original"
                style={{ objectFit: 'contain', background: '#111' }}
              />
              <div className="absolute top-3 left-3 bg-black/60 text-white text-xs font-semibold px-2 py-1 rounded pointer-events-none">
                Original
              </div>
            </div>
          }
          itemTwo={
            <div className="relative w-full h-full">
              <ReactCompareSliderImage
                src={pair.edited.url}
                alt="Edited"
                style={{ objectFit: 'contain', background: '#111' }}
              />
              <div className={`absolute ${vertical ? 'bottom-3 left-3' : 'top-3 right-3'} bg-black/60 text-white text-xs font-semibold px-2 py-1 rounded pointer-events-none`}>
                Edited
              </div>
            </div>
          }
        />
      </div>
      {zoom !== 1 && (
        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded pointer-events-none select-none">
          {Math.round(zoom * 100)}%
        </div>
      )}
    </div>
  );
}
