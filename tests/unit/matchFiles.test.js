import { describe, it, expect } from 'vitest'
import { matchFiles } from '../../src/utils/matchFiles.js'

const makeFile = (name) => ({ name, url: `blob:${name}`, lastModified: 0 })

describe('matchFiles', () => {
  it('exact name match', () => {
    const a = [makeFile('pair-1.png')]
    const b = [makeFile('pair-1.png')]
    const { matched, unmatchedA, unmatchedB } = matchFiles(a, b)
    expect(matched).toHaveLength(1)
    expect(matched[0].original.name).toBe('pair-1.png')
    expect(matched[0].edited.name).toBe('pair-1.png')
    expect(unmatchedA).toHaveLength(0)
    expect(unmatchedB).toHaveLength(0)
  })

  it('basename match (same name, different extension)', () => {
    // baseName strips extension and lowercases: 'image.png' → 'image', 'image.jpg' → 'image'
    const a = [makeFile('image.png')]
    const b = [makeFile('image.jpg')]
    const { matched, unmatchedA, unmatchedB } = matchFiles(a, b)
    expect(matched).toHaveLength(1)
    expect(matched[0].original.name).toBe('image.png')
    expect(matched[0].edited.name).toBe('image.jpg')
    expect(unmatchedA).toHaveLength(0)
    expect(unmatchedB).toHaveLength(0)
  })

  it('fuzzy match: similar names match (≥0.6), dissimilar names do not', () => {
    // 'photo-001' vs 'photo-002' — Dice coefficient ≈ 0.875, well above 0.6 threshold
    const similar = matchFiles([makeFile('photo-001.png')], [makeFile('photo-002.png')])
    expect(similar.matched).toHaveLength(1)
    expect(similar.unmatchedA).toHaveLength(0)
    expect(similar.unmatchedB).toHaveLength(0)

    // 'abc' vs 'xyz' — no bigrams in common, Dice = 0, below 0.6
    const dissimilar = matchFiles([makeFile('abc.png')], [makeFile('xyz.png')])
    expect(dissimilar.matched).toHaveLength(0)
    expect(dissimilar.unmatchedA).toHaveLength(1)
    expect(dissimilar.unmatchedB).toHaveLength(1)
  })

  it('matches ComfyUI converted names with timestamp suffix and different extension', () => {
    const a = [makeFile('134901170_001.webp')]
    const b = [makeFile('134901170_001_20260512T225939_9_0.png')]
    const { matched, unmatchedA, unmatchedB } = matchFiles(a, b)
    expect(matched).toHaveLength(1)
    expect(unmatchedA).toHaveLength(0)
    expect(unmatchedB).toHaveLength(0)
  })

  it('empty inputs', () => {
    const { matched, unmatchedA, unmatchedB } = matchFiles([], [])
    expect(matched).toHaveLength(0)
    expect(unmatchedA).toHaveLength(0)
    expect(unmatchedB).toHaveLength(0)
  })
})
