import { useCallback, useEffect, useRef, useState } from 'react'
import { useLeetie } from '../store'

/** char → CSS variable holding the pixel color */
const PALETTE: Record<string, string> = {
  k: '--cat-outline',
  f: '--cat-fur',
  s: '--cat-shade',
  w: '--cat-white',
  p: '--cat-pink',
  e: '--cat-eye',
}

const SCALE = 4

// 16 × 13 front-facing chibi cat
const BASE = [
  '..kk........kk..',
  '.kffk......kffk.',
  '.kfpfk....kfpfk.',
  '.kffffkkkkffffk.',
  'kffffffffffffffk',
  'kffeeffffffeeffk',
  'kppffffppffffppk',
  'kfffffwwwwfffffk',
  '.kkffffffffffkk.',
  '.kffffffffffffk.',
  '.kffffffffffffk.',
  '.kfwwffffffwwfk.',
  '..kkkkkkkkkkkk..',
]

function withPixels(rows: string[], pixels: Array<[number, number, string]>): string[] {
  const copy = rows.map((r) => r.split(''))
  for (const [r, c, ch] of pixels) copy[r][c] = ch
  return copy.map((r) => r.join(''))
}

function withClosedEyes(rows: string[]): string[] {
  return withPixels(rows, [
    [5, 3, 'k'],
    [5, 4, 'k'],
    [5, 11, 'k'],
    [5, 12, 'k'],
  ]).map((row, i) => (i === 5 ? row.replace(/e/g, 'f') : row))
}

// tail resting low beside the body
const FRAME_TAIL_DOWN = withPixels(BASE, [
  [10, 15, 'k'],
  [11, 15, 'k'],
])
// tail flicked up
const FRAME_TAIL_UP = withPixels(BASE, [
  [7, 15, 'k'],
  [8, 15, 'k'],
  [9, 15, 'k'],
])
const FRAME_BLINK = withClosedEyes(FRAME_TAIL_DOWN)
const FRAME_SLEEP = withClosedEyes(FRAME_TAIL_DOWN)

const CLICK_MESSAGES = [
  'mrrp! you got this ♡',
  'have you tried console.log?',
  'rubber duck? no. debugging cat.',
  'off-by-one? check your loop bounds!',
  'pspsps… the bug is scared of you',
  'remember to hydrate! ᓚᘏᗢ',
  'edge cases: empty input? one element?',
  'believe in the hash map ✨',
  'meow-mentum! keep going!',
  'stack overflow? more like snack overflow',
  'purrhaps a two-pointer approach?',
  'ur doing amazing sweetie',
  '01101101 01100101 01101111 01110111',
  'sort it first. trust me. meow.',
]

const ROLL_MESSAGES = [
  'oooh, good pick!! ᓚᘏᗢ',
  'a fresh challenge appears! ✧',
  'i love slots ♡',
  'i have a good feeling about this one!',
]

const SAD_MESSAGES = [
  'mrrp… check the red ones. you got this!',
  'so close!! read the failing input carefully ᓚᘏᗢ',
  'bugs fear persistence. and cats.',
  'take a breath. then print the input!',
]

const SPECIALS = ['bounce', 'spin', 'wiggle'] as const
type Special = (typeof SPECIALS)[number]

