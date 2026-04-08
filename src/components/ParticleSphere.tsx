import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { MoodSliders } from '../lib/contentMap';

// ─── Simplex noise (3D) ─────────────────────────────────────────────────────
const F3 = 1.0 / 3.0;
const G3 = 1.0 / 6.0;
const _p = new Uint8Array(256);
for (let i = 0; i < 256; i++) _p[i] = i;
for (let i = 255; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [_p[i], _p[j]] = [_p[j], _p[i]];
}
const perm = new Uint8Array(512);
for (let i = 0; i < 512; i++) perm[i] = _p[i & 255];

const grad3 = [
  [1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],
  [1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],
  [0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1],
];
function dot3(g: number[], x: number, y: number, z: number) { return g[0]*x+g[1]*y+g[2]*z; }
function simplex3(xin: number, yin: number, zin: number) {
  const s = (xin+yin+zin)*F3;
  const i = Math.floor(xin+s), j = Math.floor(yin+s), k = Math.floor(zin+s);
  const t = (i+j+k)*G3;
  const x0=xin-i+t, y0=yin-j+t, z0=zin-k+t;
  let i1: number,j1: number,k1: number,i2: number,j2: number,k2: number;
  if(x0>=y0){if(y0>=z0){i1=1;j1=0;k1=0;i2=1;j2=1;k2=0;}else if(x0>=z0){i1=1;j1=0;k1=0;i2=1;j2=0;k2=1;}else{i1=0;j1=0;k1=1;i2=1;j2=0;k2=1;}}
  else{if(y0<z0){i1=0;j1=0;k1=1;i2=0;j2=1;k2=1;}else if(x0<z0){i1=0;j1=1;k1=0;i2=0;j2=1;k2=1;}else{i1=0;j1=1;k1=0;i2=1;j2=1;k2=0;}}
  const x1=x0-i1+G3,y1=y0-j1+G3,z1=z0-k1+G3;
  const x2=x0-i2+2*G3,y2=y0-j2+2*G3,z2=z0-k2+2*G3;
  const x3=x0-1+3*G3,y3=y0-1+3*G3,z3=z0-1+3*G3;
  const ii=i&255,jj=j&255,kk=k&255;
  const g0=grad3[perm[ii+perm[jj+perm[kk]]]%12];
  const g1=grad3[perm[ii+i1+perm[jj+j1+perm[kk+k1]]]%12];
  const g2=grad3[perm[ii+i2+perm[jj+j2+perm[kk+k2]]]%12];
  const g3=grad3[perm[ii+1+perm[jj+1+perm[kk+1]]]%12];
  let n0=0,n1=0,n2=0,n3=0;
  let tt=0.6-x0*x0-y0*y0-z0*z0; if(tt>=0){tt*=tt;n0=tt*tt*dot3(g0,x0,y0,z0);}
  tt=0.6-x1*x1-y1*y1-z1*z1; if(tt>=0){tt*=tt;n1=tt*tt*dot3(g1,x1,y1,z1);}
  tt=0.6-x2*x2-y2*y2-z2*z2; if(tt>=0){tt*=tt;n2=tt*tt*dot3(g2,x2,y2,z2);}
  tt=0.6-x3*x3-y3*y3-z3*z3; if(tt>=0){tt*=tt;n3=tt*tt*dot3(g3,x3,y3,z3);}
  return 32*(n0+n1+n2+n3);
}

// ─── Shape target generators ────────────────────────────────────────────────
const PARTICLE_COUNT = 5000;
const phi = Math.PI * (3 - Math.sqrt(5));

function buildSphere(r = 1.6): Float32Array {
  const out = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const y = 1 - (i / (PARTICLE_COUNT - 1)) * 2;
    const radius = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = phi * i;
    out[i*3]   = Math.cos(theta) * radius * r;
    out[i*3+1] = y * r;
    out[i*3+2] = Math.sin(theta) * radius * r;
  }
  return out;
}

function buildMountain(): Float32Array {
  const out = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const spread = 1.8;
    const x = (Math.random() - 0.5) * spread * 2;
    const z = (Math.random() - 0.5) * spread * 2;
    const dist = Math.sqrt(x*x + z*z);
    const y = Math.max(-1.2, 1.8 - 1.5 * dist + simplex3(x*0.8, 0, z*0.8) * 0.4);
    out[i*3]   = x;
    out[i*3+1] = y;
    out[i*3+2] = z;
  }
  return out;
}

