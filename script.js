(() => {
  "use strict";

  const $ = id => document.getElementById(id);
  const clamp = (n,a,b) => Math.max(a, Math.min(b,n));
  const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&apos;"}[c]));
  const mulberry32 = a => () => {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
  const TAU = Math.PI * 2;

  const THEMES = {
    crimson:  { dark:"#120202", mid:"#6b0313", a:"#d10022", b:"#ff1a3c", light:"#ffeedb", text:"#ffffff" },
    candy:    { dark:"#21062e", mid:"#b31965", a:"#ff4fd8", b:"#ff7d62", light:"#ffe18a", text:"#ffffff" },
    electric: { dark:"#03142c", mid:"#0849a7", a:"#28b9ff", b:"#6560ff", light:"#d8f7ff", text:"#ffffff" },
    tropical: { dark:"#042b2a", mid:"#078f76", a:"#2de7c7", b:"#8dff72", light:"#ffe56b", text:"#08231f" },
    berry:    { dark:"#24051e", mid:"#7f185e", a:"#ed3a9f", b:"#9a4dff", light:"#ffb2df", text:"#ffffff" },
    aqua:     { dark:"#02252d", mid:"#007f94", a:"#16e2ef", b:"#4c9dff", light:"#c9fff6", text:"#ffffff" },
    solar:    { dark:"#351006", mid:"#d44b06", a:"#ff8d28", b:"#ffd447", light:"#fff1ad", text:"#331a05" },
    violet:   { dark:"#15072c", mid:"#4f1d9a", a:"#9c63ff", b:"#fb5fff", light:"#e9d5ff", text:"#ffffff" },
    lime:     { dark:"#111c02", mid:"#4f8809", a:"#9dea20", b:"#48e27c", light:"#f0ff92", text:"#122006" }
  };

  const state = {
    posterCount:5, designMode:"Cyan Geometric Editorial", theme:"crimson", depth:"flat",
    shapeSize:100, density:8, gradientSoftness:72, spacing:24, edgeFade:34, textAmount:55,
    seed:260831, format:"portrait", quality:"large", darkColor:"#1a0404", lightColor:"#ffecd6"
  };

  let generated = [], zoom = 1;

  function dims(){
    const base = {portrait:{w:1200,h:1800},square:{w:1600,h:1600},landscape:{w:1800,h:1200}}[state.format] || {w:1200,h:1800};
    const q = {standard:1,large:1.35,xl:1.8}[state.quality] || 1.35;
    return {w:Math.round(base.w*q),h:Math.round(base.h*q)};
  }

  function hexToRgb(hex){
    const s = String(hex).replace("#","");
    const clean = s.length === 3 ? s.split("").map(x=>x+x).join("") : s;
    const v = parseInt(clean,16) || 0;
    return {r:(v>>16)&255,g:(v>>8)&255,b:v&255};
  }

  function mixHex(a,b,t){
    const A=hexToRgb(a), B=hexToRgb(b);
    return "#"+[A.r,A.g,A.b].map((v,i)=>Math.round(v*(1-t)+[B.r,B.g,B.b][i]*t).toString(16).padStart(2,"0")).join("");
  }

  function sizeFactor(){ return clamp(Number(state.shapeSize)/100,.35,1.55); }

  function palette(index){
    const base = THEMES[state.theme] || THEMES.crimson;
    const themeKeys = Object.keys(THEMES);
    const shift = (Math.floor((Number(state.seed)||1)/17) + index * 3) % themeKeys.length;
    const alt = THEMES[themeKeys[shift]];
    const tint = ((index * 0.17) % 0.75);
    return {
      dark: state.darkColor || mixHex(base.dark, alt.dark, tint * .2),
      mid: mixHex(base.mid, alt.mid, tint),
      a: mixHex(base.a, alt.a, (tint + .12) % 1),
      b: mixHex(base.b, alt.b, (tint + .28) % 1),
      light: state.lightColor || mixHex(base.light, alt.light, tint * .35),
      text: index % 4 === 1 ? "#071019" : (base.text || "#fff")
    };
  }

  function commonDefs(id,p,rnd){
    return `<defs>
      <linearGradient id="${id}_bg" x1="${rnd()*20}%" y1="100%" x2="${80+rnd()*20}%" y2="0%">
        <stop offset="0%" stop-color="${p.dark}"/>
        <stop offset="34%" stop-color="${p.mid}"/>
        <stop offset="68%" stop-color="${p.a}"/>
        <stop offset="100%" stop-color="${p.light}"/>
      </linearGradient>
      <linearGradient id="${id}_hero" x1="10%" y1="90%" x2="90%" y2="10%">
        <stop offset="0%" stop-color="${p.a}"/>
        <stop offset="52%" stop-color="${p.b}"/>
        <stop offset="100%" stop-color="${p.light}"/>
      </linearGradient>
      <linearGradient id="${id}_dark" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${mixHex(p.dark,"#000000",.12)}"/>
        <stop offset="72%" stop-color="${p.mid}"/>
        <stop offset="100%" stop-color="${p.a}"/>
      </linearGradient>
      <radialGradient id="${id}_orb" cx="30%" cy="24%" r="78%">
        <stop offset="0%" stop-color="#ffffff"/>
        <stop offset="20%" stop-color="${p.light}"/>
        <stop offset="62%" stop-color="${p.a}"/>
        <stop offset="100%" stop-color="${p.dark}"/>
      </radialGradient>
    </defs>`;
  }

  function addLight(out,id,w,h,rnd,p){
    const fade = Number(state.edgeFade)/100;
    if(fade<=0) return out;
    out += `<ellipse cx="${(w*(.14+rnd()*.20)).toFixed(1)}" cy="${(h*(.08+rnd()*.20)).toFixed(1)}" rx="${(w*.30).toFixed(1)}" ry="${(h*.18).toFixed(1)}" fill="url(#${id}_hero)" opacity="${(.15+fade*.15).toFixed(2)}"/>`;
    out += `<ellipse cx="${(w*(.86-rnd()*.10)).toFixed(1)}" cy="${(h*(.78-rnd()*.10)).toFixed(1)}" rx="${(w*.24).toFixed(1)}" ry="${(h*.17).toFixed(1)}" fill="url(#${id}_bg)" opacity="${(.15+fade*.15).toFixed(2)}"/>`;
    return out;
  }

  // ==========================================
  // CORE GEOMETRIC ENGINES
  // ==========================================

  // 1. SHARP BEAMS (Editorial / Minimal / Bold)
  function sharpBeams(id,w,h,p,rnd,index) {
    const s = sizeFactor(); const shadowColor = mixHex(p.dark, "#000000", 0.6); let out = "";
    if(index % 5 === 0) {
        out += `<rect width="${w}" height="${h}" fill="url(#${id}_dark)"/>`;
        const steps = Math.max(12, Math.floor(Number(state.density)*2));
        for(let i=0; i<steps; i++) {
            let scale = 1 - (i/steps); let rX = w * 1.6 * scale * s; let rY = h * 1.3 * scale * s;
            let cx = w * 0.9 - (i * w * 0.02); let cy = h * 0.8 + (i * h * 0.01);
            let fill = i%2===0 ? `url(#${id}_hero)` : p.light; if(i > steps - 4) fill = p.light;
            if(state.depth==="3d") out += `<ellipse cx="${cx+15}" cy="${cy+15}" rx="${rX}" ry="${rY}" fill="${shadowColor}" opacity="0.3"/>`;
            out += `<ellipse cx="${cx}" cy="${cy}" rx="${rX}" ry="${rY}" fill="${fill}" />`;
        }
        return out;
    }
    if(index % 5 === 1) {
        out += `<rect width="${w}" height="${h}" fill="${p.dark}"/>`;
        const blades = Math.max(8, Math.floor(Number(state.density)*1.5));
        for(let i=0; i<blades; i++) {
            let x1 = w * (rnd() * 1.2 - 0.2); let y1 = -h * 0.2; let x2 = w * (rnd() * 1.5 - 0.2); let y2 = h * 1.2;
            let ctrlX = w * (rnd() * 0.5); let ctrlY = h * 0.5; let thick = w * (0.15 + rnd()*0.15) * s;
            let fill = i%2===0 ? `url(#${id}_hero)` : `url(#${id}_dark)`;
            let pathD = `M ${x1} ${y1} Q ${ctrlX} ${ctrlY} ${x2} ${y2} L ${x2+thick} ${y2} Q ${ctrlX+thick} ${ctrlY} ${x1+thick} ${y1} Z`;
            if(state.depth==="3d") out += `<path d="${pathD}" transform="translate(15, 15)" fill="${shadowColor}" opacity="0.5"/>`;
            out += `<path d="${pathD}" fill="${fill}"/>`;
        }
        return out;
    }
    if(index % 5 === 2) {
        out += `<rect width="${w}" height="${h}" fill="${p.dark}"/>`;
        const beams = Math.max(8, Number(state.density)*2);
        const fx = -w*0.05; const fy = h*0.5; 
        for(let i=0; i<beams; i++) {
            let angle1 = -Math.PI/2 + (i/beams) * Math.PI; let angle2 = -Math.PI/2 + ((i+0.6)/beams) * Math.PI;
            let r = Math.max(w,h) * 2;
            let x1 = fx + Math.cos(angle1)*r; let y1 = fy + Math.sin(angle1)*r;
            let x2 = fx + Math.cos(angle2)*r; let y2 = fy + Math.sin(angle2)*r;
            let fill = i%2===0 ? `url(#${id}_hero)` : `url(#${id}_bg)`;
            let pts = `${fx},${fy} ${x1},${y1} ${x2},${y2}`;
            if(state.depth==="3d") out += `<polygon points="${pts}" transform="translate(10, 10)" fill="${shadowColor}" opacity="0.4"/>`;
            out += `<polygon points="${pts}" fill="${fill}"/>`;
        }
        return out;
    }
    if(index % 5 === 3) {
        out += `<rect width="${w}" height="${h}" fill="${p.dark}"/>`;
        const bars = Math.max(6, Number(state.density)*1.2);
        for(let i=0; i<bars; i++) {
            let cx = w * (rnd() > 0.5 ? 0.1 : 0.9); let cy = h * (rnd() > 0.5 ? 0.1 : 0.9);
            let rot = rnd() * 180; let bw = w * 3; let bh = h * (0.15 + rnd()*0.15) * s;
            let fill = i%2===0 ? `url(#${id}_hero)` : `url(#${id}_dark)`;
            if(state.depth==="3d") out += `<rect x="${cx-bw/2+15}" y="${cy-bh/2+15}" width="${bw}" height="${bh}" transform="rotate(${rot} ${cx+15} ${cy+15})" fill="${shadowColor}" opacity="0.5"/>`;
            out += `<rect x="${cx-bw/2}" y="${cy-bh/2}" width="${bw}" height="${bh}" transform="rotate(${rot} ${cx} ${cy})" fill="${fill}"/>`;
        }
        return out;
    }
    out += `<rect width="${w}" height="${h}" fill="${p.light}"/>`;
    const spikes = Math.max(10, Number(state.density)*2); const cx = w*0.5, cy = h*0.5;
    const inR = w * 0.35 * s; const outR = Math.max(w,h) * 1.5;
    for(let i=0; i<spikes; i++) {
        let a1 = (i/spikes) * TAU; let a2 = ((i+1)/spikes) * TAU;
        let x1 = cx + Math.cos(a1)*inR; let y1 = cy + Math.sin(a1)*inR;
        let ox1 = cx + Math.cos(a1 - 0.2)*outR; let oy1 = cy + Math.sin(a1 - 0.2)*outR;
        let ox2 = cx + Math.cos(a2 - 0.2)*outR; let oy2 = cy + Math.sin(a2 - 0.2)*outR;
        let pts = `${x1},${y1} ${ox1},${oy1} ${ox2},${oy2}`;
        if(state.depth==="3d") out += `<polygon points="${pts}" transform="translate(10, 10)" fill="${shadowColor}" opacity="0.3"/>`;
        out += `<polygon points="${pts}" fill="url(#${id}_hero)"/>`;
    }
    return out;
  }

  // 2. LIQUID FLOW (Fluid/Organic)
  function liquid(id,w,h,p,rnd){
    let out=""; const s=sizeFactor(); const blobs=5+Math.floor(Number(state.density)/4);
    const shadowColor = mixHex(p.dark, "#000000", 0.6);
    for(let i=0;i<blobs;i++){
      const x=w*(.12+rnd()*.76), y=h*(.14+rnd()*.72), rx=w*(.10+rnd()*.20)*s, ry=h*(.06+rnd()*.16)*s;
      const d=`M ${x-rx} ${y} C ${x-rx*.7} ${y-ry*1.15}, ${x+rx*.2} ${y-ry*.8}, ${x+rx} ${y-rnd()*ry*.1} C ${x+rx*.7} ${y+ry*1.1}, ${x-rx*.1} ${y+ry*.9}, ${x-rx} ${y} Z`;
      if(state.depth==="3d") out += `<path d="${d}" transform="translate(14, 14)" fill="${shadowColor}" opacity="0.4"/>`;
      out += `<path d="${d}" fill="${i%2?`url(#${id}_hero)`:p.a}"/>`;
    }
    return out;
  }

  // 3. GRADIENT MESH (Iridescent/Holographic)
  function gradientMesh(id,w,h,p,rnd){
    let out = `<rect width="${w}" height="${h}" fill="${p.dark}"/>`;
    const count = Math.max(3, Math.floor(Number(state.density)/2));
    for(let i=0; i<count; i++){
        let cx = w * rnd(); let cy = h * rnd();
        let rx = w * (0.4 + rnd()*0.6) * sizeFactor(); let ry = h * (0.4 + rnd()*0.6) * sizeFactor();
        out += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${i%2===0 ? `url(#${id}_hero)` : `url(#${id}_orb)`}" opacity="0.7"/>`;
    }
    return out;
  }

  // 4. MEMPHIS / RETRO (Playful/Collage)
  function memphis(id,w,h,p,rnd){
    let out = `<rect width="${w}" height="${h}" fill="${p.light}"/>`;
    const items = Math.max(10, Number(state.density)*2);
    const shadowColor = mixHex(p.dark, "#000000", 0.4);
    for(let i=0; i<items; i++){
        let type = Math.floor(rnd()*4);
        let x = w*rnd(); let y = h*rnd(); let s = w * 0.05 * sizeFactor() * (1+rnd()*2);
        let col = [p.a, p.b, p.dark][i%3];
        if(state.depth==="3d") {
            if(type===0) out += `<circle cx="${x+10}" cy="${y+10}" r="${s}" fill="${shadowColor}"/>`;
            if(type===1) out += `<rect x="${x+10}" y="${y+10}" width="${s*1.5}" height="${s*1.5}" fill="none" stroke="${shadowColor}" stroke-width="${s*0.2}"/>`;
            if(type===2) out += `<polygon points="${x+10},${y-s+10} ${x+s+10},${y+s+10} ${x-s+10},${y+s+10}" fill="${shadowColor}"/>`;
        }
        if(type===0) out += `<circle cx="${x}" cy="${y}" r="${s}" fill="${col}"/>`;
        if(type===1) out += `<rect x="${x}" y="${y}" width="${s*1.5}" height="${s*1.5}" fill="none" stroke="${col}" stroke-width="${s*0.2}"/>`;
        if(type===2) out += `<polygon points="${x},${y-s} ${x+s},${y+s} ${x-s},${y+s}" fill="${col}"/>`;
        if(type===3) out += `<path d="M ${x} ${y} Q ${x+s} ${y-s} ${x+s*2} ${y} T ${x+s*4} ${y}" fill="none" stroke="${col}" stroke-width="${s*0.3}" stroke-linecap="round"/>`;
    }
    return out;
  }

  // 5. MANDALA / SACRED GEOMETRY
  function mandala(id,w,h,p,rnd){
    let out = `<rect width="${w}" height="${h}" fill="${p.dark}"/>`;
    const cx = w/2; const cy = h/2;
    const rings = Math.max(3, Math.floor(Number(state.density)/2));
    const segments = 12;
    for(let i=1; i<=rings; i++){
        let r = (Math.min(w,h)*0.4 / rings) * i * sizeFactor();
        out += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${p.a}" stroke-width="${w*0.002}"/>`;
        for(let j=0; j<segments; j++){
            let a = (j/segments) * TAU;
            let x1 = cx + Math.cos(a)*r; let y1 = cy + Math.sin(a)*r;
            let x2 = cx + Math.cos(a+TAU/(segments*2))*(r*1.2); let y2 = cy + Math.sin(a+TAU/(segments*2))*(r*1.2);
            out += `<path d="M ${cx} ${cy} L ${x1} ${y1} L ${x2} ${y2} Z" fill="none" stroke="${i%2===0?p.b:p.light}" stroke-width="${w*0.001}"/>`;
            out += `<circle cx="${x1}" cy="${y1}" r="${r*0.1}" fill="url(#${id}_hero)"/>`;
        }
    }
    return out;
  }

  // 6. PATTERN GRID (Halftone/Checkerboard)
  function patternGrid(id,w,h,p,rnd, modeStr){
    let out = `<rect width="${w}" height="${h}" fill="${p.dark}"/>`;
    let isChecker = modeStr.includes('checker');
    let isLine = modeStr.includes('line');
    let step = Math.max(20, (150 - Number(state.density)*5) * sizeFactor());
    if (isLine) {
        for(let y=0; y<h; y+=step) out += `<line x1="0" y1="${y}" x2="${w}" y2="${y}" stroke="${p.a}" stroke-width="${step*0.3}"/>`;
    } else if (isChecker) {
        let row=0;
        for(let y=0; y<h; y+=step){
            let col=0;
            for(let x=0; x<w; x+=step){
                if((row+col)%2===0) out += `<rect x="${x}" y="${y}" width="${step}" height="${step}" fill="${p.b}"/>`;
                col++;
            }
            row++;
        }
    } else {
        for(let y=0; y<h; y+=step){
            for(let x=0; x<w; x+=step){
                let r = (Math.sin(x*0.01) + Math.cos(y*0.01)) * step * 0.4;
                if(r>0) out += `<circle cx="${x}" cy="${y}" r="${r}" fill="${p.light}"/>`;
            }
        }
    }
    return out;
  }

  // 7. SPHERES (Bubbles/Glass)
  function spheres(id,w,h,p,rnd){
    let out=""; const s=sizeFactor(), count=5+Math.floor(Number(state.density)/4), min=Math.min(w,h);
    const shadowColor = mixHex(p.dark, "#000000", 0.6);
    for(let i=0;i<count;i++){
      const x=w*(.16+rnd()*.68), y=h*(.16+rnd()*.66), r=min*(.06+rnd()*.14)*s;
      const fill=i%3===0?`url(#${id}_orb)`:i%3===1?`url(#${id}_hero)`:p.dark;
      if(state.depth==="3d") out += `<circle cx="${(x+14).toFixed(1)}" cy="${(y+14).toFixed(1)}" r="${r.toFixed(1)}" fill="${shadowColor}" opacity="0.5"/>`;
      out += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${fill}"/>`;
      if(state.depth==="3d") out += `<ellipse cx="${(x-r*.25).toFixed(1)}" cy="${(y-r*.30).toFixed(1)}" rx="${(r*.32).toFixed(1)}" ry="${(r*.18).toFixed(1)}" fill="#fff" opacity=".4"/>`;
    }
    return out;
  }

  // 8. PETALS (Floral/Organic)
  function petals(id,w,h,p,rnd){
    let out=""; const cx=w*(.5+rnd()*.08-.04), cy=h*(.49+rnd()*.10-.05), R=Math.min(w,h)*.30*sizeFactor();
    const petals=5+Math.round(Number(state.density)/5);
    const shadowColor = mixHex(p.dark, "#000000", 0.6);
    for(let i=0;i<petals;i++){
      const a=i*TAU/petals-rnd()*.16, x=cx+Math.cos(a)*R*.56, y=cy+Math.sin(a)*R*.56, rx=R*(.44+rnd()*.26), ry=R*(.17+rnd()*.10);
      const rot=a*180/Math.PI+30;
      if(state.depth==="3d") out += `<ellipse cx="${(x+10).toFixed(1)}" cy="${(y+10).toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" transform="rotate(${rot.toFixed(1)} ${(x+10).toFixed(1)} ${(y+10).toFixed(1)})" fill="${shadowColor}" opacity="0.4"/>`;
      out += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" transform="rotate(${rot.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})" fill="${i%2?`url(#${id}_hero)`:p.a}"/>`;
    }
    return out;
  }

  // 9. CYBER (Synthwave / Y2K)
  function cyberTopography(id,w,h,p,rnd) {
    let out = `<rect width="${w}" height="${h}" fill="${p.dark}"/>`; const s = sizeFactor();
    const lines = Math.max(12, Math.floor(Number(state.density)*1.8));
    for(let i=0; i<lines; i++) {
      let y = h*(0.15 + (i/lines)*0.7); let pts = [];
      for(let x=0; x<=w; x+=w/15) {
        let offY = Math.sin(x*0.01 + i + rnd()*2)*h*0.12*s;
        pts.push(`${x.toFixed(1)},${(y+offY).toFixed(1)}`);
      }
      out += `<polyline points="${pts.join(" ")}" fill="none" stroke="${i%2?p.a:p.b}" stroke-width="${Math.max(3, w*.004).toFixed(1)}" opacity="0.85"/>`;
    }
    const cr = Math.min(w,h)*0.2*s;
    out += `<circle cx="${w*0.5}" cy="${h*0.5}" r="${cr}" fill="none" stroke="${p.light}" stroke-width="${Math.max(4, w*.01)}"/>`;
    return out;
  }

  // 10. WAVES
  function waves(id,w,h,p,rnd){
    let out=""; const lines=4+Math.floor(Number(state.density)/3), amp=h*.045*sizeFactor();
    const shadowColor = mixHex(p.dark, "#000000", 0.6);
    for(let j=0;j<lines;j++){
      const y=h*(.18+j*.16), pts=[], shadowPts=[]; const segments=16;
      for(let i=0;i<=segments;i++){
          const x=w*(i/segments); const yy=y+Math.sin(i*.75+j*.9)*amp*(.6+rnd()*.65); 
          pts.push(`${x.toFixed(1)},${yy.toFixed(1)}`); shadowPts.push(`${(x+10).toFixed(1)},${(yy+10).toFixed(1)}`);
      }
      if(state.depth==="3d") out += `<polyline points="${shadowPts.join(" ")}" fill="none" stroke="${shadowColor}" stroke-width="${Math.max(9,w*.010*sizeFactor()).toFixed(1)}" stroke-linecap="round" opacity="0.4"/>`;
      out += `<polyline points="${pts.join(" ")}" fill="none" stroke="${j%2?p.light:p.a}" stroke-width="${Math.max(9,w*.010*sizeFactor()).toFixed(1)}" stroke-linecap="round" opacity="${(.8+j*.05).toFixed(2)}"/>`;
    }
    return out;
  }

  // ==========================================
  // INTELLIGENT ROUTING ENGINE
  // ==========================================
  function layoutByMode(index,w,h,p,rnd,id){
    const mode = state.designMode.toLowerCase();
    
    if (mode.includes('memphis') || mode.includes('playful') || mode.includes('retro')) return memphis(id,w,h,p,rnd);
    if (mode.includes('y2k') || mode.includes('cyber') || mode.includes('tech') || mode.includes('synthwave')) return cyberTopography(id,w,h,p,rnd);
    if (mode.includes('gradient') || mode.includes('iridescent') || mode.includes('holographic') || mode.includes('chromatic')) return gradientMesh(id,w,h,p,rnd);
    if (mode.includes('mandala') || mode.includes('sacred') || mode.includes('kaleidoscope') || mode.includes('radial') || mode.includes('ornament') || mode.includes('islamic') || mode.includes('moroccan')) return mandala(id,w,h,p,rnd);
    if (mode.includes('botanical') || mode.includes('floral') || mode.includes('leaf') || mode.includes('nature') || mode.includes('petal')) return petals(id,w,h,p,rnd);
    if (mode.includes('bubble')) return spheres(id,w,h,p,rnd);
    if (mode.includes('pattern') || mode.includes('halftone') || mode.includes('dot') || mode.includes('checkerboard') || mode.includes('grid')) return patternGrid(id,w,h,p,rnd, mode);
    if (mode.includes('liquid') || mode.includes('fluid') || mode.includes('ink') || mode.includes('paint') || mode.includes('splash')) return liquid(id,w,h,p,rnd);

    if (mode.includes('geometry') || mode.includes('geometric')) {
        if (mode.includes('cyan') || mode.includes('bold')) return sharpBeams(id,w,h,p,rnd,index);
        if (mode.includes('soft') || mode.includes('organic')) return liquid(id,w,h,p,rnd);
        return sharpBeams(id,w,h,p,rnd,index);
    }

    if (mode.includes('abstract')) {
        if (mode.includes('bold')) return sharpBeams(id,w,h,p,rnd,index);
        if (mode.includes('organic')) return petals(id,w,h,p,rnd);
        return waves(id,w,h,p,rnd);
    }

    return sharpBeams(id,w,h,p,rnd,index); // Default fallback
  }

  // ==========================================
  // TEXT & RENDERING
  // ==========================================
  function textLayer(id,index,w,h,p){
    const amount=Number(state.textAmount)/100;
    if(amount<=0) return "";
    
    const fill = index%4===1 ? "#e0e0e0" : "#ffffff";
    const fs = Math.max(18,Math.round(Math.min(w,h)*.026));
    const modeName = state.designMode.toUpperCase();

    if (state.designMode === "Cyan Geometric Editorial" || state.designMode === "sharpBeams") {
      const bigFs = Math.max(30, Math.round(Math.min(w,h)*0.09));
      const textColor = index%2 === 0 ? p.light : p.text;
      if (index % 5 === 0) {
        return `<g font-family="Arial, sans-serif" fill="${textColor}" opacity="${(.7+.3*amount).toFixed(2)}"><text x="${w*0.06}" y="${h*0.1}" font-size="${bigFs}" font-weight="900" letter-spacing="4">DESIGN</text><text x="${w*0.06}" y="${h*0.13}" font-size="${bigFs*0.2}" font-weight="400" letter-spacing="2">LOREM IPSUM DOLOR SIT AMET</text></g>`;
      } 
      else if (index % 5 === 2) {
        let textOut = `<g font-family="Arial, sans-serif" fill="${textColor}" opacity="${(.7+.3*amount).toFixed(2)}">`;
        "DESIGN".split("").forEach((c, i) => { textOut += `<text x="${w*0.06}" y="${h*0.12 + i*bigFs*1.05}" font-size="${bigFs}" font-weight="300">${c}</text>`; });
        textOut += `</g>`; return textOut;
      }
      return `<g font-family="Arial, sans-serif" fill="${textColor}" opacity="${(.7+.3*amount).toFixed(2)}"><text x="${w*0.06}" y="${h*0.1}" font-size="${bigFs*0.25}" font-weight="600" letter-spacing="4">ALI STUDIO // VIBRANT</text></g>`;
    }
    
    return `<g font-family="Arial, Helvetica, sans-serif" fill="${fill}" opacity="${(.68+.28*amount).toFixed(2)}">
      <text x="${(w*.08).toFixed(1)}" y="${(h*.10).toFixed(1)}" font-size="${fs}" font-weight="900" letter-spacing="${Math.max(2,fs*.18).toFixed(1)}">${esc(modeName)}</text>
      <text x="${(w*.08).toFixed(1)}" y="${(h*.13).toFixed(1)}" font-size="${Math.round(fs*.38)}" font-weight="600" letter-spacing="${Math.max(1,fs*.07).toFixed(1)}">DESIGN / ${String(index+1).padStart(2,"0")}</text>
      <text x="${(w*.08).toFixed(1)}" y="${(h*.92).toFixed(1)}" font-size="${Math.round(fs*.34)}" font-weight="800" letter-spacing="${Math.max(1,fs*.08).toFixed(1)}">ALI STUDIO / ${String(index+1).padStart(2,"0")}</text>
      <text x="${(w*.08).toFixed(1)}" y="${(h*.946).toFixed(1)}" font-size="${Math.round(fs*.25)}" font-weight="600" letter-spacing="${Math.max(1,fs*.055).toFixed(1)}">VIBRANT VECTOR SERIES</text>
    </g>`;
  }

  function makeSvg(index){
    const {w,h}=dims();
    const rnd=mulberry32((Number(state.seed)||1)+index*7919);
    const p=palette(index);
    const id=`ali_${Number(state.seed)||1}_${index}`;
    let out=commonDefs(id,p,rnd);
    out += `<rect width="${w}" height="${h}" fill="url(#${id}_bg)"/>`;
    out += layoutByMode(index,w,h,p,rnd,id);
    out = addLight(out,id,w,h,rnd,p);
    out += textLayer(id,index,w,h,p);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
      <title>ALI STUDIO — ${esc(state.theme)} ${state.depth === "3d" ? "3D" : "Flat"} Design ${String(index+1).padStart(2,"0")}</title>
      <metadata>Generated locally by ALI STUDIO. Clean Vibrant Vectors.</metadata>
      ${out}
    </svg>`;
  }

  function makeCombinedSvg(){
    const {w:pw,h:ph}=dims();
    const count=Number(state.posterCount), cols=Math.min(4,Math.max(1,count)), rows=Math.ceil(count/cols), gap=36;
    const aw=pw*cols+gap*(cols+1), ah=ph*rows+gap*(rows+1);
    let out=`<svg xmlns="http://www.w3.org/2000/svg" width="${aw}" height="${ah}" viewBox="0 0 ${aw} ${ah}">
      <title>ALI STUDIO — Vibrant Design Collection</title><rect width="${aw}" height="${ah}" fill="#e7e9f0"/>`;
    for(let i=0;i<count;i++){
      const x=gap+(i%cols)*(pw+gap), y=gap+Math.floor(i/cols)*(ph+gap);
      const svg=makeSvg(i).replace(/^<svg[^>]*>/,"").replace(/<\/svg>\s*$/i,"");
      out += `<g id="design_${String(i+1).padStart(2,"0")}" transform="translate(${x} ${y})">${svg}</g>`;
    }
    return out+"</svg>";
  }

  function download(filename,content,mime="image/svg+xml"){
    const blob=new Blob([content],{type:mime}), a=document.createElement("a");
    a.href=URL.createObjectURL(blob); a.download=filename; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  }

  async function copyText(text){
    try{await navigator.clipboard.writeText(text); alert("SVG copied to clipboard.");}
    catch{const ta=document.createElement("textarea");ta.value=text;document.body.appendChild(ta);ta.select();document.execCommand("copy");ta.remove();alert("SVG copied to clipboard.");}
  }

  function readControls(){
    ["posterCount","shapeSize","density","gradientSoftness","spacing","edgeFade","textAmount"].forEach(k=>state[k]=Number($(k).value));
    ["designMode","theme","format","quality","darkColor","lightColor","seed"].forEach(k=>state[k]=$(k).value);
    state.seed=Number(state.seed)||1;
    state.depth=document.querySelector(".segment.active")?.dataset.depth || state.depth;
  }

  function updateOutputs(){
    const map={posterCount:["posterCountVal",v=>v],shapeSize:["shapeSizeVal",v=>`${v}%`],density:["densityVal",v=>v],gradientSoftness:["gradientSoftnessVal",v=>`${v}%`],spacing:["spacingVal",v=>`${v}%`],edgeFade:["edgeFadeVal",v=>`${v}%`],textAmount:["textAmountVal",v=>`${v}%`]};
    Object.entries(map).forEach(([id,[oid,fn]])=>$(oid).textContent=fn($(id).value));
    $("collectionCount").textContent=$("posterCount").value;
    const modeLabel=$("designMode").selectedOptions[0]?.textContent || "VIBRANT GENERATOR";
    $("workspaceTitle").textContent=modeLabel.toUpperCase();
    $("statusMode").textContent=state.depth === "3d" ? "VECTOR SHADOW ENGINE" : "VIBRANT GENERATOR";
    $("statusText").textContent=state.depth === "3d" ? "Crisp offset geometric shadows enabled" : "Pure vector rendering";
  }

  function render(){
    readControls(); updateOutputs(); generated=[];
    const grid=$("posterGrid"); grid.innerHTML="";
    const tpl=$("posterTemplate");
    for(let i=0;i<state.posterCount;i++){
      const node=tpl.content.firstElementChild.cloneNode(true), svg=makeSvg(i);
      generated.push(svg);
      node.querySelector(".poster-number").textContent=`DESIGN ${String(i+1).padStart(2,"0")}`;
      node.querySelector(".poster-mode").textContent=`${state.depth.toUpperCase()} / ${String(i+1).padStart(2,"0")}`;
      node.querySelector(".poster-frame").innerHTML=svg;
      node.querySelector(".download-one").addEventListener("click",()=>download(`ali-studio-${state.theme}-${state.depth}-${String(i+1).padStart(2,"0")}.svg`,svg));
      node.querySelector(".copy-one").addEventListener("click",()=>copyText(svg));
      grid.appendChild(node);
    }
    grid.style.gridTemplateColumns=`repeat(${Math.min(4,state.posterCount)},minmax(0,1fr))`;
    applyZoom();
  }

  function applyZoom(){ 
      const grid = $("posterGrid");
      if (!grid) return;
      grid.style.transform = `scale(${zoom})`; 
      if($("zoomLabel")) $("zoomLabel").textContent = `${Math.round(zoom*100)}%`; 
      const originalHeight = grid.offsetHeight;
      const scaledHeight = originalHeight * zoom;
      const heightDifference = scaledHeight - originalHeight;
      grid.style.marginBottom = `${heightDifference > 0 ? heightDifference + 80 : 80}px`;
  }

  ["posterCount","designMode","theme","shapeSize","density","gradientSoftness","spacing","edgeFade","textAmount","seed","format","quality","darkColor","lightColor"].forEach(id=>{
    $(id).addEventListener("input",()=>{updateOutputs();render();});
    $(id).addEventListener("change",()=>{updateOutputs();render();});
  });

  document.querySelectorAll(".segment").forEach(btn=>btn.addEventListener("click",()=>{
    document.querySelectorAll(".segment").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active"); state.depth=btn.dataset.depth; updateOutputs(); render();
  }));

  $("regenerate").addEventListener("click",render);
  $("randomize").addEventListener("click",()=>{
    $("seed").value=Math.floor(Math.random()*99999999)+1;
    $("shapeSize").value=60+Math.floor(Math.random()*86);
    $("density").value=4+Math.floor(Math.random()*13);
    $("gradientSoftness").value=48+Math.floor(Math.random()*53);
    $("spacing").value=10+Math.floor(Math.random()*51);
    $("edgeFade").value=12+Math.floor(Math.random()*65);
    const themes=Object.keys(THEMES); $("theme").value=themes[Math.floor(Math.random()*themes.length)];
    updateOutputs(); render();
  });

  $("downloadAll").addEventListener("click",()=>download(`ali-studio-${state.theme}-${state.depth}-collection.svg`,makeCombinedSvg()));
  $("downloadJson").addEventListener("click",()=>download("ali-studio-settings.json",JSON.stringify(state,null,2),"application/json"));
  $("zoomIn").addEventListener("click",()=>{zoom=clamp(zoom+.1,.5,1.8);applyZoom();});
  $("zoomOut").addEventListener("click",()=>{zoom=clamp(zoom-.1,.5,1.8);applyZoom();});

  updateOutputs(); render();
})();
