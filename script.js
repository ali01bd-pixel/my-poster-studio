// ==========================================
// SAFE AREA TOGGLE
// ==========================================
let safeAreaVisible = false;
document.getElementById('toggle-safe-area').addEventListener('click', () => {
    safeAreaVisible = !safeAreaVisible;
    for(let i=1; i<=4; i++) {
        document.getElementById(`safe-${i}`).style.display = safeAreaVisible ? 'block' : 'none';
    }
});

function linkInputToSVG(inputId, svgElementId, attribute) {
    const inputElement = document.getElementById(inputId);
    const svgElement = document.getElementById(svgElementId);
    if (inputElement && svgElement) {
        inputElement.addEventListener('input', (event) => {
            svgElement.setAttribute(attribute, event.target.value);
        });
    }
}

for (let i = 1; i <= 4; i++) {
    linkInputToSVG(`p${i}-bg1`, `p${i}-bg1-stop`, 'stop-color');
    linkInputToSVG(`p${i}-bg2`, `p${i}-bg2-stop`, 'stop-color');
    linkInputToSVG(`p${i}-line1`, `p${i}-line1-stop`, 'stop-color');
    linkInputToSVG(`p${i}-line2`, `p${i}-line2-stop`, 'stop-color');
}

const posterCountSelect = document.getElementById('poster-count');
function updatePosterCount() {
    let count = parseInt(posterCountSelect.value);
    let canvasWidths = { 1: 1830, 2: 3860, 3: 5890, 4: 7920 };
    for (let i = 1; i <= 4; i++) {
        const sidebarPanel = document.getElementById(`panel-${i}`);
        const artGroup = document.getElementById(`art-${i}`);
        if (i <= count) {
            sidebarPanel.style.display = 'block';
            artGroup.style.display = 'block';
        } else {
            sidebarPanel.style.display = 'none';
            artGroup.style.display = 'none';
        }
    }
    let newWidth = canvasWidths[count];
    document.getElementById('masterCanvas').setAttribute('viewBox', `0 0 ${newWidth} 2520`);
    document.getElementById('footer-size').innerText = `Master Artboard: ${newWidth} x 2520 px`;
}
posterCountSelect.addEventListener('change', updatePosterCount);


// ==========================================
// 23-MODE ADVANCED PATTERN GENERATOR ENGINE
// ==========================================
const densitySlider = document.getElementById('eng-density');
const freqSlider = document.getElementById('eng-freq');
const thickSlider = document.getElementById('eng-thick');
const modeSelect = document.getElementById('design-mode');
const ampSlider = document.getElementById('eng-amp');
const phaseSlider = document.getElementById('eng-phase');
const chaosSlider = document.getElementById('eng-chaos');

function getJitter(seed, chaosLevel) {
    let noise = (Math.sin(seed * 12.9898 + seed * 78.233) * 43758.5453) % 1;
    return noise * chaosLevel * 5; 
}

