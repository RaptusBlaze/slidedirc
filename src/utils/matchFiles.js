import stringSimilarity from 'string-similarity';

function baseName(filename) {
  return filename.replace(/\.[^/.]+$/, '').toLowerCase();
}

function normalizedName(filename) {
  return baseName(filename).replace(/_\d{8}t\d{6}_\d+_\d+$/, '');
}

export function matchFiles(filesA, filesB) {
  const matched = [];
  const unmatchedA = [];
  const unmatchedB = [...filesB];

  for (const a of filesA) {
    let idx = unmatchedB.findIndex(b => b.name.toLowerCase() === a.name.toLowerCase());

    if (idx === -1) {
      idx = unmatchedB.findIndex(b => normalizedName(b.name) === normalizedName(a.name));
    }

    if (idx === -1 && unmatchedB.length > 0) {
      const names = unmatchedB.map(b => normalizedName(b.name));
      const result = stringSimilarity.findBestMatch(normalizedName(a.name), names);
      if (result.bestMatch.rating >= 0.6) {
        idx = result.bestMatchIndex;
      }
    }

    if (idx !== -1) {
      matched.push({ original: a, edited: unmatchedB[idx] });
      unmatchedB.splice(idx, 1);
    } else {
      unmatchedA.push(a);
    }
  }

  return { matched, unmatchedA, unmatchedB };
}
