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
    posterCount:5, designMode:"sharpBeams", theme:"crimson", depth:"flat",
    shapeSize:100, density:8, gradientSoftness:72, spacing:24, edgeFade:34, textAmount:55,
    seed:260831, format:"portrait", quality:"large", darkColor:"#1a0404", lightColor:"#ffecd6"
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

  function sharpBeams(id,w,h,p,rnd,index) {
    const s = sizeFactor();
    const shadowColor = mixHex(p.dark, "#000000", 0.6);
    let out = "";

    if(index % 5 === 0) {
        out += `<rect width="${w}" height="${h}" fill="url(#${id}_dark)"/>`;
        const steps = Math.max(12, Math.floor(Number(state.density)*2));
        for(let i=0; i<steps; i++) {
            let scale = 1 - (i/steps);
            let rX = w * 1.6 * scale * s;
            let rY = h * 1.3 * scale * s;
            let cx = w * 0.9 - (i * w * 0.02);
            let cy = h * 0.8 + (i * h * 0.01);
            let fill = i%2===0 ? `url(#${id}_hero)` : p.light;
            if(i > steps - 4) fill = p.light;
            if(state.depth==="3d") out += `<ellipse cx="${cx+15}" cy="${cy+15}" rx="${rX}" ry="${rY}" fill="${shadowColor}" opacity="0.3"/>`;
            out += `<ellipse cx="${cx}" cy="${cy}" rx="${rX}" ry="${rY}" fill="${fill}" />`;
        }
        return out;
    }
    
    if(index % 5 === 1) {
        out += `<rect width="${w}" height="${h}" fill="${p.dark}"/>`;
        const blades = Math.max(8, Math.floor(Number(state.density)*1.5));
        for(let i=0; i<blades; i++) {
            let x1 = w * (rnd() * 1.2 - 0.2);
            let y1 = -h * 0.2;
            let x2 = w * (rnd() * 1.5 - 0.2);
            let y2 = h * 1.2;
            let ctrlX = w * (rnd() * 0.5);
            let ctrlY = h * 0.5;
            let thick = w * (0.15 + rnd()*0.15) * s;
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
            let angle1 = -Math.PI/2 + (i/beams) * Math.PI; 
            let angle2 = -Math.PI/2 + ((i+0.6)/beams) * Math.PI;
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
            let cx = w * (rnd() > 0.5 ? 0.1 : 0.9);
            let cy = h * (rnd() > 0.5 ? 0.1 : 0.9);
            let rot = rnd() * 180;
            let bw = w * 3;
            let bh = h * (0.15 + rnd()*0.15) * s;
            let fill = i%2===0 ? `url(#${id}_hero)` : `url(#${id}_dark)`;
            if(state.depth==="3d") out += `<rect x="${cx-bw/2+15}" y="${cy-bh/2+15}" width="${bw}" height="${bh}" transform="rotate(${rot} ${cx+15} ${cy+15})" fill="${shadowColor}" opacity="0.5"/>`;
            out += `<rect x="${cx-bw/2}" y="${cy-bh/2}" width="${bw}" height="${bh}" transform="rotate(${rot} ${cx} ${cy})" fill="${fill}"/>`;
        }
        return out;
    }

    out += `<rect width="${w}" height="${h}" fill="${p.light}"/>`;
    const spikes = Math.max(10, Number(state.density)*2);
    const cx = w*0.5, cy = h*0.5;
    const inR = w * 0.35 * s;
    const outR = Math.max(w,h) * 1.5;
    for(let i=0; i<spikes; i++) {
        let a1 = (i/spikes) * TAU;
        let a2 = ((i+1)/spikes) * TAU;
        let x1 = cx + Math.cos(a1)*inR; let y1 = cy + Math.sin(a1)*inR;
        let ox1 = cx + Math.cos(a1 - 0.2)*outR; let oy1 = cy + Math.sin(a1 - 0.2)*outR;
        let ox2 = cx + Math.cos(a2 - 0.2)*outR; let oy2 = cy + Math.sin(a2 - 0.2)*outR;
        let fill = `url(#${id}_hero)`; 
        let pts = `${x1},${y1} ${ox1},${oy1} ${ox2},${oy2}`;
        if(state.depth==="3d") out += `<polygon points="${pts}" transform="translate(10, 10)" fill="${shadowColor}" opacity="0.3"/>`;
        out += `<polygon points="${pts}" fill="${fill}"/>`;
    }
    return out;
  }

  function circleGrid(id,w,h,p,rnd){
    let out=""; const cols=4+(Number(state.density)>12?1:0), rows=6+(Number(state.density)%4), s=sizeFactor();
    const shadowColor = mixHex(p.dark, "#000000", 0.6);
    const cellW=w/(cols+1), cellH=h/(rows+1), base=Math.min(cellW,cellH)*.43*s;
    for(let row=0;row<rows;row++) for(let col=0;col<cols;col++){
      const x=cellW*(col+1)+Math.sin(row+col)*cellW*.05, y=cellH*(row+1)+Math.cos(col*.8)*cellH*.035;
      const r=base*(.62+rnd()*.48), fill=(row+col)%3===0?`url(#${id}_orb)`:(row%2?`url(#${id}_hero)`:p.b);
      if(state.depth==="3d") out += `<circle cx="${(x+14).toFixed(1)}" cy="${(y+14).toFixed(1)}" r="${r.toFixed(1)}" fill="${shadowColor}" opacity="0.5"/>`;
      out += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r.toFixed(1)}" fill="${fill}"/>`;
    }
    return out;
  }

  function ribbonBars(id,w,h,p,rnd){
    let out=""; const s=sizeFactor(), gap=Number(state.spacing)/100, bars=3+(Number(state.density)%5);
    const barH=h*(.13+.06*s), width=w*(.63+.25*(1-gap));
    const shadowColor = mixHex(p.dark, "#000000", 0.6);
    for(let i=0;i<bars;i++){
      const y=h*(.17+i*(.74/Math.max(1,bars-1))), dx=(rnd()-.5)*w*.10*gap;
      const rot=(rnd()-.5)*9;
      if(state.depth==="3d") out += `<g transform="translate(${(dx+14).toFixed(1)} ${(y+14).toFixed(1)}) rotate(${rot.toFixed(1)})"><rect x="${(-width/2).toFixed(1)}" y="${(-barH/2).toFixed(1)}" width="${width.toFixed(1)}" height="${barH.toFixed(1)}" rx="${(barH*.42).toFixed(1)}" fill="${shadowColor}" opacity="0.5"/></g>`;
      out += `<g transform="translate(${dx.toFixed(1)} ${y.toFixed(1)}) rotate(${rot.toFixed(1)})"><rect x="${(-width/2).toFixed(1)}" y="${(-barH/2).toFixed(1)}" width="${width.toFixed(1)}" height="${barH.toFixed(1)}" rx="${(barH*.42).toFixed(1)}" fill="${i%2?`url(#${id}_hero)`:p.a}"/><rect x="${(-width*.30).toFixed(1)}" y="${(-barH*.28).toFixed(1)}" width="${(width*.62).toFixed(1)}" height="${(barH*.16).toFixed(1)}" rx="20" fill="#fff" opacity=".25"/></g>`;
    }
    return out;
  }

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
    if(state.depth==="3d") out += `<circle cx="${(cx+10).toFixed(1)}" cy="${(cy+10).toFixed(1)}" r="${(R*.26).toFixed(1)}" fill="${shadowColor}" opacity="0.4"/>`;
    out += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${(R*.26).toFixed(1)}" fill="url(#${id}_orb)"/>`;
    return out;
  }

  function waves(id,w,h,p,rnd){
    let out=""; const lines=4+Math.floor(Number(state.density)/3), amp=h*.045*sizeFactor();
    const shadowColor = mixHex(p.dark, "#000000", 0.6);
    for(let j=0;j<lines;j++){
      const y=h*(.18+j*.16), pts=[], shadowPts=[];
      const segments=16;
      for(let i=0;i<=segments;i++){
          const x=w*(i/segments); 
          const yy=y+Math.sin(i*.75+j*.9)*amp*(.6+rnd()*.65); 
          pts.push(`${x.toFixed(1)},${yy.toFixed(1)}`);
          shadowPts.push(`${(x+10).toFixed(1)},${(yy+10).toFixed(1)}`);
      }
      if(state.depth==="3d") out += `<polyline points="${shadowPts.join(" ")}" fill="none" stroke="${shadowColor}" stroke-width="${Math.max(9,w*.010*sizeFactor()).toFixed(1)}" stroke-linecap="round" opacity="0.4"/>`;
      out += `<polyline points="${pts.join(" ")}" fill="none" stroke="${j%2?p.light:p.a}" stroke-width="${Math.max(9,w*.010*sizeFactor()).toFixed(1)}" stroke-linecap="round" opacity="${(.8+j*.05).toFixed(2)}"/>`;
    }
    return out;
  }

  function prisms(id,w,h,p,rnd){
    let out=""; const count=5+Math.floor(Number(state.density)/5), s=sizeFactor();
    const shadowColor = mixHex(p.dark, "#000000", 0.6);
    for(let i=0;i<count;i++){
      const cx=w*(.16+rnd()*.68), cy=h*(.14+rnd()*.72), r=Math.min(w,h)*(.08+rnd()*.12)*s;
      const pts=[0,1,2,3,4,5].map(k=>{const a=-Math.PI/2+k*TAU/6+(rnd()-.5)*.2; return `${(cx+Math.cos(a)*r).toFixed(1)},${(cy+Math.sin(a)*r).toFixed(1)}`}).join(" ");
      const sPts=[0,1,2,3,4,5].map(k=>{const a=-Math.PI/2+k*TAU/6+(rnd()-.5)*.2; return `${(cx+14+Math.cos(a)*r).toFixed(1)},${(cy+14+Math.sin(a)*r).toFixed(1)}`}).join(" ");
      
      if(state.depth==="3d") out += `<polygon points="${sPts}" fill="${shadowColor}" opacity="0.5"/>`;
      out += `<polygon points="${pts}" fill="${i%2?`url(#${id}_hero)`:p.dark}"/>`;
      if(state.depth==="3d") out += `<polygon points="${pts}" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width="${Math.max(3,w*.003)}"/>`;
    }
    return out;
  }

  function minimal(id,w,h,p,rnd){
    let out=""; const s=sizeFactor();
    const blocks=3+Math.floor(Number(state.density)/5);
    const shadowColor = mixHex(p.dark, "#000000", 0.6);
    for(let i=0;i<blocks;i++){
      const x=w*(.12+rnd()*.60), y=h*(.16+rnd()*.64), ww=w*(.14+rnd()*.25)*s, hh=h*(.08+rnd()*.15)*s;
      const rot=(rnd()-.5)*24;
      if(state.depth==="3d") out += `<rect x="${(x+14).toFixed(1)}" y="${(y+14).toFixed(1)}" width="${ww.toFixed(1)}" height="${hh.toFixed(1)}" rx="${Math.min(80,hh*.35).toFixed(1)}" transform="rotate(${rot.toFixed(1)} ${(x+14).toFixed(1)} ${(y+14).toFixed(1)})" fill="${shadowColor}" opacity="0.4"/>`;
      out += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${ww.toFixed(1)}" height="${hh.toFixed(1)}" rx="${Math.min(80,hh*.35).toFixed(1)}" transform="rotate(${rot.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)})" fill="${i%2?`url(#${id}_hero)`:p.a}"/>`;
    }
    return out;
  }

  function liquid(id,w,h,p,rnd){
    let out=""; const s=sizeFactor();
    const blobs=5+Math.floor(Number(state.density)/4);
    const shadowColor = mixHex(p.dark, "#000000", 0.6);
    for(let i=0;i<blobs;i++){
      const x=w*(.12+rnd()*.76), y=h*(.14+rnd()*.72), rx=w*(.10+rnd()*.20)*s, ry=h*(.06+rnd()*.16)*s;
      const d=`M ${x-rx} ${y} C ${x-rx*.7} ${y-ry*1.15}, ${x+rx*.2} ${y-ry*.8}, ${x+rx} ${y-rnd()*ry*.1} C ${x+rx*.7} ${y+ry*1.1}, ${x-rx*.1} ${y+ry*.9}, ${x-rx} ${y} Z`;
      if(state.depth==="3d") out += `<path d="${d}" transform="translate(14, 14)" fill="${shadowColor}" opacity="0.4"/>`;
      out += `<path d="${d}" fill="${i%2?`url(#${id}_hero)`:p.a}"/>`;
    }
    return out;
  }

  function referenceEditorial(id,w,h,p,rnd,index){
    const s = sizeFactor();
    const blue3 = state.lightColor || "#b9e3ff";
    const bright = "#e7f7ff";
    const black = "#01050b";
    let out = "";

    if(index % 5 === 0){
      out += `<rect width="${w}" height="${h}" fill="${black}"/>`;
      const r1=Math.min(w,h)*(.35+rnd()*.07)*s, r2=Math.min(w,h)*(.28+rnd()*.06)*s, r3=Math.min(w,h)*(.23+rnd()*.05)*s;
      const c1x=w*(.27+rnd()*.06), c1y=h*(.16+rnd()*.09);
      const c2x=w*(.71+rnd()*.06), c2y=h*(.43+rnd()*.08);
      const c3x=w*(.28+rnd()*.08), c3y=h*(.82-rnd()*.05);
      
      out += `<circle cx="${c1x.toFixed(1)}" cy="${c1y.toFixed(1)}" r="${r1.toFixed(1)}" fill="url(#${id}_orb)"/>`;
      out += `<circle cx="${c2x.toFixed(1)}" cy="${c2y.toFixed(1)}" r="${r2.toFixed(1)}" fill="url(#${id}_hero)"/>`;
      out += `<circle cx="${c3x.toFixed(1)}" cy="${c3y.toFixed(1)}" r="${r3.toFixed(1)}" fill="url(#${id}_dark)"/>`;
      out += `<circle cx="${c2x.toFixed(1)}" cy="${c2y.toFixed(1)}" r="${(r2+5).toFixed(1)}" fill="none" stroke="${bright}" stroke-width="${Math.max(3,w*.0025).toFixed(1)}"/>`;
      out += `<ellipse cx="${(w*.45).toFixed(1)}" cy="${(h*.13).toFixed(1)}" rx="${(w*.23).toFixed(1)}" ry="${(h*.11).toFixed(1)}" fill="${blue3}" opacity=".4"/>`;
      return out;
    }

    if(index % 5 === 1){
      out += `<rect width="${w}" height="${h}" fill="${black}"/>`;
      out += `<rect width="${w}" height="${h}" fill="url(#${id}_bg)" opacity=".8"/>`;
      const bx=w*(.34+rnd()*.16), by=h*(.42+rnd()*.12);
      out += `<path d="M ${w*.41} ${h*1.05} C ${w*.40} ${h*.77}, ${w*.28} ${h*.46}, ${w*.45} ${h*.07} C ${w*.59} ${h*.23}, ${w*.66} ${h*.60}, ${w*.54} ${h*1.04} Z" fill="url(#${id}_hero)"/>`;
      out += `<ellipse cx="${bx.toFixed(1)}" cy="${by.toFixed(1)}" rx="${(w*.15).toFixed(1)}" ry="${(h*.36).toFixed(1)}" fill="${bright}" opacity=".4"/>`;
      out += `<ellipse cx="${(bx+w*.04).toFixed(1)}" cy="${(by-h*.05).toFixed(1)}" rx="${(w*.065).toFixed(1)}" ry="${(h*.20).toFixed(1)}" fill="${bright}" opacity=".3"/>`;
      out += `<path d="M ${w*.06} ${h*.84} C ${w*.22} ${h*.68}, ${w*.37} ${h*.58}, ${w*.68} ${h*.28}" fill="none" stroke="${blue3}" stroke-width="${Math.max(10,w*.012)}"/>`;
      return out;
    }

    if(index % 5 === 2){
      out += `<rect width="${w}" height="${h}" fill="${black}"/>`;
      const steps = Math.max(12, Math.floor(Number(state.density)*1.7));
      const centerX = w*(.48 + (rnd()-.5)*.08);
      const baseY = h*(.72 + rnd()*.07);
      const band = h*.028*s;
      for(let i=0;i<steps;i++){
        const t=i/(steps-1), side=i<steps/2?-1:1, u=Math.abs(t-.5)*2;
        const x=centerX + side*(w*.38*u);
        const y=baseY - h*.23*(1-u) - h*.035*Math.sin(t*10);
        const bh=band*(1.38-.52*u), bw=w*(.026+.020*(1-u));
        const fill=i%3===0?`url(#${id}_orb)`:`url(#${id}_hero)`;
        out += `<rect x="${(x-bw/2).toFixed(1)}" y="${(y-bh/2).toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" fill="${fill}"/>`;
      }
      out += `<path d="M ${w*.12} ${h*.82} Q ${w*.49} ${h*.50} ${w*.88} ${h*.82}" fill="none" stroke="${bright}" stroke-width="${Math.max(10,w*.008)}"/>`;
      return out;
    }

    if(index % 5 === 3){
      out += `<rect width="${w}" height="${h}" fill="${black}"/>`;
      const lines=Math.max(24,Math.floor(Number(state.density)*3.6));
      const centerX=w*(.51+rnd()*.04), centerY=h*(.66+rnd()*.08);
      for(let i=0;i<lines;i++){
        const t=i/(lines-1), spread=w*(.08+t*.44), y0=h*(.04+t*.52), leftX=centerX-spread, rightX=centerX+spread;
        const bend=h*(.18+.08*Math.sin(t*TAU));
        const stroke=i%4===0?bright:(i%2?blue3:p.a);
        const sw=Math.max(1.6,w*(.0012+.00075*(1-t)));
        out += `<path d="M ${leftX.toFixed(1)} ${y0.toFixed(1)} C ${(leftX+spread*.40).toFixed(1)} ${(y0+bend).toFixed(1)}, ${(centerX-spread*.28).toFixed(1)} ${(centerY-bend*.30).toFixed(1)}, ${centerX.toFixed(1)} ${centerY.toFixed(1)} C ${(centerX+spread*.28).toFixed(1)} ${(centerY-bend*.18).toFixed(1)}, ${(rightX-spread*.35).toFixed(1)} ${(y0+bend*.8).toFixed(1)}, ${rightX.toFixed(1)} ${y0.toFixed(1)}" fill="none" stroke="${stroke}" stroke-width="${sw.toFixed(1)}"/>`;
      }
      out += `<ellipse cx="${centerX.toFixed(1)}" cy="${centerY.toFixed(1)}" rx="${(w*.18).toFixed(1)}" ry="${(h*.08).toFixed(1)}" fill="${blue3}" opacity=".4"/>`;
      return out;
    }

    out += `<rect width="${w}" height="${h}" fill="url(#${id}_bg)"/>`;
    const cx=w*(.78+rnd()*.05), cy=h*(.73+rnd()*.07), arcCount=Math.max(6,Math.floor(Number(state.density)/2));
    for(let i=0;i<arcCount;i++){
      const rx=w*(.30+i*.075), ry=h*(.14+i*.052);
      const startX=cx-rx, startY=cy-ry*.20, endX=cx+rx*.05, endY=cy-ry;
      const curve=`M ${startX.toFixed(1)} ${startY.toFixed(1)} C ${(cx-rx*.52).toFixed(1)} ${(cy-ry*.95).toFixed(1)}, ${(cx-rx*.08).toFixed(1)} ${(cy-ry*1.03).toFixed(1)}, ${endX.toFixed(1)} ${endY.toFixed(1)}`;
      const stroke=i%3===0?bright:(i%2?blue3:p.a);
      out += `<path d="${curve}" fill="none" stroke="${stroke}" stroke-width="${Math.max(4,w*.0045*(1-i*.025)).toFixed(1)}" stroke-linecap="round"/>`;
    }
    out += `<path d="M ${w*.02} ${h*.28} C ${w*.28} ${h*.06}, ${w*.50} ${h*.12}, ${w*.66} ${h*.30}" fill="none" stroke="${blue3}" stroke-width="${Math.max(5,w*.006)}"/>`;
    return out;
  }

  function pastelEditorial(id,w,h,p,rnd,index){
    const s = sizeFactor();
    const C = {
      bg: "#f1e2d0", cream: "#f8ecd9", peach: "#ffb266", orange: "#ff7b35", 
      coral: "#ff5f6f", pink: "#ee4a9c", rose: "#d62c77", yellow: "#ffd86b", 
      red: "#f23d52", ink: "#4b2030"
    };
    const shadowColor = "rgba(0,0,0,0.15)";
    let out = "";

    if(index % 5 === 0){
      out += `<rect width="${w}" height="${h}" fill="${C.bg}"/>`;
      const cols = Math.max(5, Math.floor(Number(state.density)/2)+2);
      const gap = w/(cols+1);
      for(let i=0;i<cols;i++){
        const x = gap*(i+1);
        const yy = h*(.18 + (i%2)*.10 + rnd()*.05);
        const bh = h*(.18 + rnd()*.16)*s;
        const bw = gap*(.52 + rnd()*.14);
        const col = [C.pink,C.peach,C.orange,C.yellow,C.coral][(i+index)%5];
        if(state.depth==="3d") out += `<rect x="${(x-bw/2+10).toFixed(1)}" y="${(yy+10).toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" rx="${(bw*.48).toFixed(1)}" fill="${shadowColor}"/>`;
        out += `<rect x="${(x-bw/2).toFixed(1)}" y="${yy.toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" rx="${(bw*.48).toFixed(1)}" fill="${col}"/>`;
        out += `<ellipse cx="${x.toFixed(1)}" cy="${(yy+bh).toFixed(1)}" rx="${(bw*.48).toFixed(1)}" ry="${(bw*.46).toFixed(1)}" fill="${col}"/>`;
      }
      out += `<ellipse cx="${w*.74}" cy="${h*.20}" rx="${w*.21}" ry="${h*.10}" fill="${C.yellow}" opacity=".4"/>`;
      return out;
    }

    if(index % 5 === 1){
      out += `<rect width="${w}" height="${h}" fill="${C.cream}"/>`;
      const centers = [
        [w*.27,h*.28,Math.min(w,h)*.15],
        [w*.67,h*.27,Math.min(w,h)*.22],
        [w*.40,h*.68,Math.min(w,h)*.19],
        [w*.76,h*.68,Math.min(w,h)*.11]
      ];
      centers.forEach((c,ci)=>{
        const [cx,cy,R]=c;
        const rings = Math.max(6, Math.floor(Number(state.density)/2));
        for(let j=0;j<rings;j++){
          const r=R*(1-j/rings*.82);
          const col=[C.pink,C.orange,C.yellow,C.coral,C.red][(j+ci)%5];
          const yy = cy + Math.sin(j*.55+ci)*R*.035;
          if(state.depth==="3d") out += `<circle cx="${(cx+8).toFixed(1)}" cy="${(yy+8).toFixed(1)}" r="${r.toFixed(1)}" fill="none" stroke="${shadowColor}" stroke-width="${Math.max(7,r*.18).toFixed(1)}"/>`;
          out += `<circle cx="${cx.toFixed(1)}" cy="${yy.toFixed(1)}" r="${r.toFixed(1)}" fill="none" stroke="${col}" stroke-width="${Math.max(7,r*.18).toFixed(1)}"/>`;
        }
        out += `<circle cx="${(cx-R*.13).toFixed(1)}" cy="${(cy-R*.14).toFixed(1)}" r="${(R*.15).toFixed(1)}" fill="${C.yellow}" opacity=".6"/>`;
      });
      return out;
    }

    if(index % 5 === 2){
      out += `<rect width="${w}" height="${h}" fill="${C.bg}"/>`;
      const bars = Math.max(9, Number(state.density)+4);
      const bw = w/(bars*1.6);
      for(let i=0;i<bars;i++){
        const x=w*.13 + i*(w*.74/(bars-1));
        const bh=h*(.26 + .045*i)*(0.82+rnd()*.30)*s;
        const y=h*.77-bh;
        const fill = i%4===0?C.yellow:(i%4===1?C.peach:(i%4===2?C.orange:C.coral));
        out += `<rect x="${(x-bw/2).toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" fill="${fill}"/>`;
      }
      out += `<rect x="0" y="${(h*.62).toFixed(1)}" width="${w}" height="${(h*.38).toFixed(1)}" fill="${C.cream}"/>`;
      out += `<ellipse cx="${w*.51}" cy="${h*.66}" rx="${w*.22}" ry="${h*.13}" fill="${C.yellow}" opacity=".5"/>`;
      return out;
    }

    if(index % 5 === 3){
      out += `<rect width="${w}" height="${h}" fill="${C.bg}"/>`;
      const cx=w*.49, cy=h*.36;
      const rings=Math.max(7, Math.floor(Number(state.density)/2)+4);
      for(let i=0;i<rings;i++){
        const R=Math.min(w,h)*(.33+i*.055)*s;
        const col=[C.coral,C.orange,C.peach,C.yellow,C.pink,C.red][i%6];
        if(state.depth==="3d") out += `<circle cx="${(cx+10).toFixed(1)}" cy="${(cy+10).toFixed(1)}" r="${R.toFixed(1)}" fill="none" stroke="${shadowColor}" stroke-width="${Math.max(18,R*.13).toFixed(1)}"/>`;
        out += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${R.toFixed(1)}" fill="none" stroke="${col}" stroke-width="${Math.max(18,R*.13).toFixed(1)}"/>`;
      }
      if(state.depth==="3d") out += `<rect x="${(w*.18+10).toFixed(1)}" y="${(h*.33+10).toFixed(1)}" width="${(w*.64).toFixed(1)}" height="${(h*.22).toFixed(1)}" fill="${shadowColor}"/>`;
      out += `<rect x="${(w*.18).toFixed(1)}" y="${(h*.33).toFixed(1)}" width="${(w*.64).toFixed(1)}" height="${(h*.22).toFixed(1)}" fill="${C.cream}"/>`;
      out += `<text x="${(w*.50).toFixed(1)}" y="${(h*.455).toFixed(1)}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="${Math.round(Math.min(w,h)*.060)}" font-weight="900" fill="${C.ink}">COVER</text>`;
      out += `<text x="${(w*.50).toFixed(1)}" y="${(h*.495).toFixed(1)}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="${Math.round(Math.min(w,h)*.060)}" font-weight="900" fill="${C.ink}">DESIGN</text>`;
      return out;
    }

    out += `<rect width="${w}" height="${h}" fill="${C.red}"/>`;
    const stripes=Math.max(16, Math.floor(Number(state.density)*2.2));
    const stripeH=h*.036;
    for(let i=-3;i<stripes+3;i++){
      const y=i*(h/(stripes));
      const col=[C.pink,C.orange,C.yellow,C.coral,C.rose][i%5];
      const slant=w*.16;
      out += `<path d="M ${(w*.02-slant).toFixed(1)} ${(y+stripeH).toFixed(1)} L ${(w*.02).toFixed(1)} ${y.toFixed(1)} L ${(w*.98).toFixed(1)} ${(y.toFixed(1))} L ${(w*.98+slant).toFixed(1)} ${(y+stripeH).toFixed(1)} Z" fill="${col}"/>`;
    }
    if(state.depth==="3d") out += `<rect x="${(w*.10+12).toFixed(1)}" y="${(h*.73+12).toFixed(1)}" width="${(w*.80).toFixed(1)}" height="${(h*.13).toFixed(1)}" rx="${(h*.03).toFixed(1)}" fill="${shadowColor}"/>`;
    out += `<rect x="${(w*.10).toFixed(1)}" y="${(h*.73).toFixed(1)}" width="${(w*.80).toFixed(1)}" height="${(h*.13).toFixed(1)}" rx="${(h*.03).toFixed(1)}" fill="${C.cream}"/>`;
    return out;
  }

  function layoutByMode(index,w,h,p,rnd,id){
    const mode = state.designMode;
    if(mode === "sharpBeams") return sharpBeams(id,w,h,p,rnd,index);
    if(mode === "liquid") return liquid(id,w,h,p,rnd);
    if(mode === "glass") return spheres(id,w,h,p,rnd);
    if(mode === "prism") return prisms(id,w,h,p,rnd);
    if(mode === "organic") return petals(id,w,h,p,rnd);
    if(mode === "waves") return waves(id,w,h,p,rnd);
    if(mode === "minimal") return minimal(id,w,h,p,rnd);
    if(mode === "blueEditorial") return referenceEditorial(id,w,h,p,rnd,index);
    if(mode === "pastelEditorial") return pastelEditorial(id,w,h,p,rnd,index);
    const options=[sharpBeams,circleGrid,ribbonBars,spheres,prisms,petals,waves,liquid,minimal];
    const fn=options[index%options.length];
    return fn(id,w,h,p,rnd,index);
  }

  function textLayer(id,index,w,h,p){
    const amount=Number(state.textAmount)/100;
    if(amount<=0) return "";
    
    const fill = index%4===1 ? "#e0e0e0" : "#ffffff";
    const fs = Math.max(18,Math.round(Math.min(w,h)*.026));

    if (state.designMode === "sharpBeams") {
      const bigFs = Math.max(30, Math.round(Math.min(w,h)*0.09));
      const textColor = index%2 === 0 ? p.light : p.text;
      
      if (index % 5 === 0) {
        return `<g font-family="Arial, sans-serif" fill="${textColor}" opacity="${(.7+.3*amount).toFixed(2)}">
          <text x="${w*0.06}" y="${h*0.1}" font-size="${bigFs}" font-weight="900" letter-spacing="4">DESIGN</text>
          <text x="${w*0.06}" y="${h*0.13}" font-size="${bigFs*0.2}" font-weight="400" letter-spacing="2">LOREM IPSUM DOLOR SIT AMET</text>
        </g>`;
      } 
      else if (index % 5 === 2) {
        let textOut = `<g font-family="Arial, sans-serif" fill="${textColor}" opacity="${(.7+.3*amount).toFixed(2)}">`;
        const chars = "DESIGN".split("");
        chars.forEach((c, i) => {
            textOut += `<text x="${w*0.06}" y="${h*0.12 + i*bigFs*1.05}" font-size="${bigFs}" font-weight="300">${c}</text>`;
        });
        textOut += `</g>`;
        return textOut;
      }
      return `<g font-family="Arial, sans-serif" fill="${textColor}" opacity="${(.7+.3*amount).toFixed(2)}">
        <text x="${w*0.06}" y="${h*0.1}" font-size="${bigFs*0.25}" font-weight="600" letter-spacing="4">ALI STUDIO // VIBRANT</text>
      </g>`;
    }

    const titles = ["VIVID MOTION","COLOR / FORM","SOFT IMPACT","NEW DIMENSION","VISUAL ENERGY","LIQUID SYSTEM","LIGHT / VOLUME","MODERN OBJECT"];
    const title=titles[index%titles.length];
    const sub = ["ABSTRACT SERIES","GENERATIVE STUDY","EDITED IN SVG","DESIGN OBJECT","COLOR EXPLORATION"][index%5];
    
    return `<g font-family="Arial, Helvetica, sans-serif" fill="${fill}" opacity="${(.68+.28*amount).toFixed(2)}">
      <text x="${(w*.08).toFixed(1)}" y="${(h*.10).toFixed(1)}" font-size="${fs}" font-weight="900" letter-spacing="${Math.max(2,fs*.18).toFixed(1)}">${esc(title)}</text>
      <text x="${(w*.08).toFixed(1)}" y="${(h*.13).toFixed(1)}" font-size="${Math.round(fs*.38)}" font-weight="600" letter-spacing="${Math.max(1,fs*.07).toFixed(1)}">${esc(sub)}</text>
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
    ["posterCount","shapeSize","density","gradientSoftness","spacing","edgeFade","textAmount"].forEach(k=> {
        if($(k)) state[k]=Number($(k).value)
    });
    ["designMode","theme","format","quality","darkColor","lightColor","seed"].forEach(k=>{
        if($(k)) state[k]=$(k).value
    });
    state.seed=Number(state.seed)||1;
    const activeSeg = document.querySelector(".segment.active");
    if(activeSeg) state.depth=activeSeg.dataset.depth;
  }

  function updateOutputs(){
    const map={posterCount:["posterCountVal",v=>v],shapeSize:["shapeSizeVal",v=>`${v}%`],density:["densityVal",v=>v],gradientSoftness:["gradientSoftnessVal",v=>`${v}%`],spacing:["spacingVal",v=>`${v}%`],edgeFade:["edgeFadeVal",v=>`${v}%`],textAmount:["textAmountVal",v=>`${v}%`]};
    Object.entries(map).forEach(([id,[oid,fn]])=>{
        if($(oid) && $(id)) $(oid).textContent=fn($(id).value);
    });
    if($("collectionCount") && $("posterCount")) $("collectionCount").textContent=$("posterCount").value;
    
    const dMode = $("designMode");
    if(dMode && $("workspaceTitle")) $("workspaceTitle").textContent = (dMode.options[dMode.selectedIndex].text).toUpperCase();
    
    if($("statusMode")) $("statusMode").textContent=state.depth === "3d" ? "VECTOR SHADOW ENGINE" : "VIBRANT GENERATOR";
    if($("statusText")) $("statusText").textContent=state.depth === "3d" ? "Crisp offset geometric shadows enabled" : "Pure vector rendering";
    if($("workspaceSubtitle")) $("workspaceSubtitle").textContent = state.depth === "3d" ? "Each design uses clean geometric shadows for a sharp 3D look." : "Every card uses rich, vivid colors with crisp, sharp geometry.";
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

  ["posterCount","designMode","theme","shapeSize","density","gradientSoftness","spacing","edgeFade","textAmount","seed","format","quality","darkColor","lightColor"].forEach(id=>{
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
    
    const modes=["sharpBeams","vibrantMix","blueEditorial","pastelEditorial","liquid","glass","prism","organic","waves","minimal"]; 
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
