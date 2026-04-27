import { useState, useCallback, useEffect, useRef } from 'react';
import { matchFiles } from '../utils/matchFiles';

const IMAGE_RE = /\.(png|jpe?g|gif|webp|bmp|tiff?|svg)$/i;

/** Scan a FileSystemDirectoryHandle and return {name, url} for all image files. */
async function getNewFiles(handle, existingFiles) {
  const existingNames = new Set((existingFiles ?? []).map(f => f.name));
  const results = [];
  for await (const [name, entry] of handle.entries()) {
    if (entry.kind !== 'file' || existingNames.has(name)) continue;
    try {
      const file = await entry.getFile();
      if (file.type.startsWith('image/') || IMAGE_RE.test(name)) {
        results.push({ name, url: URL.createObjectURL(file) });
      }
    } catch {
      // skip files that can't be read
    }
  }
  return results;
}

function revokeFolder(folder) {
  if (folder) folder.files.forEach(f => URL.revokeObjectURL(f.url));
}

export function useFileStore() {
  const [folderA, setFolderAState] = useState(null);
  const [folderB, setFolderBState] = useState(null);
  const [matches, setMatches] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dirHandleA, setDirHandleAState] = useState(null);
  const [dirHandleB, setDirHandleBState] = useState(null);
  const [liveReload, setLiveReload] = useState(false);

  // Refs so the polling closure always sees the latest folder files
  const folderARef = useRef(folderA);
  const folderBRef = useRef(folderB);
  useEffect(() => { folderARef.current = folderA; }, [folderA]);
  useEffect(() => { folderBRef.current = folderB; }, [folderB]);

  // Re-run matching whenever folder contents change; preserve current index if valid
  useEffect(() => {
    if (folderA && folderB) {
      const result = matchFiles(folderA.files, folderB.files);
      setMatches(result);
      setCurrentIndex(prev =>
        result.matched.length === 0 ? 0 : Math.min(prev, result.matched.length - 1)
      );
    } else {
      setMatches(null);
    }
  }, [folderA, folderB]);

  const setFolderA = useCallback((name, files) => {
    setFolderAState(prev => { revokeFolder(prev); return { name, files }; });
    setDirHandleAState(null);
    setLiveReload(false);
  }, []);

  const setFolderB = useCallback((name, files) => {
    setFolderBState(prev => { revokeFolder(prev); return { name, files }; });
    setDirHandleBState(null);
    setLiveReload(false);
  }, []);

  const reset = useCallback(() => {
    setFolderAState(prev => { revokeFolder(prev); return null; });
    setFolderBState(prev => { revokeFolder(prev); return null; });
    setMatches(null);
    setCurrentIndex(0);
    setDirHandleAState(null);
    setDirHandleBState(null);
    setLiveReload(false);
  }, []);

  const navigate = useCallback((delta) => {
    setCurrentIndex(prev => {
      if (!matches) return 0;
      const next = prev + delta;
      return Math.max(0, Math.min(matches.matched.length - 1, next));
    });
  }, [matches]);

  /**
   * Toggle live reload.
   * On first enable, calls showDirectoryPicker() for each folder that doesn't
   * yet have a persistent handle.  Requires a user-gesture (button click).
   */
  const toggleLiveReload = useCallback(async () => {
    if (liveReload) {
      setLiveReload(false);
      return;
    }
    if (!window.showDirectoryPicker) return;

    let hA = dirHandleA;
    let hB = dirHandleB;

    if (!hA) {
      try {
        hA = await window.showDirectoryPicker({ mode: 'read' });
        setDirHandleAState(hA);
      } catch {
        return; // user cancelled
      }
    }
    if (!hB) {
      try {
        hB = await window.showDirectoryPicker({ mode: 'read' });
        setDirHandleBState(hB);
      } catch {
        return; // user cancelled
      }
    }

    setLiveReload(true);
  }, [liveReload, dirHandleA, dirHandleB]);

  // Polling effect — runs every 3 s while live reload is active
  useEffect(() => {
    if (!liveReload || !dirHandleA || !dirHandleB) return;

    const poll = async () => {
      try {
        const [newA, newB] = await Promise.all([
          getNewFiles(dirHandleA, folderARef.current?.files),
          getNewFiles(dirHandleB, folderBRef.current?.files),
        ]);
        if (newA.length > 0) {
          setFolderAState(prev => prev ? { ...prev, files: [...prev.files, ...newA] } : prev);
        }
        if (newB.length > 0) {
          setFolderBState(prev => prev ? { ...prev, files: [...prev.files, ...newB] } : prev);
        }
      } catch {
        // silently ignore transient errors
      }
    };

    const id = setInterval(poll, 3000);
    return () => clearInterval(id);
  }, [liveReload, dirHandleA, dirHandleB]);

  return {
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
  };
}
