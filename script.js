(() => {
  "use strict";

  const $ = id => document.getElementById(id);
  const clamp = (n,a,b) => Math.max(a, Math.min(b,n));
  const mulberry32 = a => () => {
    let t = a += 0x6D2B79F5; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
  const TAU = Math.PI * 2;

  // ----------------------------------------------------
  // EXPERT COLOR PALETTES
  // ----------------------------------------------------
  const THEMES = {
    // New Optical Art Palettes
    inkMinimal:  { bg:"#F7F7F9", dark:"#182347", mid:"#263a73", a:"#3d5cba", light:"#ffffff", text:"#182347" },
    blueprint:   { bg:"#182347", dark:"#ffffff", mid:"#a2b5e8", a:"#6886db", light:"#0e152e", text:"#ffffff" },
    
    // Core Engine Palettes
    amberVolume: { bg:"#F4E7DA", dark:"#CD241E", mid:"#F05023", a:"#FF9A26", light:"#FFF171", text:"#ffffff" },
    midnightIce: { bg:"#010205", dark:"#050811", mid:"#0a1845", a:"#1d3c94", light:"#83c5f7", text:"#ffffff" },
    swissGrid:   { bg:"#EBEBEB", dark:"#111111", mid:"#D33F49", a:"#264653", light:"#FFFFFF", text:"#111111" },
    holoFold:    { bg:"#f0f0f0", dark:"#1c033b", mid:"#f093fb", a:"#00f2fe", light:"#ffe259", text:"#ffffff" },
    retroHalftone:{ bg:"#12376e", dark:"#e3242b", mid:"#f24148", a:"#31a868", light:"#e3f1e8", text:"#ffffff" },
    fluidAura:   { bg:"#020b1c", dark:"#0a245c", mid:"#1f4fb8", a:"#4785ff", light:"#ffffff", text:"#ffffff" },
    
    // Christmas / Winter
    xmasClassic: { bg:"#0B2B1E", dark:"#1A070A", mid:"#C21B27", a:"#E8A023", light:"#F5E6CD", text:"#ffffff" },
    xmasFrost:   { bg:"#051524", dark:"#020A12", mid:"#2C74B3", a:"#90C6E3", light:"#E6F4F1", text:"#ffffff" },
    
    // Fallbacks
    monochrome:  { bg:"#ffffff", dark:"#0a0a0a", mid:"#333333", a:"#888888", light:"#dddddd", text:"#111111" },
    crimson:     { bg:"#1a0505", dark:"#3b0909", mid:"#8c1313", a:"#d42626", light:"#f5b5b5", text:"#ffffff" }
  };

  const state = { posterCount:4, designMode:"opArtWireframe", theme:"curated", density:8, seed:260831, format:"portrait", quality:"large" };
  let generated = [], zoom = 1;

  function dims(){
    const base = {portrait:{w:1200,h:1600},square:{w:1600,h:1600},landscape:{w:1800,h:1200}}[state.format] || {w:1200,h:1600};
    const q = {standard:1,large:1.35,xl:1.8}[state.quality] || 1.35;
    return {w:Math.round(base.w*q),h:Math.round(base.h*q)};
  }

  function getDefs(id, p) {
      return `<defs>
        <linearGradient id="${id}_L1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${p.light}"/><stop offset="100%" stop-color="${p.dark}"/></linearGradient>
        <linearGradient id="${id}_L2" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stop-color="${p.a}"/><stop offset="100%" stop-color="${p.mid}"/></linearGradient>
        
        <radialGradient id="${id}_V1" cx="30%" cy="30%" r="70%">
            <stop offset="0%" stop-color="${p.light}"/><stop offset="40%" stop-color="${p.mid}"/><stop offset="100%" stop-color="${p.dark}"/>
        </radialGradient>
        <radialGradient id="${id}_V2" cx="70%" cy="30%" r="70%">
            <stop offset="0%" stop-color="${p.light}"/><stop offset="50%" stop-color="${p.a}"/><stop offset="100%" stop-color="${p.dark}"/>
        </radialGradient>
      </defs>`;
  }

  // ==========================================
  // NEW ENGINE: OPTICAL LINE ART (Op-Art)
  // Perfectly mathematical loops forming complex 3D illusions. No gradients, pure lines.
  // ==========================================
  function renderOpArtWireframe(w, h, p, id, rnd, i) {
      let out = `<rect width="${w}" height="${h}" fill="${p.bg}"/>`;
      
      const strokeColor = p.dark;
      
      if (i % 5 === 0) {
          // 01. The Spindle / 3D Torus Twist
          let lines = Math.max(30, Math.floor(state.density * 5));
          for(let j=0; j<lines; j++) {
              let t = j/lines;
              let rot = t * 360;
              // Oscillating radius creates the twisted shell look
              let rx = w*0.15 + Math.sin(t*TAU)*w*0.08;
              let ry = h*0.35;
              out += `<ellipse cx="${w/2}" cy="${h/2}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${w/2} ${h/2})" fill="none" stroke="${strokeColor}" stroke-width="${Math.max(1, w*0.002)}"/>`;
          }
      } 
      else if (i % 5 === 1) {
          // 02. The Hourglass / Ruled Surface Plane
          let lines = Math.max(30, Math.floor(state.density * 4));
          for(let j=0; j<=lines; j++) {
              let t = j/lines;
              let xTop = w*0.1 + t*w*0.8;
              let xBot = w*0.9 - t*w*0.8; // Reverse connection creates the twist
              out += `<line x1="${xTop}" y1="${h*0.15}" x2="${xBot}" y2="${h*0.85}" stroke="${strokeColor}" stroke-width="${Math.max(1.5, w*0.002)}"/>`;
          }
      }
      else if (i % 5 === 2) {
          // 03. Clipped Diamond Wave
          let lines = Math.max(30, Math.floor(state.density * 4));
          
          // Solid geometric anchor
          out += `<polygon points="${w/2},${h*0.6} ${w*0.8},${h*0.8} ${w/2},${h} ${w*0.2},${h*0.8}" fill="${strokeColor}"/>`;
          
          // Intersecting horizontal wave lengths forming a top diamond
          for(let j=0; j<=lines; j++) {
              let t = j/lines;
              let y = h*0.1 + t*h*0.45;
              let dist = Math.abs(t - 0.5) * 2; // Distance from vertical center (0 to 1)
              let width = (1 - dist) * w*0.35; // Maximum width at center
              out += `<line x1="${w/2 - width}" y1="${y}" x2="${w/2 + width}" y2="${y}" stroke="${strokeColor}" stroke-width="${Math.max(2, h*0.003)}"/>`;
          }
      }
      else if (i % 5 === 3) {
          // 04. Concentric Pill / Stadium Tunnel
          let lines = Math.max(15, Math.floor(state.density * 2));
          for(let j=0; j<lines; j++) {
              let t = j/(lines-1); // 0 to 1
              let width = w*0.85 - t*w*0.8; // Shrinks inwards
              let height = h*0.4 - t*h*0.38; 
              let rx = height/2; // Perfect semi-circle ends
              out += `<rect x="${w/2 - width/2}" y="${h/2 - height/2}" width="${width}" height="${height}" rx="${rx}" fill="none" stroke="${strokeColor}" stroke-width="${Math.max(2, w*0.003)}"/>`;
          }
      }
      else {
          // 05. Phase-Shifted Vertical Grid
          let lines = Math.max(20, Math.floor(state.density * 3));
          for(let j=0; j<=lines; j++) {
              let t = j/lines;
              let x = w*0.15 + t*w*0.7;
              
              // Background thin tracking line
              out += `<line x1="${x}" y1="${h*0.2}" x2="${x}" y2="${h*0.8}" stroke="${strokeColor}" stroke-width="${Math.max(1, w*0.001)}" opacity="0.25"/>`;
              
              // Foreground thick modulated line (Sine wave offset)
              let yCenter = h*0.5 + Math.sin(t * TAU * 1.5) * h*0.15;
              let segHeight = h*0.25;
              out += `<line x1="${x}" y1="${yCenter - segHeight/2}" x2="${x}" y2="${yCenter + segHeight/2}" stroke="${strokeColor}" stroke-width="${Math.max(3, w*0.006)}"/>`;
          }
      }
      return out;
  }

  // ==========================================
  // EXISTING PREMIUM ENGINES (Condensed)
  // ==========================================
  function renderAmberVolume(w,h,p,id,rnd,i) {
      let out = `<rect width="${w}" height="${h}" fill="${p.bg}"/>`;
      let s = Math.max(0.5, state.density / 8);
      if(i%3===0) {
          for(let j=0; j<4; j++) out += `<rect x="${w*0.1}" y="${h*(0.2+j*0.15)}" width="${w*0.8}" height="${h*0.1}" rx="${h*0.05}" fill="url(#${id}_V1)"/>`;
          out += `<circle cx="${w*0.5}" cy="${h*0.8}" r="${w*0.25}" fill="url(#${id}_V2)"/>`;
      } else if (i%3===1) {
          for(let j=0; j<10; j++) out += `<circle cx="${w*(0.1+rnd()*0.8)}" cy="${h*(0.1+rnd()*0.8)}" r="${w*(0.1+rnd()*0.2)*s}" fill="url(#${id}_V1)"/>`;
      } else {
          out += `<ellipse cx="${w*0.3}" cy="${h*0.3}" rx="${w*0.5}" ry="${h*0.5}" fill="url(#${id}_V1)"/>`;
          out += `<ellipse cx="${w*0.8}" cy="${h*0.8}" rx="${w*0.4}" ry="${h*0.4}" fill="url(#${id}_V2)"/>`;
      }
      return out;
  }

  function renderMidnightIce(w,h,p,id,rnd,i) {
      let out = `<rect width="${w}" height="${h}" fill="${p.dark}"/>`;
      if(i%3===0) {
          out += `<ellipse cx="${w*0.5}" cy="${h*0.8}" rx="${w*1.5}" ry="${h*0.4}" fill="url(#${id}_L1)" />`;
      } else if(i%3===1) {
          for(let j=0; j<8; j++) out += `<rect x="${w*0.1 + j*(w*0.11)}" y="${h*(0.05+(j%2)*0.05)}" width="${w*0.06}" height="${h*0.9}" fill="url(#${id}_L2)" />`;
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

  function renderHolidayTrees(w,h,p,id,rnd,i) {
      let out = `<rect width="${w}" height="${h}" fill="${p.bg}"/>`;
      const drawTree = (cx, cy, scale) => {
          let t = "";
          for(let j=0; j<3; j++) {
              let tw = w * (0.25 + j*0.1) * scale, ty = cy + j*(h*0.15*scale), th = h*0.25*scale;
              t += `<polygon points="${cx},${ty} ${cx-tw},${ty+th} ${cx},${ty+th}" fill="url(#${id}_V1)"/>`;
              t += `<polygon points="${cx},${ty} ${cx+tw},${ty+th} ${cx},${ty+th}" fill="url(#${id}_L2)"/>`;
          }
          return t;
      };
      if(i%2===0) { out += drawTree(w*0.5, h*0.25, 1); } 
      else { out += drawTree(w*0.3, h*0.4, 0.7); out += drawTree(w*0.7, h*0.5, 0.6); }
      return out;
  }

  // ==========================================
  // TYPOGRAPHY & GRIDS (Editorial Alignment)
  // ==========================================
  function textLayer(mode, w, h, p, i){
    const col = w / 12; 
    const fs = Math.max(24, Math.round(Math.min(w,h)*0.04));
    const textColor = p.text;
    
    let t = `<g font-family="system-ui, -apple-system, sans-serif" fill="${textColor}">`;

    if (mode === "opArtWireframe") {
        t += `<text x="${w/2}" y="${h*0.1}" font-size="${fs*0.8}" font-weight="800" letter-spacing="4" text-anchor="middle">OPTICAL LINE ART</text>`;
        t += `<text x="${w/2}" y="${h*0.95}" font-size="${fs*0.4}" font-weight="600" opacity="0.6" text-anchor="middle">MATHEMATICAL VECTOR MATRICES</text>`;
    } else {
        let title = mode.replace(/([A-Z])/g, ' $1').toUpperCase().trim();
        t += `<text x="${col}" y="${h*0.1}" font-size="${fs}" font-weight="900" letter-spacing="2">${title}</text>`;
        t += `<text x="${col}" y="${h*0.1 + fs*1.2}" font-size="${fs*0.4}" font-weight="600" opacity="0.7">VOL. ${String(i+1).padStart(2,"0")} / GEOMETRIC SYSTEM</text>`;
        t += `<text x="${w - col}" y="${h - h*0.05}" font-size="${fs*0.3}" font-weight="600" opacity="0.5" text-anchor="end">ALI STUDIO / ${String(i+1).padStart(2,"0")}</text>`;
    }
    return t + `</g>`;
  }

  // ==========================================
  // MASTER ROUTER
  // ==========================================
  function makeSvg(index){
    const {w,h}=dims();
    const rnd=mulberry32((Number(state.seed)||1)+index*7919);
    
    const mode = state.designMode;
    let themeKey = state.theme;
    
    // Auto-curated logic
    if(themeKey === "curated") {
        if(mode === "opArtWireframe") themeKey = "inkMinimal";
        else if(mode.includes("xmas")) themeKey = "xmasClassic";
        else themeKey = mode;
    }
    
    const p = THEMES[themeKey] || THEMES.amberVolume;
    const id = `ali_${state.seed}_${index}`;
    
    let out = getDefs(id, p);
    
    if (mode === "opArtWireframe")     out += renderOpArtWireframe(w, h, p, id, rnd, index);
    else if (mode === "xmasScandiTree") out += renderHolidayTrees(w, h, p, id, rnd, index);
    else if (mode === "midnightIce")   out += renderMidnightIce(w, h, p, id, rnd, index);
    else out += renderAmberVolume(w, h, p, id, rnd, index); // Fallback

    out += textLayer(mode, w, h, p, index);
    
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
      <title>ALI STUDIO 3.0 — ${mode} ${String(index+1).padStart(2,"0")}</title>
      ${out}
    </svg>`;
  }

  // ==========================================
  // SYSTEM ARCHITECTURE
  // ==========================================
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
    if(dMode && $("workspaceTitle")) $("workspaceTitle").textContent = (dMode.options[dMode.selectedIndex].text).replace(/^[0-9✦]+\.\s*/, '').toUpperCase();
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
          if(modeTxt) modeTxt.textContent=`VECTOR / 0${(i%5)+1}`;
          if(frame) frame.innerHTML=svg;
          if(dBtn) dBtn.addEventListener("click",()=>download(`ali-studio-${state.designMode}-${String(i+1).padStart(2,"0")}.svg`,svg));
          
          grid.appendChild(node);
        }
        grid.style.gridTemplateColumns=`repeat(${maxCols},minmax(0,1fr))`;
        applyZoom();
    } catch (e) { console.error("Render error:", e); }
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
