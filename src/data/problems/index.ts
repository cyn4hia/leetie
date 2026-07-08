import type { CuratedProblem } from '../../types'
import { easyProblems } from './easy'
import { mediumProblems } from './medium'
import { hardProblems } from './hard'

/** Problems bundled with tests + reference solutions — fully gradable offline. */
export const curatedProblems: CuratedProblem[] = [
  ...easyProblems,
  ...mediumProblems,
  ...hardProblems,
]

export const curatedBySlug: ReadonlyMap<string, CuratedProblem> = new Map(
  curatedProblems.map((p) => [p.slug, p]),
)
