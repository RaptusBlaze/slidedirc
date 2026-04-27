import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';
import { useRef, useState, useEffect, useCallback } from 'react';

// axisMode: 0 = L→R, 1 = R→L, 2 = T→B, 3 = B→T
export function CompareViewer({ pair, hoverMode, axisMode }) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  const containerRef = useRef(null);
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  // Refs so event handlers always access the latest state without re-registering
  const draggingRef = useRef(false);
  const zoomRef = useRef(zoom);
  const panRef = useRef(pan);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { panRef.current = pan; }, [pan]);

  const portrait = axisMode >= 2;
  const reversed = axisMode % 2 === 1;

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
    const sx = e.clientX - rect.left; // cursor relative to container
    const sy = e.clientY - rect.top;

    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    const prevZoom = zoomRef.current;
    const newZoom = Math.min(Math.max(prevZoom * factor, 1), 4);

    if (newZoom === 1) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      return;
    }

    // Keep the content point under the cursor stationary
    const scale = newZoom / prevZoom;
    const prevPan = panRef.current;
    setZoom(newZoom);
    setPan({
      x: sx * (1 - scale) + prevPan.x * scale,
      y: sy * (1 - scale) + prevPan.y * scale,
    });
  }, []);

  const handleMouseDown = useCallback((e) => {
    if (zoomRef.current <= 1) return;
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

  // Labels: left/top slot label and right/bottom slot label depend on reversed mode
  const slotALabel = reversed ? 'Edited' : 'Original';
  const slotBLabel = reversed ? 'Original' : 'Edited';
  // slotB label position: bottom-left for portrait, top-right for landscape
  const slotBClass = `absolute ${portrait ? 'bottom-3 left-3' : 'top-3 right-3'} bg-black/60 text-white text-xs font-semibold px-2 py-1 rounded pointer-events-none select-none`;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden"
      style={{ cursor: zoom > 1 ? (dragging ? 'grabbing' : 'grab') : 'default' }}
      onMouseDown={handleMouseDown}
    >
      {/* Scaled / panned layer — labels are intentionally kept outside so they don't move */}
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
          // Remount on every mode change to reset slider position to 50%
          key={axisMode}
          changePositionOnHover={hoverMode}
          portrait={portrait}
          keyboardIncrement="0%"
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

      {zoom !== 1 && (
        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded pointer-events-none select-none">
          {Math.round(zoom * 100)}%
        </div>
      )}
    </div>
  );
}