export function CatPet() {
  const theme = useLeetie((s) => s.theme)
  const catEvent = useLeetie((s) => s.catEvent)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [x, setX] = useState(() => 120 + Math.random() * 250)
  const xRef = useRef(x)
  const [walkMs, setWalkMs] = useState(0)
  const [walking, setWalking] = useState(false)
  const [tailUp, setTailUp] = useState(false)
  const [blink, setBlink] = useState(false)
  const [sleeping, setSleeping] = useState(false)
  const [anim, setAnim] = useState<Special | null>(null)
  const [bubble, setBubble] = useState<string | null>(null)
  const [hearts, setHearts] = useState<Array<{ id: number; left: number; char: string }>>([])

  const bubbleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const animTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const heartSeq = useRef(0)

  const say = useCallback((msg: string) => {
    setBubble(msg)
    clearTimeout(bubbleTimer.current)
    bubbleTimer.current = setTimeout(() => setBubble(null), 3400)
  }, [])

  const playAnim = useCallback((a: Special) => {
    setAnim(a)
    clearTimeout(animTimer.current)
    animTimer.current = setTimeout(() => setAnim(null), 1400)
  }, [])

  const spawnHearts = useCallback((chars = '♥♡✧') => {
    const batch = Array.from({ length: 5 }, () => ({
      id: heartSeq.current++,
      left: 4 + Math.random() * 52,
      char: chars[Math.floor(Math.random() * chars.length)],
    }))
    setHearts((h) => [...h, ...batch])
    setTimeout(() => {
      setHearts((h) => h.filter((it) => !batch.some((b) => b.id === it.id)))
    }, 1400)
  }, [])

  // draw the current frame (deferred a frame so theme CSS vars are applied)
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const css = getComputedStyle(document.documentElement)
      const colors: Record<string, string> = {}
      for (const [ch, cssVar] of Object.entries(PALETTE)) {
        colors[ch] = css.getPropertyValue(cssVar).trim() || '#888'
      }
      const frame = sleeping
        ? FRAME_SLEEP
        : blink
          ? FRAME_BLINK
          : tailUp
            ? FRAME_TAIL_UP
            : FRAME_TAIL_DOWN
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      frame.forEach((row, r) => {
        for (let c = 0; c < row.length; c++) {
          const ch = row[c]
          if (ch === '.') continue
          ctx.fillStyle = colors[ch]
          ctx.fillRect(c * SCALE, r * SCALE, SCALE, SCALE)
        }
      })
    })
    return () => cancelAnimationFrame(raf)
  }, [tailUp, blink, sleeping, theme])

  // idle life: tail flicks + occasional blinks
  useEffect(() => {
    const interval = setInterval(() => {
      if (sleeping) return
      setTailUp((t) => !t)
      if (Math.random() < 0.18) {
        setBlink(true)
        setTimeout(() => setBlink(false), 180)
      }
    }, 700)
    return () => clearInterval(interval)
  }, [sleeping])

  // behavior loop: wander / nap / wake
  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>

    const next = () => {
      if (cancelled) return
      timer = setTimeout(() => {
        setSleeping((asleep) => {
          if (asleep) {
            return Math.random() < 0.4 ? false : true
          }
          const roll = Math.random()
          if (roll < 0.45) {
            const target = 40 + Math.random() * Math.max(120, window.innerWidth - 180)
            const dur = Math.max(600, (Math.abs(target - xRef.current) / 55) * 1000)
            xRef.current = target
            setWalkMs(dur)
            setX(target)
            setWalking(true)
            setTimeout(() => setWalking(false), dur)
            return false
          }
          if (roll < 0.6) return true // nap time
          return false // just vibe
        })
        next()
      }, 6000 + Math.random() * 8000)
    }
    next()
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [])

  // react to run results
  useEffect(() => {
    if (!catEvent) return
    if (catEvent.kind === 'celebrate') {
      setSleeping(false)
      playAnim('bounce')
      spawnHearts('♥♡✧★')
      say('PURRFECT!! all tests passed ✧ᓚᘏᗢ✧')
    } else if (catEvent.kind === 'sad') {
      setSleeping(false)
      playAnim('wiggle')
      say(SAD_MESSAGES[Math.floor(Math.random() * SAD_MESSAGES.length)])
    } else if (catEvent.kind === 'greet') {
      setSleeping(false)
      playAnim('spin')
      say('no shame in peeking — that’s how we learn! ♡')
    } else if (catEvent.kind === 'roll') {
      setSleeping(false)
      playAnim('bounce')
      say(ROLL_MESSAGES[Math.floor(Math.random() * ROLL_MESSAGES.length)])
    }
  }, [catEvent, playAnim, say, spawnHearts])

  const onClick = () => {
    if (sleeping) {
      setSleeping(false)
      say('mrrp?! …I was just resting my eyes')
      return
    }
    playAnim(SPECIALS[Math.floor(Math.random() * SPECIALS.length)])
    spawnHearts()
    say(CLICK_MESSAGES[Math.floor(Math.random() * CLICK_MESSAGES.length)])
  }

  return (
    <div
      className={`cat-wrap ${walking ? 'walking' : ''} ${anim ? `anim-${anim}` : ''}`}
      style={{
        left: x,
        transition: `left ${walkMs}ms linear`,
        transform: sleeping ? 'scaleY(0.92) translateY(3px)' : undefined,
      }}
      onClick={onClick}
      title="pspsps"
    >
      {bubble && <div className="cat-bubble">{bubble}</div>}
      {sleeping && <div className="zzz">z z z</div>}
      {hearts.map((h) => (
        <span key={h.id} className="cat-heart" style={{ left: h.left }}>
          {h.char}
        </span>
      ))}
      <canvas ref={canvasRef} width={16 * SCALE} height={13 * SCALE} />
    </div>
  )
}
