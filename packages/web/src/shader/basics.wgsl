// name `vertex_main` and `fragment_main` required
// name 'compute_main' required for compute pipeline

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
