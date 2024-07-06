// Vertex shader
struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) texcoord: vec2f,
};

@vertex
fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
    let pos = array<vec2f, 3>(
      // 1st triangle
      vec2f( 0.0,  0.0),  // center
      vec2f( 4.0,  0.0),  // right, center
      vec2f( 0.0,  4.0),  // center, top
    );
    var vOut: VertexOutput;
    let xy = pos[vertexIndex];
    vOut.position = vec4f(xy.x, -xy.y, 0.0, 1.0) - vec4f(1, -1, 0, 0);
    vOut.texcoord = xy / 2.0;
    return vOut;
}

// Fragment shader
@group(0) @binding(0) var fSampler: sampler;
@group(0) @binding(1) var tilesTexture: texture_2d<f32>;
@group(0) @binding(2) var coloursTexture: texture_1d<f32>;

@fragment
fn fragmentMain(v: VertexOutput) -> @location(0) vec4f {
    var cell = textureSample(tilesTexture, fSampler, v.texcoord);
    return textureSample(coloursTexture, fSampler, cell.x);
}