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

  // New Obsidian Theme perfectly matching the reference
  const THEMES = {
    obsidianBlue: { dark:"#050811", mid:"#0a1845", a:"#1d3c94", b:"#3a75c4", light:"#83c5f7", text:"#ffffff" },
    obsidianGold: { dark:"#110a05", mid:"#452a0a", a:"#94601d", b:"#c48b3a", light:"#f7da83", text:"#ffffff" },
    obsidianCrimson:{ dark:"#110508", mid:"#450a18", a:"#941d3c", b:"#c43a60", light:"#f7839e", text:"#ffffff" }
  };

  const state = {
    posterCount:5, designMode:"midnightIce", theme:"obsidianBlue", depth:"flat",
    density:8, seed:260831, format:"portrait", quality:"large", 
    darkColor:"#050811", lightColor:"#c3e8ff"
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
    const base = THEMES[state.theme] || THEMES.obsidianBlue;
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
      text: base.text
    };
  }

  // ==========================================
  // PURE VECTOR 3D GRADIENTS
  // Generates perfect metallic volume with zero SVG filters
  // ==========================================
  function commonDefs(id,p,rnd){
    return `<defs>
      <!-- Horizon Planet Gradient -->
      <linearGradient id="${id}_horizon" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${p.light}"/>
        <stop offset="20%" stop-color="${p.b}"/>
        <stop offset="60%" stop-color="${p.mid}"/>
        <stop offset="100%" stop-color="${p.dark}"/>
      </linearGradient>

      <!-- Vertical Metallic Bar Gradient -->
      <linearGradient id="${id}_bar" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${p.dark}"/>
        <stop offset="15%" stop-color="${p.mid}"/>
        <stop offset="40%" stop-color="${p.light}"/>
        <stop offset="60%" stop-color="${p.b}"/>
        <stop offset="85%" stop-color="${p.a}"/>
        <stop offset="100%" stop-color="${p.dark}"/>
      </linearGradient>

      <!-- Sweeping Ribbon Gradient -->
      <linearGradient id="${id}_ribbon" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${p.dark}"/>
        <stop offset="30%" stop-color="${p.b}"/>
        <stop offset="70%" stop-color="${p.light}"/>
        <stop offset="100%" stop-color="${p.a}"/>
      </linearGradient>

      <!-- Background Fades for Poster 4 -->
      <linearGradient id="${id}_fadeDown" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${p.light}"/>
        <stop offset="30%" stop-color="${p.b}"/>
        <stop offset="100%" stop-color="#020308"/>
      </linearGradient>
      <linearGradient id="${id}_fadeUp" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#020308"/>
        <stop offset="40%" stop-color="${p.a}"/>
        <stop offset="100%" stop-color="${p.mid}"/>
      </linearGradient>

      <!-- 3D Fan Gradients for Poster 5 -->
      <linearGradient id="${id}_fanFace" x1="0%" y1="50%" x2="100%" y2="50%">
        <stop offset="0%" stop-color="${p.light}"/>
        <stop offset="50%" stop-color="${p.b}"/>
        <stop offset="100%" stop-color="${p.mid}"/>
      </linearGradient>
      <linearGradient id="${id}_fanShadow" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${p.mid}"/>
        <stop offset="100%" stop-color="${p.dark}"/>
      </linearGradient>
    </defs>`;
  }

  // ==========================================
  // REFERENCE IMAGE LAYOUT REPLICATOR: Midnight Ice
  // ==========================================
  function midnightIce(id,w,h,p,rnd,index) {
    let out = `<rect width="${w}" height="${h}" fill="${p.dark}"/>`;

    if (index % 5 === 0) {
        // POSTER 1: GLOWING HORIZONS
        // Massive smooth intersecting planetary curves
        out += `<ellipse cx="${w*0.5}" cy="${h*0.75}" rx="${w*1.5}" ry="${h*0.4}" fill="url(#${id}_horizon)" />`;
        out += `<ellipse cx="${w*0.3}" cy="${h*1.1}" rx="${w*1.5}" ry="${h*0.4}" fill="url(#${id}_horizon)" />`;
        return out;
    }
    else if (index % 5 === 1) {
        // POSTER 2: METALLIC BARS
        // Vertical bars fading precisely into the dark background
        let barsCount = 7;
        let barW = w / (barsCount * 1.6);
        let totalW = barsCount * barW;
        let gap = (w - totalW) / (barsCount + 1);

        for(let i=0; i<barsCount; i++) {
           let x = gap + i*(barW + gap);
           // Alternate vertical placement to give rhythm
           let y = (i%2===0) ? h*0.1 : h*0.05;
           let bh = (i%2===0) ? h*0.8 : h*0.9;
           out += `<rect x="${x}" y="${y}" width="${barW}" height="${bh}" fill="url(#${id}_bar)" />`;
        }
        return out;
    }
    else if (index % 5 === 2) {
        // POSTER 3: SWEEPING RIBBONS
        // Diagonal overlapping ribbons originating from bottom-left
        let ribbonsCount = Math.max(10, Math.floor(Number(state.density)*1.5));
        for(let i=0; i<ribbonsCount; i++) {
            // Stack them from top-left downwards
            let startY = h - (i * (h*0.6/ribbonsCount));
            let endX = w; 
            let endY = h - (i * (h*0.9/ribbonsCount));
            
            // Bezier curve controls
            let cx1 = w*0.2; let cy1 = startY;
            let cx2 = w*0.6; let cy2 = endY - h*0.3;
            let thick = w*0.09;
            
            let path = `M 0,${startY} C ${cx1},${cy1} ${cx2},${cy2} ${endX},${endY} L ${endX},${endY+thick} C ${cx2},${cy2+thick} ${cx1},${cy1+thick} 0,${startY+thick} Z`;
            out += `<path d="${path}" fill="url(#${id}_ribbon)" />`;
        }
        return out;
    }
    else if (index % 5 === 3) {
        // POSTER 4: INFINITE HORIZON
        // Minimalist horizontal glowing bands
        out += `<rect x="0" y="0" width="${w}" height="${h*0.48}" fill="url(#${id}_fadeDown)" />`;
        // Thin glowing separator line
        out += `<rect x="0" y="${h*0.48}" width="${w}" height="${h*0.01}" fill="#000000" />`;
        out += `<rect x="0" y="${h*0.49}" width="${w}" height="${h*0.51}" fill="url(#${id}_fadeUp)" />`;
        return out;
    }
    else {
        // POSTER 5: 3D FOLDED FAN
        // Radiating architectural origami spokes
        let cx = w*0.9; 
        let cy = h*0.6; 
        let radius = w*1.8;
        let blades = Math.max(20, Math.floor(Number(state.density)*3));
        
        for(let i=0; i<blades; i++) {
           let a1 = (i/blades)*TAU; 
           let a2 = ((i+1)/blades)*TAU;
           // The middle point forms the sharp 'crease'
           let aMid = ((i+0.5)/blades)*TAU;
           
           let p1x = cx + Math.cos(a1)*radius; let p1y = cy + Math.sin(a1)*radius;
           let p2x = cx + Math.cos(aMid)*radius; let p2y = cy + Math.sin(aMid)*radius;
           let p3x = cx + Math.cos(a2)*radius; let p3y = cy + Math.sin(a2)*radius;
           
           // The shadow face
           out += `<polygon points="${cx},${cy} ${p1x},${p1y} ${p2x},${p2y}" fill="url(#${id}_fanShadow)"/>`;
           // The lit face
           out += `<polygon points="${cx},${cy} ${p2x},${p2y} ${p3x},${p3y}" fill="url(#${id}_fanFace)"/>`;
        }
        return out;
    }
  }

  // ==========================================
  // TYPOGRAPHY (Matches Reference Image)
  // ==========================================
  function textLayer(id,index,w,h,p){
    const fill = p.text;
    const fs = Math.max(24, Math.round(Math.min(w,h)*0.04));
    const smallFs = Math.max(10, Math.round(fs*0.35));
    
    let textOut = `<g font-family="Arial, Helvetica, sans-serif" fill="${fill}" opacity="0.9">`;

    if (index % 5 === 0) {
        textOut += `<text x="${w*0.5}" y="${h*0.1}" font-size="${smallFs*1.2}" font-weight="300" text-anchor="middle">Design Inspiration</text>`;
    }
    else if (index % 5 === 1) {
        textOut += `<text x="${w*0.5}" y="${h*0.8}" font-size="${fs*0.8}" font-weight="300" letter-spacing="4" text-anchor="middle">INSPIRATION</text>`;
        textOut += `<text x="${w*0.5}" y="${h*0.83}" font-size="${smallFs*0.7}" font-weight="600" letter-spacing="2" text-anchor="middle" opacity="0.5">GRAPHIC DESIGN POSTER</text>`;
    }
    else if (index % 5 === 2) {
        textOut += `<text x="${w*0.9}" y="${h*0.1}" font-size="${smallFs}" font-weight="600" letter-spacing="2" transform="rotate(90 ${w*0.9} ${h*0.1})">GRADIENT DESIGN</text>`;
        
        textOut += `<text x="${w*0.1}" y="${h*0.25}" font-size="${smallFs*0.8}" opacity="0.7">Lorem ipsum dolor</text>`;
        textOut += `<text x="${w*0.1}" y="${h*0.265}" font-size="${smallFs*0.8}" opacity="0.7">sit amet consetur.</text>`;

        textOut += `<text x="${w*0.1}" y="${h*0.32}" font-size="${smallFs*0.8}" opacity="0.7">Lorem ipsum dolor</text>`;
        textOut += `<text x="${w*0.1}" y="${h*0.335}" font-size="${smallFs*0.8}" opacity="0.7">sit amet consetur.</text>`;

        textOut += `<text x="${w*0.1}" y="${h*0.85}" font-size="${fs*0.7}" font-weight="800" letter-spacing="1">ABSTRACT</text>`;
        textOut += `<text x="${w*0.1}" y="${h*0.88}" font-size="${fs*0.7}" font-weight="800" letter-spacing="1">POSTER</text>`;
    }
    else if (index % 5 === 3) {
        textOut += `<text x="${w*0.1}" y="${h*0.2}" font-size="${smallFs*0.8}" font-weight="600" letter-spacing="1" opacity="0.7">ABSTRACT / POSTER</text>`;
        textOut += `<text x="${w*0.1}" y="${h*0.24}" font-size="${fs*0.8}" font-weight="800" letter-spacing="1">INSPIRATION</text>`;
        textOut += `<text x="${w*0.1}" y="${h*0.28}" font-size="${smallFs}" font-weight="600" letter-spacing="1">LOREM IPSUM</text>`;
        textOut += `<text x="${w*0.1}" y="${h*0.3}" font-size="${smallFs}" font-weight="600" letter-spacing="1">DOLOR SIT AMET</text>`;
        
        textOut += `<text x="${w*0.1}" y="${h*0.35}" font-size="${smallFs*0.8}" font-weight="600" letter-spacing="1" opacity="0.7">01 / LOREM IPSUM</text>`;
    }
    else if (index % 5 === 4) {
        textOut += `<text x="${w*0.1}" y="${h*0.8}" font-size="${fs*0.8}" font-weight="800" letter-spacing="2">CREATE</text>`;
        textOut += `<text x="${w*0.1}" y="${h*0.83}" font-size="${smallFs}" font-weight="600" letter-spacing="1" opacity="0.8">LOREM IPSUM DOLOR</text>`;
        textOut += `<text x="${w*0.1}" y="${h*0.85}" font-size="${smallFs}" font-weight="600" letter-spacing="1" opacity="0.8">SIT AMET CONSECTUR</text>`;

        textOut += `<text x="${w*0.9}" y="${h*0.85}" font-size="${fs*0.8}" font-weight="800" text-anchor="end">001</text>`;
    }

    textOut += `</g>`;
    return textOut;
  }

  // ==========================================
  // COMPILATION ENGINE
  // ==========================================
  function layoutByMode(index,w,h,p,rnd,id){
    return midnightIce(id,w,h,p,rnd,index);
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
      <title>ALI STUDIO — Midnight Ice Design ${String(index+1).padStart(2,"0")}</title>
      <metadata>Generated locally by ALI STUDIO. Pure Vector Graphics.</metadata>
      ${out}
    </svg>`;
  }

  function makeCombinedSvg(){
    const {w:pw,h:ph}=dims();
    const count=Number(state.posterCount), cols=Math.min(5,Math.max(1,count)), rows=Math.ceil(count/cols), gap=36;
    const aw=pw*cols+gap*(cols+1), ah=ph*rows+gap*(rows+1);
    let out=`<svg xmlns="http://www.w3.org/2000/svg" width="${aw}" height="${ah}" viewBox="0 0 ${aw} ${ah}">
      <title>ALI STUDIO — Midnight Ice Collection</title><rect width="${aw}" height="${ah}" fill="#d4d4d4"/>`;
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
      if(mode) mode.textContent=`MIDNIGHT / ${String((i%5)+1).padStart(2,"0")}`;
      if(frame) frame.innerHTML=svg;
      if(dBtn) dBtn.addEventListener("click",()=>download(`ali-studio-midnight-${String(i+1).padStart(2,"0")}.svg`,svg));
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

  if($("downloadAll")) $("downloadAll").addEventListener("click",()=>download(`ali-studio-midnight-collection.svg`,makeCombinedSvg()));
  if($("downloadJson")) $("downloadJson").addEventListener("click",()=>download("ali-studio-settings.json",JSON.stringify(state,null,2),"application/json"));
  if($("zoomIn")) $("zoomIn").addEventListener("click",()=>{zoom=clamp(zoom+.1,.4,1.8);applyZoom();});
  if($("zoomOut")) $("zoomOut").addEventListener("click",()=>{zoom=clamp(zoom-.1,.4,1.8);applyZoom();});

  updateOutputs(); render();
})();
