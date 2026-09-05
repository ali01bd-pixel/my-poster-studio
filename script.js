(() => {
  "use strict";

  const $ = id => document.getElementById(id);
  const clamp = (n,a,b) => Math.max(a, Math.min(b,n));
  const mulberry32 = a => () => {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
  const TAU = Math.PI * 2;

  // Exact Palettes matching the 11 Reference Images
  const THEMES = {
    amberVolume: { bg:"#F4E7DA", dark:"#CD241E", mid:"#F05023", a:"#FF9A26", light:"#FFF171" },
    midnightIce: { bg:"#010205", dark:"#050811", mid:"#0a1845", a:"#1d3c94", light:"#83c5f7" },
    neonOrbs:    { bg:"#e6e6e6", dark:"#1c033b", mid:"#47137d", a:"#ff4000", light:"#ffb366" },
    blueLiquid:  { bg:"#020b1c", dark:"#0a245c", mid:"#1f4fb8", a:"#4785ff", light:"#ffffff" },
    cyanWash:    { bg:"#ffffff", dark:"#05367a", mid:"#126cdb", a:"#4debe2", light:"#d1fffc" },
    musicFest:   { bg:"#09061c", dark:"#19084a", mid:"#cf0a4c", a:"#e34d0b", light:"#b9e615" },
    sunsetGeom:  { bg:"#2b0d2a", dark:"#590f48", mid:"#b81254", a:"#f56200", light:"#ffdd00" },
    midAutumn:   { bg:"#fcf2e6", dark:"#e697a8", mid:"#f5c1d1", a:"#ffeb99", light:"#ffffff" },
    retroXmas:   { bg:"#12376e", dark:"#e3242b", mid:"#f24148", a:"#31a868", light:"#e3f1e8" },
    softXmas:    { bg:"#e6f2ea", dark:"#187a38", mid:"#3eba6d", a:"#d6e352", light:"#ffffff" },
    pastelXmas:  { bg:"#fce8f0", dark:"#d9668d", mid:"#f59ab6", a:"#1b876a", light:"#b0eddb" }
  };

  const state = {
    posterCount:3, designMode:"pastelXmas", density:8, seed:260831, 
    format:"portrait", quality:"large"
  };

  let generated = [], zoom = 1;

  function dims(){
    const base = {portrait:{w:1200,h:1600},square:{w:1600,h:1600},landscape:{w:1800,h:1200}}[state.format] || {w:1200,h:1600};
    const q = {standard:1,large:1.35,xl:1.8}[state.quality] || 1.35;
    return {w:Math.round(base.w*q),h:Math.round(base.h*q)};
  }

  // --- HELPER GEOMETRY GENERATORS (NO FILTERS) ---
  
  // Simulated Halftone Pattern via vector circles
  function drawHalftone(cx, cy, rMax, color, dotSpacing, rnd) {
      let out = "";
      for(let y=-rMax; y<=rMax; y+=dotSpacing) {
        for(let x=-rMax; x<=rMax; x+=dotSpacing) {
           let dist = Math.sqrt(x*x + y*y);
           if (dist < rMax) {
              let r = (dotSpacing*0.45) * (1 - Math.pow(dist/rMax, 2)); 
              if(r>1) out += `<circle cx="${cx+x}" cy="${cy+y}" r="${r}" fill="${color}"/>`;
           }
        }
      }
      return out;
  }

  function drawStar(cx, cy, rOut, rIn, pts, color, rot=0) {
      let d = "";
      for(let i=0; i<pts*2; i++){
          let r = (i%2===0)?rOut:rIn;
          let a = rot + (i/(pts*2))*TAU;
          d += (i===0?"M":"L") + `${cx+Math.cos(a)*r},${cy+Math.sin(a)*r} `;
      }
      return `<path d="${d}Z" fill="${color}"/>`;
  }

  // Master Gradient Defs
  function getDefs(id, p) {
      return `<defs>
        <!-- Standard Linear -->
        <linearGradient id="${id}_L1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${p.light}"/><stop offset="100%" stop-color="${p.dark}"/></linearGradient>
        <linearGradient id="${id}_L2" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stop-color="${p.a}"/><stop offset="100%" stop-color="${p.mid}"/></linearGradient>
        <linearGradient id="${id}_L3" x1="50%" y1="0%" x2="50%" y2="100%"><stop offset="0%" stop-color="${p.bg}"/><stop offset="100%" stop-color="${p.light}"/></linearGradient>
        
        <!-- Fades (Simulates Blur/Glow) -->
        <radialGradient id="${id}_R1" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="${p.light}" stop-opacity="1"/>
            <stop offset="40%" stop-color="${p.a}" stop-opacity="0.6"/>
            <stop offset="100%" stop-color="${p.dark}" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="${id}_R2" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="${p.mid}" stop-opacity="0.9"/>
            <stop offset="60%" stop-color="${p.dark}" stop-opacity="0.4"/>
            <stop offset="100%" stop-color="${p.dark}" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="${id}_R3" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="${p.light}" stop-opacity="0.9"/>
            <stop offset="50%" stop-color="${p.light}" stop-opacity="0.2"/>
            <stop offset="100%" stop-color="${p.light}" stop-opacity="0"/>
        </radialGradient>
        
        <!-- 3D Volumes -->
        <linearGradient id="${id}_V1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="${p.light}"/><stop offset="40%" stop-color="${p.a}"/><stop offset="100%" stop-color="${p.dark}"/>
        </linearGradient>
        <radialGradient id="${id}_V2" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stop-color="${p.light}"/><stop offset="40%" stop-color="${p.mid}"/><stop offset="100%" stop-color="${p.dark}"/>
        </radialGradient>
      </defs>`;
  }

  // ==========================================
  // SPECIFIC IMAGE GENERATORS
  // ==========================================

  function renderAmberVolume(w, h, p, id, rnd, i) {
      let out = `<rect width="${w}" height="${h}" fill="${p.bg}"/>`;
      if(i%3===0) {
          // Folded 3D Ribbons
          for(let j=0; j<4; j++){
              out += `<rect x="${w*0.1}" y="${h*(0.2+j*0.15)}" width="${w*0.8}" height="${h*0.1}" rx="${h*0.05}" fill="url(#${id}_V1)"/>`;
          }
      } else if (i%3===1) {
          // Floating 3D Spheres
          for(let j=0; j<12; j++){
              let r = w*(0.1+rnd()*0.2);
              out += `<circle cx="${w*rnd()}" cy="${h*rnd()}" r="${r}" fill="url(#${id}_V2)"/>`;
          }
      } else {
          // Fluid Fade Background
          out += `<rect width="${w}" height="${h}" fill="url(#${id}_R1)"/>`;
          out += `<ellipse cx="${w*0.8}" cy="${h*0.8}" rx="${w*0.5}" ry="${h*0.5}" fill="url(#${id}_R2)"/>`;
      }
      return out;
  }

  function renderMidnightIce(w, h, p, id, rnd, i) {
      let out = `<rect width="${w}" height="${h}" fill="${p.dark}"/>`;
      if(i%3===0) {
          // Glowing Horizons
          out += `<ellipse cx="${w*0.5}" cy="${h*0.8}" rx="${w*1.5}" ry="${h*0.4}" fill="url(#${id}_V1)" />`;
          out += `<ellipse cx="${w*0.3}" cy="${h*1.2}" rx="${w*1.5}" ry="${h*0.4}" fill="url(#${id}_V1)" />`;
      } else if(i%3===1) {
          // Metallic Bars
          for(let j=0; j<8; j++){
             out += `<rect x="${w*0.1 + j*(w*0.11)}" y="${h*(0.05+(j%2)*0.05)}" width="${w*0.06}" height="${h*0.9}" fill="url(#${id}_V1)" />`;
          }
      } else {
          // 3D Folded Fan
          let cx=w*0.9, cy=h*0.5;
          for(let j=0; j<24; j++) {
              let a1=(j/24)*TAU, aMid=((j+0.5)/24)*TAU, a2=((j+1)/24)*TAU;
              out += `<polygon points="${cx},${cy} ${cx+Math.cos(a1)*w*1.5},${cy+Math.sin(a1)*w*1.5} ${cx+Math.cos(aMid)*w*1.5},${cy+Math.sin(aMid)*w*1.5}" fill="${p.dark}"/>`;
              out += `<polygon points="${cx},${cy} ${cx+Math.cos(aMid)*w*1.5},${cy+Math.sin(aMid)*w*1.5} ${cx+Math.cos(a2)*w*1.5},${cy+Math.sin(a2)*w*1.5}" fill="url(#${id}_L1)"/>`;
          }
      }
      return out;
  }

  function renderNeonOrbs(w, h, p, id, rnd, i) {
      let out = `<rect width="${w}" height="${h}" fill="${i%2===0?p.bg:p.dark}"/>`;
      if(i%3===0) {
          out += `<circle cx="${w*0.2}" cy="${h*0.2}" r="${w*0.3}" fill="url(#${id}_V2)"/>`;
          out += `<circle cx="${w*0.8}" cy="${h*0.8}" r="${w*0.4}" fill="url(#${id}_R1)"/>`;
          out += `<circle cx="${w*0.5}" cy="${h*0.5}" r="${w*0.25}" fill="none" stroke="${p.light}" stroke-width="2"/>`;
          out += drawStar(w*0.8, h*0.2, w*0.1, w*0.02, 4, p.light);
      } else if (i%3===1) {
          out += `<rect x="${w*0.2}" y="0" width="${w*0.3}" height="${h}" fill="url(#${id}_L1)"/>`;
          out += `<circle cx="${w*0.6}" cy="${h*0.6}" r="${w*0.2}" fill="url(#${id}_V2)"/>`;
          out += drawStar(w*0.5, h*0.8, w*0.15, w*0.03, 4, p.light, Math.PI/4);
      } else {
          out += `<rect width="${w}" height="${h*0.5}" fill="url(#${id}_R1)"/>`;
          out += `<circle cx="${w*0.5}" cy="${h*0.5}" r="${w*0.3}" fill="${p.dark}"/>`;
          out += `<rect y="${h*0.5}" width="${w}" height="${h*0.5}" fill="url(#${id}_R2)"/>`;
      }
      return out;
  }

  function renderBlueLiquid(w, h, p, id, rnd, i) {
      let out = `<rect width="${w}" height="${h}" fill="${p.dark}"/>`;
      if(i%3===0) {
          out += `<circle cx="${w*0.2}" cy="${h*0.3}" r="${w*0.6}" fill="url(#${id}_R3)"/>`;
          out += `<circle cx="${w*0.8}" cy="${h*0.7}" r="${w*0.5}" fill="url(#${id}_R1)"/>`;
      } else if (i%3===1) {
          out += `<rect width="${w}" height="${h}" fill="${p.bg}"/>`;
          for(let j=0; j<6; j++){
              out += `<circle cx="${w*0.2 + (j%2)*w*0.6}" cy="${h*0.2 + j*h*0.15}" r="${w*0.35}" fill="url(#${id}_R1)"/>`;
          }
      } else {
          for(let j=0; j<8; j++){
              out += `<path d="M 0,${h*(rnd()*0.8)} Q ${w*0.5},${h*rnd()} ${w},${h*(rnd()*0.8)} L ${w},${h} L 0,${h} Z" fill="url(#${id}_L1)" opacity="0.6"/>`;
          }
      }
      return out;
  }

  function renderCyanWash(w, h, p, id, rnd, i) {
      let out = `<rect width="${w}" height="${h}" fill="${p.bg}"/>`;
      if(i%3===0) {
          out += `<ellipse cx="${w*0.5}" cy="${h}" rx="${w*0.8}" ry="${h*0.6}" fill="url(#${id}_R1)"/>`;
          out += `<path d="M 0,${h*0.6} Q ${w*0.5},${h*0.4} ${w},${h*0.6} L ${w},${h} L 0,${h} Z" fill="url(#${id}_V1)"/>`;
      } else if(i%3===1) {
          out += `<circle cx="${w*0.3}" cy="${h*0.3}" r="${w*0.4}" fill="url(#${id}_R1)"/>`;
          out += `<circle cx="${w*0.7}" cy="${h*0.6}" r="${w*0.35}" fill="url(#${id}_R2)"/>`;
      } else {
          out += `<rect width="${w}" height="${h*0.3}" y="${h*0.1}" fill="url(#${id}_R1)"/>`;
          out += `<rect width="${w}" height="${h*0.4}" y="${h*0.6}" fill="url(#${id}_R2)"/>`;
      }
      return out;
  }

  function renderMusicFest(w, h, p, id, rnd, i) {
      let out = `<rect width="${w}" height="${h}" fill="${p.bg}"/>`;
      if(i%3===0) {
          out += `<circle cx="${w*0.5}" cy="${h*0.4}" r="${w*0.4}" fill="url(#${id}_V1)"/>`;
          for(let j=0; j<20; j++) out += `<rect y="${h*0.1 + j*h*0.04}" width="${w}" height="${h*0.01}" fill="${p.light}"/>`;
      } else if (i%3===1) {
          for(let j=0; j<6; j++){
              out += `<path d="M 0,${h*rnd()} Q ${w*0.5},${h*rnd()} ${w},${h*rnd()} L ${w},${h*rnd()} Q ${w*0.5},${h*rnd()} 0,${h*rnd()} Z" fill="url(#${id}_L1)" opacity="0.8"/>`;
          }
      } else {
          out += `<path d="M ${w*0.2},0 Q ${w*0.8},${h*0.5} ${w*0.2},${h} L 0,${h} L 0,0 Z" fill="url(#${id}_V2)"/>`;
          out += `<rect x="${w*0.6}" width="${w*0.4}" height="${h}" fill="url(#${id}_L1)"/>`;
      }
      return out;
  }

  function renderSunsetGeom(w, h, p, id, rnd, i) {
      let out = `<rect width="${w}" height="${h}" fill="${p.bg}"/>`;
      if(i%3===0) {
          for(let j=0; j<20; j++){
              out += `<path d="M 0,${h*0.8} Q ${w*0.2},${h*0.4} ${w},${h*(j/20)} L 0,${h*(j/20)} Z" fill="url(#${id}_L2)" opacity="0.6"/>`;
          }
      } else if (i%3===1) {
          out += `<polygon points="${w*0.2},${h*0.2} ${w*0.8},${h*0.4} ${w*0.4},${h*0.8}" fill="url(#${id}_V1)"/>`;
          out += `<polygon points="${w*0.5},${h*0.1} ${w*0.9},${h*0.5} ${w*0.2},${h*0.9}" fill="url(#${id}_V2)" opacity="0.9"/>`;
      } else {
          out += `<circle cx="${w*0.5}" cy="${h*0.5}" r="${w*0.4}" fill="url(#${id}_R1)"/>`;
          out += `<rect y="${h*0.4}" width="${w}" height="${h*0.05}" fill="${p.dark}"/>`;
          out += `<rect y="${h*0.6}" width="${w}" height="${h*0.05}" fill="${p.dark}"/>`;
      }
      return out;
  }

  function renderMidAutumn(w, h, p, id, rnd, i) {
      let out = `<rect width="${w}" height="${h}" fill="${p.bg}"/>`;
      out += `<circle cx="${w*0.5}" cy="${h*0.4}" r="${w*0.3}" fill="url(#${id}_R3)"/>`; // Glow Moon
      out += `<circle cx="${w*0.5}" cy="${h*0.4}" r="${w*0.2}" fill="${p.light}"/>`;    // Solid Moon
      
      const drawBunny = (bx, by, s) => {
          return `<ellipse cx="${bx}" cy="${by}" rx="${30*s}" ry="${40*s}" fill="#fff"/>
                  <circle cx="${bx}" cy="${by-30*s}" r="${25*s}" fill="#fff"/>
                  <ellipse cx="${bx-10*s}" cy="${by-60*s}" rx="${8*s}" ry="${25*s}" fill="#fff" transform="rotate(-15 ${bx-10*s} ${by-60*s})"/>
                  <ellipse cx="${bx+10*s}" cy="${by-60*s}" rx="${8*s}" ry="${25*s}" fill="#fff" transform="rotate(15 ${bx+10*s} ${by-60*s})"/>`;
      };
      
      if(i%3===0) {
          out += `<ellipse cx="${w*0.3}" cy="${h*0.8}" rx="${w*0.3}" ry="${h*0.1}" fill="${p.a}"/>`; // Lotus leaf
          out += `<ellipse cx="${w*0.7}" cy="${h*0.85}" rx="${w*0.25}" ry="${h*0.08}" fill="${p.a}"/>`;
          out += drawBunny(w*0.4, h*0.65, w*0.002);
      } else if (i%3===1) {
          out += drawBunny(w*0.6, h*0.75, w*0.003);
          out += `<path d="M 0,${h*0.8} Q ${w*0.5},${h*0.6} ${w},${h*0.9} L ${w},${h} L 0,${h} Z" fill="url(#${id}_L3)"/>`;
      } else {
          out += drawBunny(w*0.3, h*0.3, w*0.0015);
          out += drawBunny(w*0.7, h*0.3, w*0.0015);
          out += `<circle cx="${w*0.5}" cy="${h*0.8}" r="${w*0.4}" fill="url(#${id}_R1)"/>`;
      }
      return out;
  }

  function renderRetroXmas(w, h, p, id, rnd, i) {
      let out = `<rect width="${w}" height="${h}" fill="${p.bg}"/>`;
      if(i%3===0) {
          out += `<polygon points="${w*0.3},${h*0.2} ${w*0.6},${h*0.8} 0,${h*0.8}" fill="url(#${id}_L1)"/>`;
          out += `<polygon points="${w*0.8},${h*0.4} ${w},${h*0.9} ${w*0.4},${h*0.9}" fill="url(#${id}_V1)"/>`;
          out += drawHalftone(w*0.2, h*0.8, w*0.2, p.dark, w*0.02, rnd);
          out += drawHalftone(w*0.8, h*0.3, w*0.15, p.a, w*0.02, rnd);
      } else if (i%3===1) {
          out += drawHalftone(w*0.2, h*0.7, w*0.4, p.light, w*0.03, rnd);
          out += `<circle cx="${w*0.5}" cy="${h*0.5}" r="${w*0.35}" fill="${p.dark}"/>`; // Red ornament
          out += `<circle cx="${w*0.2}" cy="${h*0.2}" r="${w*0.2}" fill="${p.mid}"/>`;
          out += `<circle cx="${w*0.8}" cy="${h*0.8}" r="${w*0.25}" fill="${p.a}"/>`;
      } else {
          out += `<path d="M ${w*0.2},${h*0.8} Q ${w*0.5},${h*0.2} ${w*0.8},${h*0.4} L ${w},${h} L 0,${h} Z" fill="${p.dark}"/>`;
          out += `<circle cx="${w*0.8}" cy="${h*0.6}" r="${w*0.2}" fill="${p.light}"/>`;
          out += drawHalftone(w*0.8, h*0.6, w*0.15, p.dark, w*0.02, rnd);
      }
      return out;
  }

  function renderSoftXmas(w, h, p, id, rnd, i) {
      let out = `<rect width="${w}" height="${h}" fill="${p.bg}"/>`;
      if(i%3===0) {
          out += drawStar(w*0.3, h*0.2, w*0.2, w*0.08, 5, `url(#${id}_R3)`);
          out += drawStar(w*0.7, h*0.5, w*0.25, w*0.1, 4, `url(#${id}_R1)`);
          out += drawStar(w*0.4, h*0.8, w*0.15, w*0.05, 8, `url(#${id}_R2)`);
      } else if (i%3===1) {
          out += `<circle cx="${w*0.4}" cy="${h*0.6}" r="${w*0.2}" fill="url(#${id}_R2)"/>`; // Soft ornament
          out += `<polygon points="${w*0.5},${h*0.1} ${w*0.7},${h*0.4} ${w*0.3},${h*0.4}" fill="url(#${id}_R1)"/>`; // Soft tree
          for(let j=0; j<6; j++) out += `<line x1="${w*0.7}" y1="${h*0.4}" x2="${w*0.7+Math.cos((j/6)*TAU)*w*0.1}" y2="${h*0.4+Math.sin((j/6)*TAU)*w*0.1}" stroke="${p.light}" stroke-width="4"/>`;
      } else {
          out += `<rect width="${w}" height="${h*0.2}" y="${h*0.8}" fill="${p.dark}"/>`; // Ground
          out += `<circle cx="${w*0.5}" cy="${h*0.5}" r="${w*0.35}" fill="url(#${id}_R3)"/>`; // Globe
          out += `<polygon points="${w*0.5},${h*0.3} ${w*0.7},${h*0.7} ${w*0.3},${h*0.7}" fill="url(#${id}_R1)"/>`; // Tree in globe
      }
      return out;
  }

  function renderPastelXmas(w, h, p, id, rnd, i) {
      let out = `<rect width="${w}" height="${h}" fill="${p.bg}"/>`;
      const curtain = `<path d="M 0,0 Q ${w*0.2},${h*0.2} 0,${h*0.4} Z" fill="${p.dark}"/><path d="M ${w},0 Q ${w*0.8},${h*0.2} ${w},${h*0.4} Z" fill="${p.dark}"/>`;
      
      if(i%3===0) {
          out += `<polygon points="${w*0.5},${h*0.2} ${w*0.7},${h*0.7} ${w*0.5},${h*0.7}" fill="url(#${id}_V1)"/>`;
          out += `<polygon points="${w*0.5},${h*0.2} ${w*0.3},${h*0.7} ${w*0.5},${h*0.7}" fill="url(#${id}_V2)"/>`;
          out += `<rect x="${w*0.2}" y="${h*0.65}" width="${w*0.2}" height="${h*0.1}" fill="${p.mid}"/>`;
          out += `<rect x="${w*0.6}" y="${h*0.65}" width="${w*0.2}" height="${h*0.1}" fill="${p.mid}"/>`;
      } else if (i%3===1) {
          out += `<polygon points="${w*0.5},${h*0.2} ${w*0.8},${h*0.5} ${w*0.5},${h*0.8} ${w*0.2},${h*0.5}" fill="url(#${id}_V1)"/>`;
          out += `<polygon points="${w*0.5},${h*0.2} ${w*0.8},${h*0.5} ${w*0.5},${h*0.5}" fill="url(#${id}_V2)"/>`;
          out += curtain;
      } else {
          out += `<polygon points="${w*0.5},${h*0.1} ${w*0.8},${h*0.7} ${w*0.5},${h*0.6}" fill="url(#${id}_V1)"/>`;
          out += `<polygon points="${w*0.5},${h*0.1} ${w*0.2},${h*0.7} ${w*0.5},${h*0.6}" fill="url(#${id}_L1)"/>`;
          out += curtain;
      }
      return out;
  }

  // ==========================================
  // MASTER ROUTER
  // ==========================================
  function layoutByMode(mode, w, h, p, rnd, id, i) {
      if (mode === "amberVolume") return renderAmberVolume(w, h, p, id, rnd, i);
      if (mode === "midnightIce") return renderMidnightIce(w, h, p, id, rnd, i);
      if (mode === "neonOrbs")    return renderNeonOrbs(w, h, p, id, rnd, i);
      if (mode === "blueLiquid")  return renderBlueLiquid(w, h, p, id, rnd, i);
      if (mode === "cyanWash")    return renderCyanWash(w, h, p, id, rnd, i);
      if (mode === "musicFest")   return renderMusicFest(w, h, p, id, rnd, i);
      if (mode === "sunsetGeom")  return renderSunsetGeom(w, h, p, id, rnd, i);
      if (mode === "midAutumn")   return renderMidAutumn(w, h, p, id, rnd, i);
      if (mode === "retroXmas")   return renderRetroXmas(w, h, p, id, rnd, i);
      if (mode === "softXmas")    return renderSoftXmas(w, h, p, id, rnd, i);
      if (mode === "pastelXmas")  return renderPastelXmas(w, h, p, id, rnd, i);
      return renderPastelXmas(w, h, p, id, rnd, i); // fallback
  }

  function textLayer(mode, w, h, p, i){
    const fs = Math.max(24, Math.round(Math.min(w,h)*0.04));
    let t = `<g font-family="system-ui, sans-serif" fill="${p.text}">`;

    if(mode.includes("Xmas") || mode === "midAutumn") {
        let title = mode==="midAutumn" ? "MID AUTUMN" : "MERRY CHRISTMAS";
        t += `<text x="${w/2}" y="${h*0.15}" font-size="${fs*1.2}" font-weight="900" text-anchor="middle">${title}</text>`;
        t += `<text x="${w/2}" y="${h*0.18}" font-size="${fs*0.4}" font-weight="600" text-anchor="middle" opacity="0.7">FESTIVAL CELEBRATION</text>`;
    } else if (mode === "musicFest") {
        t += `<text x="${w*0.1}" y="${h*0.8}" font-size="${fs*1.5}" font-weight="900" font-style="italic">MUSIC</text>`;
        t += `<text x="${w*0.1}" y="${h*0.85}" font-size="${fs}" font-weight="900" font-style="italic">FESTIVAL</text>`;
    } else {
        t += `<text x="${w*0.1}" y="${h*0.1}" font-size="${fs*0.8}" font-weight="800" letter-spacing="2">ABSTRACT</text>`;
        t += `<text x="${w*0.1}" y="${h*0.13}" font-size="${fs*0.8}" font-weight="800" letter-spacing="2">DESIGN</text>`;
        t += `<text x="${w*0.9}" y="${h*0.9}" font-size="${fs*0.5}" font-weight="600" text-anchor="end">ALI STUDIO</text>`;
    }
    return t + `</g>`;
  }

  function makeSvg(index){
    const {w,h}=dims();
    const rnd=mulberry32((Number(state.seed)||1)+index*7919);
    
    // Get correct theme palette based on mode
    const mode = state.designMode;
    const baseThemeKey = {
        amberVolume:"amber", midnightIce:"midnight", neonOrbs:"neonOrbs", blueLiquid:"blueLiquid", 
        cyanWash:"cyanWash", musicFest:"musicFest", sunsetGeom:"sunsetGeom", midAutumn:"midAutumn", 
        retroXmas:"retroXmas", softXmas:"softXmas", pastelXmas:"pastelXmas"
    }[mode];
    
    const p = THEMES[baseThemeKey];
    const id=`ali_${state.seed}_${index}`;
    
    let out = getDefs(id, p);
    out += layoutByMode(mode, w, h, p, rnd, id, index);
    out += textLayer(mode, w, h, p, index);
    
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
      <title>ALI STUDIO 3.0 — ${mode} ${String(index+1).padStart(2,"0")}</title>
      ${out}
    </svg>`;
  }

  function download(filename,content,mime="image/svg+xml"){
    const blob=new Blob([content],{type:mime}), a=document.createElement("a");
    a.href=URL.createObjectURL(blob); a.download=filename; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  }

  function updateOutputs(){
    if($("posterCountVal")) $("posterCountVal").textContent = state.posterCount;
    if($("densityVal")) $("densityVal").textContent = state.density;
    if($("collectionCount")) $("collectionCount").textContent = state.posterCount;
    
    const dMode = $("designMode");
    if(dMode && $("workspaceTitle")) {
        $("workspaceTitle").textContent = (dMode.options[dMode.selectedIndex].text).toUpperCase();
    }
  }

  function readControls(){
    if($("posterCount")) state.posterCount = Number($("posterCount").value);
    if($("density")) state.density = Number($("density").value);
    if($("designMode")) state.designMode = $("designMode").value;
    if($("seed")) state.seed = Number($("seed").value) || 1;
    if($("format")) state.format = $("format").value;
    if($("quality")) state.quality = $("quality").value;
  }

  function render(){
    readControls(); updateOutputs(); generated=[];
    const grid=$("posterGrid"); if(!grid) return;
    grid.innerHTML="";
    const tpl=$("posterTemplate"); if(!tpl) return;
    
    let maxCols = Math.min(3, state.posterCount);

    for(let i=0;i<state.posterCount;i++){
      const node=tpl.content.firstElementChild.cloneNode(true), svg=makeSvg(i);
      generated.push(svg);
      const num = node.querySelector(".poster-number");
      const modeTxt = node.querySelector(".poster-mode");
      const frame = node.querySelector(".poster-frame");
      const dBtn = node.querySelector(".download-one");
      
      if(num) num.textContent=`DESIGN ${String(i+1).padStart(2,"0")}`;
      if(modeTxt) modeTxt.textContent=`VECTOR / ${String((i%3)+1).padStart(2,"0")}`;
      if(frame) frame.innerHTML=svg;
      if(dBtn) dBtn.addEventListener("click",()=>download(`ali-studio-${state.designMode}-${String(i+1).padStart(2,"0")}.svg`,svg));
      
      grid.appendChild(node);
    }
    grid.style.gridTemplateColumns=`repeat(${maxCols},minmax(0,1fr))`;
    applyZoom();
  }

  function applyZoom(){ 
      const grid = $("posterGrid"); if (!grid) return;
      grid.style.transform = `scale(${zoom})`; 
      if($("zoomLabel")) $("zoomLabel").textContent = `${Math.round(zoom*100)}%`; 
      const hDiff = (grid.offsetHeight * zoom) - grid.offsetHeight;
      grid.style.marginBottom = `${hDiff > 0 ? hDiff + 80 : 80}px`;
  }

  ["posterCount","density","designMode","seed","format","quality"].forEach(id=>{
    let el = $(id);
    if(el){
        el.addEventListener("input",()=>{updateOutputs();render();});
        el.addEventListener("change",()=>{updateOutputs();render();});
    }
  });

  if($("regenerate")) $("regenerate").addEventListener("click",render);
  if($("randomize")) {
      $("randomize").addEventListener("click",()=>{
        if($("seed")) $("seed").value = Math.floor(Math.random()*99999999)+1;
        if($("density")) $("density").value = 5+Math.floor(Math.random()*15);
        updateOutputs(); render();
      });
  }

  if($("downloadAll")) {
      $("downloadAll").addEventListener("click",()=>{
          const {w:pw,h:ph}=dims();
          const count=state.posterCount, cols=Math.min(3,count), rows=Math.ceil(count/cols), gap=40;
          const aw=pw*cols+gap*(cols+1), ah=ph*rows+gap*(rows+1);
          let out=`<svg xmlns="http://www.w3.org/2000/svg" width="${aw}" height="${ah}" viewBox="0 0 ${aw} ${ah}"><rect width="${aw}" height="${ah}" fill="#111"/>`;
          for(let i=0;i<count;i++){
            const x=gap+(i%cols)*(pw+gap), y=gap+Math.floor(i/cols)*(ph+gap);
            const svg=makeSvg(i).replace(/^<svg[^>]*>/,"").replace(/<\/svg>\s*$/i,"");
            out += `<g transform="translate(${x} ${y})">${svg}</g>`;
          }
          out += "</svg>";
          download(`ali-studio-${state.designMode}-collection.svg`, out);
      });
  }

  if($("zoomIn")) $("zoomIn").addEventListener("click",()=>{zoom=clamp(zoom+.1,.4,1.8);applyZoom();});
  if($("zoomOut")) $("zoomOut").addEventListener("click",()=>{zoom=clamp(zoom-.1,.4,1.8);applyZoom();});

  updateOutputs(); render();
})();
