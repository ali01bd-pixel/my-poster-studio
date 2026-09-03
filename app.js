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

  // New Oceanic Theme exactly matches the reference image
  const THEMES = {
    oceanic:  { dark:"#03070b", mid:"#0e263d", a:"#1e537d", b:"#438ec9", light:"#e4f1f7", text:"#ffffff" },
    neonFlow: { dark:"#0a0a0a", mid:"#4011ba", a:"#e82375", b:"#ff6e21", light:"#ffd2a6", text:"#ffffff" },
    crimson:  { dark:"#120202", mid:"#6b0313", a:"#d10022", b:"#ff1a3c", light:"#ffeedb", text:"#ffffff" },
    candy:    { dark:"#21062e", mid:"#b31965", a:"#ff4fd8", b:"#ff7d62", light:"#ffe18a", text:"#ffffff" },
    electric: { dark:"#03142c", mid:"#0849a7", a:"#28b9ff", b:"#6560ff", light:"#d8f7ff", text:"#ffffff" },
    tropical: { dark:"#042b2a", mid:"#078f76", a:"#2de7c7", b:"#8dff72", light:"#ffe56b", text:"#08231f" },
    berry:    { dark:"#24051e", mid:"#7f185e", a:"#ed3a9f", b:"#9a4dff", light:"#ffb2df", text:"#ffffff" },
    aqua:     { dark:"#02252d", mid:"#007f94", a:"#16e2ef", b:"#4c9dff", light:"#c9fff6", text:"#ffffff" },
    solar:    { dark:"#351006", mid:"#d44b06", a:"#ff8d28", b:"#ffd447", light:"#fff1ad", text:"#331a05" },
    violet:   { dark:"#15072c", mid:"#4f1d9a", a:"#9c63ff", b:"#fb5fff", light:"#e9d5ff", text:"#ffffff" }
  };

  const state = {
    posterCount:5, designMode:"blueElegant", theme:"oceanic", depth:"flat",
    shapeSize:100, density:8, gradientSoftness:72, textAmount:55,
    seed:260831, format:"portrait", quality:"large", darkColor:"#03070b", lightColor:"#e4f1f7"
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
    const base = THEMES[state.theme] || THEMES.oceanic;
    const themeKeys = Object.keys(THEMES);
    const shift = (Math.floor((Number(state.seed)||1)/17) + index * 3) % themeKeys.length;
    const alt = THEMES[themeKeys[shift]];
    const tint = ((index * 0.17) % 0.75);
    return {
      dark: mixHex(base.dark, alt.dark, tint * .1),
      mid: mixHex(base.mid, alt.mid, tint),
      a: mixHex(base.a, alt.a, (tint + .12) % 1),
      b: mixHex(base.b, alt.b, (tint + .28) % 1),
      light: mixHex(base.light, alt.light, tint * .2),
      text: "#ffffff"
    };
  }

  // PURE VECTOR GRADIENTS (Zero SVG Blur/Drop Shadows)
  function commonDefs(id,p,rnd){
    return `<defs>
      <!-- Vertical Fade for Backgrounds -->
      <linearGradient id="${id}_bgVert" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${p.light}"/>
        <stop offset="35%" stop-color="${p.b}"/>
        <stop offset="65%" stop-color="${p.mid}"/>
        <stop offset="100%" stop-color="${p.dark}"/>
      </linearGradient>

      <!-- Soft Radial Background (Fakes Blur with Pure Vector Gradient) -->
      <radialGradient id="${id}_bgSoft" cx="50%" cy="30%" r="90%">
        <stop offset="0%" stop-color="${p.light}"/>
        <stop offset="25%" stop-color="${p.b}"/>
        <stop offset="60%" stop-color="${p.mid}"/>
        <stop offset="100%" stop-color="${p.dark}"/>
      </radialGradient>

      <!-- Petal 3D Shell Gradient (Provides the sharp highlight fading into deep shadow) -->
      <linearGradient id="${id}_petal" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${p.light}"/>
        <stop offset="8%" stop-color="${p.light}"/>
        <stop offset="20%" stop-color="${p.b}"/>
        <stop offset="50%" stop-color="${p.mid}"/>
        <stop offset="100%" stop-color="${p.dark}"/>
      </linearGradient>

      <!-- Deep Dark Orb Gradient -->
      <radialGradient id="${id}_darkOrb" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stop-color="${p.a}"/>
        <stop offset="40%" stop-color="${p.dark}"/>
        <stop offset="100%" stop-color="#010204"/>
      </radialGradient>
    </defs>`;
  }

  // ==========================================
  // REFERENCE IMAGE LAYOUT REPLICATOR: Oceanic 3D Shells
  // ==========================================
  function blueElegant(id,w,h,p,rnd,index) {
    let out = "";
    const s = sizeFactor();

    if (index % 5 === 0) {
        // Poster 1: Smooth Vertical Gradient (No Shapes)
        out += `<rect width="${w}" height="${h}" fill="url(#${id}_bgVert)"/>`;
        return out;
    }
    else if (index % 5 === 1) {
        // Poster 2: 3D Shells Radiating from Top Left
        out += `<rect width="${w}" height="${h}" fill="${p.dark}"/>`;
        
        // Function to draw a stacked 3D shell fan
        const drawFan = (cx, cy, radius, startAngle, endAngle, steps) => {
            let fanOut = "";
            let petalW = radius * 0.2; 
            // Shape of one petal (Teardrop/Shell scale)
            let pathD = `M 0,0 C ${radius*0.4},${petalW} ${radius*0.9},${petalW*0.6} ${radius},0 C ${radius*0.8},-${petalW*0.3} ${radius*0.3},-${petalW*0.1} 0,0`;
            
            for(let i=0; i<steps; i++) {
                let rot = startAngle + (i/steps) * (endAngle - startAngle);
                fanOut += `<path d="${pathD}" transform="translate(${cx}, ${cy}) rotate(${rot})" fill="url(#${id}_petal)" />`;
            }
            return fanOut;
        };

        // Main Top Cluster
        out += drawFan(w*0.2, h*0.2, w*0.85*s, -45, 120, Math.max(10, Math.floor(Number(state.density)*1.5)));
        // Bottom Accent Cluster
        out += drawFan(w*0.7, h*1.1, w*0.7*s, 160, 280, Math.max(8, Math.floor(Number(state.density)*1.2)));
        
        return out;
    }
    else if (index % 5 === 2) {
        // Poster 3: Soft Background + Crisp Minimal Wireframe
        out += `<rect width="${w}" height="${h}" fill="url(#${id}_bgSoft)"/>`;
        
        // Wireframe Lines
        out += `<line x1="0" y1="${h*0.12}" x2="${w}" y2="${h*0.1}" stroke="${p.light}" stroke-width="${Math.max(1, w*0.001)}" opacity="0.6"/>`;
        out += `<line x1="${w*0.15}" y1="0" x2="${w*0.85}" y2="${h}" stroke="${p.light}" stroke-width="${Math.max(1, w*0.001)}" opacity="0.6"/>`;
        out += `<line x1="${w}" y1="${h*0.7}" x2="0" y2="${h*0.9}" stroke="${p.light}" stroke-width="${Math.max(1, w*0.001)}" opacity="0.6"/>`;
        
        // Wireframe Diamonds
        const drawDiamond = (cx, cy) => {
            let r = w*0.008;
            return `<polygon points="${cx},${cy-r} ${cx+r},${cy} ${cx},${cy+r} ${cx-r},${cy}" fill="${p.light}"/>`;
        };
        out += drawDiamond(w*0.145, h*0.117);
        out += drawDiamond(w*0.585, h*0.62); 
        
        return out;
    }
    else if (index % 5 === 3) {
        // Poster 4: 3D Shells Radiating from Right Side
        out += `<rect width="${w}" height="${h}" fill="${p.dark}"/>`;
        
        const drawFan = (cx, cy, radius, startAngle, endAngle, steps) => {
            let fanOut = "";
            let petalW = radius * 0.22; 
            let pathD = `M 0,0 C ${radius*0.4},${petalW} ${radius*0.9},${petalW*0.6} ${radius},0 C ${radius*0.8},-${petalW*0.3} ${radius*0.3},-${petalW*0.1} 0,0`;
            for(let i=0; i<steps; i++) {
                let rot = startAngle + (i/steps) * (endAngle - startAngle);
                fanOut += `<path d="${pathD}" transform="translate(${cx}, ${cy}) rotate(${rot})" fill="url(#${id}_petal)" />`;
            }
            return fanOut;
        };

        // Right side cluster
        out += drawFan(w*0.9, h*0.4, w*0.8*s, 80, 240, Math.max(12, Math.floor(Number(state.density)*1.8)));
        return out;
    }
    else {
        // Poster 5: Dark Gradient Orb on Soft Background
        out += `<rect width="${w}" height="${h}" fill="url(#${id}_bgSoft)"/>`;
        // Massive dark orb
        out += `<circle cx="${w*0.5}" cy="${h*0.55}" r="${w*0.42*s}" fill="url(#${id}_darkOrb)"/>`;
        return out;
    }
  }

  // ==========================================
  // TYPOGRAPHY / TEXT PLACEMENTS
  // ==========================================
  function textLayer(id,index,w,h,p){
    const amount=Number(state.textAmount)/100;
    if(amount<=0) return "";
    
    const fill = "#ffffff";
    const fs = Math.max(22, Math.round(Math.min(w,h)*0.035));
    const smallFs = Math.max(10, Math.round(fs*0.4));
    let textOut = `<g font-family="Arial, Helvetica, sans-serif" fill="${fill}" opacity="${(.8+.2*amount).toFixed(2)}">`;

    // Dynamic placement matching the specific "Oceanic Shells" reference image
    if (state.designMode === "blueElegant") {
        if (index % 5 === 0) {
            textOut += `<text x="${w*0.5}" y="${h*0.5}" font-size="${smallFs*1.8}" font-weight="600" letter-spacing="4" text-anchor="middle">INSPIRATION</text>`;
            textOut += `<text x="${w*0.5}" y="${h*0.5 + smallFs*1.5}" font-size="${smallFs*0.7}" font-weight="400" letter-spacing="2" text-anchor="middle">GRAPHIC DESIGN POSTER</text>`;
        }
        else if (index % 5 === 1) {
            textOut += `<text x="${w*0.08}" y="${h*0.1}" font-size="${fs}" font-weight="600" letter-spacing="2">DESIGN</text>`;
            textOut += `<text x="${w*0.08}" y="${h*0.92}" font-size="${smallFs*1.2}" font-weight="600" letter-spacing="1">ABSTRACT</text>`;
            textOut += `<text x="${w*0.08}" y="${h*0.94}" font-size="${smallFs*0.8}" font-weight="400" letter-spacing="1">MODERN ART</text>`;
            textOut += `<text x="${w*0.92}" y="${h*0.94}" font-size="${smallFs}" font-weight="400" letter-spacing="1" text-anchor="end">Sept 2026</text>`;
        }
        else if (index % 5 === 2) {
            textOut += `<text x="${w*0.1}" y="${h*0.42}" font-size="${smallFs*1.5}" font-weight="600" letter-spacing="1">Design</text>`;
            textOut += `<text x="${w*0.1}" y="${h*0.44}" font-size="${smallFs*1.5}" font-weight="600" letter-spacing="1">Inspiration</text>`;
            textOut += `<text x="${w*0.1}" y="${h*0.46}" font-size="${smallFs*1.5}" font-weight="600" letter-spacing="1">Background</text>`;
            
            textOut += `<text x="${w*0.1}" y="${h*0.5}" font-size="${smallFs*0.6}" font-weight="400" letter-spacing="0.5">Lorem ipsum dolor sit amet,</text>`;
            textOut += `<text x="${w*0.1}" y="${h*0.51}" font-size="${smallFs*0.6}" font-weight="400" letter-spacing="0.5">consectetur adipiscing elit.</text>`;
        }
        else if (index % 5 === 3) {
            textOut += `<text x="${w*0.1}" y="${h*0.2}" font-size="${smallFs*1.5}" font-weight="800" letter-spacing="1">01</text>`;
            textOut += `<line x1="${w*0.13}" y1="${h*0.21}" x2="${w*0.16}" y2="${h*0.18}" stroke="#fff" stroke-width="2"/>`;
            textOut += `<text x="${w*0.15}" y="${h*0.23}" font-size="${smallFs*1.5}" font-weight="800" letter-spacing="1">06</text>`;

            textOut += `<text x="${w*0.88}" y="${h*0.75}" font-size="${smallFs*1.8}" font-weight="600" letter-spacing="2" text-anchor="end">INOVATION</text>`;
            textOut += `<text x="${w*0.88}" y="${h*0.78}" font-size="${smallFs*1.8}" font-weight="600" letter-spacing="2" text-anchor="end">FUTURE CITY</text>`;
            textOut += `<line x1="${w*0.82}" y1="${h*0.8}" x2="${w*0.88}" y2="${h*0.8}" stroke="#fff" stroke-width="2"/>`;
        }
        else if (index % 5 === 4) {
            textOut += `<text x="${w*0.08}" y="${h*0.1}" font-size="${fs}" font-weight="800" letter-spacing="2">VISION</text>`;
            textOut += `<text x="${w*0.92}" y="${h*0.92}" font-size="${smallFs*0.7}" font-weight="400" letter-spacing="1" text-anchor="end">SHAPE DESIGN</text>`;
            textOut += `<text x="${w*0.92}" y="${h*0.935}" font-size="${smallFs*0.7}" font-weight="400" letter-spacing="1" text-anchor="end">COLLECTION 2026</text>`;
            textOut += `<text x="${w*0.92}" y="${h*0.95}" font-size="${smallFs*0.7}" font-weight="400" letter-spacing="1" text-anchor="end">VECTOR STUDIO</text>`;
        }
    } 
    // Fallback for other modes
    else {
        const title="VIBRANT VECTOR";
        textOut += `<text x="${(w*.08).toFixed(1)}" y="${(h*.10).toFixed(1)}" font-size="${fs}" font-weight="900" letter-spacing="${Math.max(2,fs*.18).toFixed(1)}">${esc(title)}</text>`;
        textOut += `<text x="${(w*.08).toFixed(1)}" y="${(h*.13).toFixed(1)}" font-size="${Math.round(fs*.38)}" font-weight="600" letter-spacing="${Math.max(1,fs*.07).toFixed(1)}">DESIGN / ${String(index+1).padStart(2,"0")}</text>`;
        textOut += `<text x="${(w*.08).toFixed(1)}" y="${(h*.92).toFixed(1)}" font-size="${Math.round(fs*.34)}" font-weight="800" letter-spacing="${Math.max(1,fs*.08).toFixed(1)}">ALI STUDIO / ${String(index+1).padStart(2,"0")}</text>`;
    }

    textOut += `</g>`;
    return textOut;
  }

  // ==========================================
  // ROUTING ENGINE (In case you use other modes)
  // ==========================================
  function layoutByMode(index,w,h,p,rnd,id){
    const mode = state.designMode;
    if(mode === "blueElegant") return blueElegant(id,w,h,p,rnd,index);
    // Fallback if other modes are selected
    return blueElegant(id,w,h,p,rnd,index); 
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
      <title>ALI STUDIO — ${esc(state.theme)} Graphic ${String(index+1).padStart(2,"0")}</title>
      <metadata>Generated locally by ALI STUDIO. Clean Vibrant Vectors.</metadata>
      ${out}
    </svg>`;
  }

  function makeCombinedSvg(){
    const {w:pw,h:ph}=dims();
    const count=Number(state.posterCount), cols=Math.min(4,Math.max(1,count)), rows=Math.ceil(count/cols), gap=36;
    const aw=pw*cols+gap*(cols+1), ah=ph*rows+gap*(rows+1);
    let out=`<svg xmlns="http://www.w3.org/2000/svg" width="${aw}" height="${ah}" viewBox="0 0 ${aw} ${ah}">
      <title>ALI STUDIO — Design Collection</title><rect width="${aw}" height="${ah}" fill="#03070b"/>`;
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
    ["posterCount","shapeSize","density","gradientSoftness","textAmount"].forEach(k=>{
        if($(k))state[k]=Number($(k).value)
    });
    ["designMode","theme","format","quality","darkColor","lightColor","seed"].forEach(k=>{
        if($(k))state[k]=$(k).value
    });
    state.seed=Number(state.seed)||1;
  }

  function updateOutputs(){
    const map={posterCount:["posterCountVal",v=>v],shapeSize:["shapeSizeVal",v=>`${v}%`],density:["densityVal",v=>v],gradientSoftness:["gradientSoftnessVal",v=>`${v}%`],textAmount:["textAmountVal",v=>`${v}%`]};
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
    
    for(let i=0;i<state.posterCount;i++){
      const node=tpl.content.firstElementChild.cloneNode(true), svg=makeSvg(i);
      generated.push(svg);
      const num = node.querySelector(".poster-number");
      const mode = node.querySelector(".poster-mode");
      const frame = node.querySelector(".poster-frame");
      const dBtn = node.querySelector(".download-one");
      const cBtn = node.querySelector(".copy-one");
      
      if(num) num.textContent=`DESIGN ${String(i+1).padStart(2,"0")}`;
      if(mode) mode.textContent=`VECTOR / ${String(i+1).padStart(2,"0")}`;
      if(frame) frame.innerHTML=svg;
      if(dBtn) dBtn.addEventListener("click",()=>download(`ali-studio-${state.theme}-${String(i+1).padStart(2,"0")}.svg`,svg));
      if(cBtn) cBtn.addEventListener("click",()=>copyText(svg));
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

  ["posterCount","designMode","theme","shapeSize","density","gradientSoftness","textAmount","seed","format","quality","darkColor","lightColor"].forEach(id=>{
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
        if($("shapeSize")) $("shapeSize").value=60+Math.floor(Math.random()*86);
        if($("density")) $("density").value=4+Math.floor(Math.random()*13);
        
        const themes=Object.keys(THEMES); 
        if($("theme")) $("theme").value=themes[Math.floor(Math.random()*themes.length)];
        
        updateOutputs(); render();
      });
  }

  if($("downloadAll")) $("downloadAll").addEventListener("click",()=>download(`ali-studio-${state.theme}-collection.svg`,makeCombinedSvg()));
  if($("downloadJson")) $("downloadJson").addEventListener("click",()=>download("ali-studio-settings.json",JSON.stringify(state,null,2),"application/json"));
  if($("zoomIn")) $("zoomIn").addEventListener("click",()=>{zoom=clamp(zoom+.1,.5,1.8);applyZoom();});
  if($("zoomOut")) $("zoomOut").addEventListener("click",()=>{zoom=clamp(zoom-.1,.5,1.8);applyZoom();});

  updateOutputs(); render();
})();
