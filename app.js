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

  // New Amber Theme perfectly matching the reference image
  const THEMES = {
    amberGlow: { bg:"#F4E7DA", dark:"#CD241E", mid:"#F05023", a:"#FF9A26", light:"#FFF171", text:"#ffffff" },
    roseGold:  { bg:"#F5E8EB", dark:"#962A4E", mid:"#D44C6A", a:"#F28C8C", light:"#FFE3DF", text:"#ffffff" },
    cyberPink: { bg:"#EBDDF2", dark:"#73105C", mid:"#B51B78", a:"#E843A1", light:"#FF9EF1", text:"#ffffff" }
  };

  const state = {
    posterCount:5, designMode:"amberVolume", theme:"amberGlow", depth:"flat",
    density:8, seed:260831, format:"portrait", quality:"large", 
    darkColor:"#CD241E", lightColor:"#FFF171"
  };

  let generated = [], zoom = 1;

  function dims(){
    const base = {portrait:{w:1200,h:1600},square:{w:1600,h:1600},landscape:{w:1800,h:1200}}[state.format] || {w:1200,h:1600};
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

  function palette(index){
    const base = THEMES[state.theme] || THEMES.amberGlow;
    const themeKeys = Object.keys(THEMES);
    const shift = (Math.floor((Number(state.seed)||1)/17) + index * 3) % themeKeys.length;
    const alt = THEMES[themeKeys[shift]];
    const tint = ((index * 0.17) % 0.75);
    return {
      bg: base.bg,
      dark: state.darkColor || mixHex(base.dark, alt.dark, tint * .2),
      mid: mixHex(base.mid, alt.mid, tint),
      a: mixHex(base.a, alt.a, (tint + .12) % 1),
      light: state.lightColor || mixHex(base.light, alt.light, tint * .35),
      text: base.text
    };
  }

  // ==========================================
  // PURE VECTOR 3D GRADIENTS
  // Generates perfect luminous volume with zero SVG filters
  // ==========================================
  function commonDefs(id,p,rnd){
    return `<defs>
      <!-- Base Canvas Fade -->
      <linearGradient id="${id}_bgFade" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${p.bg}"/>
        <stop offset="100%" stop-color="${mixHex(p.bg, p.mid, 0.15)}"/>
      </linearGradient>

      <!-- 3D Orb Radial Gradient (Offset highlight simulates sphere lighting) -->
      <radialGradient id="${id}_orbGrad" cx="35%" cy="30%" r="70%">
        <stop offset="0%" stop-color="${p.light}"/>
        <stop offset="35%" stop-color="${p.a}"/>
        <stop offset="70%" stop-color="${p.mid}"/>
        <stop offset="100%" stop-color="${p.dark}"/>
      </radialGradient>

      <!-- 3D Pill/Tube Gradient (Vertical fade for cylindrical lighting) -->
      <linearGradient id="${id}_pillGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${p.light}"/>
        <stop offset="30%" stop-color="${p.a}"/>
        <stop offset="70%" stop-color="${p.mid}"/>
        <stop offset="100%" stop-color="${p.dark}"/>
      </linearGradient>
      
      <!-- Folded Ribbon Gradient (Sweeping 3D fold lighting) -->
      <linearGradient id="${id}_ribbonGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${p.light}"/>
        <stop offset="40%" stop-color="${p.a}"/>
        <stop offset="100%" stop-color="${p.mid}"/>
      </linearGradient>
      <linearGradient id="${id}_ribbonGrad2" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${p.mid}"/>
        <stop offset="60%" stop-color="${p.dark}"/>
        <stop offset="100%" stop-color="${p.dark}"/>
      </linearGradient>
    </defs>`;
  }

  // ==========================================
  // REFERENCE IMAGE LAYOUT REPLICATOR: Amber Volume
  // ==========================================
  function amberVolume(id,w,h,p,rnd,index) {
    let out = `<rect width="${w}" height="${h}" fill="url(#${id}_bgFade)"/>`;

    if (index % 5 === 0) {
        // POSTER 1: Stacked Pills/Discs
        // Standing petals (Top Left)
        let standing = 3;
        for(let i=0; i<standing; i++){
            let cx = w*(0.2 + i*0.2); 
            let cy = h*0.25;
            let rx = w*0.1; let ry = h*0.25;
            let rot = -15 + i*15;
            out += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${cx} ${cy})" fill="url(#${id}_orbGrad)" />`;
        }

        // Stacked flat discs (Bottom)
        let discs = 3;
        for(let i=0; i<discs; i++){
            let cx = w*0.5;
            let cy = h*(0.55 + i*0.15);
            let rx = w*0.42; let ry = h*0.12;
            out += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#${id}_pillGrad)" />`;
        }
        return out;
    }
    else if (index % 5 === 1) {
        // POSTER 2: 6 Columns Grid
        let cols = 3; let rows = 2;
        let pW = w * 0.22; let pH = h * 0.38;
        let gapX = (w - (cols * pW)) / 4;
        let gapY = h * 0.08;
        
        for(let r=0; r<rows; r++){
            for(let c=0; c<cols; c++){
                let x = gapX + c*(pW + gapX);
                let y = h*0.08 + r*(pH + gapY);
                out += `<rect x="${x}" y="${y}" width="${pW}" height="${pH}" rx="${w*0.05}" fill="url(#${id}_pillGrad)" />`;
            }
        }
        return out;
    }
    else if (index % 5 === 2) {
        // POSTER 3: Giant Edge Orbs
        out += `<circle cx="${w*0.2}" cy="${h*0.3}" r="${w*0.4}" fill="url(#${id}_orbGrad)" />`;
        out += `<circle cx="${w*0.8}" cy="${h*0.1}" r="${w*0.3}" fill="url(#${id}_orbGrad)" />`;
        out += `<circle cx="${w*0.65}" cy="${h*0.8}" r="${w*0.6}" fill="url(#${id}_orbGrad)" />`;
        return out;
    }
    else if (index % 5 === 3) {
        // POSTER 4: Fluid Twisting Wave/Ribbon
        // Recreated using solid overlapping vector paths and gradients to simulate the twist
        
        // Background sweeping shadow tail
        let path1 = `M ${w*0.2},${h} C ${w*0.4},${h*0.8} ${w*0.3},${h*0.6} ${w*0.5},${h*0.4} C ${w*0.7},${h*0.2} ${w*0.8},${-h*0.1} ${w*1.2},${-h*0.1} L ${w},${h} Z`;
        out += `<path d="${path1}" fill="url(#${id}_ribbonGrad2)" opacity="0.6"/>`;
        
        // Foreground sweeping glowing wave
        let path2 = `M ${-w*0.2},${h*1.2} C ${w*0.8},${h*0.9} ${w*0.5},${h*0.5} ${w*0.6},${h*0.3} C ${w*0.7},${h*0.1} ${w*0.9},${0} ${w*1.2},${-h*0.2} L ${w*0.6},${-h*0.2} C ${w*0.4},${h*0.2} ${w*0.3},${h*0.5} ${-w*0.4},${h*1.2} Z`;
        out += `<path d="${path2}" fill="url(#${id}_ribbonGrad1)" />`;

        return out;
    }
    else {
        // POSTER 5: Central Orb Cluster
        let cluster = Math.max(7, Math.floor(Number(state.density)));
        
        // Background Orbs
        for(let i=0; i<cluster; i++){
            let cx = w * (0.25 + rnd()*0.5);
            let cy = h * (0.2 + rnd()*0.6);
            let r = w * (0.2 + rnd()*0.15);
            out += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${id}_orbGrad)" />`;
        }
        
        // Foreground hero orbs
        out += `<circle cx="${w*0.3}" cy="${h*0.4}" r="${w*0.28}" fill="url(#${id}_orbGrad)" />`;
        out += `<circle cx="${w*0.7}" cy="${h*0.6}" r="${w*0.25}" fill="url(#${id}_orbGrad)" />`;
        out += `<circle cx="${w*0.5}" cy="${h*0.5}" r="${w*0.32}" fill="url(#${id}_orbGrad)" />`;

        return out;
    }
  }

  // ==========================================
  // TYPOGRAPHY (Matches Reference Image)
  // ==========================================
  function textLayer(id,index,w,h,p){
    const fill = p.text;
    const fs = Math.max(22, Math.round(Math.min(w,h)*0.035));
    const smallFs = Math.max(12, Math.round(fs*0.4));
    const tinyFs = Math.max(9, Math.round(fs*0.25));
    
    let textOut = `<g font-family="Arial, Helvetica, sans-serif" fill="${fill}" opacity="0.9">`;

    if (index % 5 === 0) {
        textOut += `<text x="${w*0.5}" y="${h*0.88}" font-size="${fs*0.8}" font-weight="600" letter-spacing="4" text-anchor="middle">INSPIRATION</text>`;
        textOut += `<text x="${w*0.5}" y="${h*0.9}" font-size="${tinyFs}" font-weight="400" letter-spacing="1" text-anchor="middle" opacity="0.6">CREATIVE DESIGN SYSTEM</text>`;
    }
    else if (index % 5 === 1) {
        textOut += `<text x="${w*0.08}" y="${h*0.1}" font-size="${smallFs*1.2}" font-weight="800" letter-spacing="1">ABSTRACT</text>`;
        textOut += `<text x="${w*0.08}" y="${h*0.12}" font-size="${smallFs*1.2}" font-weight="800" letter-spacing="1">POSTER</text>`;
        
        textOut += `<text x="${w*0.92}" y="${h*0.9}" font-size="${smallFs*1.2}" font-weight="800" text-anchor="end">01 <tspan font-weight="400" font-size="${smallFs}">TEMPLATE</tspan></text>`;
    }
    else if (index % 5 === 2) {
        textOut += `<text x="${w*0.9}" y="${h*0.1}" font-size="${smallFs}" font-weight="600" letter-spacing="2" transform="rotate(90 ${w*0.9} ${h*0.1})">GRADIENT DESIGN</text>`;
        
        textOut += `<text x="${w*0.1}" y="${h*0.25}" font-size="${tinyFs}" opacity="0.7">Lorem ipsum dolor</text>`;
        textOut += `<text x="${w*0.1}" y="${h*0.265}" font-size="${tinyFs}" opacity="0.7">sit amet consetur.</text>`;

        textOut += `<text x="${w*0.1}" y="${h*0.45}" font-size="${tinyFs}" opacity="0.7">Lorem ipsum dolor</text>`;
        textOut += `<text x="${w*0.1}" y="${h*0.465}" font-size="${tinyFs}" opacity="0.7">sit amet consetur.</text>`;

        textOut += `<text x="${w*0.1}" y="${h*0.85}" font-size="${fs*0.8}" font-weight="800" letter-spacing="1">ABSTRACT</text>`;
        textOut += `<text x="${w*0.1}" y="${h*0.88}" font-size="${fs*0.8}" font-weight="800" letter-spacing="1">POSTER</text>`;
    }
    else if (index % 5 === 3) {
        textOut += `<text x="${w*0.1}" y="${h*0.15}" font-size="${smallFs*1.2}" font-weight="800" letter-spacing="2">INSPIRATION</text>`;
        textOut += `<text x="${w*0.1}" y="${h*0.18}" font-size="${tinyFs}" font-weight="400" letter-spacing="1" opacity="0.7">LOREM IPSUM</text>`;
        textOut += `<text x="${w*0.1}" y="${h*0.195}" font-size="${tinyFs}" font-weight="400" letter-spacing="1" opacity="0.7">DOLOR SIT AMET</text>`;
    }
    else if (index % 5 === 4) {
        textOut += `<text x="${w*0.5}" y="${h*0.5}" font-size="${smallFs*1.4}" font-weight="400" letter-spacing="1" text-anchor="middle">Design Inspiration</text>`;
    }

    textOut += `</g>`;
    return textOut;
  }

  // ==========================================
  // COMPILATION ENGINE
  // ==========================================
  function layoutByMode(index,w,h,p,rnd,id){
    return amberVolume(id,w,h,p,rnd,index);
  }

  function makeSvg(index){
    const {w,h}=dims();
    const rnd=mulberry32((Number(state.seed)||1)+index*7919);
    const p=palette(index);
    const id=`ali_${Number(state.seed)||1}_${index}`;
    
    let out=commonDefs(id,p,rnd);
    out += layoutByMode(index,w,h,p,rnd,id);
    out += textLayer(id,index,w,h,p);
    
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
      <title>ALI STUDIO — Amber Volume Design ${String(index+1).padStart(2,"0")}</title>
      <metadata>Generated locally by ALI STUDIO. Pure Vector Graphics.</metadata>
      ${out}
    </svg>`;
  }

  function makeCombinedSvg(){
    const {w:pw,h:ph}=dims();
    const count=Number(state.posterCount), cols=Math.min(5,Math.max(1,count)), rows=Math.ceil(count/cols), gap=36;
    const aw=pw*cols+gap*(cols+1), ah=ph*rows+gap*(rows+1);
    let out=`<svg xmlns="http://www.w3.org/2000/svg" width="${aw}" height="${ah}" viewBox="0 0 ${aw} ${ah}">
      <title>ALI STUDIO — Amber Volume Collection</title><rect width="${aw}" height="${ah}" fill="#111"/>`;
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
    ["posterCount","density"].forEach(k=>{if($(k))state[k]=Number($(k).value)});
    ["theme","format","quality","darkColor","lightColor","seed"].forEach(k=>{if($(k))state[k]=$(k).value});
    state.seed=Number(state.seed)||1;
  }

  function updateOutputs(){
    const map={posterCount:["posterCountVal",v=>v],density:["densityVal",v=>v]};
    Object.entries(map).forEach(([id,[oid,fn]])=>{if($(oid) && $(id)) $(oid).textContent=fn($(id).value)});
    if($("collectionCount") && $("posterCount")) $("collectionCount").textContent=$("posterCount").value;
  }

  function render(){
    readControls(); updateOutputs(); generated=[];
    const grid=$("posterGrid"); 
    if(!grid) return;
    grid.innerHTML="";
    const tpl=$("posterTemplate");
    if(!tpl) return;
    
    let maxCols = Math.min(5, state.posterCount);

    for(let i=0;i<state.posterCount;i++){
      const node=tpl.content.firstElementChild.cloneNode(true), svg=makeSvg(i);
      generated.push(svg);
      const num = node.querySelector(".poster-number");
      const mode = node.querySelector(".poster-mode");
      const frame = node.querySelector(".poster-frame");
      const dBtn = node.querySelector(".download-one");
      const cBtn = node.querySelector(".copy-one");
      
      if(num) num.textContent=`DESIGN ${String(i+1).padStart(2,"0")}`;
      if(mode) mode.textContent=`VOLUME / ${String((i%5)+1).padStart(2,"0")}`;
      if(frame) frame.innerHTML=svg;
      if(dBtn) dBtn.addEventListener("click",()=>download(`ali-studio-amber-${String(i+1).padStart(2,"0")}.svg`,svg));
      if(cBtn) cBtn.addEventListener("click",()=>copyText(svg));
      grid.appendChild(node);
    }
    grid.style.gridTemplateColumns=`repeat(${maxCols},minmax(0,1fr))`;
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

  ["posterCount","density","seed","format","quality","darkColor","lightColor"].forEach(id=>{
    let el = $(id);
    if(el){
        el.addEventListener("input",()=>{updateOutputs();render();});
        el.addEventListener("change",()=>{updateOutputs();render();});
    }
  });

  if($("regenerate")) $("regenerate").addEventListener("click",render);
  if($("randomize")) {
      $("randomize").addEventListener("click",()=>{
        if($("seed")) $("seed").value=Math.floor(Math.random()*99999999)+1;
        if($("density")) $("density").value=5+Math.floor(Math.random()*15);
        updateOutputs(); render();
      });
  }

  if($("downloadAll")) $("downloadAll").addEventListener("click",()=>download(`ali-studio-amber-collection.svg`,makeCombinedSvg()));
  if($("downloadJson")) $("downloadJson").addEventListener("click",()=>download("ali-studio-settings.json",JSON.stringify(state,null,2),"application/json"));
  if($("zoomIn")) $("zoomIn").addEventListener("click",()=>{zoom=clamp(zoom+.1,.4,1.8);applyZoom();});
  if($("zoomOut")) $("zoomOut").addEventListener("click",()=>{zoom=clamp(zoom-.1,.4,1.8);applyZoom();});

  updateOutputs(); render();
})();