function generateDynamicArt() {
    const density = parseInt(densitySlider.value); 
    const freq = parseInt(freqSlider.value);       
    const thick = parseInt(thickSlider.value);     
    const amp = parseInt(ampSlider.value) / 100;    
    const phase = parseInt(phaseSlider.value);      
    const chaos = parseInt(chaosSlider.value);      
    const mode = modeSelect.value;

    const startX = 0; const endX = 1830; const midX = 915; const height = 2520;
    let paths = ["", "", "", ""];
    
    // Determine whether this mode draws Lines (stroke) or Shapes (fill)
    let useFill = ['watercolor_bubble', 'gradient_grain', 'aura', 'translucent_fluid', 'bauhaus', 'boho_terrazzo'].includes(mode);
    
    for (let i = 1; i <= 4; i++) {
        let el = document.getElementById(`svg-p${i}-line`);
        if(useFill) {
            el.setAttribute('fill', `url(#stroke-grad-${i})`);
            el.setAttribute('stroke', 'none');
            el.setAttribute('opacity', mode === 'bauhaus' ? '0.9' : '0.6'); // Transparency for overlaps
        } else {
            el.setAttribute('fill', 'none');
            el.setAttribute('stroke', `url(#stroke-grad-${i})`);
            el.setAttribute('stroke-width', thick * (1 + (i*0.2))); 
            el.setAttribute('opacity', '1');
        }
    }

    // 1. GEOMETRIC
    if (mode === 'geometric') {
        for(let p=0; p<4; p++) {
            for (let i = 0; i < density; i++) {
                let y = ((height / density) * i) + (phase * 5); 
                let b = freq * 15 * amp; let j = getJitter(i+p, chaos);
                if(p===0) paths[p] += `M ${startX},${y+j} Q ${midX+j},${y+b} ${endX},${y+j} M ${startX},${y+j} Q ${midX-j},${y-b} ${endX},${y+j} `;
                if(p===1) paths[p] += `M ${startX},${y+j} Q ${midX},${y+b+j} ${endX},${y+j} `;
                if(p===2) paths[p] += `M ${startX},${y+j} L ${midX+j},${y+b} L ${endX},${y+j} `;
                if(p===3) paths[p] += `M ${startX},${y} L ${startX + 150 + (Math.abs(Math.sin(i*freq*0.05))*endX*amp) + j},${y} `;
            }
        }
    }
    // 2. RETRO WAVES
    else if (mode === 'retro') {
        for(let p=0; p<4; p++) {
            for (let i = 0; i < density; i++) {
                let y = ((height / density) * i) + (phase * 5); let a = freq * 5 * amp; let j = getJitter(i+p, chaos);
                if(p===0) paths[p] += `M ${startX},${y+j} C ${startX+250+j},${y-a} ${midX-250-j},${y+a} ${midX},${y+j} C ${midX+250+j},${y-a} ${endX-250-j},${y+a} ${endX},${y+j} `;
                if(p===1) paths[p] += `M ${startX},${height+j} Q ${midX+j},${y - (freq*12*amp)} ${endX},${height+j} `;
                if(p===2) paths[p] += `M ${startX},${height - (i*12*amp) + j} A ${i*12*amp+j} ${i*12*amp+j} 0 0 1 ${startX + (i*12*amp) + j},${height} `;
                if(p===3) paths[p] += `M ${startX},${y+j} C ${startX+500},${y+j} ${endX-500},${y-(freq*15*amp)+j} ${endX},${y-(freq*15*amp)+j} `;
            }
        }
    }
    // 3. TOPOLOGY
    else if (mode === 'topology') {
        for (let i = 0; i < density; i++) {
            let y = ((height / density) * i) + (phase * 5);
            paths[0] += `M ${startX},${y} `; paths[1] += `M ${startX},${y} `; paths[2] += `M ${startX},${y} `; paths[3] += `M ${startX},${y} `;
            for(let x = startX; x <= endX; x += 80) {
                let px = x + (phase * 2); let j = getJitter(x*i, chaos);
                paths[0] += `L ${x+j},${y + Math.sin(px*0.005 + i*0.1)*(freq*3*amp) + j} `;
                paths[1] += `L ${x+j},${y + Math.sin(px*0.01)*(freq*5*amp) + j} `;
                paths[2] += `L ${x+j},${y + Math.sin(px*0.008 - i*0.2)*(freq*4*amp) + j} `;
                paths[3] += `L ${x+j},${y + Math.sin(px*0.003)*(freq*8*amp) + j} `;
            }
        }
    }
    // 4. MANDALA
    else if (mode === 'mandala') {
        let l = Math.floor(density/3)+4; let pet = Math.floor(freq/3)+6; let rad = 1000*amp; let pr = phase*(Math.PI/180);
        for(let i=1; i<=l; i++) {
            let r = (rad/l)*i;
            for(let j=0; j<=pet; j++) {
                let a = (j/pet)*Math.PI*2 + pr; let sp = (j%2===0)?(freq*1.5*amp):-(freq*1.5*amp); let jx = getJitter(i*j,chaos);
                let x = midX + Math.cos(a)*(r+sp)+jx; let y = 1260 + Math.sin(a)*(r+sp)+jx;
                if(j===0) paths[0]+= `M ${x},${y} `; else paths[0]+= `L ${x},${y} `;
                
                let x1 = midX + Math.cos(a)*r; let y1 = 1260 + Math.sin(a)*r;
                let x2 = midX + Math.cos(a+0.2)*(r+freq*3*amp)+jx; let y2 = 1260 + Math.sin(a+0.2)*(r+freq*3*amp)+jx;
                paths[1]+= `M ${x1},${y1} Q ${x2},${y2} ${x1},${y1} `;
            }
        }
        for(let i=1; i<=density; i++) {
            let r = (rad/density)*i; let s = Math.floor(freq/8)+3;
            for(let j=0; j<=s; j++) {
                let a = (j/s)*Math.PI*2 + pr; let x = midX + Math.cos(a)*r + getJitter(i*j,chaos); let y = 1260 + Math.sin(a)*r;
                if(j===0) paths[2]+= `M ${x},${y} `; else paths[2]+= `L ${x},${y} `;
            }
            for(let j=0; j<s; j++) {
                let a1 = (j/s)*Math.PI*2 + pr + (i*0.1); let a2 = a1 + (Math.PI*2/s)*0.6;
                paths[3]+= `M ${midX+Math.cos(a1)*r},${1260+Math.sin(a1)*r} A ${r} ${r} 0 0 1 ${midX+Math.cos(a2)*r},${1260+Math.sin(a2)*r} `;
            }
        }
    }
    // 5. WATERCOLOR BUBBLE & 6. GRADIENT GRAIN & 7. AURA (Circle based shapes)
    else if (['watercolor_bubble', 'gradient_grain', 'aura'].includes(mode)) {
        for(let p=0; p<4; p++) {
            for(let i=0; i<density; i++) {
                let r = (freq * 4 * amp) + getJitter(i, 100) + 50;
                let cx = midX + getJitter(i+p, endX); 
                let cy = 1260 + getJitter(i*p, height) - (height/2);
                if(mode === 'aura') { cx = midX; cy = 1260; r = (i*freq*2*amp) + 50; }
                paths[p] += `M ${cx-r},${cy} a ${r},${r} 0 1,0 ${r*2},0 a ${r},${r} 0 1,0 -${r*2},0 `;
            }
        }
    }
    // 8. RETRO POSTER (Concentric)
    else if (mode === 'retro_poster') {
        for(let p=0; p<4; p++) {
            for(let i=0; i<density; i++) {
                let r = i * (2000/density) * amp; let j = getJitter(i, chaos);
                let cx = (p%2===0) ? 0 : endX; let cy = (p<2) ? height : 0;
                paths[p] += `M ${cx},${cy-r+j} A ${r} ${r} 0 0 ${(p%2===0)?1:0} ${cx+(p%2===0?r:-r)+j},${cy} `;
            }
        }
    }
    // 9. PSYCHEDELIC (Dense Ribbons)
    else if (mode === 'psychedelic') {
        for(let p=0; p<4; p++) {
            for(let i=0; i<density*2; i++) {
                let y = ((height/(density*2))*i) + phase*5; let j = getJitter(i, chaos);
                let f = freq*0.01; let a = 200*amp;
                paths[p] += `M ${startX},${y} C ${midX-500},${y-a+j} ${midX+500},${y+a-j} ${endX},${y} `;
            }
        }
    }
    // 10. MID-CENTURY MODERN (Intersecting Geometry)
    else if (mode === 'mid_century') {
        for(let p=0; p<4; p++) {
            for(let i=0; i<density/3; i++) {
                let cx = getJitter(i, endX); let cy = getJitter(i+1, height); let r = freq*5*amp;
                paths[p] += `M ${cx-r},${cy} a ${r},${r} 0 1,0 ${r*2},0 a ${r},${r} 0 1,0 -${r*2},0 `;
                paths[p] += `M ${cx},${cy-r*2} L ${cx},${cy+r*2} M ${cx-r*2},${cy} L ${cx+r*2},${cy} `;
            }
        }
    }
    // 11. JAPANESE MATCHBOX
    else if (mode === 'japanese_matchbox') {
        for(let p=0; p<4; p++) {
            // Frame
            paths[p] += `M 150,150 L 1680,150 L 1680,2370 L 150,2370 Z `;
            // Sun
            paths[p] += `M ${midX-400*amp},1000 a ${400*amp},${400*amp} 0 1,0 ${800*amp},0 a ${400*amp},${400*amp} 0 1,0 -${800*amp},0 `;
            // Waves at bottom
            for(let i=0; i<density; i++) {
                let y = 1800 + (i*15*amp); let b = freq*2*amp;
                paths[p] += `M 150,${y} Q 500,${y-b} 915,${y} T 1680,${y} `;
            }
        }
    }
    // 12. RISOGRAPH (Halftone Dots)
    else if (mode === 'risograph') {
        for(let p=0; p<4; p++) {
            for(let y=200; y<2400; y+= (2000/density)) {
                for(let x=200; x<1700; x+= (1500/density)) {
                    let r = (Math.sin(x*0.01 + y*0.01 + phase)*freq*0.2*amp) + 10;
                    if(r>0) paths[p] += `M ${x-r},${y} a ${r},${r} 0 1,0 ${r*2},0 a ${r},${r} 0 1,0 -${r*2},0 `;
                }
            }
        }
    }
    // 13. SYNTHWAVE GRID
    else if (mode === 'synthwave') {
        for(let p=0; p<4; p++) {
            // Perspective Horizon
            for (let x = -3000; x <= 5000; x += (1000/density)) {
                paths[p] += `M ${midX},1300 L ${x+getJitter(x,chaos)},2520 `;
            }
            for (let y = 1300; y <= 2520; y += (y-1290)*0.1 + 5) {
                paths[p] += `M 0,${y+getJitter(y,chaos)} L 1830,${y+getJitter(y,chaos)} `;
            }
            // Sun
            paths[p] += `M ${midX-500*amp},1200 a ${500*amp},${500*amp} 0 1,0 ${1000*amp},0 a ${500*amp},${500*amp} 0 1,0 -${1000*amp},0 `;
        }
    }
    // 14. LIQUID MARBLE & 15. TRANSLUCENT FLUID
    else if (['liquid_marble', 'translucent_fluid'].includes(mode)) {
        for(let p=0; p<4; p++) {
            for(let i=0; i<density; i++) {
                let y = (height/density)*i; let b1 = freq*10*amp; let b2 = freq*15*amp; let j = getJitter(i, chaos);
                paths[p] += `M ${startX-200},${y} C ${midX-500},${y-b1+j} ${midX+500},${y+b2-j} ${endX+200},${y} `;
                if(mode==='translucent_fluid') paths[p] += `L ${endX+200},2600 L -200,2600 Z `; // close shape for filling
            }
        }
    }
    // 16. Y2K CYBER
    else if (mode === 'y2k') {
        for(let p=0; p<4; p++) {
            for(let i=0; i<density/4; i++) {
                let cx = getJitter(i, 1830); let cy = getJitter(i*2, 2520); let r = freq*3*amp;
                paths[p] += `M ${cx},${cy-r} L ${cx+r*0.2},${cy-r*0.2} L ${cx+r},${cy} L ${cx+r*0.2},${cy+r*0.2} L ${cx},${cy+r} L ${cx-r*0.2},${cy+r*0.2} L ${cx-r},${cy} L ${cx-r*0.2},${cy-r*0.2} Z `;
            }
            // Orbit rings
            paths[p] += `M 915,1260 a 600,200 0 1,0 1200,0 a 600,200 0 1,0 -1200,0 M 915,1260 a 200,600 0 1,0 400,0 a 200,600 0 1,0 -400,0 `;
        }
    }
    // 17. BAUHAUS & 18. BOHO TERRAZZO
    else if (['bauhaus', 'boho_terrazzo'].includes(mode)) {
        for(let p=0; p<4; p++) {
            if(mode === 'boho_terrazzo') {
                paths[p] += `M 415,2520 L 415,1000 A 500,500 0 0,1 1415,1000 L 1415,2520 Z `;
            }
            for(let i=0; i<density; i++) {
                let x = getJitter(i, 1830); let y = getJitter(i*2, 2520); let s = freq*2*amp;
                if(i%3===0) paths[p] += `M ${x},${y} L ${x+s},${y} L ${x+s},${y+s} L ${x},${y+s} Z `; // Square/speck
                else if(i%3===1) paths[p] += `M ${x},${y} L ${x+s},${y+s} L ${x-s},${y+s} Z `; // Triangle
                else paths[p] += `M ${x-s},${y} a ${s},${s} 0 1,0 ${s*2},0 a ${s},${s} 0 1,0 -${s*2},0 `; // Circle
            }
        }
    }
    // 19. MINIMALIST LINE
    else if (mode === 'minimalist_line') {
        for(let p=0; p<4; p++) {
            paths[p] += `M ${midX},0 `;
            for(let i=1; i<density; i++) {
                let y = (height/density)*i; let bx = getJitter(i, 1830); let j = getJitter(i*2, chaos);
                paths[p] += `S ${bx+j},${y-200} ${midX+j},${y} `;
            }
        }
    }
    // 20. NEO-BRUTALIST
    else if (mode === 'neo_brutalist') {
        for(let p=0; p<4; p++) {
            for(let i=0; i<density/5; i++) {
                let cx = getJitter(i, 1830); let cy = getJitter(i*2, 2520); let r = freq*4*amp;
                // Harsh Star polygon
                paths[p] += `M ${cx},${cy-r} L ${cx+r*0.4},${cy-r*0.4} L ${cx+r},${cy} L ${cx+r*0.4},${cy+r*0.4} L ${cx},${cy+r} L ${cx-r*0.4},${cy+r*0.4} L ${cx-r},${cy} L ${cx-r*0.4},${cy-r*0.4} Z `;
                // Drop shadow
                paths[p] += `M ${cx+20},${cy-r+20} L ${cx+r*0.4+20},${cy-r*0.4+20} L ${cx+r+20},${cy+20} L ${cx+r*0.4+20},${cy+r*0.4+20} L ${cx+20},${cy+r+20} L ${cx-r*0.4+20},${cy+r*0.4+20} L ${cx-r+20},${cy+20} L ${cx-r*0.4+20},${cy-r*0.4+20} Z `;
            }
        }
    }
    // 21. VINTAGE BOTANICAL
    else if (mode === 'botanical') {
        for(let p=0; p<4; p++) {
            paths[p] += `M ${midX},2520 Q ${midX+getJitter(1,200)},1260 ${midX},100 `; // Stem
            for(let i=1; i<density/2; i++) {
                 let y = 2400 - (i*2200/(density/2)); let leaf = freq*2*amp;
                 paths[p] += `M ${midX},${y} Q ${midX+leaf},${y-leaf/2} ${midX+leaf*1.5},${y-leaf*1.5} Q ${midX+leaf/2},${y-leaf} ${midX},${y} `;
                 paths[p] += `M ${midX},${y-50} Q ${midX-leaf},${y-50-leaf/2} ${midX-leaf*1.5},${y-50-leaf*1.5} Q ${midX-leaf/2},${y-50-leaf} ${midX},${y-50} `;
            }
        }
    }
    // 22. SCANDI LANDSCAPE
    else if (mode === 'scandi_landscape') {
        for(let p=0; p<4; p++) {
            paths[p] += `M ${midX},800 a ${300*amp},${300*amp} 0 1,0 ${600*amp},0 a ${300*amp},${300*amp} 0 1,0 -${600*amp},0 `; // Sun
            for(let i=0; i<density/4; i++) {
                let y = 1500 + (i*200); let peak = y - (freq*10*amp);
                paths[p] += `M -200,2600 L -200,${y} Q 915,${peak} 2000,${y+200} L 2000,2600 Z `;
            }
        }
    }
    // 23. CELESTIAL CONSTELLATION
    else if (mode === 'celestial') {
        for(let p=0; p<4; p++) {
            // Crescent Moon
            paths[p] += `M 1400,400 A 200,200 0 1,1 1100,700 A 250,250 0 1,0 1400,400 `;
            for(let i=0; i<density; i++) {
                let cx = getJitter(i, 1830); let cy = getJitter(i*2, 2520); let r = 5*amp;
                paths[p] += `M ${cx-r},${cy} a ${r},${r} 0 1,0 ${r*2},0 a ${r},${r} 0 1,0 -${r*2},0 `;
                if(i>0) {
                    let px = getJitter(i-1, 1830); let py = getJitter((i-1)*2, 2520);
                    if(Math.abs(cx-px) < (freq*10)) paths[p] += `M ${cx},${cy} L ${px},${py} `; // connect stars
                }
            }
        }
    }

    for(let i=1; i<=4; i++) {
        document.getElementById(`svg-p${i}-line`).setAttribute('d', paths[i-1]);
    }
}

