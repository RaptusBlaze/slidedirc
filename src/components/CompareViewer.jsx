import { ReactCompareSlider, ReactCompareSliderImage, ReactCompareSliderHandle } from 'react-compare-slider';
import { useRef, useState, useEffect, useCallback } from 'react';

// axisMode (clockwise): 0=L→R, 1=T→B, 2=R→L, 3=B→T
export function CompareViewer({ pair, hoverMode, axisMode }) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [spaceActive, setSpaceActive] = useState(false);

  const containerRef = useRef(null);
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  // Refs so event handlers always see latest values without re-registering
  const draggingRef = useRef(false);
  const spaceRef = useRef(false);
  const zoomRef = useRef(zoom);
  const panRef = useRef(pan);
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

  // Wheel: zoom toward the cursor position using transform-origin 0 0 math
  const handleWheel = useCallback((e) => {
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

  // Pan via Space + drag — spacebar hold activates pan mode to avoid fighting the slider
  const handleMouseDown = useCallback((e) => {
    if (!spaceRef.current || zoomRef.current <= 1) return;
    e.preventDefault();
    draggingRef.current = true;
    setDragging(true);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      panX: panRef.current.x,
      panY: panRef.current.y,
    };
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!draggingRef.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setPan({ x: dragStart.current.panX + dx, y: dragStart.current.panY + dy });
  }, []);

  const handleMouseUp = useCallback(() => {
    draggingRef.current = false;
    setDragging(false);
  }, []);

  // Spacebar: activates pan mode; prevent page scroll while held
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.code !== 'Space') return;
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON') return;
      if (!spaceRef.current) {
        e.preventDefault();
        spaceRef.current = true;
        setSpaceActive(true);
      }
    };
    const onKeyUp = (e) => {
      if (e.code !== 'Space') return;
      spaceRef.current = false;
      setSpaceActive(false);
      draggingRef.current = false;
      setDragging(false);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      el.removeEventListener('wheel', handleWheel);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleWheel, handleMouseMove, handleMouseUp]);

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

  // Cursor: grabbing while dragging with space, grab while space held + zoomed, default otherwise
  const cursor = dragging ? 'grabbing' : (spaceActive && zoom > 1 ? 'grab' : 'default');

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
      onMouseDown={handleMouseDown}
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

      {/* Space-pan hint when zoomed but space not yet held */}
      {zoom > 1 && !spaceActive && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-gray-300 text-xs px-2 py-1 rounded pointer-events-none select-none">
          Hold <kbd className="bg-gray-700 px-1 rounded">Space</kbd> + drag to pan
        </div>
      )}
    </div>
  );
}
