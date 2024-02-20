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