// LSD molecule: hexagonal core ring + satellite rings + bonds
function buildLSD(): Float32Array {
  const out = new Float32Array(PARTICLE_COUNT * 3);
  let idx = 0;
  const ringCount = 6;
  const coreR = 0.7;
  const perRing = Math.floor(PARTICLE_COUNT * 0.08);

  // Core hexagonal rings
  for (let ring = 0; ring < ringCount; ring++) {
    const ringAngle = (ring / ringCount) * Math.PI * 2;
    const cx = Math.cos(ringAngle) * coreR;
    const cy = Math.sin(ringAngle) * coreR;
    for (let i = 0; i < perRing && idx < PARTICLE_COUNT; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * 0.28;
      out[idx*3]   = cx + Math.cos(a) * r;
      out[idx*3+1] = cy + Math.sin(a) * r;
      out[idx*3+2] = (Math.random() - 0.5) * 0.12;
      idx++;
    }
  }

  // Connecting bonds between adjacent rings
  const bondPts = Math.floor(PARTICLE_COUNT * 0.04);
  for (let ring = 0; ring < ringCount; ring++) {
    const a0 = (ring / ringCount) * Math.PI * 2;
    const a1 = ((ring + 1) / ringCount) * Math.PI * 2;
    for (let i = 0; i < bondPts && idx < PARTICLE_COUNT; i++) {
      const t = i / bondPts;
      out[idx*3]   = Math.cos(a0)*coreR*(1-t) + Math.cos(a1)*coreR*t + (Math.random()-0.5)*0.05;
      out[idx*3+1] = Math.sin(a0)*coreR*(1-t) + Math.sin(a1)*coreR*t + (Math.random()-0.5)*0.05;
      out[idx*3+2] = (Math.random()-0.5)*0.05;
      idx++;
    }
  }

  // Outer satellite rings at 4 cardinal positions
  const outerAngles = [0, Math.PI*0.5, Math.PI, Math.PI*1.5];
  const outerR = 1.45;
  const outerPts = Math.floor(PARTICLE_COUNT * 0.06);
  for (const oa of outerAngles) {
    const ox = Math.cos(oa) * outerR;
    const oy = Math.sin(oa) * outerR;
    for (let i = 0; i < outerPts && idx < PARTICLE_COUNT; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * 0.22;
      out[idx*3]   = ox + Math.cos(a) * r;
      out[idx*3+1] = oy + Math.sin(a) * r;
      out[idx*3+2] = (Math.random()-0.5)*0.1;
      idx++;
    }
    // Bond from nearest core ring to outer ring
    const nearRing = Math.round((oa / (Math.PI*2)) * ringCount) % ringCount;
    const ra = (nearRing / ringCount) * Math.PI * 2;
    const rx = Math.cos(ra) * coreR;
    const ry = Math.sin(ra) * coreR;
    for (let i = 0; i < 30 && idx < PARTICLE_COUNT; i++) {
      const t = i / 30;
      out[idx*3]   = rx*(1-t) + ox*t + (Math.random()-0.5)*0.04;
      out[idx*3+1] = ry*(1-t) + oy*t + (Math.random()-0.5)*0.04;
      out[idx*3+2] = (Math.random()-0.5)*0.04;
      idx++;
    }
  }

  // Fill remainder near center
  while (idx < PARTICLE_COUNT) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * 0.15;
    out[idx*3]   = Math.cos(a) * r;
    out[idx*3+1] = Math.sin(a) * r;
    out[idx*3+2] = (Math.random()-0.5)*0.1;
    idx++;
  }
  return out;
}

// Sea wave: layered sine-wave surface
function buildWave(): Float32Array {
  const out = new Float32Array(PARTICLE_COUNT * 3);
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const u = (Math.random() - 0.5) * 3.6;
    const v = (Math.random() - 0.5) * 2.4;
    const wave1 = Math.sin(u * 1.8 + 0.5) * 0.45;
    const wave2 = Math.sin(u * 3.2 + 1.0) * 0.22;
    const wave3 = Math.sin(u * 0.9 - 0.3) * 0.30;
    const cross  = Math.sin(v * 1.4) * 0.08;
    const y = wave1 + wave2 + wave3 + cross + (Math.random()-0.5)*0.08;
    out[i*3]   = u;
    out[i*3+1] = y;
    out[i*3+2] = v * 0.6;
  }
  return out;
}

