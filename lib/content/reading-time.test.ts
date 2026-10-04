import { describe, expect, it } from 'bun:test'

import {
  countWords,
  minutesFor,
  minutesLeft,
  WORDS_PER_MINUTE,
} from './reading-time'

describe('countWords', () => {
  it('counts runs of non-space characters', () => {
    expect(countWords('Scope is the deliverable.')).toBe(4)
    expect(countWords('  two\n words ')).toBe(2)
    expect(countWords('   ')).toBe(0)
  })
})

describe('minutesFor', () => {
  it('rounds to whole minutes and never says zero', () => {
    expect(minutesFor(WORDS_PER_MINUTE * 6)).toBe(6)
    expect(minutesFor(WORDS_PER_MINUTE * 6 + 10)).toBe(6)
    expect(minutesFor(10)).toBe(1)
  })
})

describe('minutesLeft', () => {
  const words = [WORDS_PER_MINUTE * 2, WORDS_PER_MINUTE * 2, WORDS_PER_MINUTE]

  it('counts only the paragraphs still ahead', () => {
    expect(minutesLeft(words, 0)).toBe(5)
    expect(minutesLeft(words, 2)).toBe(1)
  })

  it('says nothing is left once every paragraph is read', () => {
    expect(minutesLeft(words, 3)).toBe(0)
  })
})
