import { ReactCompareSlider, ReactCompareSliderImage, ReactCompareSliderHandle } from 'react-compare-slider';
import { useRef, useState, useEffect, useCallback } from 'react';

// axisMode (clockwise): 0=L→R, 1=T→B, 2=R→L, 3=B→T
export function CompareViewer({ pair, hoverMode, axisMode }) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [spaceActive, setSpaceActive] = useState(false);

  const containerRef = useRef(null);
  // Refs so event handlers always see latest values without re-registering
  const spaceRef = useRef(false);
  const zoomRef = useRef(zoom);
  const panRef = useRef(pan);
  const lastMousePos = useRef(null);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { panRef.current = pan; }, [pan]);

  // Clockwise axis: 0=L→R, 1=T→B, 2=R→L, 3=B→T
  const portrait = axisMode % 2 === 1;
  const reversed = axisMode >= 2;

  // Reset zoom and pan on every pair change
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [pair]);

  // Wheel: Ctrl+scroll zooms toward cursor; plain scroll is left for image navigation (App.jsx)
  const handleWheel = useCallback((e) => {
    if (!e.ctrlKey) return; // plain scroll handled by App for image navigation
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    const prevZoom = zoomRef.current;
    const newZoom = Math.min(Math.max(prevZoom * factor, 1), 4);

    if (newZoom === 1) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      return;
    }

    const scale = newZoom / prevZoom;
    const prevPan = panRef.current;
    setZoom(newZoom);
    setPan({
      x: sx * (1 - scale) + prevPan.x * scale,
      y: sy * (1 - scale) + prevPan.y * scale,
    });
  }, []);

  // Pan via Space toggle + mouse movement (GIMP-style: no click needed).
  const handleMouseMove = useCallback((e) => {
    if (!spaceRef.current || zoomRef.current <= 1) return;
    if (lastMousePos.current === null) {
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      return;
    }
    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
    setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
  }, []);

  // Spacebar: toggles pan mode on each press (GIMP-style).
  // Prevent page scroll while pan mode is active.
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.code !== 'Space' || e.repeat) return;
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON') return;
      e.preventDefault();
      const next = !spaceRef.current;
      spaceRef.current = next;
      setSpaceActive(next);
      // Reset tracked position when entering pan mode so first move anchors correctly
      if (next) lastMousePos.current = null;
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      el.removeEventListener('wheel', handleWheel);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [handleWheel, handleMouseMove]);

  if (!pair) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900 text-gray-500">
        No pair selected
      </div>
    );
  }

  const originalImg = (
    <ReactCompareSliderImage
      src={pair.original.url}
      alt="Original"
      style={{ objectFit: 'contain', background: '#111' }}
    />
  );
  const editedImg = (
    <ReactCompareSliderImage
      src={pair.edited.url}
      alt="Edited"
      style={{ objectFit: 'contain', background: '#111' }}
    />
  );

  const slotALabel = reversed ? 'Edited' : 'Original';
  const slotBLabel = reversed ? 'Original' : 'Edited';
  const slotBClass = `absolute ${portrait ? 'bottom-3 left-3' : 'top-3 right-3'} bg-black/60 text-white text-xs font-semibold px-2 py-1 rounded pointer-events-none select-none`;

  // Cursor: crosshair-grab while pan mode active + zoomed, default otherwise
  const cursor = spaceActive && zoom > 1 ? 'grab' : 'default';

  // Minimal handle: just the divider line, no thumb button
  const sliderHandle = (
    <ReactCompareSliderHandle
      buttonStyle={{ display: 'none' }}
      linesStyle={{ width: 2, opacity: 0.8 }}
    />
  );

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden"
      style={{ cursor }}
    >
      {/* Scaled / panned layer — labels are intentionally outside so they don't zoom/move */}
      <div
        style={{
          width: '100%',
          height: '100%',
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          willChange: 'transform',
        }}
      >
        <ReactCompareSlider
          key={axisMode}
          changePositionOnHover={hoverMode}
          portrait={portrait}
          keyboardIncrement="0%"
          handle={sliderHandle}
          style={{ width: '100%', height: '100%' }}
          itemOne={reversed ? editedImg : originalImg}
          itemTwo={reversed ? originalImg : editedImg}
        />
      </div>

      {/* Fixed overlay labels */}
      <div className="absolute top-3 left-3 bg-black/60 text-white text-xs font-semibold px-2 py-1 rounded pointer-events-none select-none">
        {slotALabel}
      </div>
      <div className={slotBClass}>
        {slotBLabel}
      </div>

      {/* Zoom badge */}
      {zoom !== 1 && (
        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded pointer-events-none select-none">
          {Math.round(zoom * 100)}%
          {spaceActive && <span className="ml-1 opacity-70">· pan</span>}
        </div>
      )}

      {/* Hints when zoomed */}
      {zoom > 1 && !spaceActive && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-gray-300 text-xs px-2 py-1 rounded pointer-events-none select-none">
          Press <kbd className="bg-gray-700 px-1 rounded">Space</kbd> to toggle pan mode
        </div>
      )}
      {zoom > 1 && spaceActive && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-gray-300 text-xs px-2 py-1 rounded pointer-events-none select-none">
          Pan mode — move mouse to pan · Press <kbd className="bg-gray-700 px-1 rounded">Space</kbd> to exit
        </div>
      )}
    </div>
  );
}
