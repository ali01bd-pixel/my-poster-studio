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

  // Color Themes
  const THEMES = {
    deepIndigo:   { dark:"#05081f", mid:"#193175", a:"#2b50b3", b:"#5c8ee6", light:"#c0dbf5", text:"#ffffff" },
    emeraldGold:  { dark:"#021c15", mid:"#0c4233", a:"#168060", b:"#e8b641", light:"#faeab6", text:"#ffffff" },
    crimsonSteel: { dark:"#1a060a", mid:"#47111b", a:"#9c263c", b:"#8ea1a8", light:"#e1e5e8", text:"#ffffff" }
  };

  const state = {
    posterCount:5, designMode:"indigoVolume", theme:"deepIndigo", depth:"flat",
    shapeSize:100, density:8, seed:260831, format:"portrait", quality:"large", 
    darkColor:"#05081f", lightColor:"#c0dbf5"
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

  function sizeFactor(){ return clamp(Number(state.shapeSize)/100,.35,2.5); }

  function palette(index){
    const base = THEMES[state.theme] || THEMES.deepIndigo;
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
  // Generates 3D metallic/volume effects with zero SVG filters
  // ==========================================
  function commonDefs(id,p,rnd){
    return `<defs>
      <!-- Base Background Gradients -->
      <linearGradient id="${id}_bgGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${p.light}"/>
        <stop offset="100%" stop-color="${p.dark}"/>
      </linearGradient>

      <!-- 3D Bevel/Shadow Gradient for Grid Holes -->
      <linearGradient id="${id}_bevel" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${p.dark}"/>
        <stop offset="40%" stop-color="${p.mid}"/>
        <stop offset="100%" stop-color="${p.light}"/>
      </linearGradient>

      <!-- 3D Face Gradient for Convex objects -->
      <linearGradient id="${id}_face" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${p.dark}"/>
        <stop offset="50%" stop-color="${p.a}"/>
        <stop offset="100%" stop-color="${p.light}"/>
      </linearGradient>

      <!-- Horizontal Cylinder 3D Gradient -->
      <linearGradient id="${id}_cylinderH" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${p.light}"/>
        <stop offset="25%" stop-color="${p.b}"/>
        <stop offset="50%" stop-color="${p.a}"/>
        <stop offset="85%" stop-color="${p.mid}"/>
        <stop offset="100%" stop-color="${p.dark}"/>
      </linearGradient>

      <!-- Vertical Bar 3D Fade Gradient -->
      <linearGradient id="${id}_barFade" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${p.a}"/>
        <stop offset="40%" stop-color="${p.b}"/>
        <stop offset="100%" stop-color="${p.dark}"/>
      </linearGradient>

      <!-- 3D Sphere Radial Gradient -->
      <radialGradient id="${id}_sphere" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stop-color="${p.light}"/>
        <stop offset="25%" stop-color="${p.b}"/>
        <stop offset="60%" stop-color="${p.mid}"/>
        <stop offset="90%" stop-color="${p.dark}"/>
        <stop offset="100%" stop-color="#02030d"/>
      </radialGradient>

      <!-- 3D Petal Angle Gradient -->
      <linearGradient id="${id}_petal" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${p.light}"/>
        <stop offset="30%" stop-color="${p.b}"/>
        <stop offset="60%" stop-color="${p.mid}"/>
        <stop offset="100%" stop-color="${p.dark}"/>
      </linearGradient>
    </defs>`;
  }

  // ==========================================
  // REFERENCE IMAGE LAYOUT REPLICATOR
  // ==========================================
  function indigoVolume(id,w,h,p,rnd,index) {
    let out = "";
    const s = sizeFactor();

    if (index % 5 === 0) {
        // ---------------------------------------------------
        // POSTER 1: 3D COIN/HOLE GRID
        // ---------------------------------------------------
        out += `<rect width="${w}" height="${h}" fill="${p.dark}"/>`;
        
        let cols = Math.max(4, Math.floor(Number(state.density)));
        let step = w / cols;
        let rOuter = step * 0.48;
        let rInner = step * 0.44;

        for (let y = -step; y < h + step; y += step) {
            for (let x = 0; x < w + step; x += step) {
                // Offset every other row for interlocking honeycomb feel
                let xOff = ((Math.round(y/step) % 2) !== 0) ? step/2 : 0;
                let cx = x + xOff;
                
                // Outer circle acts as a shadow/bevel (Dark top left to light bottom right)
                out += `<circle cx="${cx}" cy="${y}" r="${rOuter}" fill="url(#${id}_bevel)"/>`;
                // Inner circle acts as the lit face (Light bottom left to dark top right)
                out += `<circle cx="${cx}" cy="${y}" r="${rInner}" fill="url(#${id}_face)"/>`;
            }
        }
        return out;
    }
    else if (index % 5 === 1) {
        // ---------------------------------------------------
        // POSTER 2: FOLDED 3D CYLINDERS
        // ---------------------------------------------------
        out += `<rect width="${w}" height="${h}" fill="${p.dark}"/>`;
        
        // Background structural columns
        out += `<rect x="${w*0.25}" y="0" width="${w*0.1}" height="${h}" fill="${p.mid}" opacity="0.3"/>`;
        out += `<rect x="${w*0.65}" y="0" width="${w*0.1}" height="${h}" fill="${p.mid}" opacity="0.3"/>`;

        let tabs = Math.max(3, Math.floor(Number(state.density)*0.6));
        let tabH = (h / tabs) * 0.8 * s;
        let spacing = h / tabs;

        for(let i=0; i<tabs; i++){
            // Alternate left and right attachments
            let isLeft = i % 2 === 0;
            let tw = w * (0.7 + rnd()*0.2);
            let tx = isLeft ? -w*0.1 : w - tw + w*0.1;
            let ty = (i * spacing) + (spacing*0.1);
            
            // Background shadow to ground it
            out += `<rect x="${tx}" y="${ty + tabH*0.2}" width="${tw}" height="${tabH}" rx="${tabH/2}" fill="#01020a" opacity="0.6"/>`;
            // The 3D cylinder tab
            out += `<rect x="${tx}" y="${ty}" width="${tw}" height="${tabH}" rx="${tabH/2}" fill="url(#${id}_cylinderH)"/>`;
        }
        return out;
    }
    else if (index % 5 === 2) {
        // ---------------------------------------------------
        // POSTER 3: FLOATING SPHERES
        // ---------------------------------------------------
        out += `<rect width="${w}" height="${h}" fill="${p.dark}"/>`;
        
        let spheresCount = Math.max(5, Math.floor(Number(state.density)*1.5));
        
        // Background small spheres
        for(let i=0; i<spheresCount; i++){
            let cx = w * (0.3 + rnd()*0.7);
            let cy = h * rnd();
            let r = w * (0.02 + rnd()*0.08) * s;
            out += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${id}_sphere)"/>`;
        }

        // Foreground massive spheres
        let giantSpheres = 3;
        for(let i=0; i<giantSpheres; i++){
            let cx = w * (0.4 + rnd()*0.5);
            let cy = h * (0.2 + (i*0.3));
            let r = w * (0.25 + rnd()*0.15) * s;
            
            // Hard shadow casting onto background
            out += `<circle cx="${cx - r*0.1}" cy="${cy + r*0.1}" r="${r}" fill="#01020a" opacity="0.5"/>`;
            // The 3D Sphere
            out += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${id}_sphere)"/>`;
        }
        return out;
    }
    else if (index % 5 === 3) {
        // ---------------------------------------------------
        // POSTER 4: INTERLOCKING GRADIENT BARS
        // ---------------------------------------------------
        // Background fades light top to dark bottom
        out += `<rect width="${w}" height="${h}" fill="url(#${id}_bgGradient)"/>`;
        
        let bars = Math.max(6, Math.floor(Number(state.density)));
        let bw = w / bars;

        for(let i=0; i<bars; i++){
            let bh = h * (0.4 + rnd()*0.4) * s;
            // The bars fade from mid-blue top to dark bottom, creating an optical illusion against the background
            out += `<rect x="${i*bw + bw*0.1}" y="${h - bh}" width="${bw*0.8}" height="${bh}" fill="url(#${id}_barFade)"/>`;
        }
        return out;
    }
    else {
        // ---------------------------------------------------
        // POSTER 5: METALLIC FLORAL / 3D PETALS
        // ---------------------------------------------------
        out += `<rect width="${w}" height="${h}" fill="${p.dark}"/>`;
        
        // Draws a 3D blooming flower from a specific center point
        const drawFlower = (cx, cy, radius, petalsNum) => {
            let flowerOut = "";
            let pW = radius * 0.4;
            // Teardrop petal path
            let pathD = `M 0,0 C ${radius*0.3},${pW} ${radius*0.8},${pW*0.8} ${radius},0 C ${radius*0.8},-${pW*0.8} ${radius*0.3},-${pW} 0,0 Z`;
            
            for(let i=0; i<petalsNum; i++){
                let rot = (360 / petalsNum) * i;
                // Dark shadow underneath each petal to give stacked 3D effect
                flowerOut += `<path d="${pathD}" transform="translate(${cx}, ${cy}) rotate(${rot - 5})" fill="#01020a" opacity="0.8"/>`;
                // The actual 3D gradient petal
                flowerOut += `<path d="${pathD}" transform="translate(${cx}, ${cy}) rotate(${rot})" fill="url(#${id}_petal)"/>`;
            }
            // Deep center hole
            flowerOut += `<circle cx="${cx}" cy="${cy}" r="${radius*0.15}" fill="#02030d"/>`;
            return flowerOut;
        };

        // Top Left Flower
        out += drawFlower(-w*0.1, -h*0.05, w*0.8*s, 10);
        // Bottom Right Flower
        out += drawFlower(w*0.9, h*0.9, w*0.7*s, 8);

        return out;
    }
  }

  // ==========================================
  // TYPOGRAPHY (Matches Reference Image)
  // ==========================================
  function textLayer(id,index,w,h,p){
    const amount=Number(state.textAmount)/100;
    if(amount<=0) return "";
    
    const fill = p.text;
    const fs = Math.max(20, Math.round(Math.min(w,h)*0.035));
    const smallFs = Math.max(10, Math.round(fs*0.4));
    
    let textOut = `<g font-family="Arial, Helvetica, sans-serif" fill="${fill}" opacity="${(.8+.2*amount).toFixed(2)}">`;

    if (index % 5 === 0) {
        // Poster 1: Center Aligned
        textOut += `<text x="${w*0.5}" y="${h*0.5}" font-size="${fs*0.8}" font-weight="800" letter-spacing="4" text-anchor="middle">INSPIRATION</text>`;
        textOut += `<text x="${w*0.5}" y="${h*0.53}" font-size="${smallFs*0.8}" font-weight="600" letter-spacing="1" text-anchor="middle">DESIGN POSTER</text>`;
    }
    else if (index % 5 === 1) {
        // Poster 2: Bottom Left & Top Tabs
        textOut += `<text x="${w*0.08}" y="${h*0.75}" font-size="${fs}" font-weight="800" letter-spacing="2">COVER</text>`;
        textOut += `<text x="${w*0.08}" y="${h*0.75 + fs*1.2}" font-size="${fs}" font-weight="800" letter-spacing="2">DESIGN</text>`;
        textOut += `<text x="${w*0.08}" y="${h*0.75 + fs*1.8}" font-size="${smallFs}" font-weight="600" letter-spacing="1">POSTER</text>`;
        
        textOut += `<text x="${w*0.08}" y="${h*0.05}" font-size="${smallFs*0.8}" font-weight="600" letter-spacing="1">ABSTRACT</text>`;
        textOut += `<text x="${w*0.5}" y="${h*0.05}" font-size="${smallFs*0.8}" font-weight="600" letter-spacing="1" text-anchor="middle">2026</text>`;
        textOut += `<text x="${w*0.92}" y="${h*0.05}" font-size="${smallFs*0.8}" font-weight="600" letter-spacing="1" text-anchor="end">GRADIENT</text>`;
    }
    else if (index % 5 === 2) {
        // Poster 3: Left Middle
        textOut += `<text x="${w*0.08}" y="${h*0.4}" font-size="${smallFs*1.2}" font-weight="600" letter-spacing="1">Design</text>`;
        textOut += `<text x="${w*0.08}" y="${h*0.4 + smallFs*1.5}" font-size="${fs*0.8}" font-weight="800" letter-spacing="1">Inspiration</text>`;
        textOut += `<text x="${w*0.08}" y="${h*0.4 + smallFs*4}" font-size="${smallFs*0.7}" font-weight="400">Lorem ipsum dolor sit amet,</text>`;
        textOut += `<text x="${w*0.08}" y="${h*0.4 + smallFs*5}" font-size="${smallFs*0.7}" font-weight="400">consectetur adipiscing elit.</text>`;
    }
    else if (index % 5 === 3) {
        // Poster 4: Bottom Left
        textOut += `<text x="${w*0.08}" y="${h*0.8}" font-size="${fs}" font-weight="800" letter-spacing="1">MODERN</text>`;
        textOut += `<text x="${w*0.08}" y="${h*0.8 + fs*1.1}" font-size="${fs}" font-weight="800" letter-spacing="1">COVER</text>`;
        textOut += `<text x="${w*0.08}" y="${h*0.8 + fs*1.6}" font-size="${smallFs*1.2}" font-weight="600" letter-spacing="1">Design</text>`;
    }
    else if (index % 5 === 4) {
        // Poster 5: Center Cross
        textOut += `<text x="${w*0.5}" y="${h*0.48}" font-size="${fs*0.8}" font-weight="800" letter-spacing="4" text-anchor="middle">MODERN ART</text>`;
        textOut += `<text x="${w*0.5}" y="${h*0.51}" font-size="${smallFs*0.8}" font-weight="600" letter-spacing="2" text-anchor="middle">DESIGN</text>`;
    }

    textOut += `</g>`;
    return textOut;
  }

  function makeSvg(index){
    const {w,h}=dims();
    const rnd=mulberry32((Number(state.seed)||1)+index*7919);
    const p=palette(index);
    const id=`ali_${Number(state.seed)||1}_${index}`;
    
    let out=commonDefs(id,p,rnd);
    out += indigoVolume(id,w,h,p,rnd,index);
    out += textLayer(id,index,w,h,p);
    
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
      <title>ALI STUDIO — 3D Volume Design ${String(index+1).padStart(2,"0")}</title>
      <metadata>Generated locally by ALI STUDIO. Pure Vector 3D.</metadata>
      ${out}
    </svg>`;
  }

  function makeCombinedSvg(){
    const {w:pw,h:ph}=dims();
    const count=Number(state.posterCount), cols=Math.min(5,Math.max(1,count)), rows=Math.ceil(count/cols), gap=36;
    const aw=pw*cols+gap*(cols+1), ah=ph*rows+gap*(rows+1);
    let out=`<svg xmlns="http://www.w3.org/2000/svg" width="${aw}" height="${ah}" viewBox="0 0 ${aw} ${ah}">
      <title>ALI STUDIO — 3D Volume Collection</title><rect width="${aw}" height="${ah}" fill="#d4d4d4"/>`;
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
    ["posterCount","shapeSize","density","textAmount"].forEach(k=>{if($(k))state[k]=Number($(k).value)});
    ["theme","format","quality","darkColor","lightColor","seed"].forEach(k=>{if($(k))state[k]=$(k).value});
    state.seed=Number(state.seed)||1;
  }

  function updateOutputs(){
    const map={posterCount:["posterCountVal",v=>v],shapeSize:["shapeSizeVal",v=>`${v}%`],density:["densityVal",v=>v],textAmount:["textAmountVal",v=>`${v}%`]};
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
    
    // Auto scale grid layout for 5 designs
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
      if(dBtn) dBtn.addEventListener("click",()=>download(`ali-studio-volume-${String(i+1).padStart(2,"0")}.svg`,svg));
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

  ["posterCount","shapeSize","density","textAmount","seed","format","quality","darkColor","lightColor"].forEach(id=>{
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
        if($("shapeSize")) $("shapeSize").value=80+Math.floor(Math.random()*50);
        if($("density")) $("density").value=5+Math.floor(Math.random()*15);
        updateOutputs(); render();
      });
  }

  if($("downloadAll")) $("downloadAll").addEventListener("click",()=>download(`ali-studio-volume-collection.svg`,makeCombinedSvg()));
  if($("downloadJson")) $("downloadJson").addEventListener("click",()=>download("ali-studio-settings.json",JSON.stringify(state,null,2),"application/json"));
  if($("zoomIn")) $("zoomIn").addEventListener("click",()=>{zoom=clamp(zoom+.1,.4,1.8);applyZoom();});
  if($("zoomOut")) $("zoomOut").addEventListener("click",()=>{zoom=clamp(zoom-.1,.4,1.8);applyZoom();});

  updateOutputs(); render();
})();
