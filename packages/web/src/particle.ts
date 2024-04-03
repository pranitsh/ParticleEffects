/*
 * Copyright (c) 2024 Pranit Shah
 * All rights reserved.
 */
import Renderer from './renderer'

let basicS = `/*
 * Copyright (c) 2024 Pranit Shah
 * All rights reserved.
 */

@vertex
fn vertex_main(
  @builtin(vertex_index) VertexIndex : u32
) -> @builtin(position) vec4<f32> {
  var radi: f32 = 2.0 * 3.14159265359 * f32(VertexIndex)/100;
  var pos: vec2<f32> = vec2<f32>(cos(radi), sin(radi));
  return vec4<f32>(pos, 0.0, 1.0);
}

@fragment
fn fragment_main(@builtin(position) FragCoord: vec4<f32>) -> @location(0) vec4<f32> {
  return vec4<f32>(0.0, 1.0, 1.0, 1.0);
}
`

let renderS = `/*
* Copyright (c) 2024 Pranit Shah
* All rights reserved.
*/
struct Particle {
 position: vec3<f32>,
 color: vec3<f32>,
 direction: vec3<f32>,
}

struct ParticleData {
 data: array<Particle>,
}

@group(0) @binding(0)
var<storage, read> particles: ParticleData;

struct VertexOutput {
 @builtin(position) position : vec4<f32>,
 @location(0) color: vec3<f32>,
 @location(1) direction : vec3<f32>,
}

@vertex
fn vertex_main(
 @builtin(vertex_index) VertexIndex : u32,
) -> VertexOutput {
 var output: VertexOutput;
 output.position = vec4<f32>(particles.data[VertexIndex].position, 1.0);
 output.color = particles.data[VertexIndex].color;
 output.direction = particles.data[VertexIndex].direction;
 return output;
}

@fragment
fn fragment_main(input: VertexOutput) -> @location(0) vec4<f32> {
 var alpha: f32 = 1.0 - length(input.direction);
 return vec4<f32>(input.color, alpha);
}
`


let computeS = `
/*
 * Copyright (c) 2024 Pranit Shah
 * All rights reserved.
 */
struct Particle {
  position: vec3<f32>,
  color: vec3<f32>,
  direction: vec3<f32>,
}

struct ParticleData {
  data: array<Particle>,
}

@group(0) @binding(0)
var<storage, read_write> particles: ParticleData;

@compute @workgroup_size(64)
fn compute_main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {
  let index = GlobalInvocationID.x;
  let angle = 2.0 * 3.14159 * f32(index) / 100.0;
  var x = 0.5 * cos(angle) + f32(particles.data[index].direction[0]);
  var y = 0.5 * sin(angle) + f32(particles.data[index].direction[1]);
  if (x > 1.0) {
    x = x - 0.01 * f32(particles.data[index].direction[0]);
  }
  var z = 0.0;
  particles.data[index].position = vec3<f32>(x, y, z);
  particles.data[index].color = vec3<f32>(1.0, 1.0, 1.0);
  particles.data[index].direction = vec3<f32>(x/100, y/100, 0.0);
}
`

let simpleS = `/*
* Copyright (c) 2024 Pranit Shah
* All rights reserved.
*/
struct ParticleData {
 data: array<u32>,
}

@group(0) @binding(0)
var<storage, read_write> particles: ParticleData;

@compute @workgroup_size(64)
fn compute_main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {
 let index = GlobalInvocationID.x;
 particles.data[index] = index;
}
`

let jaggedS = `/*
* Copyright (c) 2024 Pranit Shah
* All rights reserved.
*/
struct Particle {
 position: vec3<f32>,
 color: vec3<f32>,
 direction: vec3<f32>,
}

struct ParticleData {
 data: array<Particle>,
}

@group(0) @binding(0)
var<storage, read_write> particles: ParticleData;

@compute @workgroup_size(64)
fn compute_main(@builtin(global_invocation_id) GlobalInvocationID : vec3<u32>) {
 let index = GlobalInvocationID.x;
 let angle = 2.0 * 3.14159 * f32(index) / 64.0;
 var x = 0.5 * cos(angle) + particles.data[index].direction[0];
 var y = 0.5 * sin(angle) + particles.data[index].direction[1];
 if (x > 1.0) {
   x = x / 2.0;
 }
 if (y > 1.0) {
   y = x / 2.0;
 }
 let z = 0.0;
 particles.data[index].position = vec3<f32>(x, y, z);
 particles.data[index].color = vec3<f32>(x, y, 0.5 - x);
 particles.data[index].direction = vec3<f32>(x, y, 0.0);
}
`

interface Options {
  initialCount: number
  particleCount: number
  renderShader: string
  computeShader: string
}

const TEST: Options = {
  renderShader: renderS,
  computeShader: computeS,
  initialCount: 10,
  particleCount: 100
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
