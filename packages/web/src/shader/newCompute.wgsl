
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
