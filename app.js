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

  const state = {
    posterCount:5, designMode:"holographicRibbons", theme:"hologram", depth:"flat",
    shapeSize:100, density:8, seed:260831, format:"portrait", quality:"large", 
    darkColor:"#050505", lightColor:"#e6e4dc"
  };

  let generated = [], zoom = 1;

  function dims(){
    const base = {portrait:{w:1200,h:1800},square:{w:1600,h:1600},landscape:{w:1800,h:1200}}[state.format] || {w:1200,h:1800};
    const q = {standard:1,large:1.35,xl:1.8}[state.quality] || 1.35;
    return {w:Math.round(base.w*q),h:Math.round(base.h*q)};
  }

  function sizeFactor(){ return clamp(Number(state.shapeSize)/100,.35,1.55); }

  // PURE VECTOR MULTI-STOP GRADIENTS (Mimics Iridescent/Holographic Foil perfectly)
  function commonDefs(id, rnd){
    return `<defs>
      <!-- Rainbow Holographic 1 -->
      <linearGradient id="${id}_holo1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#00f2fe"/>
        <stop offset="25%" stop-color="#4facfe"/>
        <stop offset="50%" stop-color="#f093fb"/>
        <stop offset="75%" stop-color="#f5576c"/>
        <stop offset="100%" stop-color="#ffe259"/>
      </linearGradient>
      
      <!-- Reverse Holographic 2 -->
      <linearGradient id="${id}_holo2" x1="100%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#16d9e3"/>
        <stop offset="25%" stop-color="#30c7ec"/>
        <stop offset="50%" stop-color="#46aef7"/>
        <stop offset="75%" stop-color="#b224ef"/>
        <stop offset="100%" stop-color="#ff0844"/>
      </linearGradient>

      <!-- Golden/Magenta Holographic 3 -->
      <linearGradient id="${id}_holo3" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#ff0844"/>
        <stop offset="30%" stop-color="#ffb199"/>
        <stop offset="60%" stop-color="#fad0c4"/>
        <stop offset="100%" stop-color="#ffd1ff"/>
      </linearGradient>

      <!-- Cyan/Blue Deep Holographic 4 -->
      <linearGradient id="${id}_holo4" x1="0%" y1="50%" x2="100%" y2="50%">
        <stop offset="0%" stop-color="#0250c5"/>
        <stop offset="50%" stop-color="#d43f8d"/>
        <stop offset="100%" stop-color="#00f2fe"/>
      </linearGradient>

      <!-- Reusable Star Shape -->
      <g id="${id}_star">
        <path d="M 0,-40 Q 0,0 40,0 Q 0,0 0,40 Q 0,0 -40,0 Q 0,0 0,-40 Z" />
      </g>
    </defs>`;
  }

  // ==========================================
  // REFERENCE IMAGE LAYOUT REPLICATOR: Holographic Engine
  // ==========================================
  function holographicRibbons(id,w,h,rnd,index) {
    let out = "";
    const s = sizeFactor();
    const dark = state.darkColor;
    const light = state.lightColor;

    // 1. Iridescent Vortex (Left Poster)
    if (index % 5 === 0) {
        out += `<rect width="${w}" height="${h}" fill="${dark}"/>`;
        let cx = w/2, cy = h/2 + h*0.05;
        let rings = Math.max(15, Math.floor(Number(state.density)*2.5));
        
        for(let i=rings; i>0; i--) {
            let r = i * (w*0.035 * s);
            let dash1 = r * 0.5 * (0.8 + rnd()*0.4);
            let dash2 = r * 0.2 * (0.8 + rnd()*0.4);
            let grad = `url(#${id}_holo${Math.floor(rnd()*4)+1})`;
            let thick = w * (0.015 + rnd()*0.02);
            out += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${grad}" stroke-width="${thick}" stroke-dasharray="${dash1} ${dash2}" transform="rotate(${i*12 + rnd()*90} ${cx} ${cy})"/>`;
        }

        // Star and Typography
        out += `<use href="#${id}_star" x="${w*0.8}" y="${h*0.2}" fill="#fff" transform="scale(1.5) translate(${-w*0.8*0.33}, ${-h*0.2*0.33})"/>`;
        out += `<use href="#${id}_star" x="${w*0.85}" y="${h*0.55}" fill="#fff" transform="scale(2) translate(${-w*0.85*0.5}, ${-h*0.55*0.5})"/>`;
        
        out += `<text x="${w*0.05}" y="${h*0.18}" font-family="Georgia, serif" font-size="${w*0.28}" font-weight="normal" letter-spacing="-5" fill="#fff">design</text>`;
        out += `<text x="${w*0.06}" y="${h*0.21}" font-family="Arial, sans-serif" font-size="${w*0.02}" font-weight="bold" fill="#fff">Visual System  Creative Layout  Graphic Study</text>`;
        
        return out;
    }
    
    // 2. Origami Folded Ribbon (Second Poster)
    else if (index % 5 === 1) {
        out += `<rect width="${w}" height="${h}" fill="${light}"/>`;
        let startY = h * 0.15;
        let pW = w * 0.65 * s;
        let pH = h * 0.08 * s;
        let cx = w/2;

        let points = [
            {x: cx - pW/2, y: startY}, {x: cx + pW/2, y: startY + pH*0.5},
            {x: cx + pW/2.5, y: startY + pH*2}, {x: cx - pW/1.5, y: startY + pH*2.5},
            {x: cx - pW/2, y: startY + pH*4}, {x: cx + pW/1.5, y: startY + pH*4.5},
            {x: cx + pW/3, y: startY + pH*6}, {x: cx - pW/2.5, y: startY + pH*6.5},
            {x: cx - pW/4, y: startY + pH*8}, {x: cx + pW/2, y: startY + pH*8.5}
        ];

        for(let i=0; i<points.length-1; i++) {
            let p1 = points[i]; let p2 = points[i+1];
            let xOffset = (i%2===0) ? w*0.1 : -w*0.1;
            let poly = `${p1.x},${p1.y} ${p2.x},${p2.y} ${p2.x+xOffset},${p2.y+pH} ${p1.x+xOffset},${p1.y+pH}`;
            let grad = `url(#${id}_holo${(i%4)+1})`;
            out += `<polygon points="${poly}" fill="${grad}"/>`;
        }
        return out;
    }

    // 3. Dynamic Curved Swarms & Grid (Third Poster)
    else if (index % 5 === 2) {
        out += `<rect width="${w}" height="${h}" fill="${dark}"/>`;
        
        // Fine White Grid
        out += `<line x1="${w*0.5}" y1="0" x2="${w*0.5}" y2="${h}" stroke="#ffffff" stroke-width="1.5" opacity="0.6"/>`;
        out += `<line x1="0" y1="${h*0.35}" x2="${w}" y2="${h*0.35}" stroke="#ffffff" stroke-width="1.5" opacity="0.6"/>`;

        // Swarming shapes
        let swarms = Math.max(12, Math.floor(Number(state.density)*2));
        for(let i=0; i<swarms; i++) {
            let cx = w * rnd(); let cy = h * rnd();
            let rx = w * (0.1 + rnd()*0.3) * s; let ry = h * (0.02 + rnd()*0.05) * s;
            let rot = (rnd() * 60) - 30;
            let grad = `url(#${id}_holo${Math.floor(rnd()*4)+1})`;
            out += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" transform="rotate(${rot} ${cx} ${cy})" fill="${grad}"/>`;
        }

        out += `<text x="${w*0.08}" y="${h*0.3}" font-family="Georgia, serif" font-size="${w*0.18}" font-weight="normal" fill="#fff">design</text>`;
        out += `<text x="${w*0.08}" y="${h*0.4}" font-family="Arial, sans-serif" font-size="${w*0.04}" font-weight="bold" fill="#fff">Visual System</text>`;
        out += `<text x="${w*0.08}" y="${h*0.43}" font-family="Arial, sans-serif" font-size="${w*0.04}" font-weight="bold" fill="#fff">Creative Layout</text>`;
        out += `<text x="${w*0.08}" y="${h*0.46}" font-family="Arial, sans-serif" font-size="${w*0.04}" font-weight="bold" fill="#fff">Graphic Study</text>`;

        return out;
    }

    // 4. Split Background Scattered Ribbons (Fourth Poster combination)
    else if (index % 5 === 3) {
        // Draw split colored grid background
        out += `<rect x="0" y="0" width="${w/2}" height="${h/2}" fill="#ff9a00"/>`;
        out += `<rect x="${w/2}" y="0" width="${w/2}" height="${h/2}" fill="#ffffff"/>`;
        out += `<rect x="0" y="${h/2}" width="${w/2}" height="${h/2}" fill="#16d9e3"/>`;
        out += `<rect x="${w/2}" y="${h/2}" width="${w/2}" height="${h/2}" fill="#ffcc00"/>`;
        
        let ribbons = Math.max(6, Math.floor(Number(state.density)));
        for(let i=0; i<ribbons; i++) {
            let x = w * rnd(); let y = h * rnd();
            let width = w * 0.8 * s; let height = h * 0.08 * s;
            let rot = (rnd() > 0.5 ? 45 : -45) + (rnd()*20 - 10);
            let grad = `url(#${id}_holo${Math.floor(rnd()*4)+1})`;
            out += `<rect x="${x - width/2}" y="${y - height/2}" width="${width}" height="${height}" rx="${height/2}" transform="rotate(${rot} ${x} ${y})" fill="${grad}"/>`;
        }

        // Scattered Letters
        const chars = ["d", "e", "s", "i", "g", "n"];
        chars.forEach((c, i) => {
            out += `<text x="${w * (0.2 + (i%3)*0.3)}" y="${h * (0.15 + Math.floor(i/3)*0.2)}" font-family="Georgia, serif" font-size="${w*0.12}" fill="#fff" text-anchor="middle">${c}</text>`;
        });

        out += `<use href="#${id}_star" x="${w*0.25}" y="${h*0.75}" fill="${dark}" transform="scale(3) translate(${-w*0.25*0.66}, ${-h*0.75*0.66})"/>`;
        return out;
    }

    // 5. Holographic Brick Grid (Fifth Poster)
    else {
        out += `<rect width="${w}" height="${h}" fill="${light}"/>`;
        let cols = 6; let rows = 12;
        let colW = w / cols; let rowH = h / rows;
        
        for(let x=0; x<=w; x+=colW) {
            for(let y=-rowH; y<=h; y+=rowH) {
                let offY = (Math.random() > 0.5) ? rowH/2 : 0;
                let grad = `url(#${id}_holo${Math.floor(rnd()*4)+1})`;
                out += `<rect x="${x}" y="${y+offY}" width="${colW+1}" height="${rowH+1}" fill="${grad}"/>`;
            }
        }
        
        // Massive Center Text
        out += `<text x="${w*0.5}" y="${h*0.53}" font-family="Georgia, serif" font-size="${w*0.35}" font-weight="normal" letter-spacing="-5" fill="${dark}" text-anchor="middle">design</text>`;
        out += `<use href="#${id}_star" x="${w*0.8}" y="${h*0.4}" fill="${dark}" transform="scale(1.2) translate(${-w*0.8*0.16}, ${-h*0.4*0.16})"/>`;

        return out;
    }
  }

  function makeSvg(index){
    const {w,h}=dims();
    const rnd=mulberry32((Number(state.seed)||1)+index*7919);
    const id=`ali_${Number(state.seed)||1}_${index}`;
    let out=commonDefs(id, rnd);
    out += holographicRibbons(id,w,h,rnd,index);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
      <title>ALI STUDIO — Holographic Layout ${String(index+1).padStart(2,"0")}</title>
      <metadata>Generated locally by ALI STUDIO. Clean Vibrant Vectors.</metadata>
      ${out}
    </svg>`;
  }

  function makeCombinedSvg(){
    const {w:pw,h:ph}=dims();
    const count=Number(state.posterCount), cols=Math.min(4,Math.max(1,count)), rows=Math.ceil(count/cols), gap=36;
    const aw=pw*cols+gap*(cols+1), ah=ph*rows+gap*(rows+1);
    let out=`<svg xmlns="http://www.w3.org/2000/svg" width="${aw}" height="${ah}" viewBox="0 0 ${aw} ${ah}">
      <title>ALI STUDIO — Holographic Design Collection</title><rect width="${aw}" height="${ah}" fill="#111"/>`;
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
    ["posterCount","shapeSize","density"].forEach(k=>{
        if($(k))state[k]=Number($(k).value)
    });
    ["format","quality","darkColor","lightColor","seed"].forEach(k=>{
        if($(k))state[k]=$(k).value
    });
    state.seed=Number(state.seed)||1;
  }

  function updateOutputs(){
    const map={posterCount:["posterCountVal",v=>v],shapeSize:["shapeSizeVal",v=>`${v}%`],density:["densityVal",v=>v]};
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
      if(mode) mode.textContent=`HOLOGRAPHIC / ${String(i+1).padStart(2,"0")}`;
      if(frame) frame.innerHTML=svg;
      if(dBtn) dBtn.addEventListener("click",()=>download(`ali-studio-holo-${String(i+1).padStart(2,"0")}.svg`,svg));
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

  ["posterCount","shapeSize","density","seed","format","quality","darkColor","lightColor"].forEach(id=>{
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
        updateOutputs(); render();
      });
  }

  if($("downloadAll")) $("downloadAll").addEventListener("click",()=>download(`ali-studio-holo-collection.svg`,makeCombinedSvg()));
  if($("downloadJson")) $("downloadJson").addEventListener("click",()=>download("ali-studio-settings.json",JSON.stringify(state,null,2),"application/json"));
  if($("zoomIn")) $("zoomIn").addEventListener("click",()=>{zoom=clamp(zoom+.1,.5,1.8);applyZoom();});
  if($("zoomOut")) $("zoomOut").addEventListener("click",()=>{zoom=clamp(zoom-.1,.5,1.8);applyZoom();});

  updateOutputs(); render();
})();
