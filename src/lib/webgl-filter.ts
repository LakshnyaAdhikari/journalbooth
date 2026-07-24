import type { FilterParams } from "./filters";

const VERT = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = vec2((a_pos.x + 1.0) * 0.5, 1.0 - (a_pos.y + 1.0) * 0.5);
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

const FRAG = `
precision mediump float;
varying vec2 v_uv;
uniform sampler2D u_tex;
uniform float u_saturation;
uniform float u_contrast;
uniform float u_brightness;
uniform float u_grain;
uniform float u_vignette;
uniform float u_warmth;
uniform vec3  u_tint;
uniform float u_chroma;
uniform float u_time;
uniform vec2  u_res;

float rand(vec2 n) { return fract(sin(dot(n, vec2(12.9898, 78.233))) * 43758.5453); }

void main() {
  vec2 uv = v_uv;
  // Chromatic aberration — sample R/B slightly offset from center.
  vec2 dir = uv - 0.5;
  float r = texture2D(u_tex, uv - dir * u_chroma).r;
  float g = texture2D(u_tex, uv).g;
  float b = texture2D(u_tex, uv + dir * u_chroma).b;
  vec3 col = vec3(r, g, b);

  // Brightness
  col += u_brightness;
  // Contrast
  col = (col - 0.5) * u_contrast + 0.5;
  // Warmth (shift R up / B down or vice versa)
  col.r += u_warmth * 0.15;
  col.b -= u_warmth * 0.15;
  // Saturation
  float luma = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(vec3(luma), col, u_saturation);
  // Tint
  col += u_tint * 0.3;

  // Grain
  float n = rand(uv * u_res + u_time);
  col += (n - 0.5) * u_grain * 0.35;

  // Vignette
  float d = distance(uv, vec2(0.5));
  col *= 1.0 - smoothstep(0.4, 0.9, d) * u_vignette;

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(s));
    throw new Error("shader compile failed");
  }
  return s;
}

export class WebGLFilter {
  private gl: WebGLRenderingContext;
  private program: WebGLProgram;
  private tex: WebGLTexture;
  private uniforms: Record<string, WebGLUniformLocation | null>;
  private startedAt = performance.now();

  constructor(private canvas: HTMLCanvasElement) {
    const gl = canvas.getContext("webgl", { premultipliedAlpha: false, preserveDrawingBuffer: true });
    if (!gl) throw new Error("WebGL not supported");
    this.gl = gl;

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    const p = gl.createProgram()!;
    gl.attachShader(p, vs); gl.attachShader(p, fs); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error("link failed");
    this.program = p;
    gl.useProgram(p);

    // Full-screen quad.
    const buf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(p, "a_pos");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    // Texture
    this.tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    const u = (n: string) => gl.getUniformLocation(p, n);
    this.uniforms = {
      u_tex: u("u_tex"),
      u_saturation: u("u_saturation"),
      u_contrast: u("u_contrast"),
      u_brightness: u("u_brightness"),
      u_grain: u("u_grain"),
      u_vignette: u("u_vignette"),
      u_warmth: u("u_warmth"),
      u_tint: u("u_tint"),
      u_chroma: u("u_chroma"),
      u_time: u("u_time"),
      u_res: u("u_res"),
    };
  }

  resize(w: number, h: number) {
    this.canvas.width = w; this.canvas.height = h;
    this.gl.viewport(0, 0, w, h);
  }

  render(source: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement, p: FilterParams) {
    const gl = this.gl;
    gl.useProgram(this.program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    try {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
    } catch { return; }
    gl.uniform1i(this.uniforms.u_tex!, 0);
    gl.uniform1f(this.uniforms.u_saturation!, p.saturation);
    gl.uniform1f(this.uniforms.u_contrast!, p.contrast);
    gl.uniform1f(this.uniforms.u_brightness!, p.brightness);
    gl.uniform1f(this.uniforms.u_grain!, p.grain);
    gl.uniform1f(this.uniforms.u_vignette!, p.vignette);
    gl.uniform1f(this.uniforms.u_warmth!, p.warmth);
    gl.uniform3f(this.uniforms.u_tint!, p.tintR, p.tintG, p.tintB);
    gl.uniform1f(this.uniforms.u_chroma!, p.chromaShift);
    gl.uniform1f(this.uniforms.u_time!, (performance.now() - this.startedAt) / 1000);
    gl.uniform2f(this.uniforms.u_res!, this.canvas.width, this.canvas.height);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  snapshot(): string {
    return this.canvas.toDataURL("image/png");
  }
}