// ==========================================
// BACKGROUND & LINE GRADIENT SHUFFLE ENGINE
// ==========================================
function randomizeColors() {
    const bgGradients = [
        ['#0f2027', '#203a43'], ['#2c3e50', '#000000'], ['#141e30', '#243b55'], 
        ['#23074d', '#cc5333'], ['#1a2a6c', '#b21f1f'], ['#000000', '#434343'], 
        ['#111111', '#111111'], ['#3E5151', '#DECBA4'], ['#ffecd2', '#fcb69f'], 
        ['#eaafc8', '#654ea3'], ['#000428', '#004e92']
    ];

    const lineGradients = [
        ['#00c6ff', '#0072ff'], ['#f12711', '#f5af19'], ['#fc4a1a', '#f7b733'], 
        ['#7F00FF', '#E100FF'], ['#11998e', '#38ef7d'], ['#ff0084', '#33001b'], 
        ['#00d2ff', '#3a7bd5'], ['#f85032', '#e73827'], ['#ffffff', '#e0e0e0'],
        ['#fdfc47', '#24fe41'], ['#ff9a9e', '#fecfef']
    ];
    
    for (let i = 1; i <= 4; i++) {
        let randomBg = bgGradients[Math.floor(Math.random() * bgGradients.length)];
        let randomLine = lineGradients[Math.floor(Math.random() * lineGradients.length)];
        
        document.getElementById(`p${i}-bg1-stop`).setAttribute('stop-color', randomBg[0]);
        document.getElementById(`p${i}-bg2-stop`).setAttribute('stop-color', randomBg[1]);
        document.getElementById(`p${i}-line1-stop`).setAttribute('stop-color', randomLine[0]);
        document.getElementById(`p${i}-line2-stop`).setAttribute('stop-color', randomLine[1]);

        document.getElementById(`p${i}-bg1`).value = randomBg[0];
        document.getElementById(`p${i}-bg2`).value = randomBg[1];
        document.getElementById(`p${i}-line1`).value = randomLine[0];
        document.getElementById(`p${i}-line2`).value = randomLine[1];
    }
}

