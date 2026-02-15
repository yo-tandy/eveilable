/** Fisher-Yates shuffle (in-place). Returns the array. */
export function shuffle<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

/** Pick a random element from an array. */
export function randomPick<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]
}

/** Pick n unique random indices from range [0, max). */
export function randomIndices(max: number, n: number): number[] {
  const indices = Array.from({ length: max }, (_, i) => i)
  shuffle(indices)
  return indices.slice(0, Math.min(n, max))
}
