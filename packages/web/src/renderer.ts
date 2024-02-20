enum BACKEND {
  webGPU,
  webGL,
  canvas
}

interface Simulator {
  pipeline: GPURenderPipeline
  context: GPUCanvasContext
  device: GPUDevice
  system: System
  format: GPUTextureFormat
}

interface System {
  initialCount: number
  shader: string
  particles: ParticleGroup[]
}

interface ParticleGroup {
  particleCount: number
  buffer: GPUBuffer
  visibility: GPUShaderStageFlags
  pipeline: GPUComputePipeline
}

interface webGPUsetup {
  device: GPUDevice
  context: GPUCanvasContext
  format: GPUTextureFormat
}

export default class Renderer {
  static canvas: HTMLCanvasElement = document.getElementById('canvas') as HTMLCanvasElement
  static backend: BACKEND = Renderer.determineBackend()
  static webGPUsetup: webGPUsetup | null = null

  constructor (defaultBackend: BACKEND = Renderer.backend) {
    Renderer.backend = defaultBackend
  }

  static async getCanvas (): Promise<boolean> {
    return await new Promise<boolean>((resolve) => {
      document.addEventListener('DOMContentLoaded', (_) => {
        Renderer.canvas = document.getElementById('canvas') as HTMLCanvasElement
        resolve(Renderer.canvas != null)
      })
    })
  }

  static determineBackend (): BACKEND {
    if (Renderer.isWebGPUSupported()) {
      return BACKEND.webGPU
    } else if (Renderer.isWebGLSupported()) {
      return BACKEND.webGL
    } else {
      throw new Error('Unsupported browser')
    }
  }

  static isWebGPUSupported (): boolean {
    return 'gpu' in navigator
  }

  static isWebGLSupported (): boolean {
    const gl = Renderer.canvas.getContext('webgl') ?? Renderer.canvas.getContext('experimental-webgl')
    return gl != null && gl instanceof WebGLRenderingContext
  }

  static async getWebGPUsetup (): Promise<webGPUsetup | null> {
    if (document.visibilityState !== 'visible') {
      console.log('Page not visible', document.visibilityState)
      return null
    }
    if (Renderer.webGPUsetup != null) {
      return Renderer.webGPUsetup
    }
    const adapter = await navigator.gpu.requestAdapter()
    if (adapter == null) {
      Renderer.backend = BACKEND.webGL
      console.log('Failed getting GPUAdapter, using webGL instead')
      return null
    }
    const device = await adapter.requestDevice()
    if (device == null) {
      Renderer.backend = BACKEND.webGL
      console.log('Failed getting GPUDevice, using webGL')
      return null
    }
    const context: GPUCanvasContext | null = this.canvas.getContext('webgpu')
    if (context == null) {
      Renderer.backend = BACKEND.webGL
      console.log('Failed to get WebGPU context, using webGL')
      return null
    }
    const devicePixelRatio = window.devicePixelRatio
    this.canvas.width = window.innerWidth * devicePixelRatio
    this.canvas.height = window.innerHeight * devicePixelRatio
    const presentationFormat = navigator.gpu.getPreferredCanvasFormat()
    context.configure({
      device,
      format: presentationFormat
    })
    this.webGPUsetup = {
      device,
      context,
      format: presentationFormat
    }
    return {
      device,
      context,
      format: presentationFormat
    }
  }

  async createShaderModule (
    device: GPUDevice,
    code: string
  ): Promise<GPUShaderModule> {
    const shaderModule = device.createShaderModule({
      code
    })
    return shaderModule
  }

  async createRenderPipeline (
    device: GPUDevice,
    vertexShaderModule: GPUShaderModule,
    fragmentShaderModule: GPUShaderModule,
    format: GPUTextureFormat
  ): Promise<GPURenderPipeline> {
    const pipeline = device.createRenderPipeline({
      layout: 'auto',
      vertex: {
        module: vertexShaderModule,
        entryPoint: 'vertex_main'
      },
      fragment: {
        module: fragmentShaderModule,
        entryPoint: 'fragment_main',
        targets: [{ format }]
      }
    })
    return pipeline
  }

  createRenderPassDescriptor (
    textureView: GPUTextureView
  ): GPURenderPassDescriptor {
    return {
      colorAttachments: [{
        view: textureView,
        clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
        loadOp: 'clear',
        storeOp: 'store'
      }]
    }
  }

  async createSimulator (
    device: GPUDevice,
    context: GPUCanvasContext,
    format: GPUTextureFormat,
    system: System
  ): Promise<Simulator | null> {
    return {
      system,
      format,
      device,
      context,
      pipeline: await this.createRenderPipeline(
        device,
        await this.createShaderModule(
          device,
          system.shader
        ),
        await this.createShaderModule(
          device,
          system.shader
        ),
        format
      )
    }
  }

  createSystem (
    indexCount: number,
    shader: string,
    particles: ParticleGroup[]
  ): System {
    return {
      initialCount: indexCount,
      shader,
      particles
    }
  }

