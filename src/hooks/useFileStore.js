import { useState, useCallback, useEffect } from 'react';
import { matchFiles } from '../utils/matchFiles';

export function useFileStore() {
  const [folderA, setFolderAState] = useState(null);
  const [folderB, setFolderBState] = useState(null);
  const [matches, setMatches] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (folderA && folderB) {
      const result = matchFiles(folderA.files, folderB.files);
      setMatches(result);
      setCurrentIndex(0);
    } else {
      setMatches(null);
    }
  }, [folderA, folderB]);

  const setFolderA = useCallback((name, files) => {
    setFolderAState(prev => { revokeFolder(prev); return { name, files }; });
  }, []);

  const setFolderB = useCallback((name, files) => {
    setFolderBState(prev => { revokeFolder(prev); return { name, files }; });
  }, []);

  const revokeFolder = (folder) => {
    if (folder) folder.files.forEach(f => URL.revokeObjectURL(f.url));
  };

  const reset = useCallback(() => {
    setFolderAState(prev => { revokeFolder(prev); return null; });
    setFolderBState(prev => { revokeFolder(prev); return null; });
    setMatches(null);
    setCurrentIndex(0);
  }, []);

  const navigate = useCallback((delta) => {
    setCurrentIndex(prev => {
      if (!matches) return 0;
      const next = prev + delta;
      return Math.max(0, Math.min(matches.matched.length - 1, next));
    });
  }, [matches]);

  return {
    folderA,
    folderB,
    matches,
    currentIndex,
    setFolderA,
    setFolderB,
    reset,
    navigate,
  };
}
