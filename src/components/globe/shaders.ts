export const earthVertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  void main() {
    vUv = uv;
    vNormal = normalize(mat3(modelMatrix) * normal);
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`

export const earthFragment = /* glsl */ `
  uniform sampler2D dayMap;
  uniform sampler2D nightMap;
  uniform sampler2D bumpMap;
  uniform sampler2D specMap;
  uniform vec3 sunDir;
  uniform float nightMix;
  uniform vec2 texel;
  uniform float bumpScale;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPos;

  void main() {
    vec3 geoN = normalize(vNormal);

    // Relieve sutil: perturbamos la normal con el gradiente del mapa topográfico
    // usando el marco tangente natural de la esfera (este / norte).
    vec3 east = normalize(cross(vec3(0.0, 1.0, 0.0), geoN) + vec3(1e-5));
    vec3 north = cross(geoN, east);
    float h  = texture2D(bumpMap, vUv).r;
    float hx = texture2D(bumpMap, vUv + vec2(texel.x, 0.0)).r;
    float hy = texture2D(bumpMap, vUv + vec2(0.0, texel.y)).r;
    vec3 n = normalize(geoN + (east * (hx - h) - north * (hy - h)) * bumpScale);

    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    float ndl = dot(n, sunDir);
    float dayF = smoothstep(-0.18, 0.32, dot(geoN, sunDir));

    vec3 day = texture2D(dayMap, vUv).rgb;
    vec3 night = texture2D(nightMap, vUv).rgb;
    float water = texture2D(specMap, vUv).r;

    float spec = pow(max(dot(reflect(-sunDir, geoN), viewDir), 0.0), 90.0) * water * 0.12;
    vec3 lit = day * (0.05 + 1.1 * max(ndl, 0.0)) + vec3(0.6, 0.75, 1.0) * spec;

    vec3 cityLights = night * vec3(1.0, 0.82, 0.55) * 1.8 * nightMix;
    vec3 dark = cityLights + day * 0.03;

    vec3 col = mix(dark, lit, dayF);

    // Borde atmosférico interior (fresnel)
    float fres = pow(1.0 - max(dot(viewDir, geoN), 0.0), 3.0);
    col += vec3(0.32, 0.58, 1.0) * fres * (0.12 + 0.45 * dayF);

    // Tinte cálido en el terminador
    float term = smoothstep(0.35, 0.0, abs(dot(geoN, sunDir)));
    col += vec3(1.0, 0.45, 0.2) * term * 0.05;

    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`

export const atmosphereVertex = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewPos;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vViewPos = mv.xyz;
    gl_Position = projectionMatrix * mv;
  }
`

export const atmosphereFragment = /* glsl */ `
  uniform vec3 glowColor;
  uniform float intensity;
  varying vec3 vNormal;
  varying vec3 vViewPos;
  void main() {
    vec3 viewDir = normalize(-vViewPos);
    // Cara trasera: máximo junto al limbo terrestre, se desvanece hacia el borde exterior.
    float facing = clamp(-dot(vNormal, viewDir), 0.0, 1.0);
    float glow = pow(facing, 1.8) * intensity;
    gl_FragColor = vec4(glowColor * glow, glow);
  }
`
