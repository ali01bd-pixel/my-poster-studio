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

  // Includes the new Cyber Neon theme
  const THEMES = {
    cyber:    { dark:"#050814", mid:"#1f0a45", a:"#7000ff", b:"#00f0ff", light:"#e0ffff", text:"#ffffff" },
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
    posterCount:5, designMode:"cyberTopography", theme:"cyber", depth:"flat", motionMode:"static",
    shapeSize:100, density:8, gradientSoftness:72, spacing:24, edgeFade:34, textAmount:55,
    seed:260831, format:"portrait", quality:"large", darkColor:"#050814", lightColor:"#00f0ff"
  };

  let generated = [], zoom = 1;

  function dims(){
    const base = {portrait:{w:1200,h:1800},square:{w:1600,h:1600},landscape:{w:1800,h:1200}}[state.format];
    const q = {standard:1,large:1.35,xl:1.8}[state.quality];
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
    const base = THEMES[state.theme] || THEMES.cyber;
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
    const softness = Math.max(1.5, 2 + (100 - Number(state.gradientSoftness)) * .13);
    const depth = state.depth === "3d";
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
        <stop offset="0%" stop-color="#ffffff" stop-opacity=".90"/>
        <stop offset="20%" stop-color="${p.light}" stop-opacity=".96"/>
        <stop offset="62%" stop-color="${p.a}" stop-opacity=".95"/>
        <stop offset="100%" stop-color="${p.dark}" stop-opacity=".96"/>
      </radialGradient>
      <filter id="${id}_soft" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="${softness}"/>
      </filter>
      <filter id="${id}_shadow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="${depth ? 16 : 7}" stdDeviation="${depth ? 14 : 8}" flood-color="#080715" flood-opacity="${depth ? .48 : .22}"/>
      </filter>
      <filter id="${id}_glow" x="-70%" y="-70%" width="240%" height="240%"><feGaussianBlur stdDeviation="${depth ? 18 : 12}"/></filter>
    </defs>`;
  }

  function addLight(out,id,w,h,rnd,p){
    const fade = Number(state.edgeFade)/100;
    if(fade<=0) return out;
    out += `<ellipse cx="${(w*(.14+rnd()*.20)).toFixed(1)}" cy="${(h*(.08+rnd()*.20)).toFixed(1)}" rx="${(w*.30).toFixed(1)}" ry="${(h*.18).toFixed(1)}" fill="${p.light}" opacity="${(.07+fade*.14).toFixed(2)}" filter="url(#${id}_soft)"/>`;
    out += `<ellipse cx="${(w*(.86-rnd()*.10)).toFixed(1)}" cy="${(h*(.78-rnd()*.10)).toFixed(1)}" rx="${(w*.24).toFixed(1)}" ry="${(h*.17).toFixed(1)}" fill="${p.b}" opacity="${(.06+fade*.10).toFixed(2)}" filter="url(#${id}_soft)"/>`;
    return out;
  }

  // --- NEW: CYBER TOPOGRAPHY DESIGN MODE ---
  function cyberTopography(id,w,h,p,rnd) {
    let out = ""; const s = sizeFactor();
    out += `<rect width="${w}" height="${h}" fill="${p.dark}"/>`;
    const lines = Math.max(12, Math.floor(Number(state.density)*1.8));
    for(let i=0; i<lines; i++) {
      let y = h*(0.15 + (i/lines)*0.7);
      let pts = [];
      for(let x=0; x<=w; x+=w/15) {
        let offY = Math.sin(x*0.01 + i + rnd()*2)*h*0.12*s;
        pts.push(`${x.toFixed(1)},${(y+offY).toFixed(1)}`);
      }
      out += `<polyline points="${pts.join(" ")}" fill="none" stroke="${i%2?p.a:p.b}" stroke-width="${Math.max(3, w*.004).toFixed(1)}" opacity="0.85" filter="url(#${id}_glow)"/>`;
      out += `<polyline points="${pts.join(" ")}" fill="none" stroke="#fff" stroke-width="${Math.max(1, w*.001).toFixed(1)}" opacity="0.4"/>`;
    }
    const cr = Math.min(w,h)*0.2*s;
    out += `<circle cx="${w*0.5}" cy="${h*0.5}" r="${cr}" fill="none" stroke="${p.light}" stroke-width="${Math.max(4, w*.01)}" filter="url(#${id}_shadow)"/>`;
    out += `<circle cx="${w*0.5}" cy="${h*0.5}" r="${cr*1.05}" fill="none" stroke="${p.b}" stroke-dasharray="10 20" stroke-width="${Math.max(2, w*.005)}"/>`;
    return out;
  }

  // --- STANDARD DESIGN MODES ---
  function circleGrid(id,w,h,p,rnd){
    let out=""; const cols=4+(Number(state.density)>12?1:0), rows=6+(Number(state.density)%4), s=sizeFactor();
    const cellW=w/(cols+1), cellH=h/(rows+1), base=Math.min(cellW,cellH)*.43*s;
    for(let row=0;row<rows;row++) for(let col=0;col<cols;col++){
      const x=cellW*(col+1)+Math.sin(row+col)*cellW*.05, y=cellH*(row+1)+Math.cos(col*.8)*cellH*.035;
      const r=base*(.62+rnd()*.48), fill=(row+col)%3===0?`url(#${id}_orb)`:(row%2?`url(#${id}_hero)`:p.b);
      out += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${fill}" opacity=".94" filter="url(#${id}_shadow)"/>`;
    }
    return out;
  }

  function ribbonBars(id,w,h,p,rnd){
    let out=""; const s=sizeFactor(), gap=Number(state.spacing)/100, bars=3+(Number(state.density)%5);
    const barH=h*(.13+.06*s), width=w*(.63+.25*(1-gap));
    for(let i=0;i<bars;i++){
      const y=h*(.17+i*(.74/Math.max(1,bars-1))), dx=(rnd()-.5)*w*.10*gap;
      const rot=(rnd()-.5)*9;
      out += `<g transform="translate(${dx.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(1)})" filter="url(#${id}_shadow)"><rect x="${(-width/2).toFixed(1)}" y="${(-barH/2).toFixed(1)}" width="${width.toFixed(1)}" height="${barH.toFixed(1)}" rx="${(barH*.42).toFixed(1)}" fill="${i%2?`url(#${id}_hero)`:p.a}" opacity=".95"/><rect x="${(-width*.30).toFixed(1)}" y="${(-barH*.28).toFixed(1)}" width="${(width*.62).toFixed(1)}" height="${(barH*.16).toFixed(1)}" rx="20" fill="#fff" opacity=".14"/></g>`;
    }
    return out;
  }

  function spheres(id,w,h,p,rnd){
    let out=""; const s=sizeFactor(), count=5+Math.floor(Number(state.density)/4), min=Math.min(w,h);
    for(let i=0;i<count;i++){
      const x=w*(.16+rnd()*.68), y=h*(.16+rnd()*.66), r=min*(.06+rnd()*.14)*s;
      const fill=i%3===0?`url(#${id}_orb)`:i%3===1?`url(#${id}_hero)`:p.dark;
      out += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${fill}" opacity=".97" filter="url(#${id}_shadow)"/>`;
      if(state.depth==="3d") out += `<ellipse cx="${(x-r*.25).toFixed(1)}" cy="${(y-r*.30).toFixed(1)}" rx="${(r*.32).toFixed(1)}" ry="${(r*.18).toFixed(1)}" fill="#fff" opacity=".36" filter="url(#${id}_soft)"/>`;
    }
    return out;
  }

  function petals(id,w,h,p,rnd){
    let out=""; const cx=w*(.5+rnd()*.08-.04), cy=h*(.49+rnd()*.10-.05), R=Math.min(w,h)*.30*sizeFactor();
    const petals=5+Math.round(Number(state.density)/5);
    for(let i=0;i<petals;i++){
      const a=i*TAU/petals-rnd()*.16, x=cx+Math.cos(a)*R*.56, y=cy+Math.sin(a)*R*.56, rx=R*(.44+rnd()*.26), ry=R*(.17+rnd()*.10);
      const rot=a*180/Math.PI+30;
      out += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" transform="rotate(${rot.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})" fill="${i%2?`url(#${id}_hero)`:p.a}" opacity=".92" filter="url(#${id}_shadow)"/>`;
    }
    out += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(R*.26).toFixed(1)}" fill="url(#${id}_orb)" filter="url(#${id}_shadow)"/>`;
    return out;
  }

  function waves(id,w,h,p,rnd){
    let out=""; const lines=4+Math.floor(Number(state.density)/3), amp=h*.045*sizeFactor();
    for(let j=0;j<lines;j++){
      const y=h*(.18+j*.16), pts=[];
      const segments=16;
      for(let i=0;i<=segments;i++){const x=w*(i/segments); const yy=y+Math.sin(i*.75+j*.9)*amp*(.6+rnd()*.65); pts.push(`${x.toFixed(1)},${yy.toFixed(1)}`)}
      out += `<polyline points="${pts.join(" ")}" fill="none" stroke="${j%2?p.light:p.a}" stroke-width="${Math.max(9,w*.010*sizeFactor()).toFixed(1)}" stroke-linecap="round" opacity="${(.62+j*.05).toFixed(2)}" filter="url(#${id}_shadow)"/>`;
    }
    return out;
  }

  function prisms(id,w,h,p,rnd){
    let out=""; const count=5+Math.floor(Number(state.density)/5), s=sizeFactor();
    for(let i=0;i<count;i++){
      const cx=w*(.16+rnd()*.68), cy=h*(.14+rnd()*.72), r=Math.min(w,h)*(.08+rnd()*.12)*s;
      const pts=[0,1,2,3,4,5].map(k=>{const a=-Math.PI/2+k*TAU/6+(rnd()-.5)*.2; return `${(cx+Math.cos(a)*r).toFixed(1)},${(cy+Math.sin(a)*r).toFixed(1)}`}).join(" ");
      out += `<polygon points="${pts}" fill="${i%2?`url(#${id}_hero)`:p.dark}" opacity=".95" filter="url(#${id}_shadow)"/>`;
      if(state.depth==="3d") out += `<polygon points="${pts}" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width="${Math.max(3,w*.003)}"/>`;
    }
    return out;
  }

  function minimal(id,w,h,p,rnd){
    let out=""; const s=sizeFactor();
    const blocks=3+Math.floor(Number(state.density)/5);
    for(let i=0;i<blocks;i++){
      const x=w*(.12+rnd()*.60), y=h*(.16+rnd()*.64), ww=w*(.14+rnd()*.25)*s, hh=h*(.08+rnd()*.15)*s;
      const rot=(rnd()-.5)*24;
      out += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${ww.toFixed(1)}" height="${hh.toFixed(1)}" rx="${Math.min(80,hh*.35).toFixed(1)}" transform="rotate(${rot.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})" fill="${i%2?`url(#${id}_hero)`:p.a}" opacity=".9" filter="url(#${id}_shadow)"/>`;
    }
    return out;
  }

  function liquid(id,w,h,p,rnd){
    let out=""; const s=sizeFactor();
    const blobs=5+Math.floor(Number(state.density)/4);
    for(let i=0;i<blobs;i++){
      const x=w*(.12+rnd()*.76), y=h*(.14+rnd()*.72), rx=w*(.10+rnd()*.20)*s, ry=h*(.06+rnd()*.16)*s;
      const d=`M ${x-rx} ${y} C ${x-rx*.7} ${y-ry*1.15}, ${x+rx*.2} ${y-ry*.8}, ${x+rx} ${y-rnd()*ry*.1} C ${x+rx*.7} ${y+ry*1.1}, ${x-rx*.1} ${y+ry*.9}, ${x-rx} ${y} Z`;
      out += `<path d="${d}" fill="${i%2?`url(#${id}_hero)`:p.a}" opacity=".92" filter="url(#${id}_shadow)"/>`;
    }
    return out;
  }


  function referenceEditorial(id,w,h,p,rnd,index){
    const s = sizeFactor();
    const blue3 = state.lightColor || "#b9e3ff";
    const bright = "#e7f7ff";
    const black = "#01050b";
    const shadow = `url(#${id}_shadow)`;
    const glow = `url(#${id}_glow)`;
    let out = "";

    if(index % 5 === 0){
      out += `<rect width="${w}" height="${h}" fill="${black}"/>`;
      const r1=Math.min(w,h)*(.35+rnd()*.07)*s, r2=Math.min(w,h)*(.28+rnd()*.06)*s, r3=Math.min(w,h)*(.23+rnd()*.05)*s;
      const c1x=w*(.27+rnd()*.06), c1y=h*(.16+rnd()*.09);
      const c2x=w*(.71+rnd()*.06), c2y=h*(.43+rnd()*.08);
      const c3x=w*(.28+rnd()*.08), c3y=h*(.82-rnd()*.05);
      out += `<circle cx="${c1x.toFixed(1)}" cy="${c1y.toFixed(1)}" r="${r1.toFixed(1)}" fill="url(#${id}_orb)" opacity=".82" filter="${shadow}"/>`;
      out += `<circle cx="${c2x.toFixed(1)}" cy="${c2y.toFixed(1)}" r="${r2.toFixed(1)}" fill="url(#${id}_hero)" opacity=".70" filter="${shadow}"/>`;
      out += `<circle cx="${c3x.toFixed(1)}" cy="${c3y.toFixed(1)}" r="${r3.toFixed(1)}" fill="url(#${id}_dark)" opacity=".95" filter="${shadow}"/>`;
      out += `<circle cx="${c2x.toFixed(1)}" cy="${c2y.toFixed(1)}" r="${(r2+5).toFixed(1)}" fill="none" stroke="${bright}" stroke-opacity=".70" stroke-width="${Math.max(3,w*.0025).toFixed(1)}"/>`;
      return out;
    }
    if(index % 5 === 1){
      out += `<rect width="${w}" height="${h}" fill="${black}"/>`;
      out += `<rect width="${w}" height="${h}" fill="url(#${id}_bg)" opacity=".58"/>`;
      const bx=w*(.34+rnd()*.16), by=h*(.42+rnd()*.12);
      out += `<path d="M ${w*.41} ${h*1.05} C ${w*.40} ${h*.77}, ${w*.28} ${h*.46}, ${w*.45} ${h*.07} C ${w*.59} ${h*.23}, ${w*.66} ${h*.60}, ${w*.54} ${h*1.04} Z" fill="url(#${id}_hero)" opacity=".74" filter="${glow}"/>`;
      out += `<ellipse cx="${bx.toFixed(1)}" cy="${by.toFixed(1)}" rx="${(w*.15).toFixed(1)}" ry="${(h*.36).toFixed(1)}" fill="${bright}" opacity=".22" filter="${glow}"/>`;
      return out;
    }
    if(index % 5 === 2){
      out += `<rect width="${w}" height="${h}" fill="${black}"/>`;
      const steps = Math.max(12, Math.floor(Number(state.density)*1.7));
      const centerX = w*(.48 + (rnd()-.5)*.08), baseY = h*(.72 + rnd()*.07), band = h*.028*s;
      for(let i=0;i<steps;i++){
        const t=i/(steps-1), side=i<steps/2?-1:1, u=Math.abs(t-.5)*2;
        const x=centerX + side*(w*.38*u), y=baseY - h*.23*(1-u) - h*.035*Math.sin(t*10);
        const bh=band*(1.38-.52*u), bw=w*(.026+.020*(1-u));
        const fill=i%3===0?`url(#${id}_orb)`:`url(#${id}_hero)`;
        out += `<rect x="${(x-bw/2).toFixed(1)}" y="${(y-bh/2).toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" fill="${fill}" opacity="${(.34+.50*(1-u)).toFixed(2)}" filter="${shadow}"/>`;
      }
      return out;
    }
    out += `<rect width="${w}" height="${h}" fill="url(#${id}_bg)" opacity=".96"/>`;
    const cx=w*(.78+rnd()*.05), cy=h*(.73+rnd()*.07), arcCount=Math.max(6,Math.floor(Number(state.density)/2));
    for(let i=0;i<arcCount;i++){
      const rx=w*(.30+i*.075), ry=h*(.14+i*.052);
      const startX=cx-rx, startY=cy-ry*.20, endX=cx+rx*.05, endY=cy-ry;
      const curve=`M ${startX.toFixed(1)} ${startY.toFixed(1)} C ${(cx-rx*.52).toFixed(1)} ${(cy-ry*.95).toFixed(1)}, ${(cx-rx*.08).toFixed(1)} ${(cy-ry*1.03).toFixed(1)}, ${endX.toFixed(1)} ${endY.toFixed(1)}`;
      const stroke=i%3===0?bright:p.a;
      out += `<path d="${curve}" fill="none" stroke="${stroke}" stroke-opacity="${(.20+.62*(1-i/arcCount)).toFixed(2)}" stroke-width="${Math.max(3,w*.0035*(1-i*.025)).toFixed(1)}" stroke-linecap="round"/>`;
    }
    return out;
  }

  function pastelEditorial(id,w,h,p,rnd,index){
    const s = sizeFactor(); 
    const C = {bg: "#f1e2d0", cream: "#f8ecd9", peach: "#ffb266", orange: "#ff7b35", coral: "#ff5f6f", pink: "#ee4a9c", yellow: "#ffd86b", ink: "#4b2030"};
    const shadow = `url(#${id}_shadow)`; let out = "";
    if(index % 5 === 0){
      out += `<rect width="${w}" height="${h}" fill="${C.bg}"/>`;
      const cols = Math.max(5, Math.floor(Number(state.density)/2)+2), gap = w/(cols+1);
      for(let i=0;i<cols;i++){
        const x = gap*(i+1), yy = h*(.18 + (i%2)*.10 + rnd()*.05), bh = h*(.18 + rnd()*.16)*s, bw = gap*(.52 + rnd()*.14);
        const col = [C.pink,C.peach,C.orange,C.yellow,C.coral][(i+index)%5];
        out += `<rect x="${(x-bw/2).toFixed(1)}" y="${yy.toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" rx="${(bw*.48).toFixed(1)}" fill="${col}" opacity=".95" filter="${shadow}"/>`;
      }
      return out;
    }
    if(index % 5 === 1){
      out += `<rect width="${w}" height="${h}" fill="${C.bg}"/>`;
      const bars = Math.max(9, Number(state.density)+4), bw = w/(bars*1.6);
      for(let i=0;i<bars;i++){
        const x=w*.13 + i*(w*.74/(bars-1)), bh=h*(.26 + .045*i)*(0.82+rnd()*.30)*s, y=h*.77-bh;
        const fill = i%4===0?C.yellow:(i%4===1?C.peach:(i%4===2?C.orange:C.coral));
        out += `<rect x="${(x-bw/2).toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" fill="${fill}" opacity="${(.25+.58*(i/bars)).toFixed(2)}"/>`;
      }
      return out;
    }
    out += `<rect width="${w}" height="${h}" fill="${C.cream}"/>`;
    const rings = Math.max(6, Math.floor(Number(state.density)/2));
    for(let j=0;j<rings;j++){
        const r=(Math.min(w,h)*.22)*(1-j/rings*.82);
        const col=[C.pink,C.orange,C.yellow,C.coral,C.pink][j%5];
        out += `<circle cx="${(w*.5).toFixed(1)}" cy="${(h*.4).toFixed(1)}" r="${r.toFixed(1)}" fill="none" stroke="${col}" stroke-width="${Math.max(7,r*.18).toFixed(1)}" stroke-opacity="${(.28+.56*(1-j/rings)).toFixed(2)}"/>`;
    }
    return out;
  }

  function layoutByMode(index,w,h,p,rnd,id){
    const mode = state.designMode;
    if(mode === "cyberTopography") return cyberTopography(id,w,h,p,rnd);
    if(mode === "liquid") return liquid(id,w,h,p,rnd);
    if(mode === "glass") return spheres(id,w,h,p,rnd);
    if(mode === "prism") return prisms(id,w,h,p,rnd);
    if(mode === "organic") return petals(id,w,h,p,rnd);
    if(mode === "waves") return waves(id,w,h,p,rnd);
    if(mode === "minimal") return minimal(id,w,h,p,rnd);
    if(mode === "blueEditorial") return referenceEditorial(id,w,h,p,rnd,index);
    if(mode === "pastelEditorial") return pastelEditorial(id,w,h,p,rnd,index);
    const options=[cyberTopography,circleGrid,ribbonBars,spheres,prisms,petals,waves,liquid,minimal];
    const fn=options[index%options.length];
    return fn(id,w,h,p,rnd);
  }

  function textLayer(id,index,w,h,p){
    const amount=Number(state.textAmount)/100;
    if(amount<=0) return "";
    const titles = ["DYNAMIC MOTION","CYBER SYSTEM","SOFT IMPACT","NEW DIMENSION","VISUAL ENERGY","LIQUID SYSTEM","LIGHT / VOLUME","MODERN OBJECT"];
    const title=titles[index%titles.length];
    const fs=Math.max(18,Math.round(Math.min(w,h)*.026));
    const sub = ["ABSTRACT SERIES","GENERATIVE STUDY","EDITED IN SVG","DESIGN OBJECT","COLOR EXPLORATION"][index%5];
    const fill=index%4===1?"#e0e0e0":"#ffffff";
    return `<g font-family="Arial, Helvetica, sans-serif" fill="${fill}" opacity="${(.68+.28*amount).toFixed(2)}">
      <text x="${(w*.08).toFixed(1)}" y="${(h*.10).toFixed(1)}" font-size="${fs}" font-weight="800" letter-spacing="${Math.max(2,fs*.18).toFixed(1)}">${esc(title)}</text>
      <text x="${(w*.08).toFixed(1)}" y="${(h*.13).toFixed(1)}" font-size="${Math.round(fs*.38)}" letter-spacing="${Math.max(1,fs*.07).toFixed(1)}">${esc(sub)}</text>
      <text x="${(w*.08).toFixed(1)}" y="${(h*.92).toFixed(1)}" font-size="${Math.round(fs*.34)}" font-weight="700" letter-spacing="${Math.max(1,fs*.08).toFixed(1)}">ALI STUDIO 2.0 / ${String(index+1).padStart(2,"0")}</text>
      <text x="${(w*.08).toFixed(1)}" y="${(h*.946).toFixed(1)}" font-size="${Math.round(fs*.25)}" letter-spacing="${Math.max(1,fs*.055).toFixed(1)}">${state.depth === "3d" ? "DIMENSIONAL SVG SERIES" : "VIBRANT MOTION SERIES"}</text>
    </g>`;
  }

  function makeSvg(index){
    const {w,h}=dims();
    const rnd=mulberry32((Number(state.seed)||1)+index*7919);
    const p=palette(index);
    const id=`ali_${Number(state.seed)||1}_${index}`;
    let out=commonDefs(id,p,rnd);
    out += `<rect width="${w}" height="${h}" fill="url(#${id}_bg)"/>`;
    
    if(state.depth === "3d"){
      out += `<ellipse cx="${(w*.50).toFixed(1)}" cy="${(h*.58).toFixed(1)}" rx="${(w*.36).toFixed(1)}" ry="${(h*.20).toFixed(1)}" fill="#000" opacity=".46" filter="url(#${id}_soft)"/>`;
      out += `<circle cx="${(w*.83).toFixed(1)}" cy="${(h*.16).toFixed(1)}" r="${(Math.min(w,h)*.09).toFixed(1)}" fill="${p.light}" opacity=".25" filter="url(#${id}_glow)"/>`;
    }
    
    // Core Layout Generation
    let layoutOut = layoutByMode(index,w,h,p,rnd,id);
    
    // SVG Motion logic
    if (state.motionMode !== 'static') {
        const cx = w/2; const cy = h/2;
        if (state.motionMode === 'breathe') {
            layoutOut = `<g style="transform-origin: ${cx}px ${cy}px;"><animateTransform attributeName="transform" type="scale" values="1; 1.04; 0.96; 1" keyTimes="0; 0.3; 0.7; 1" dur="${8+rnd()*4}s" repeatCount="indefinite" />${layoutOut}</g>`;
        } else if (state.motionMode === 'orbit') {
            layoutOut = `<g style="transform-origin: ${cx}px ${cy}px;"><animateTransform attributeName="transform" type="rotate" values="0;360" dur="${30+rnd()*20}s" repeatCount="indefinite" />${layoutOut}</g>`;
        } else if (state.motionMode === 'drift') {
            layoutOut = `<g><animateTransform attributeName="transform" type="translate" values="0 0; ${w*.03} ${h*.03}; -${w*.03} ${h*.01}; 0 0" dur="${12+rnd()*6}s" repeatCount="indefinite" />${layoutOut}</g>`;
        }
    }

    out += layoutOut;
    out = addLight(out,id,w,h,rnd,p);
    out += textLayer(id,index,w,h,p);
    
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
      <title>ALI STUDIO — ${esc(state.theme)} ${state.depth === "3d" ? "3D" : "Flat"} Design ${String(index+1).padStart(2,"0")}</title>
      <metadata>Generated locally by ALI STUDIO. All visible artwork is SVG.</metadata>
      ${out}
    </svg>`;
  }

  function makeCombinedSvg(){
    const {w:pw,h:ph}=dims();
    const count=Number(state.posterCount), cols=Math.min(4,Math.max(1,count)), rows=Math.ceil(count/cols), gap=36;
    const aw=pw*cols+gap*(cols+1), ah=ph*rows+gap*(rows+1);
    let out=`<svg xmlns="http://www.w3.org/2000/svg" width="${aw}" height="${ah}" viewBox="0 0 ${aw} ${ah}">
      <title>ALI STUDIO — Vibrant Design Collection</title><rect width="${aw}" height="${ah}" fill="#050814"/>`;
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

  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  function readControls(){
    ["posterCount","shapeSize","density","gradientSoftness","spacing","edgeFade","textAmount"].forEach(k=>{
        if($(k)) state[k] = Number($(k).value);
    });
    ["designMode","theme","format","quality","darkColor","lightColor","seed", "motionMode"].forEach(k=>{
        if($(k)) state[k] = $(k).value;
    });
    state.seed=Number(state.seed)||1;
    // Capture segment button manually
    const activeSeg = document.querySelector(".segment.active");
    if(activeSeg) state.depth = activeSeg.dataset.depth;
  }

  function updateOutputs(){
    const map={
        posterCount:["posterCountVal",v=>v],
        shapeSize:["shapeSizeVal",v=>`${v}%`],
        density:["densityVal",v=>v],
        gradientSoftness:["gradientSoftnessVal",v=>`${v}%`],
        spacing:["spacingVal",v=>`${v}%`],
        edgeFade:["edgeFadeVal",v=>`${v}%`],
        textAmount:["textAmountVal",v=>`${v}%`]
    };
    Object.entries(map).forEach(([id,[oid,fn]])=>{
        if($(oid) && $(id)) $(oid).textContent=fn($(id).value);
    });
    
    if($("collectionCount") && $("posterCount")) $("collectionCount").textContent=$("posterCount").value;
    
    const dMode = $("designMode");
    if(dMode && $("workspaceTitle")) $("workspaceTitle").textContent = (dMode.options[dMode.selectedIndex].text).toUpperCase();
    
    if($("statusMode")) $("statusMode").textContent=state.depth === "3d" ? "3D DEPTH GENERATOR" : "VIBRANT GENERATOR";
    if($("statusText")) $("statusText").textContent=state.depth === "3d" ? "Editable light + depth effects enabled" : "Unique look for every poster";
    if($("workspaceSubtitle")) $("workspaceSubtitle").textContent = state.depth === "3d" ? "Each design gets a different dimensional composition with editable SVG lighting." : "Every card gets a different composition and coordinated color palette.";
  }

  // ==========================================
  // SCROLLING OVERFLOW BUG FIX 
  // ==========================================
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

  function render(){
    try {
        readControls(); updateOutputs(); generated=[];
        const grid=$("posterGrid"); 
        if(!grid) return;
        grid.innerHTML="";
        const tpl=$("posterTemplate");
        if(!tpl) return;
        
        for(let i=0;i<state.posterCount;i++){
          const node=tpl.content.firstElementChild.cloneNode(true);
          const svg=makeSvg(i);
          generated.push(svg);
          
          let pNum = node.querySelector(".poster-number");
          let pMode = node.querySelector(".poster-mode");
          let pFrame = node.querySelector(".poster-frame");
          let dBtn = node.querySelector(".download-one");
          let cBtn = node.querySelector(".copy-one");

          if(pNum) pNum.textContent=`DESIGN ${String(i+1).padStart(2,"0")}`;
          if(pMode) pMode.textContent=`${state.depth.toUpperCase()} / ${String(i+1).padStart(2,"0")}`;
          if(pFrame) pFrame.innerHTML=svg;
          if(dBtn) dBtn.addEventListener("click",()=>download(`ali-studio-${state.theme}-${state.depth}-${String(i+1).padStart(2,"0")}.svg`,svg));
          if(cBtn) cBtn.addEventListener("click",()=>copyText(svg));
          grid.appendChild(node);
        }
        grid.style.gridTemplateColumns=`repeat(${Math.min(4,state.posterCount)},minmax(0,1fr))`;
        applyZoom();
    } catch (e) {
        console.error("Render Error:", e);
    }
  }

  // ==========================================
  // EVENT BINDINGS
  // ==========================================
  ["posterCount","designMode","theme","shapeSize","density","gradientSoftness","spacing","edgeFade","textAmount","seed","format","quality","darkColor","lightColor", "motionMode"].forEach(id=>{
    let el = $(id);
    if(el) {
        el.addEventListener("input",()=>{updateOutputs();render();});
        el.addEventListener("change",()=>{updateOutputs();render();});
    }
  });

  document.querySelectorAll(".segment").forEach(btn=>btn.addEventListener("click",()=>{
    document.querySelectorAll(".segment").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active"); state.depth=btn.dataset.depth; updateOutputs(); render();
  }));

  if($("regenerate")) $("regenerate").addEventListener("click",render);
  if($("randomize")) $("randomize").addEventListener("click",()=>{
    if($("seed")) $("seed").value=Math.floor(Math.random()*99999999)+1;
    if($("shapeSize")) $("shapeSize").value=60+Math.floor(Math.random()*86);
    if($("density")) $("density").value=4+Math.floor(Math.random()*13);
    if($("gradientSoftness")) $("gradientSoftness").value=48+Math.floor(Math.random()*53);
    if($("spacing")) $("spacing").value=10+Math.floor(Math.random()*51);
    if($("edgeFade")) $("edgeFade").value=12+Math.floor(Math.random()*65);
    
    const themes=Object.keys(THEMES); 
    if($("theme")) $("theme").value=themes[Math.floor(Math.random()*themes.length)];
    
    const modes=["cyberTopography","vibrantMix","blueEditorial","pastelEditorial","liquid","glass","prism","organic","waves","minimal"]; 
    if($("designMode")) $("designMode").value=modes[Math.floor(Math.random()*modes.length)];
    
    updateOutputs(); render();
  });

  if($("downloadAll")) $("downloadAll").addEventListener("click",()=>download(`ali-studio-${state.theme}-${state.depth}-collection.svg`,makeCombinedSvg()));
  if($("downloadJson")) $("downloadJson").addEventListener("click",()=>download("ali-studio-settings.json",JSON.stringify(state,null,2),"application/json"));
  
  if($("zoomIn")) $("zoomIn").addEventListener("click",()=>{zoom=clamp(zoom+.1,.3,2);applyZoom();});
  if($("zoomOut")) $("zoomOut").addEventListener("click",()=>{zoom=clamp(zoom-.1,.3,2);applyZoom();});

  // START ENGINE
  updateOutputs(); 
  render();
})();
