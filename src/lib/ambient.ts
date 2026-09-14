/**
 * Música ambiental generativa con Web Audio: un pad de acordes lentos con
 * filtro, delay con realimentación y un "shimmer" de campanas ocasional.
 * Sin archivos de audio — nada que descargar ni licenciar.
 */
const CHORDS = [
  [220.0, 277.18, 329.63, 415.3], // Amaj7
  [185.0, 233.08, 277.18, 369.99], // F#m9-ish
  [146.83, 220.0, 293.66, 369.99], // Dmaj7
  [164.81, 246.94, 329.63, 415.3], // E6/9
]

export class AmbientEngine {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private timers: number[] = []
  private voices: OscillatorNode[] = []

  start() {
    if (this.ctx) return
    const ctx = new AudioContext()
    const master = ctx.createGain()
    master.gain.value = 0
    master.gain.linearRampToValueAtTime(0.16, ctx.currentTime + 4)

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 900
    filter.Q.value = 0.4

    const delay = ctx.createDelay(2)
    delay.delayTime.value = 0.62
    const feedback = ctx.createGain()
    feedback.gain.value = 0.42
    delay.connect(feedback).connect(delay)

    filter.connect(master)
    filter.connect(delay)
    delay.connect(master)
    master.connect(ctx.destination)

    // Movimiento lento del filtro
    const lfo = ctx.createOscillator()
    const lfoGain = ctx.createGain()
    lfo.frequency.value = 0.05
    lfoGain.gain.value = 350
    lfo.connect(lfoGain).connect(filter.frequency)
    lfo.start()
    this.voices.push(lfo)

    this.ctx = ctx
    this.master = master

    let step = 0
    const playChord = () => {
      const chord = CHORDS[step++ % CHORDS.length]
      const now = ctx.currentTime
      chord.forEach((freq, i) => {
        for (const detune of [-6, 6]) {
          const osc = ctx.createOscillator()
          const g = ctx.createGain()
          osc.type = i === 0 ? 'sine' : 'triangle'
          osc.frequency.value = freq / (i === 0 ? 2 : 1)
          osc.detune.value = detune
          g.gain.setValueAtTime(0, now)
          g.gain.linearRampToValueAtTime(0.05, now + 3.5)
          g.gain.linearRampToValueAtTime(0, now + 11)
          osc.connect(g).connect(filter)
          osc.start(now)
          osc.stop(now + 11.5)
        }
      })
    }
    const shimmer = () => {
      const now = ctx.currentTime
      const chord = CHORDS[(step + 3) % CHORDS.length]
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = chord[Math.floor(Math.random() * chord.length)] * 4
      g.gain.setValueAtTime(0, now)
      g.gain.linearRampToValueAtTime(0.025, now + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, now + 3)
      osc.connect(g).connect(delay)
      osc.start(now)
      osc.stop(now + 3.2)
    }

    playChord()
    this.timers.push(window.setInterval(playChord, 9000))
    this.timers.push(window.setInterval(() => Math.random() > 0.35 && shimmer(), 2300))
  }

  stop() {
    const { ctx, master } = this
    if (!ctx || !master) return
    this.timers.forEach(clearInterval)
    this.timers = []
    master.gain.cancelScheduledValues(ctx.currentTime)
    master.gain.setValueAtTime(master.gain.value, ctx.currentTime)
    master.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5)
    this.ctx = null
    this.master = null
    const voices = this.voices
    this.voices = []
    setTimeout(() => {
      voices.forEach((v) => v.stop())
      ctx.close()
    }, 1700)
  }
}