  async createParticleGroup (
    device: GPUDevice,
    isForVertex: boolean = true,
    totalParticles: number,
    shader: string
  ): Promise<ParticleGroup> {
    const bufferSize = totalParticles * 4 * 4
    const buffer: GPUBuffer = device.createBuffer({
      size: bufferSize,
      usage: GPUBufferUsage.STORAGE,
      mappedAtCreation: true
    })
    buffer.unmap()
    return {
      particleCount: totalParticles,
      buffer,
      visibility: isForVertex ? GPUShaderStage.VERTEX : GPUShaderStage.FRAGMENT,
      pipeline: device.createComputePipeline({
        layout: 'auto',
        compute: {
          module: await this.createShaderModule(device, shader),
          entryPoint: 'compute_main'
        }
      })
    }
  }

  async renderSimulator (
    simulator: Simulator
  ): Promise<void> {
    const commandEncoder = simulator.device.createCommandEncoder()
    let binding: number = 0
    let renderCount = simulator.system.initialCount
    const renderBindGroupEntries: GPUBindGroupEntry[] = []
    const renderBindGroupLayoutEntries: GPUBindGroupLayoutEntry[] = []
    for (const particleGroup of simulator.system.particles) {
      const computeCommandEncoder = simulator.device.createCommandEncoder()
      const computePass = computeCommandEncoder.beginComputePass()
      computePass.setPipeline(particleGroup.pipeline)
      const computeBindGroupEntries: GPUBindGroupEntry[] = [
        {
          binding: 0,
          resource: {
            buffer: particleGroup.buffer
          }
        }
      ]
      renderBindGroupEntries.push({
        binding,
        resource: {
          buffer: particleGroup.buffer
        }
      })
      renderBindGroupLayoutEntries.push({
        binding,
        visibility: particleGroup.visibility,
        buffer: {
          type: 'read-only-storage'
        }
      })
      binding += 1
      renderCount += particleGroup.particleCount
      const bindGroup: GPUBindGroup = simulator.device.createBindGroup({
        layout: particleGroup.pipeline.getBindGroupLayout(0),
        entries: computeBindGroupEntries
      })
      computePass.setBindGroup(0, bindGroup)
      computePass.dispatchWorkgroups(100, 1, 1)
      computePass.end()
      simulator.device.queue.submit([computeCommandEncoder.finish()])
    }
    simulator.context.configure({
      device: simulator.device,
      format: simulator.format
    })
    const textureView: GPUTextureView = simulator.context.getCurrentTexture().createView({
      format: simulator.format
    })
    const passEncoder = commandEncoder.beginRenderPass(
      this.createRenderPassDescriptor(textureView)
    )
    const bindGroup: GPUBindGroup = simulator.device.createBindGroup({
      layout: simulator.pipeline.getBindGroupLayout(0),
      entries: renderBindGroupEntries
    })
    passEncoder.setBindGroup(0, bindGroup)
    passEncoder.setPipeline(simulator.pipeline)
    passEncoder.draw(renderCount, 1, 0)
    passEncoder.end()
    simulator.device.queue.submit([commandEncoder.finish()])
  }

  async webGPUdraw (
    renderShader: string,
    computeShader: string
  ): Promise<void> {
    const setup: webGPUsetup | null = await Renderer.getWebGPUsetup()
    if (setup === null) {
      console.log('Failed to configure WebGPU page')
      return
    }
    const simulator: Simulator | null = await this.createSimulator(
      setup.device,
      setup.context,
      setup.format,
      this.createSystem(
        100,
        renderShader,
        [
          await this.createParticleGroup(
            setup.device,
            true,
            1000,
            computeShader
          )
        ]
      )
    )
    if (simulator === null) {
      return
    }
    await this.renderSimulator(simulator)
  }

  async renderLoop (
    simulator: Simulator
  ): Promise<void> {
    await this.renderSimulator(simulator)
    await simulator.device.queue.onSubmittedWorkDone()
    requestAnimationFrame(() => {
      void this.renderLoop(simulator)
    })
  }

  async startLoop (
    renderShader: string,
    computeShader: string,
    initialCount: number = 100,
    particleCount: number = 1000
  ): Promise<void> {
    const setup = await Renderer.getWebGPUsetup()
    if (setup == null) {
      console.log('Failed to configure WebGPU page')
      return
    }
    const simulator: Simulator | null = await this.createSimulator(
      setup.device,
      setup.context,
      setup.format,
      this.createSystem(
        initialCount,
        renderShader,
        [
          await this.createParticleGroup(
            setup.device,
            true,
            particleCount,
            computeShader
          )
        ]
      )
    )
    if (simulator === null) {
      return
    }
    await this.renderLoop(simulator)
  }

  async webGPULoop (
    renderShader: string,
    computeShader: string,
    initialCount: number = 100,
    particleCount: number = 1000
  ): Promise<void> {
    const setup = await Renderer.getWebGPUsetup()
    if (setup == null) {
      console.log('Failed to configure WebGPU page')
      return
    }
    const simulator: Simulator | null = await this.createSimulator(
      setup.device,
      setup.context,
      setup.format,
      this.createSystem(
        initialCount,
        renderShader,
        [
          await this.createParticleGroup(
            setup.device,
            true,
            particleCount,
            computeShader
          )
        ]
      )
    )
    if (simulator === null) {
      return
    }
    requestAnimationFrame(() => {
      void this.webGPULoop(renderShader, computeShader, initialCount, particleCount)
    })
  }
}
