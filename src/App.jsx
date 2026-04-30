import { useState, useEffect } from 'react';
import { useFileStore } from './hooks/useFileStore';
import { DropZone } from './components/DropZone';
import { TopBar } from './components/TopBar';
import { CompareViewer } from './components/CompareViewer';
import { NavigationRibbon } from './components/NavigationRibbon';
import { UnmatchedPanel } from './components/UnmatchedPanel';
import { HelpOverlay } from './components/HelpOverlay';

export default function App() {
  const {
    folderA,
    folderB,
    matches,
    currentIndex,
    setFolderA,
    setFolderB,
    reset,
    navigate,
    liveReload,
    toggleLiveReload,
  } = useFileStore();

  const [hoverMode, setHoverMode] = useState(true);
  const [axisMode, setAxisMode] = useState(0); // 0=L→R, 1=T→B, 2=R→L, 3=B→T (clockwise)
  const [showHelp, setShowHelp] = useState(false);

  const hasMatches = matches && matches.matched.length > 0;
  const currentPair = hasMatches ? matches.matched[currentIndex] : null;

  useEffect(() => {
    const handleKey = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'r' || e.key === 'R') {
        setAxisMode(m => (m + 1) % 4);
      }
      if (e.key === '?') {
        setShowHelp(h => !h);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Plain scroll (no Ctrl) navigates images; Ctrl+scroll is handled by CompareViewer for zoom
  useEffect(() => {
    if (!hasMatches) return;
    const handleWheel = (e) => {
      if (e.ctrlKey) return;
      e.preventDefault();
      if (e.deltaY > 0) navigate(1);
      else navigate(-1);
    };
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [hasMatches, navigate]);

  if (hasMatches) {
    return (
      <div className="flex flex-col h-screen bg-gray-950 text-white overflow-hidden">
        <TopBar
          currentPair={currentPair}
          matches={matches}
          onReset={reset}
          hoverMode={hoverMode}
          onHoverModeToggle={() => setHoverMode(m => !m)}
          axisMode={axisMode}
          onAxisCycle={() => setAxisMode(m => (m + 1) % 4)}
          liveReload={liveReload}
          onLiveReloadToggle={toggleLiveReload}
          onHelpToggle={() => setShowHelp(h => !h)}
        />
        <div className="flex-1 overflow-hidden">
          <CompareViewer pair={currentPair} hoverMode={hoverMode} axisMode={axisMode} />
        </div>
        <NavigationRibbon
          matched={matches.matched}
          currentIndex={currentIndex}
          onNavigate={navigate}
        />
        <UnmatchedPanel
          unmatchedA={matches.unmatchedA}
          unmatchedB={matches.unmatchedB}
        />
        {showHelp && <HelpOverlay onClose={() => setShowHelp(false)} />}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <h1 className="text-3xl font-bold mb-2 text-white">Image Compare Tool</h1>
        <p className="text-gray-400 mb-8 text-center">
          Drop your original and edited image folders to compare them side by side
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl">
          <DropZone
            label="Drop Original Folder Here"
            folder={folderA}
            onDrop={setFolderA}
          />
          <DropZone
            label="Drop Edited Folder Here"
            folder={folderB}
            onDrop={setFolderB}
          />
        </div>
        {folderA && folderB && matches && matches.matched.length === 0 && (
          <div className="mt-6 text-yellow-400 text-center">
            No matching images found. Try dropping folders with similarly named images.
          </div>
        )}
        {(folderA || folderB) && (
          <div className="mt-4 text-gray-500 text-sm">
            {folderA && folderB ? (
              matches ? `${matches.matched.length} pairs matched, ${(matches.unmatchedA?.length ?? 0) + (matches.unmatchedB?.length ?? 0)} unmatched` : 'Matching...'
            ) : (
              'Drop both folders to start matching'
            )}
          </div>
        )}
      </div>
    </div>
  );
}