// Skyline: metropolitan high-rise silhouette
function buildSkyline(): Float32Array {
  const out = new Float32Array(PARTICLE_COUNT * 3);
  // [x_center, width, height]
  const buildings: [number, number, number][] = [
    [-2.8, 0.30, 0.5],
    [-2.4, 0.20, 0.9],
    [-2.0, 0.40, 1.1],
    [-1.7, 0.25, 1.8],
    [-1.3, 0.35, 1.3],
    [-1.0, 0.50, 2.2],
    [-0.6, 0.20, 1.5],
    [-0.3, 0.60, 2.8],
    [ 0.1, 0.20, 1.6],
    [ 0.4, 0.40, 2.0],
    [ 0.7, 0.30, 1.4],
    [ 1.0, 0.50, 2.4],
    [ 1.35,0.50, 2.4],
    [ 1.7, 0.25, 1.0],
    [ 2.0, 0.35, 1.5],
    [ 2.3, 0.40, 0.8],
    [ 2.6, 0.25, 0.6],
    [ 2.85,0.20, 0.4],
  ];
  const weights = buildings.map(([, w, h]) => w * h);
  const totalW  = weights.reduce((a, b) => a + b, 0);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    let r = Math.random() * totalW;
    let bi = 0;
    for (let b = 0; b < buildings.length; b++) { r -= weights[b]; if (r <= 0) { bi = b; break; } }
    const [bx, bw, bh] = buildings[bi];
    out[i*3]   = bx + (Math.random()-0.5)*bw;
    out[i*3+1] = -1.2 + Math.random()*bh;
    out[i*3+2] = (Math.random()-0.5)*0.3;
  }
  return out;
}

// Star: filled 5-pointed star
function buildStar(): Float32Array {
  const out = new Float32Array(PARTICLE_COUNT * 3);
  const outerR = 1.7, innerR = 0.68, pts = 5;
  const verts: [number, number][] = [];
  for (let p = 0; p < pts*2; p++) {
    const angle = (p/(pts*2))*Math.PI*2 - Math.PI/2;
    verts.push([Math.cos(angle)*(p%2===0?outerR:innerR), Math.sin(angle)*(p%2===0?outerR:innerR)]);
  }
  const center: [number,number] = [0,0];
  const tris: [[number,number],[number,number],[number,number]][] = [];
  for (let p = 0; p < pts*2; p++) tris.push([center, verts[p], verts[(p+1)%(pts*2)]]);
  const areas = tris.map(([a,b,c]) => Math.abs((b[0]-a[0])*(c[1]-a[1])-(c[0]-a[0])*(b[1]-a[1]))*0.5);
  const totalA = areas.reduce((s,a) => s+a, 0);
  let idx = 0;
  while (idx < PARTICLE_COUNT) {
    let rv = Math.random()*totalA; let ti = 0;
    for (let t = 0; t < tris.length; t++) { rv -= areas[t]; if (rv <= 0) { ti = t; break; } }
    const [a,b,c] = tris[ti];
    const s = Math.random(), tt = Math.random(), sr = Math.sqrt(s);
    out[idx*3]   = (1-sr)*a[0] + sr*(1-tt)*b[0] + sr*tt*c[0];
    out[idx*3+1] = (1-sr)*a[1] + sr*(1-tt)*b[1] + sr*tt*c[1];
    out[idx*3+2] = (Math.random()-0.5)*0.25;
    idx++;
  }
  return out;
}

// ─── Precompute all shapes at module load ────────────────────────────────────
const SHAPES: Record<string, Float32Array> = {
  sphere:   buildSphere(),
  mountain: buildMountain(),
  lsd:      buildLSD(),
  wave:     buildWave(),
  skyline:  buildSkyline(),
  star:     buildStar(),
};

// ─── Component ───────────────────────────────────────────────────────────────
interface Props { sliders: MoodSliders }

