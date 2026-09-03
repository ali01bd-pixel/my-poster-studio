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

  // Water Color Themes
  const THEMES = {
    deepSea: { dark:"#0f3b5e", mid:"#1884a8", a:"#5db2db", b:"#d4eefc", light:"#ffffff", text:"#002447" },
    emeraldSea: { dark:"#06423c", mid:"#19877b", a:"#47c2b4", b:"#bbf0ea", light:"#ffffff", text:"#02211e" },
    sunsetSea: { dark:"#4a154b", mid:"#8f3a88", a:"#d674b8", b:"#fcd4e9", light:"#ffffff", text:"#290829" }
  };

  const state = {
    posterCount:3, designMode:"oceanWatercolor", theme:"deepSea", depth:"flat",
    shapeSize:100, density:8, seed:260831, format:"portrait", quality:"large", 
    darkColor:"#0f3b5e", lightColor:"#ffffff"
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
    const base = THEMES[state.theme] || THEMES.deepSea;
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
  // PURE VECTOR WATERCOLOR SIMULATION
  // By fading radial gradients to opacity="0", we mimic soft wet ink without SVG blurs.
  // ==========================================
  function commonDefs(id,p,rnd){
    return `<defs>
      <!-- Base Background Gradients -->
      <linearGradient id="${id}_bg1" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${p.light}"/>
        <stop offset="60%" stop-color="${p.b}"/>
        <stop offset="100%" stop-color="${p.a}"/>
      </linearGradient>
      
      <linearGradient id="${id}_bg2" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${p.light}"/>
        <stop offset="40%" stop-color="${p.b}"/>
        <stop offset="80%" stop-color="${p.a}"/>
        <stop offset="100%" stop-color="${p.mid}"/>
      </linearGradient>

      <!-- Soft Watercolor Radial Washes -->
      <!-- Opaque center, perfectly transparent outer edge -->
      <radialGradient id="${id}_washDark" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="${p.dark}" stop-opacity="0.85"/>
        <stop offset="40%" stop-color="${p.dark}" stop-opacity="0.5"/>
        <stop offset="100%" stop-color="${p.dark}" stop-opacity="0"/>
      </radialGradient>

      <radialGradient id="${id}_washMid" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="${p.mid}" stop-opacity="0.8"/>
        <stop offset="50%" stop-color="${p.mid}" stop-opacity="0.4"/>
        <stop offset="100%" stop-color="${p.mid}" stop-opacity="0"/>
      </radialGradient>

      <radialGradient id="${id}_washCyan" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="${p.a}" stop-opacity="0.75"/>
        <stop offset="60%" stop-color="${p.a}" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="${p.a}" stop-opacity="0"/>
      </radialGradient>

      <radialGradient id="${id}_washLight" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="${p.light}" stop-opacity="0.9"/>
        <stop offset="40%" stop-color="${p.light}" stop-opacity="0.6"/>
        <stop offset="100%" stop-color="${p.light}" stop-opacity="0"/>
      </radialGradient>

      <!-- Soft directional gradient for wave bodies -->
      <linearGradient id="${id}_waveFade" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${p.a}" stop-opacity="0"/>
        <stop offset="50%" stop-color="${p.a}" stop-opacity="0.7"/>
        <stop offset="100%" stop-color="${p.mid}" stop-opacity="0.9"/>
      </linearGradient>
      
      <linearGradient id="${id}_waveFadeDark" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="${p.mid}" stop-opacity="0"/>
        <stop offset="50%" stop-color="${p.dark}" stop-opacity="0.8"/>
        <stop offset="100%" stop-color="${p.dark}" stop-opacity="0.95"/>
      </linearGradient>
    </defs>`;
  }

  // ==========================================
  // REFERENCE IMAGE LAYOUT REPLICATOR
  // ==========================================
  function oceanWatercolor(id,w,h,p,rnd,index) {
    let out = "";
    const s = sizeFactor();
    const density = Math.max(1, Number(state.density));

    // Function to draw randomized overlapping "ink blobs" to fake watercolor
    const drawBlobs = (count, cxBase, cyBase, spreadX, spreadY, gradientId, scaleMulti = 1) => {
        let blobStr = "";
        for(let i=0; i<count; i++) {
            let cx = cxBase + (rnd() * spreadX - spreadX/2);
            let cy = cyBase + (rnd() * spreadY - spreadY/2);
            let rx = w * (0.15 + rnd()*0.2) * s * scaleMulti;
            let ry = h * (0.1 + rnd()*0.15) * s * scaleMulti;
            let rot = rnd() * 360;
            blobStr += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${cx} ${cy})" fill="url(#${id}_${gradientId})" />`;
        }
        return blobStr;
    };

    if (index % 3 === 0) {
        // ---------------------------------------------------
        // POSTER 1: SEA WAVE (Bottom-left to Top-Left Splash)
        // ---------------------------------------------------
        out += `<rect width="${w}" height="${h}" fill="${p.light}"/>`;
        out += `<rect width="${w}" height="${h}" fill="url(#${id}_bg1)" opacity="0.4"/>`;

        // Underlying solid waves for structure
        out += `<path d="M 0,${h*0.8} Q ${w*0.3},${h*0.6} ${w*0.8},${h} L 0,${h} Z" fill="url(#${id}_waveFadeDark)"/>`;
        out += `<path d="M 0,${h*0.9} Q ${w*0.4},${h*0.75} ${w},${h} L 0,${h} Z" fill="url(#${id}_waveFade)"/>`;
        
        // Soft ink washes building up the wave crests (Bottom Left)
        out += drawBlobs(density * 3, w*0.2, h*0.85, w*0.6, h*0.4, 'washDark', 1.2);
        out += drawBlobs(density * 4, w*0.3, h*0.9, w*0.8, h*0.3, 'washMid', 1);
        out += drawBlobs(density * 5, w*0.4, h*0.8, w*0.6, h*0.3, 'washCyan', 0.8);
        out += drawBlobs(density * 2, w*0.2, h*0.8, w*0.4, h*0.2, 'washLight', 0.6);

        // Top Left Splashes
        out += drawBlobs(density * 2, w*0.2, h*0.2, w*0.4, h*0.3, 'washMid', 0.9);
        out += drawBlobs(density * 3, w*0.25, h*0.25, w*0.3, h*0.3, 'washCyan', 0.8);
        out += drawBlobs(density * 2, w*0.15, h*0.2, w*0.2, h*0.2, 'washLight', 0.7);

        return out;
    }
    else if (index % 3 === 1) {
        // ---------------------------------------------------
        // POSTER 2: OCEAN WAVES (Layered horizontal rolling hills)
        // ---------------------------------------------------
        out += `<rect width="${w}" height="${h}" fill="url(#${id}_bg2)"/>`;

        let layers = Math.max(4, Math.floor(density));
        for (let i = 0; i < layers; i++) {
            let yBase = h * (0.4 + (i/layers)*0.5);
            let cp1x = w * (0.2 + rnd()*0.2);
            let cp1y = yBase - h*(0.1 + rnd()*0.1)*s;
            let cp2x = w * (0.6 + rnd()*0.2);
            let cp2y = yBase + h*(0.05 + rnd()*0.1)*s;
            let endY = yBase + h*(rnd()*0.1 - 0.05);

            let fill = (i > layers/2) ? `url(#${id}_waveFadeDark)` : `url(#${id}_waveFade)`;
            out += `<path d="M 0,${yBase} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${w},${endY} L ${w},${h} L 0,${h} Z" fill="${fill}"/>`;
            
            // Add soft watercolor bleeding on the edges of the waves
            out += drawBlobs(3, w*0.5, yBase, w*1.2, h*0.1, (i > layers/2) ? 'washDark' : 'washMid', 0.8);
        }

        // Soften the entire bottom
        out += drawBlobs(density * 2, w*0.5, h*0.9, w, h*0.3, 'washDark', 1.5);
        out += drawBlobs(density * 2, w*0.5, h*0.8, w, h*0.4, 'washCyan', 1.2);

        return out;
    }
    else {
        // ---------------------------------------------------
        // POSTER 3: DEEP SEA (Heavy immersive blue, light streaks)
        // ---------------------------------------------------
        out += `<rect width="${w}" height="${h}" fill="${p.a}"/>`;
        
        // Huge soft background washes to create watercolor depth
        out += drawBlobs(density * 2, w*0.8, h*0.2, w*0.8, h*0.6, 'washMid', 2);
        out += drawBlobs(density * 2, w*0.2, h*0.8, w*0.8, h*0.6, 'washDark', 2);
        
        // Mid-level texture
        out += drawBlobs(density * 3, w*0.5, h*0.5, w, h, 'washCyan', 1.2);
        out += drawBlobs(density * 3, w*0.7, h*0.7, w*0.8, h*0.8, 'washDark', 1.5);

        // Vertical light streak faked with a stretched radial gradient
        out += `<ellipse cx="${w*0.6}" cy="${h*0.5}" rx="${w*0.15*s}" ry="${h*0.8}" fill="url(#${id}_washLight)" opacity="0.8"/>`;
        out += `<ellipse cx="${w*0.6}" cy="${h*0.5}" rx="${w*0.05*s}" ry="${h*0.6}" fill="url(#${id}_washLight)" opacity="0.9"/>`;

        // Small ink drops/splatters
        let drops = Math.floor(density * 3);
        for(let i=0; i<drops; i++) {
            let cx = w * rnd(); let cy = h * rnd();
            let r = w * (0.005 + rnd()*0.02) * s;
            let opacity = 0.2 + rnd()*0.6;
            let color = rnd() > 0.5 ? p.dark : p.a;
            out += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" opacity="${opacity}"/>`;
        }

        return out;
    }
  }

  // ==========================================
  // TYPOGRAPHY (Matches Reference Image)
  // ==========================================
  function textLayer(id,index,w,h,p){
    const amount=Number(state.textAmount)/100;
    if(amount<=0) return "";
    
    const fill = p.text; // Use dark ink text as seen in reference
    const fs = Math.max(30, Math.round(Math.min(w,h)*0.06));
    const smallFs = Math.max(12, Math.round(fs*0.25));
    const tinyFs = Math.max(8, Math.round(fs*0.15));
    
    let textOut = `<g font-family="Georgia, 'Times New Roman', serif" fill="${fill}" opacity="${(.8+.2*amount).toFixed(2)}">`;

    if (index % 3 === 0) {
        // SEA WAVE (Right aligned area)
        textOut += `<text x="${w*0.7}" y="${h*0.48}" font-size="${tinyFs}" font-weight="bold" letter-spacing="2" text-anchor="middle" opacity="0.6">COVER</text>`;
        textOut += `<text x="${w*0.7}" y="${h*0.51}" font-size="${fs}" font-weight="normal" letter-spacing="1" text-anchor="middle">SEA WAVE</text>`;
        textOut += `<text x="${w*0.7}" y="${h*0.53}" font-family="Arial, sans-serif" font-size="${smallFs}" font-weight="600" letter-spacing="2" text-anchor="middle" opacity="0.7">ABSTRACT WATERCOLOR</text>`;
    }
    else if (index % 3 === 1) {
        // OCEAN WAVES (Top Center)
        textOut += `<text x="${w*0.5}" y="${h*0.33}" font-size="${fs}" font-weight="normal" letter-spacing="1" text-anchor="middle">OCEAN WAVES</text>`;
        textOut += `<text x="${w*0.5}" y="${h*0.355}" font-family="Arial, sans-serif" font-size="${smallFs}" font-weight="600" letter-spacing="2" text-anchor="middle" opacity="0.7">ABSTRACT WATERCOLOR</text>`;
    }
    else {
        // DEEP SEA (Bottom Right)
        textOut += `<text x="${w*0.85}" y="${h*0.8}" font-size="${fs}" font-weight="normal" letter-spacing="2" text-anchor="end">DEEP SEA</text>`;
        textOut += `<text x="${w*0.85}" y="${h*0.825}" font-family="Arial, sans-serif" font-size="${smallFs}" font-weight="600" letter-spacing="2" text-anchor="end" opacity="0.7">ABSTRACT WATERCOLOR</text>`;
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
    out += oceanWatercolor(id,w,h,p,rnd,index);
    out += textLayer(id,index,w,h,p);
    
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
      <title>ALI STUDIO — Watercolor Wave ${String(index+1).padStart(2,"0")}</title>
      <metadata>Generated locally by ALI STUDIO. Pure Vector Watercolor.</metadata>
      ${out}
    </svg>`;
  }

  function makeCombinedSvg(){
    const {w:pw,h:ph}=dims();
    const count=Number(state.posterCount), cols=Math.min(3,Math.max(1,count)), rows=Math.ceil(count/cols), gap=36;
    const aw=pw*cols+gap*(cols+1), ah=ph*rows+gap*(rows+1);
    let out=`<svg xmlns="http://www.w3.org/2000/svg" width="${aw}" height="${ah}" viewBox="0 0 ${aw} ${ah}">
      <title>ALI STUDIO — Watercolor Collection</title><rect width="${aw}" height="${ah}" fill="#082a45"/>`;
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
    
    // Auto scale grid layout for 3 designs
    let maxCols = Math.min(3, state.posterCount);

    for(let i=0;i<state.posterCount;i++){
      const node=tpl.content.firstElementChild.cloneNode(true), svg=makeSvg(i);
      generated.push(svg);
      const num = node.querySelector(".poster-number");
      const mode = node.querySelector(".poster-mode");
      const frame = node.querySelector(".poster-frame");
      const dBtn = node.querySelector(".download-one");
      const cBtn = node.querySelector(".copy-one");
      
      if(num) num.textContent=`DESIGN ${String(i+1).padStart(2,"0")}`;
      if(mode) mode.textContent=`WATERCOLOR / ${String((i%3)+1).padStart(2,"0")}`;
      if(frame) frame.innerHTML=svg;
      if(dBtn) dBtn.addEventListener("click",()=>download(`ali-studio-watercolor-${String(i+1).padStart(2,"0")}.svg`,svg));
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

  if($("downloadAll")) $("downloadAll").addEventListener("click",()=>download(`ali-studio-watercolor-collection.svg`,makeCombinedSvg()));
  if($("downloadJson")) $("downloadJson").addEventListener("click",()=>download("ali-studio-settings.json",JSON.stringify(state,null,2),"application/json"));
  if($("zoomIn")) $("zoomIn").addEventListener("click",()=>{zoom=clamp(zoom+.1,.5,1.8);applyZoom();});
  if($("zoomOut")) $("zoomOut").addEventListener("click",()=>{zoom=clamp(zoom-.1,.5,1.8);applyZoom();});

  updateOutputs(); render();
})();
