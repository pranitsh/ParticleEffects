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
  // You can use the color and direction to determine the color of the particle
  var alpha: f32 = 0.0 - length(input.direction);
  return vec4<f32>(input.color, alpha);
}
