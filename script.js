(() => {
  "use strict";

  const $ = id => document.getElementById(id);
  const clamp = (n,a,b) => Math.max(a, Math.min(b,n));
  const mulberry32 = a => () => {
    let t = a += 0x6D2B79F5; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
  const TAU = Math.PI * 2;

  // ----------------------------------------------------
  // EXPERT COLOR PALETTES (Includes new Christmas themes)
  // ----------------------------------------------------
  const THEMES = {
    // Christmas / Winter
    xmasClassic: { bg:"#0B2B1E", dark:"#1A070A", mid:"#C21B27", a:"#E8A023", light:"#F5E6CD", text:"#ffffff" },
    xmasFrost:   { bg:"#051524", dark:"#020A12", mid:"#2C74B3", a:"#90C6E3", light:"#E6F4F1", text:"#ffffff" },
    xmasCandy:   { bg:"#F7EBEB", dark:"#C21531", mid:"#E85A6A", a:"#2BA880", light:"#C3F0DF", text:"#111111" },
    
    // Original Studio
    amberVolume: { bg:"#F4E7DA", dark:"#CD241E", mid:"#F05023", a:"#FF9A26", light:"#FFF171", text:"#ffffff" },
    midnightIce: { bg:"#010205", dark:"#050811", mid:"#0a1845", a:"#1d3c94", light:"#83c5f7", text:"#ffffff" },
    swissGrid:   { bg:"#EBEBEB", dark:"#111111", mid:"#D33F49", a:"#264653", light:"#FFFFFF", text:"#111111" },
    holoFold:    { bg:"#f0f0f0", dark:"#1c033b", mid:"#f093fb", a:"#00f2fe", light:"#ffe259", text:"#ffffff" },
    retroHalftone:{ bg:"#12376e", dark:"#e3242b", mid:"#f24148", a:"#31a868", light:"#e3f1e8", text:"#ffffff" },
    fluidAura:   { bg:"#020b1c", dark:"#0a245c", mid:"#1f4fb8", a:"#4785ff", light:"#ffffff", text:"#ffffff" },
    
    // User Overrides
    monochrome:  { bg:"#ffffff", dark:"#0a0a0a", mid:"#333333", a:"#888888", light:"#dddddd", text:"#ffffff" },
    crimson:     { bg:"#1a0505", dark:"#3b0909", mid:"#8c1313", a:"#d42626", light:"#f5b5b5", text:"#ffffff" }
  };

  const state = { posterCount:4, designMode:"xmasScandiTree", theme:"curated", density:8, seed:260831, format:"portrait", quality:"large" };
  let generated = [], zoom = 1;

  function dims(){
    const base = {portrait:{w:1200,h:1600},square:{w:1600,h:1600},landscape:{w:1800,h:1200}}[state.format] || {w:1200,h:1600};
    const q = {standard:1,large:1.35,xl:1.8}[state.quality] || 1.35;
    return {w:Math.round(base.w*q),h:Math.round(base.h*q)};
  }

  // ----------------------------------------------------
  // SVG DEFINITIONS (Pure Vectors, NO Blur Filters)
  // ----------------------------------------------------
  function getDefs(id, p) {
      return `<defs>
        <linearGradient id="${id}_L1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${p.light}"/><stop offset="100%" stop-color="${p.dark}"/></linearGradient>
        <linearGradient id="${id}_L2" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stop-color="${p.a}"/><stop offset="100%" stop-color="${p.mid}"/></linearGradient>
        <linearGradient id="${id}_L3" x1="50%" y1="0%" x2="50%" y2="100%"><stop offset="0%" stop-color="${p.bg}"/><stop offset="100%" stop-color="${p.light}"/></linearGradient>
        
        <radialGradient id="${id}_R1" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="${p.light}" stop-opacity="1"/>
            <stop offset="40%" stop-color="${p.a}" stop-opacity="0.8"/>
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
        
        <linearGradient id="${id}_V1" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="${p.light}"/><stop offset="40%" stop-color="${p.a}"/><stop offset="100%" stop-color="${p.dark}"/>
        </linearGradient>
        <radialGradient id="${id}_V2" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stop-color="${p.light}"/><stop offset="40%" stop-color="${p.mid}"/><stop offset="100%" stop-color="${p.dark}"/>
        </radialGradient>
      </defs>`;
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

  // ----------------------------------------------------
  // CHRISTMAS / HOLIDAY ENGINES
  // ----------------------------------------------------
  
  function renderXmasScandiTree(w, h, p, id, rnd, i) {
      let out = `<rect width="${w}" height="${h}" fill="${p.bg}"/>`;
      out += `<rect width="${w}" height="${h}" fill="url(#${id}_L3)" opacity="0.6"/>`;
      
      const drawTree = (cx, cy, scale) => {
          let t = "";
          let tiers = 3;
          for(let j=0; j<tiers; j++) {
              let tw = w * (0.25 + j*0.1) * scale;
              let ty = cy + j*(h*0.15*scale);
              let th = h*0.25*scale;
              // 3D split effect for geometric tree
              t += `<polygon points="${cx},${ty} ${cx-tw},${ty+th} ${cx},${ty+th}" fill="url(#${id}_V1)"/>`;
              t += `<polygon points="${cx},${ty} ${cx+tw},${ty+th} ${cx},${ty+th}" fill="url(#${id}_L2)"/>`;
          }
          t += `<rect x="${cx - w*0.04*scale}" y="${cy + tiers*(h*0.15*scale) + h*0.08*scale}" width="${w*0.08*scale}" height="${h*0.08*scale}" fill="${p.dark}"/>`;
          t += drawStar(cx, cy, w*0.06*scale, w*0.02*scale, 4, p.light);
          return t;
      };

      if(i%3===0) {
          out += drawTree(w*0.5, h*0.25, 1);
      } else if (i%3===1) {
          out += drawTree(w*0.3, h*0.4, 0.7);
          out += drawTree(w*0.7, h*0.5, 0.6);
          out += drawTree(w*0.5, h*0.2, 0.9);
      } else {
          out += `<polygon points="${0},${h} ${w},${h*0.4} ${w},${h}" fill="${p.dark}"/>`;
          out += drawTree(w*0.7, h*0.3, 0.8);
          out += drawStar(w*0.2, h*0.2, w*0.1, w*0.03, 4, p.a);
      }
      return out;
  }

  function renderXmasOrnaments(w, h, p, id, rnd, i) {
      let out = `<rect width="${w}" height="${h}" fill="${p.dark}"/>`;
      
      const drawBauble = (cx, cy, r) => {
          let b = `<line x1="${cx}" y1="0" x2="${cx}" y2="${cy-r}" stroke="${p.light}" stroke-width="${w*0.005}"/>`;
          b += `<rect x="${cx - r*0.15}" y="${cy-r - r*0.1}" width="${r*0.3}" height="${r*0.1}" fill="${p.a}"/>`;
          b += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${id}_V2)"/>`;
          b += `<path d="M ${cx-r*0.6} ${cy-r*0.5} Q ${cx} ${cy-r*0.8} ${cx+r*0.6} ${cy-r*0.5}" fill="none" stroke="${p.light}" stroke-width="${r*0.05}" stroke-linecap="round" opacity="0.5"/>`;
          return b;
      };

      if(i%3===0) {
          out += drawBauble(w*0.2, h*0.4, w*0.15);
          out += drawBauble(w*0.5, h*0.7, w*0.25);
          out += drawBauble(w*0.8, h*0.5, w*0.18);
      } else if (i%3===1) {
          out += `<circle cx="${w*0.5}" cy="${h*0.5}" r="${w*0.4}" fill="url(#${id}_R1)"/>`;
          out += drawBauble(w*0.5, h*0.5, w*0.35);
          out += drawStar(w*0.8, h*0.2, w*0.08, w*0.02, 4, p.light);
      } else {
          for(let j=0; j<8; j++) {
              let r = w*(0.05 + rnd()*0.1);
              out += `<circle cx="${w*rnd()}" cy="${h*rnd()}" r="${r}" fill="url(#${id}_V1)"/>`;
          }
          out += drawBauble(w*0.3, h*0.4, w*0.2);
          out += drawBauble(w*0.7, h*0.6, w*0.2);
      }
      return out;
  }

  function renderXmasSnowflake(w, h, p, id, rnd, i) {
      let out = `<rect width="${w}" height="${h}" fill="${p.bg}"/>`;
      
      const drawFlake = (cx, cy, r) => {
          let f = "";
          for(let j=0; j<6; j++) {
              let rot = j * 60;
              f += `<g transform="translate(${cx}, ${cy}) rotate(${rot})">`;
              f += `<line x1="0" y1="0" x2="0" y2="${-r}" stroke="${p.a}" stroke-width="${r*0.05}"/>`;
              f += `<polygon points="${-r*0.1},${-r*0.3} ${0},${-r*0.5} ${r*0.1},${-r*0.3} ${0},${-r*0.2}" fill="${p.mid}"/>`;
              f += `<polygon points="${-r*0.15},${-r*0.6} ${0},${-r*0.9} ${r*0.15},${-r*0.6} ${0},${-r*0.4}" fill="url(#${id}_V1)"/>`;
              f += `</g>`;
          }
          f += `<circle cx="${cx}" cy="${cy}" r="${r*0.1}" fill="${p.light}"/>`;
          return f;
      };

      if(i%3===0) {
          out += `<circle cx="${w*0.5}" cy="${h*0.5}" r="${w*0.6}" fill="url(#${id}_R1)"/>`;
          out += drawFlake(w*0.5, h*0.5, w*0.4);
      } else if (i%3===1) {
          out += drawFlake(w*0.2, h*0.2, w*0.15);
          out += drawFlake(w*0.8, h*0.3, w*0.2);
          out += drawFlake(w*0.3, h*0.7, w*0.25);
          out += drawFlake(w*0.7, h*0.8, w*0.15);
      } else {
          out += drawFlake(0, h*0.5, w*0.6);
          out += drawFlake(w, 0, w*0.4);
      }
      return out;
  }

  function renderXmasRibbons(w, h, p, id, rnd, i) {
      let out = `<rect width="${w}" height="${h}" fill="${p.dark}"/>`;
      let ribbonsCount = Math.max(4, Math.floor(state.density/2));
      
      for(let j=0; j<ribbonsCount; j++) {
          let startY = h - (j * (h*0.8/ribbonsCount));
          let endX = w; let endY = h - (j * (h*0.9/ribbonsCount));
          let cx1 = w*0.2; let cy1 = startY;
          let cx2 = w*0.6; let cy2 = endY - h*0.3;
          let thick = w*0.08;
          
          let path = `M 0,${startY} C ${cx1},${cy1} ${cx2},${cy2} ${endX},${endY} L ${endX},${endY+thick} C ${cx2},${cy2+thick} ${cx1},${cy1+thick} 0,${startY+thick} Z`;
          out += `<path d="${path}" fill="url(#${id}_L2)" />`;
          out += `<path d="${path}" fill="url(#${id}_V1)" opacity="0.6" />`;
      }
      out += drawStar(w*0.8, h*0.2, w*0.06, w*0.02, 4, p.light);
      return out;
  }

  // ----------------------------------------------------
  // ORIGINAL PREMIUM STUDIO ENGINES
  // ----------------------------------------------------
  function renderAmberVolume(w, h, p, id, rnd, i) {
      let out = `<rect width="${w}" height="${h}" fill="${p.bg}"/>`;
      let s = Math.max(0.5, state.density / 8);
      if(i%3===0) {
          for(let j=0; j<4; j++) out += `<rect x="${w*0.1}" y="${h*(0.2+j*0.15)}" width="${w*0.8}" height="${h*0.1}" rx="${h*0.05}" fill="url(#${id}_V3)"/>`;
          out += `<circle cx="${w*0.5}" cy="${h*0.8}" r="${w*0.25}" fill="url(#${id}_V1)"/>`;
      } else if (i%3===1) {
          for(let j=0; j<10; j++) out += `<circle cx="${w*(0.1+rnd()*0.8)}" cy="${h*(0.1+rnd()*0.8)}" r="${w*(0.1+rnd()*0.2)*s}" fill="url(#${id}_V1)"/>`;
      } else {
          out += `<ellipse cx="${w*0.3}" cy="${h*0.3}" rx="${w*0.5}" ry="${h*0.5}" fill="url(#${id}_V1)"/>`;
          out += `<ellipse cx="${w*0.8}" cy="${h*0.8}" rx="${w*0.4}" ry="${h*0.4}" fill="url(#${id}_V2)"/>`;
      }
      return out;
  }

  function renderMidnightIce(w, h, p, id, rnd, i) {
      let out = `<rect width="${w}" height="${h}" fill="${p.dark}"/>`;
      if(i%3===0) {
          out += `<ellipse cx="${w*0.5}" cy="${h*0.8}" rx="${w*1.5}" ry="${h*0.4}" fill="url(#${id}_V3)" />`;
          out += `<ellipse cx="${w*0.3}" cy="${h*1.2}" rx="${w*1.5}" ry="${h*0.4}" fill="url(#${id}_V3)" />`;
      } else if(i%3===1) {
          for(let j=0; j<8; j++) out += `<rect x="${w*0.1 + j*(w*0.11)}" y="${h*(0.05+(j%2)*0.05)}" width="${w*0.06}" height="${h*0.9}" fill="url(#${id}_V3)" />`;
      } else {
          let cx=w*0.9, cy=h*0.5; let blades = Math.max(12, state.density * 2);
          for(let j=0; j<blades; j++) {
              let a1=(j/blades)*TAU, aMid=((j+0.5)/blades)*TAU, a2=((j+1)/blades)*TAU;
              out += `<polygon points="${cx},${cy} ${cx+Math.cos(a1)*w*1.5},${cy+Math.sin(a1)*w*1.5} ${cx+Math.cos(aMid)*w*1.5},${cy+Math.sin(aMid)*w*1.5}" fill="${p.dark}"/>`;
              out += `<polygon points="${cx},${cy} ${cx+Math.cos(aMid)*w*1.5},${cy+Math.sin(aMid)*w*1.5} ${cx+Math.cos(a2)*w*1.5},${cy+Math.sin(a2)*w*1.5}" fill="url(#${id}_L1)"/>`;
          }
      }
      return out;
  }

  function renderSwissGrid(w, h, p, id, rnd, i) {
      let out = `<rect width="${w}" height="${h}" fill="${p.bg}"/>`;
      let col = w/12; let row = h/12;
      if(i%3===0) {
          out += `<rect x="${col*2}" y="${row*2}" width="${col*4}" height="${row*8}" fill="${p.mid}"/>`;
          out += `<circle cx="${col*8}" cy="${row*6}" r="${col*3}" fill="${p.a}"/>`;
          out += `<rect x="${col*4}" y="${row*8}" width="${col*6}" height="${row*2}" fill="${p.dark}"/>`;
      } else if (i%3===1) {
          out += `<polygon points="${0},${0} ${w},${0} ${w},${h*0.6}" fill="${p.dark}"/>`;
          out += `<circle cx="${col*4}" cy="${row*6}" r="${col*3}" fill="${p.light}"/>`;
          out += `<rect x="${col*6}" y="${row*4}" width="${col*5}" height="${row*5}" fill="${p.a}"/>`;
      } else {
          for(let j=0; j<6; j++) out += `<rect x="${col*(1 + j*2)}" y="${row*(1 + rnd()*4)}" width="${col}" height="${row*(4 + rnd()*4)}" fill="${j%2===0?p.dark:p.mid}"/>`;
      }
      return out;
  }

  function renderHoloFold(w, h, p, id, rnd, i) {
      return renderXmasRibbons(w, h, p, id, rnd, i); // Shared logic, different palette mapped via theme
  }

  function renderRetroHalftone(w, h, p, id, rnd, i) {
      let out = `<rect width="${w}" height="${h}" fill="${p.bg}"/>`;
      
      const drawDots = (cx, cy, rMax, color, sp) => {
          let str = "";
          for(let y=-rMax; y<=rMax; y+=sp) {
            for(let x=-rMax; x<=rMax; x+=sp) {
               let dist = Math.sqrt(x*x + y*y);
               if (dist < rMax) {
                  let r = (sp*0.45) * (1 - Math.pow(dist/rMax, 2)); 
                  if(r>1) str += `<circle cx="${cx+x}" cy="${cy+y}" r="${r}" fill="${color}"/>`;
               }
            }
          }
          return str;
      };

      if(i%3===0) {
          out += `<polygon points="${w*0.2},${h*0.2} ${w*0.8},${h*0.8} 0,${h*0.8}" fill="${p.dark}"/>`;
          out += drawDots(w*0.3, h*0.7, w*0.25, p.a, w*0.02);
          out += `<circle cx="${w*0.7}" cy="${h*0.4}" r="${w*0.2}" fill="${p.mid}"/>`;
      } else {
          out += drawDots(w*0.5, h*0.5, w*0.4, p.dark, w*0.02);
          out += `<rect x="${w*0.2}" y="${h*0.4}" width="${w*0.6}" height="${h*0.2}" fill="${p.light}"/>`;
          out += `<circle cx="${w*0.5}" cy="${h*0.5}" r="${w*0.15}" fill="${p.a}"/>`;
      }
      return out;
  }

  function renderFluidAura(w, h, p, id, rnd, i) {
      let out = `<rect width="${w}" height="${h}" fill="${p.dark}"/>`;
      let orbs = Math.max(3, Math.floor(state.density/2));
      for(let j=0; j<orbs; j++) out += `<ellipse cx="${w*rnd()}" cy="${h*rnd()}" rx="${w*(0.6+rnd()*0.4)}" ry="${h*(0.4+rnd()*0.4)}" fill="url(#${id}_R1)"/>`;
      return out;
  }

  // ==========================================
  // EDITORIAL TYPOGRAPHY & GRIDS
  // ==========================================
  function textLayer(mode, w, h, p, i){
    const col = w / 12; 
    const fs = Math.max(24, Math.round(Math.min(w,h)*0.04));
    
    let fill = p.text;
    if (mode === "swissGrid") fill = p.dark; 
    if (mode === "retroHalftone" && i%3!==0) fill = p.dark;

    let t = `<g font-family="system-ui, -apple-system, sans-serif" fill="${fill}">`;

    if(mode.includes("xmas") || mode.includes("Xmas")) {
        let title = "MERRY CHRISTMAS";
        t += `<text x="${w/2}" y="${h*0.15}" font-size="${fs*1.2}" font-weight="900" text-anchor="middle" letter-spacing="2">${title}</text>`;
        t += `<text x="${w/2}" y="${h*0.18}" font-size="${fs*0.4}" font-weight="600" text-anchor="middle" opacity="0.7">WINTER HOLIDAY CELEBRATION</text>`;
        t += `<text x="${col}" y="${h*0.9}" font-size="${fs*0.3}" font-weight="500" opacity="0.6">HOLIDAY EDITION</text>`;
    } else {
        let title = mode.replace(/([A-Z])/g, ' $1').toUpperCase().trim();
        t += `<text x="${col}" y="${h*0.1}" font-size="${fs}" font-weight="900" letter-spacing="2">${title}</text>`;
        t += `<text x="${col}" y="${h*0.1 + fs*1.2}" font-size="${fs*0.4}" font-weight="600" opacity="0.7">VOL. ${String(i+1).padStart(2,"0")} / GEOMETRIC SYSTEM</text>`;
        t += `<text x="${w - col}" y="${h - h*0.05}" font-size="${fs*0.3}" font-weight="600" opacity="0.5" text-anchor="end">ALI STUDIO / ${String(i+1).padStart(2,"0")}</text>`;
        t += `<text x="${col}" y="${h - h*0.05}" font-size="${fs*0.3}" font-weight="500" opacity="0.6">Grid System: 12 Columns</text>`;

        if (mode === "swissGrid" && i%3===0) {
            t += `<text x="${col*6}" y="${h*0.5}" font-size="${fs*2.5}" font-weight="900" letter-spacing="-2" text-anchor="middle" fill="${p.light}">FORM</text>`;
        }
    }
    
    return t + `</g>`;
  }

  // ==========================================
  // CORE ENGINE LOGIC
  // ==========================================
  function makeSvg(index){
    const {w,h}=dims();
    const rnd=mulberry32((Number(state.seed)||1)+index*7919);
    
    const mode = state.designMode;
    let themeKey = state.theme;
    
    // Auto-curated mapping
    if(themeKey === "curated") {
        if(mode.includes("xmas")) {
            if(mode==="xmasScandiTree") themeKey = "xmasClassic";
            else if(mode==="xmasSnowflake") themeKey = "xmasFrost";
            else themeKey = "xmasCandy";
        } else {
            themeKey = mode;
        }
    }
    
    const p = THEMES[themeKey] || THEMES.amberVolume;
    const id = `ali_${state.seed}_${index}`;
    
    let out = getDefs(id, p);
    
    if (mode === "xmasScandiTree") out += renderXmasScandiTree(w, h, p, id, rnd, index);
    else if (mode === "xmasOrnaments") out += renderXmasOrnaments(w, h, p, id, rnd, index);
    else if (mode === "xmasSnowflake") out += renderXmasSnowflake(w, h, p, id, rnd, index);
    else if (mode === "xmasRibbons")   out += renderXmasRibbons(w, h, p, id, rnd, index);
    else if (mode === "amberVolume")   out += renderAmberVolume(w, h, p, id, rnd, index);
    else if (mode === "midnightIce")   out += renderMidnightIce(w, h, p, id, rnd, index);
    else if (mode === "swissGrid")     out += renderSwissGrid(w, h, p, id, rnd, index);
    else if (mode === "holoFold")      out += renderHoloFold(w, h, p, id, rnd, index);
    else if (mode === "retroHalftone") out += renderRetroHalftone(w, h, p, id, rnd, index);
    else if (mode === "fluidAura")     out += renderFluidAura(w, h, p, id, rnd, index);
    else out += renderAmberVolume(w, h, p, id, rnd, index);

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
        let text = dMode.options[dMode.selectedIndex].text;
        $("workspaceTitle").textContent = text.replace(/^[0-9]+\.\s*/, '').replace('✦ ', '').toUpperCase();
    }
  }

  function readControls(){
    if($("posterCount")) state.posterCount = Number($("posterCount").value);
    if($("density")) state.density = Number($("density").value);
    if($("designMode")) state.designMode = $("designMode").value;
    if($("theme")) state.theme = $("theme").value;
    if($("seed")) state.seed = Number($("seed").value) || 1;
    if($("format")) state.format = $("format").value;
    if($("quality")) state.quality = $("quality").value;
  }

  function render(){
    try {
        readControls(); updateOutputs(); generated=[];
        const grid=$("posterGrid"); if(!grid) return;
        grid.innerHTML="";
        const tpl=$("posterTemplate"); if(!tpl) return;
        
        let maxCols = Math.min(4, state.posterCount);

        for(let i=0;i<state.posterCount;i++){
          const node=tpl.content.firstElementChild.cloneNode(true), svg=makeSvg(i);
          generated.push(svg);
          const num = node.querySelector(".poster-number");
          const modeTxt = node.querySelector(".poster-mode");
          const frame = node.querySelector(".poster-frame");
          const dBtn = node.querySelector(".download-one");
          
          if(num) num.textContent=`ARTBOARD 0${i+1}`;
          if(modeTxt) modeTxt.textContent=`VECTOR / 0${(i%3)+1}`;
          if(frame) frame.innerHTML=svg;
          if(dBtn) dBtn.addEventListener("click",()=>download(`ali-studio-${state.designMode}-${String(i+1).padStart(2,"0")}.svg`,svg));
          
          grid.appendChild(node);
        }
        grid.style.gridTemplateColumns=`repeat(${maxCols},minmax(0,1fr))`;
        applyZoom();
    } catch (e) {
        console.error("Render error:", e);
    }
  }

  function applyZoom(){ 
      const grid = $("posterGrid"); if (!grid) return;
      grid.style.transform = `scale(${zoom})`; 
      if($("zoomLabel")) $("zoomLabel").textContent = `${Math.round(zoom*100)}%`; 
      const hDiff = (grid.offsetHeight * zoom) - grid.offsetHeight;
      grid.style.marginBottom = `${hDiff > 0 ? hDiff + 80 : 80}px`;
  }

  ["posterCount","density","designMode","theme","seed","format","quality"].forEach(id=>{
    let el = $(id);
    if(el){ el.addEventListener("input",()=>{updateOutputs();render();}); el.addEventListener("change",()=>{updateOutputs();render();}); }
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
          const count=state.posterCount, cols=Math.min(4,count), rows=Math.ceil(count/cols), gap=40;
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

  if($("zoomIn")) $("zoomIn").addEventListener("click",()=>{zoom=clamp(zoom+.1,.4,2);applyZoom();});
  if($("zoomOut")) $("zoomOut").addEventListener("click",()=>{zoom=clamp(zoom-.1,.4,2);applyZoom();});

  updateOutputs(); render();
})();
