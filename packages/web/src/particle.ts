import Renderer from './renderer'
import renderS from './shader/particleRender.wgsl'
import computeS from './shader/jaggedCompute.wgsl'

interface Options {
  initialCount: number
  particleCount: number
  renderShader: string
  computeShader: string
}

const TEST: Options = {
  renderShader: renderS,
  computeShader: computeS,
  initialCount: 100,
  particleCount: 1000
}

export default class Particle {
  static id: number = 0
  renderClass: Renderer
  options: Options

  constructor (options: Options, renderClass: Renderer = new Renderer()) {
    Particle.id = Particle.id++
    this.renderClass = renderClass
    this.options = options
  }

  async setup (): Promise<void> {
    await Renderer.getCanvas()
    Renderer.isWebGPUSupported()
  }

  async start (): Promise<void> {
    await this.renderClass.startLoop(
      this.options.renderShader,
      this.options.computeShader,
      this.options.initialCount,
      this.options.particleCount
    )
  }
}

(function testColorParticle () {
  // Test initialization
  const particle = new Particle(TEST)
  // Test start
  void particle.setup().then(async () => { await particle.start() })
})()