['eng-density', 'eng-freq', 'eng-thick', 'eng-amp', 'eng-phase', 'eng-chaos'].forEach(id => {
    document.getElementById(id).addEventListener('input', (e) => {
        let valText = e.target.value;
        if(id === 'eng-freq' || id === 'eng-amp' || id === 'eng-chaos') valText += '%';
        if(id === 'eng-thick') valText += 'PX';
        if(id === 'eng-phase') valText += '°';
        document.getElementById(`val-${id.split('eng-')[1]}`).innerText = valText;
        generateDynamicArt();
    });
});

modeSelect.addEventListener('change', () => {
    randomizeColors();
    generateDynamicArt();
});

// ==========================================
// RANDOMIZATION ENGINE (AUTO SHUFFLE)
// ==========================================
function randomizeEngine() {
    const modes = Array.from(modeSelect.options).map(opt => opt.value);
    const randomMode = modes[Math.floor(Math.random() * modes.length)];
    
    const randomDensity = Math.floor(Math.random() * (150 - 10 + 1)) + 10;
    const randomFreq = Math.floor(Math.random() * 100) + 1;
    const randomThick = Math.floor(Math.random() * 100) + 1;
    const randomAmp = Math.floor(Math.random() * (200 - 50 + 1)) + 50; 
    const randomPhase = Math.floor(Math.random() * 360);
    const randomChaos = Math.floor(Math.random() * 30); 

    modeSelect.value = randomMode;
    densitySlider.value = randomDensity;
    freqSlider.value = randomFreq;
    thickSlider.value = randomThick;
    ampSlider.value = randomAmp;
    phaseSlider.value = randomPhase;
    chaosSlider.value = randomChaos;

    document.getElementById('val-density').innerText = randomDensity;
    document.getElementById('val-freq').innerText = randomFreq + '%';
    document.getElementById('val-thick').innerText = randomThick + 'PX';
    document.getElementById('val-amp').innerText = randomAmp + '%';
    document.getElementById('val-phase').innerText = randomPhase + '°';
    document.getElementById('val-chaos').innerText = randomChaos + '%';

    randomizeColors();
    generateDynamicArt();
}

const shuffleBtn = document.querySelector('.btn-shuffle:not(#toggle-safe-area)');
if (shuffleBtn) {
    shuffleBtn.addEventListener('click', randomizeEngine);
}

// INITIALIZE ON PAGE LOAD
randomizeEngine();
updatePosterCount();

// ==========================================
// MASTER DOWNLOAD LOGIC (Hides Safe Area)
// ==========================================
document.getElementById('downloadBtn').addEventListener('click', () => {
    // Hide safe areas temporarily before saving
    let wasSafeVisible = safeAreaVisible;
    if(wasSafeVisible) {
        for(let i=1; i<=4; i++) document.getElementById(`safe-${i}`).style.display = 'none';
    }

    const svgElement = document.getElementById('masterCanvas');
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svgElement);
    if (!source.match(/^<\?xml[^>]+>/)) source = '<?xml version="1.0" standalone="no"?>\r\n' + source;
    
    const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source);
    const downloadLink = document.createElement("a");
    downloadLink.href = url;
    downloadLink.download = "Ali_Design_Hub_Master.svg";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    // Restore safe areas if they were visible
    if(wasSafeVisible) {
        for(let i=1; i<=4; i++) document.getElementById(`safe-${i}`).style.display = 'block';
    }
});
