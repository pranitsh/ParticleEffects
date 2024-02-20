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
