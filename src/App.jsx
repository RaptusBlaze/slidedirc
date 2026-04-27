import { useFileStore } from './hooks/useFileStore';
import { DropZone } from './components/DropZone';
import { TopBar } from './components/TopBar';
import { CompareViewer } from './components/CompareViewer';
import { NavigationRibbon } from './components/NavigationRibbon';
import { UnmatchedPanel } from './components/UnmatchedPanel';

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
  } = useFileStore();

  const hasMatches = matches && matches.matched.length > 0;
  const currentPair = hasMatches ? matches.matched[currentIndex] : null;

  if (hasMatches) {
    return (
      <div className="flex flex-col h-screen bg-gray-950 text-white overflow-hidden">
        <TopBar
          folderA={folderA}
          folderB={folderB}
          matches={matches}
          onReset={reset}
        />
        <div className="flex-1 overflow-hidden">
          <CompareViewer pair={currentPair} />
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