export function ParticleSphere({ sliders }: Props) {
  const mountRef   = useRef<HTMLDivElement>(null);
  const slidersRef = useRef(sliders);
  slidersRef.current = sliders;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, container.clientWidth/container.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 5);

    const positions  = new Float32Array(PARTICLE_COUNT * 3);
    const currentPos = new Float32Array(PARTICLE_COUNT * 3);
    const colors     = new Float32Array(PARTICLE_COUNT * 3);
    const sizes      = new Float32Array(PARTICLE_COUNT);

    const initShape = SHAPES['sphere'];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i*3]   = currentPos[i*3]   = initShape[i*3];
      positions[i*3+1] = currentPos[i*3+1] = initShape[i*3+1];
      positions[i*3+2] = currentPos[i*3+2] = initShape[i*3+2];
      colors[i*3] = 0.42; colors[i*3+1] = 0.38; colors[i*3+2] = 1.0;
      sizes[i] = 0.5 + Math.random() * 1.5;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color',    new THREE.BufferAttribute(colors,    3));
    geometry.setAttribute('size',     new THREE.BufferAttribute(sizes,     1));

    const material = new THREE.PointsMaterial({
      size: 0.025,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.88,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexColors: true,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    let targetRotX = 0, targetRotY = 0, curRotX = 0, curRotY = 0;
    const onMouseMove = (e: MouseEvent) => {
      targetRotY = ((e.clientX / window.innerWidth)  - 0.5) *  0.8;
      targetRotX = ((e.clientY / window.innerHeight) - 0.5) * -0.5;
    };
    window.addEventListener('mousemove', onMouseMove);

    const onResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', onResize);

    const clock = new THREE.Clock();
    let animId: number;

    function animate() {
      animId = requestAnimationFrame(animate);
      const t  = clock.getElapsedTime();
      const sl = slidersRef.current;

      // ── Param mapping ──
      const speedFactor  = 0.03 + (sl.calm_tense      / 100) * 0.25;
      const noiseAmp     = 0.02 + (sl.entropy          / 100) * 0.55;
      const noiseScale   = 0.5  + (sl.entropy          / 100) * 1.2;
      const jitter       = (1 - sl.organic_synthetic   / 100) * 0.08;
      const symmetryPull = sl.organic_synthetic / 100;
      const brightness   = 0.25 + (sl.day_night        / 100) * 0.75;
      const warmth       = 1 - (sl.intimate_open       / 100); // 1=warm, 0=cold

      material.size = 0.012 + (sl.calm_tense / 100) * 0.008;

      const posArr = geometry.attributes.position.array as Float32Array;
      const colArr = geometry.attributes.color.array    as Float32Array;
      const target = SHAPES[sl.shape] ?? SHAPES['sphere'];

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const tx = target[i*3], ty = target[i*3+1], tz = target[i*3+2];

        const nx = simplex3(tx*noiseScale + t*speedFactor,      ty*noiseScale,                  tz*noiseScale       ) * noiseAmp;
        const ny = simplex3(tx*noiseScale,                       ty*noiseScale + t*speedFactor,  tz*noiseScale + 1.7 ) * noiseAmp;
        const nz = simplex3(tx*noiseScale + 3.1,                ty*noiseScale,                  tz*noiseScale + t*speedFactor) * noiseAmp;
        const jx = (Math.sin(t*0.3 + i*0.01) - 0.5) * jitter;
        const jy = (Math.cos(t*0.2 + i*0.01) - 0.5) * jitter;

        let destX = tx + nx + jx;
        let destY = ty + ny + jy;
        const destZ = tz + nz;

        if (symmetryPull > 0.5 && i % 2 === 1 && i > 0) {
          const blend = (symmetryPull - 0.5) * 2;
          destX = destX + (-posArr[(i-1)*3] - destX) * blend * 0.3;
        }

        const lerpSpeed = 0.04;
        currentPos[i*3]   += (destX - currentPos[i*3])   * lerpSpeed;
        currentPos[i*3+1] += (destY - currentPos[i*3+1]) * lerpSpeed;
        currentPos[i*3+2] += (destZ - currentPos[i*3+2]) * lerpSpeed;

        posArr[i*3]   = currentPos[i*3];
        posArr[i*3+1] = currentPos[i*3+1];
        posArr[i*3+2] = currentPos[i*3+2];

        // Color: warm (violet→amber) ↔ cold (blue→cyan)
        const pct = i / PARTICLE_COUNT;
        let r: number, g: number, b: number;
        if (warmth > 0.5) {
          const w = (warmth - 0.5) * 2;
          r = (0.42 + pct*0.3)*(1-w) + (0.90 + pct*0.1)*w;
          g = (0.20 + pct*0.2)*(1-w) + (0.50 + pct*0.1)*w;
          b = (0.95 - pct*0.1)*(1-w) + 0.10*w;
        } else {
          const c = warmth * 2;
          r = 0.05*(1-c)              + (0.42 + pct*0.3)*c;
          g = (0.5 + pct*0.3)*(1-c)  + (0.20 + pct*0.2)*c;
          b = 1.0*(1-c)               + (0.95 - pct*0.1)*c;
        }
        colArr[i*3]   = Math.min(1, r * brightness);
        colArr[i*3+1] = Math.min(1, g * brightness);
        colArr[i*3+2] = Math.min(1, b * brightness);
      }

      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.color.needsUpdate    = true;

      curRotX += (targetRotX - curRotX) * 0.04;
      curRotY += (targetRotY - curRotY) * 0.04;
      points.rotation.x = curRotX;
      points.rotation.y = curRotY + t * (0.02 + speedFactor * 0.3);

      renderer.render(scene, camera);
    }

    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />;
}
