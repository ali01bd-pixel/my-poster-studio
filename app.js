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

  // Includes the exact color palette from your reference image
  const THEMES = {
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
    posterCount:5, designMode:"vibrantGradientFlow", theme:"neonFlow", depth:"flat",
    shapeSize:100, density:8, gradientSoftness:72, textAmount:55,
    seed:260831, format:"portrait", quality:"large", darkColor:"#0a0a0a", lightColor:"#ffd2a6"
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
    const base = THEMES[state.theme] || THEMES.neonFlow;
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

  // Pure Vector Gradients (Zero SVG Effects/Filters)
  function commonDefs(id,p,rnd){
    return `<defs>
      <!-- Diagonal Purple to Orange -->
      <linearGradient id="${id}_grad1" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="${p.mid}"/>
        <stop offset="40%" stop-color="${p.a}"/>
        <stop offset="70%" stop-color="${p.b}"/>
        <stop offset="100%" stop-color="${p.light}"/>
      </linearGradient>
      <!-- Vertical Dark to Pink -->
      <linearGradient id="${id}_grad2" x1="50%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%" stop-color="${p.dark}"/>
        <stop offset="30%" stop-color="${p.mid}"/>
        <stop offset="100%" stop-color="${p.a}"/>
      </linearGradient>
      <!-- Diagonal Orange to Light -->
      <linearGradient id="${id}_grad3" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${p.light}"/>
        <stop offset="40%" stop-color="${p.b}"/>
        <stop offset="80%" stop-color="${p.a}"/>
        <stop offset="100%" stop-color="${p.mid}"/>
      </linearGradient>
    </defs>`;
  }

  // ==========================================
  // REFERENCE IMAGE LAYOUT REPLICATOR
  // ==========================================
  function vibrantGradientFlow(id,w,h,p,rnd,index) {
    let out = `<rect width="${w}" height="${h}" fill="${p.dark}"/>`;
    const s = sizeFactor();

    if (index % 5 === 0) {
        // Poster 1: Floating Orbs
        out += `<ellipse cx="${w*0.3}" cy="${h*0.6}" rx="${w*0.5*s}" ry="${h*0.35*s}" transform="rotate(35 ${w*0.3} ${h*0.6})" fill="url(#${id}_grad1)" opacity="0.95"/>`;
        out += `<ellipse cx="${w*0.8}" cy="${h*0.2}" rx="${w*0.4*s}" ry="${h*0.3*s}" transform="rotate(-30 ${w*0.8} ${h*0.2})" fill="url(#${id}_grad2)" opacity="0.9"/>`;
        out += `<ellipse cx="${w*0.4}" cy="${h*0.95}" rx="${w*0.45*s}" ry="${h*0.25*s}" transform="rotate(-15 ${w*0.4} ${h*0.95})" fill="url(#${id}_grad3)" opacity="0.95"/>`;
        return out;
    }
    else if (index % 5 === 1) {
        // Poster 2: Diagonal Blades
        const blades = 12 + Math.floor(Number(state.density));
        for(let i=0; i<blades; i++) {
            let x = w * (rnd() * 1.4 - 0.2);
            let bw = w * (0.02 + rnd()*0.05) * s;
            let bh = h * 1.5;
            let grad = rnd() > 0.5 ? `url(#${id}_grad1)` : `url(#${id}_grad3)`;
            out += `<rect x="${x}" y="${-h*0.2}" width="${bw}" height="${bh}" transform="rotate(25 ${x} ${-h*0.2})" fill="${grad}" opacity="0.95"/>`;
        }
        return out;
    }
    else if (index % 5 === 2) {
        // Poster 3: Soft Diagonal Pills
        const pills = 3 + Math.floor(Number(state.density)/4);
        for(let i=0; i<pills; i++) {
            let x = w * (rnd() * 1.5 - 0.5);
            let y = h * (rnd() * 1.2 - 0.2);
            let bw = w * 1.8 * s;
            let bh = h * (0.2 + rnd()*0.15) * s;
            let grad = rnd() > 0.5 ? `url(#${id}_grad1)` : `url(#${id}_grad2)`;
            out += `<rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="${bh/2}" transform="rotate(-40 ${x} ${y})" fill="${grad}" opacity="0.9"/>`;
        }
        return out;
    }
    else if (index % 5 === 3) {
        // Poster 4: Overlapping Rings/Crescents
        out += `<circle cx="${w*0.15}" cy="${h*0.45}" r="${w*0.45*s}" fill="url(#${id}_grad3)" opacity="0.95"/>`;
        out += `<circle cx="${w*0.8}" cy="${h*0.6}" r="${w*0.5*s}" fill="url(#${id}_grad1)" opacity="0.95"/>`;
        // Hard Cutout to make it a crescent ring
        out += `<circle cx="${w*0.95}" cy="${h*0.6}" r="${w*0.35*s}" fill="${p.dark}"/>`;
        return out;
    }
    else {
        // Poster 5: Woven Orthogonal Grid
        const bars = 8 + Math.floor(Number(state.density));
        for(let i=0; i<bars; i++) {
            let x = w * rnd();
            let bw = w * (0.04 + rnd()*0.06) * s;
            let bh = h * (0.4 + rnd()*0.6);
            let y = h * (rnd() * 0.5);
            out += `<rect x="${x}" y="${y}" width="${bw}" height="${bh}" fill="url(#${id}_grad2)" opacity="0.95"/>`;
        }
        for(let i=0; i<bars; i++) {
            let y = h * rnd();
            let bh = h * (0.03 + rnd()*0.05) * s;
            let bw = w * (0.5 + rnd()*0.5);
            let x = w * (rnd() * 0.5);
            out += `<rect x="${x}" y="${y}" width="${bw}" height="${bh}" fill="url(#${id}_grad1)" opacity="0.95"/>`;
        }
        return out;
    }
  }

  function textLayer(id,index,w,h,p){
    const amount=Number(state.textAmount)/100;
    if(amount<=0) return "";
    
    const fill = "#ffffff";
    const fs = Math.max(22, Math.round(Math.min(w,h)*0.035));
    const smallFs = Math.max(10, Math.round(fs*0.4));
    let textOut = `<g font-family="Arial, Helvetica, sans-serif" fill="${fill}" opacity="${(.8+.2*amount).toFixed(2)}">`;

    // Dynamic placement matching the reference image layout
    if (index % 5 === 0) {
        textOut += `<text x="${w*0.08}" y="${h*0.25}" font-size="${smallFs}" font-weight="400" letter-spacing="1">vibrant gradient design</text>`;
        textOut += `<text x="${w*0.08}" y="${h*0.25 + smallFs*1.5}" font-size="${smallFs}" font-weight="400" letter-spacing="1">for web, social media,</text>`;
        textOut += `<text x="${w*0.08}" y="${h*0.25 + smallFs*3}" font-size="${smallFs}" font-weight="400" letter-spacing="1">presentation &amp; more.</text>`;
        textOut += `<circle cx="${w*0.09}" cy="${h*0.35}" r="${w*0.01}" fill="#fff"/>`;
        textOut += `<circle cx="${w*0.12}" cy="${h*0.35}" r="${w*0.01}" fill="#fff"/>`;
        textOut += `<circle cx="${w*0.15}" cy="${h*0.35}" r="${w*0.01}" fill="#fff"/>`;
    }
    else if (index % 5 === 1) {
        textOut += `<text x="${w*0.92}" y="${h*0.12}" font-size="${fs}" font-weight="900" letter-spacing="2" text-anchor="end">GRADIENT</text>`;
        textOut += `<text x="${w*0.92}" y="${h*0.12 + fs*1.2}" font-size="${fs}" font-weight="400" letter-spacing="1" text-anchor="end">DESIGN</text>`;
        textOut += `<circle cx="${w*0.1}" cy="${h*0.9}" r="${w*0.01}" fill="#fff"/>`;
        textOut += `<circle cx="${w*0.13}" cy="${h*0.9}" r="${w*0.01}" fill="#fff"/>`;
        textOut += `<circle cx="${w*0.16}" cy="${h*0.9}" r="${w*0.01}" fill="#fff"/>`;
    }
    else if (index % 5 === 2) {
        textOut += `<text x="${w*0.5}" y="${h*0.5}" font-size="${fs}" font-weight="800" letter-spacing="2" text-anchor="middle">ABSTRACT</text>`;
        textOut += `<text x="${w*0.5}" y="${h*0.5 + fs*0.6}" font-size="${smallFs}" font-weight="400" letter-spacing="1" text-anchor="middle">BACKGROUND</text>`;
    }
    else if (index % 5 === 3) {
        textOut += `<text x="${w*0.92}" y="${h*0.8}" font-size="${smallFs}" font-weight="400" letter-spacing="1" text-anchor="end">vibrant gradient design</text>`;
        textOut += `<text x="${w*0.92}" y="${h*0.8 + smallFs*1.5}" font-size="${smallFs}" font-weight="400" letter-spacing="1" text-anchor="end">presentation &amp; more.</text>`;
        textOut += `<circle cx="${w*0.86}" cy="${h*0.88}" r="${w*0.01}" fill="#fff"/>`;
        textOut += `<circle cx="${w*0.89}" cy="${h*0.88}" r="${w*0.01}" fill="#fff"/>`;
        textOut += `<circle cx="${w*0.92}" cy="${h*0.88}" r="${w*0.01}" fill="#fff"/>`;
    }
    else if (index % 5 === 4) {
        textOut += `<text x="${w*0.3}" y="${h*0.2}" font-size="${fs}" font-weight="900" letter-spacing="2" font-style="italic">GRADIENT</text>`;
        textOut += `<text x="${w*0.3 + fs*4.5}" y="${h*0.2}" font-size="${smallFs}" font-weight="400" letter-spacing="1">BACKGROUND</text>`;
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
    out += vibrantGradientFlow(id,w,h,p,rnd,index);
    out += textLayer(id,index,w,h,p);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
      <title>ALI STUDIO — ${esc(state.theme)} Gradient Flow ${String(index+1).padStart(2,"0")}</title>
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
      if(mode) mode.textContent=`GRADIENTS / ${String(i+1).padStart(2,"0")}`;
      if(frame) frame.innerHTML=svg;
      if(dBtn) dBtn.addEventListener("click",()=>download(`ali-studio-${state.theme}-gradient-${String(i+1).padStart(2,"0")}.svg`,svg));
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

  if($("downloadAll")) $("downloadAll").addEventListener("click",()=>download(`ali-studio-${state.theme}-gradient-collection.svg`,makeCombinedSvg()));
  if($("downloadJson")) $("downloadJson").addEventListener("click",()=>download("ali-studio-settings.json",JSON.stringify(state,null,2),"application/json"));
  if($("zoomIn")) $("zoomIn").addEventListener("click",()=>{zoom=clamp(zoom+.1,.5,1.8);applyZoom();});
  if($("zoomOut")) $("zoomOut").addEventListener("click",()=>{zoom=clamp(zoom-.1,.5,1.8);applyZoom();});

  updateOutputs(); render();
})();
