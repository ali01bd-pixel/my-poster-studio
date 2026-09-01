// ==========================================
// SAFE AREA TOGGLE
// ==========================================
let safeAreaVisible = false;
const toggleSafeBtn = document.getElementById('toggle-safe-area');
if (toggleSafeBtn) {
    toggleSafeBtn.addEventListener('click', () => {
        safeAreaVisible = !safeAreaVisible;
        for(let i=1; i<=4; i++) {
            let safeBox = document.getElementById(`safe-${i}`);
            if(safeBox) safeBox.style.display = safeAreaVisible ? 'block' : 'none';
        }
    });
}

// ==========================================
// BIND COLOR INPUTS TO SVG GRADIENTS
// ==========================================
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

// ==========================================
// DYNAMIC ARTBOARD COUNT SELECTOR
// ==========================================
const posterCountSelect = document.getElementById('poster-count');

function updatePosterCount() {
    if (!posterCountSelect) return;
    let count = parseInt(posterCountSelect.value);
    let canvasWidths = { 1: 1830, 2: 3860, 3: 5890, 4: 7920 };
    
    for (let i = 1; i <= 4; i++) {
        const sidebarPanel = document.getElementById(`panel-${i}`);
        const artGroup = document.getElementById(`art-${i}`);
        if (i <= count) {
            if (sidebarPanel) sidebarPanel.style.display = 'block';
            if (artGroup) artGroup.style.display = 'block';
        } else {
            if (sidebarPanel) sidebarPanel.style.display = 'none';
            if (artGroup) artGroup.style.display = 'none';
        }
    }
    
    let newWidth = canvasWidths[count];
    const masterCanvas = document.getElementById('masterCanvas');
    if (masterCanvas) masterCanvas.setAttribute('viewBox', `0 0 ${newWidth} 2520`);
    
    const footerSize = document.getElementById('footer-size');
    if (footerSize) footerSize.innerText = `Master Artboard: ${newWidth} x 2520 px`;
}

if (posterCountSelect) posterCountSelect.addEventListener('change', updatePosterCount);


// ==========================================
// ADVANCED MATHEMATICAL ART ENGINE
// ==========================================
const densitySlider = document.getElementById('eng-density');
const freqSlider = document.getElementById('eng-freq');
const thickSlider = document.getElementById('eng-thick');
const modeSelect = document.getElementById('design-mode');
const ampSlider = document.getElementById('eng-amp');
const phaseSlider = document.getElementById('eng-phase');
const chaosSlider = document.getElementById('eng-chaos');
const depth3dSlider = document.getElementById('eng-3d'); // NEW 3D Slider

// Deterministic Pseudo-Random Number Generator for smooth chaos
function randomSeed(seed) {
    let x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}

function getJitter(seed, chaosLevel) {
    return (randomSeed(seed) - 0.5) * chaosLevel * 10; 
}

function generateDynamicArt() {
    if (!densitySlider || !modeSelect) return;

    const density = parseInt(densitySlider.value); 
    const freq = parseInt(freqSlider.value);       
    const thick = parseInt(thickSlider.value);     
    const amp = parseInt(ampSlider.value) / 100;    
    const phase = parseInt(phaseSlider.value);      
    const chaos = parseInt(chaosSlider.value);      
    const depth3d = parseInt(depth3dSlider.value);  
    const mode = modeSelect.value;

    const W = 1830; 
    const H = 2520;
    const midX = W / 2;
    const midY = H / 2;
    
    // Apply Universal 3D Extrusion
    const shadowFilter = document.getElementById('shadow-layer');
    if (shadowFilter) {
        shadowFilter.setAttribute('dx', depth3d);
        shadowFilter.setAttribute('dy', depth3d);
    }

    let paths = ["", "", "", ""];
    
    // Determine if the design mode uses solid shapes (fill) or outlines (stroke)
    let fillModes = ['watercolor_bubble', 'bauhaus', 'boho_terrazzo', 'neo_brutalist', 'gradient_grain', 'aura', 'liquid_marble'];
    let useFill = fillModes.includes(mode);
    
    for (let i = 1; i <= 4; i++) {
        let el = document.getElementById(`svg-p${i}-line`);
        if (!el) continue;
        
        if (useFill) {
            el.setAttribute('fill', `url(#stroke-grad-${i})`);
            el.setAttribute('stroke', 'none');
            if (['watercolor_bubble', 'gradient_grain', 'aura'].includes(mode)) {
                el.setAttribute('style', 'mix-blend-mode: overlay; opacity: 0.9;');
            } else {
                el.setAttribute('style', 'mix-blend-mode: normal; opacity: 1;');
            }
        } else {
            el.setAttribute('fill', 'none');
            el.setAttribute('stroke', `url(#stroke-grad-${i})`);
            el.setAttribute('stroke-width', thick * (1 + (i*0.1))); 
            el.setAttribute('style', 'mix-blend-mode: normal; opacity: 1;');
        }
    }

    for (let p = 0; p < 4; p++) {
        let path = "";
        
        // ----------------------------------------------------
        // TRUE 3D MODES
        // ----------------------------------------------------
        if (mode === '3d_wireframe') {
            // Draw spherical grid that rotates based on Phase
            for(let i=0; i<=density; i++) {
                let rScale = (W/2 * amp) * (i/density);
                let ry = W/2 * amp;
                path += `M ${midX-rScale},${midY} a ${rScale},${ry} 0 1,0 ${rScale*2},0 a ${rScale},${ry} 0 1,0 -${rScale*2},0 `;
            }
            let latCount = Math.floor(density/1.5);
            for(let i=1; i<latCount; i++) {
                let yOffset = (W/2 * amp) * (i/latCount);
                let tilt = phase * 0.01; // Simulates 3D tilt
                let rx = Math.sqrt(Math.abs(Math.pow(W/2*amp, 2) - Math.pow(yOffset, 2)));
                let ry = rx * (0.1 + tilt);
                path += `M ${midX-rx},${midY-yOffset} a ${rx},${ry} 0 1,0 ${rx*2},0 a ${rx},${ry} 0 1,0 -${rx*2},0 `;
                path += `M ${midX-rx},${midY+yOffset} a ${rx},${ry} 0 1,0 ${rx*2},0 a ${rx},${ry} 0 1,0 -${rx*2},0 `;
            }
        }
        else if (mode === '3d_ribbon') {
            // Draws an intersecting helical tube
            let steps = density * 2;
            for(let i=0; i<steps; i++) {
                let y = (H/steps) * i;
                let rad = phase * (Math.PI/180);
                let xOffset = Math.sin((y * freq * 0.005) + rad + p) * 600 * amp;
                let zScale = Math.cos((y * freq * 0.005) + rad + p); 
                let width = (400 * amp) * (0.5 + zScale * 0.5); // Perspective scaling
                let cx = midX + xOffset + getJitter(i, chaos);
                path += `M ${cx-width/2},${y} C ${cx-width/2},${y+(H/steps)} ${cx+width/2},${y+(H/steps)} ${cx+width/2},${y} `;
            }
        }

        // ----------------------------------------------------
        // ORIGINAL ARCHITECTURAL MODES
        // ----------------------------------------------------
        else if (mode === 'minimalist_line') {
            let points = density / 10 + 3;
            path += `M 0,${midY} `;
            for(let i=1; i<=points; i++) {
                let x = (W / points) * i;
                let y = midY + Math.sin(i * freq * 0.1 + phase + p) * (800 * amp) + getJitter(i+p, chaos);
                let cp1x = x - (W/points/2); let cp1y = y - (400*amp);
                let cp2x = x - (W/points/2); let cp2y = y + (400*amp);
                path += `C ${cp1x},${cp1y} ${cp2x},${cp2y} ${x},${y} `;
            }
        }
        else if (mode === 'bauhaus') {
            let shapes = Math.floor(density / 10) + 2;
            for(let i=0; i<shapes; i++) {
                let s = (freq * 5 * amp) + (randomSeed(i*p+1)*200);
                let x = randomSeed(i*p+2) * W; 
                let y = randomSeed(i*p+3) * H;
                let type = Math.floor(randomSeed(i*p+4) * 3);
                
                if (type === 0) {
                    path += `M ${x},${y} m -${s},0 a ${s},${s} 0 1,0 ${s*2},0 a ${s},${s} 0 1,0 -${s*2},0 `;
                } else if (type === 1) {
                    path += `M ${x},${y} L ${x+s*1.5},${y} L ${x+s*1.5},${y+s} L ${x},${y+s} Z `;
                } else {
                    path += `M ${x},${y} L ${x+s*2},${y+s*2} L ${x},${y+s*2} Z `;
                }
            }
        }
        else if (mode === 'boho_terrazzo') {
            let archW = 400 * amp + (p*50);
            let archH = 1000 * amp;
            let ax = midX - archW;
            let ay = midY + 500;
            path += `M ${ax},${ay} L ${ax},${ay - archH} A ${archW},${archW} 0 0,1 ${ax + archW*2},${ay - archH} L ${ax + archW*2},${ay} Z `;
            
            let flakes = density;
            for(let i=0; i<flakes; i++) {
                let fx = randomSeed(i*p+5) * W;
                let fy = randomSeed(i*p+6) * H;
                let fs = randomSeed(i*p+7) * freq * amp;
                path += `M ${fx},${fy} L ${fx+fs},${fy+fs*0.5} L ${fx+fs*0.8},${fy+fs*1.2} L ${fx-fs*0.2},${fy+fs} Z `;
            }
        }
        else if (mode === 'synthwave') {
            let horizon = midY + 200;
            let sr = 400 * amp;
            path += `M ${midX},${horizon - 100} m -${sr},0 a ${sr},${sr} 0 1,1 ${sr*2},0 a ${sr},${sr} 0 1,1 -${sr*2},0 `;
            
            let lines = Math.floor(density / 3);
            for(let i=-lines; i<=lines; i++) {
                let bottomX = midX + (i * 150 * amp);
                path += `M ${midX},${horizon} L ${bottomX + (i*100)},${H} `;
            }
            
            for(let i=0; i<15; i++) {
                let y = horizon + Math.pow(1.4, i) * (freq * 0.1);
                if (y < H) path += `M 0,${y} L ${W},${y} `;
            }
        }
        else if (mode === 'psychedelic' || mode === 'retro') {
            let waves = density / 2;
            for(let i=0; i<waves; i++) {
                let y = (H / waves) * i;
                let waveDepth = freq * 10 * amp;
                let j = getJitter(i, chaos);
                path += `M 0,${y+j} C 400,${y-waveDepth} 600,${y+waveDepth} 900,${y} C 1200,${y-waveDepth} 1400,${y+waveDepth} 1830,${y+j} `;
            }
        }
        else if (mode === 'y2k') {
            let stars = Math.floor(density / 10) + 1;
            for(let i=0; i<stars; i++) {
                let cx = randomSeed(i*p+8) * W;
                let cy = randomSeed(i*p+9) * H;
                let r = (freq * 3 * amp) + 50;
                path += `M ${cx},${cy-r} Q ${cx+r*0.1},${cy-r*0.1} ${cx+r},${cy} Q ${cx+r*0.1},${cy+r*0.1} ${cx},${cy+r} Q ${cx-r*0.1},${cy+r*0.1} ${cx-r},${cy} Q ${cx-r*0.1},${cy-r*0.1} ${cx},${cy-r} Z `;
            }
            let eX = W * 0.8; let eY = H * 0.2;
            for(let i=1; i<=3; i++) {
                let rx = 300 * i * amp; let ry = 100 * i * amp;
                path += `M ${eX-rx},${eY} a ${rx},${ry} 0 1,0 ${rx*2},0 a ${rx},${ry} 0 1,0 -${rx*2},0 `;
            }
        }
        else if (mode === 'watercolor_bubble' || mode === 'aura' || mode === 'gradient_grain') {
            let circles = density / 2;
            for(let i=0; i<circles; i++) {
                let r = (freq * 4 * amp) + randomSeed(i+p)*200;
                let cx = (mode === 'aura') ? midX : randomSeed(i*p+10) * W; 
                let cy = (mode === 'aura') ? midY + (i*50) : randomSeed(i*p+11) * H;
                path += `M ${cx-r},${cy} a ${r},${r} 0 1,0 ${r*2},0 a ${r},${r} 0 1,0 -${r*2},0 `;
            }
        }
        else if (mode === 'mandala') {
            let layers = Math.floor(density / 5) + 3; 
            let petals = Math.floor(freq / 3) + 8;    
            let maxRadius = 1000 * amp; 

            for(let i=1; i<=layers; i++) {
                let rBase = (maxRadius / layers) * i;
                for(let j=0; j<petals; j++) {
                    let angle1 = ((j / petals) * Math.PI * 2);
                    let angle2 = (((j + 0.5) / petals) * Math.PI * 2);
                    let angle3 = (((j + 1) / petals) * Math.PI * 2);
                    
                    let x1 = midX + Math.cos(angle1) * rBase; 
                    let y1 = midY + Math.sin(angle1) * rBase;
                    let x2 = midX + Math.cos(angle2) * (rBase + (freq*2*amp)); 
                    let y2 = midY + Math.sin(angle2) * (rBase + (freq*2*amp));
                    let x3 = midX + Math.cos(angle3) * rBase; 
                    let y3 = midY + Math.sin(angle3) * rBase;
                    
                    path += `M ${x1},${y1} Q ${x2},${y2} ${x3},${y3} `;
                }
            }
        }
        else if (mode === 'topology') {
            for (let i = 0; i < density; i++) {
                let yBase = ((H / density) * i);
                path += `M 0,${yBase} `; 
                for(let x = 0; x <= W; x += 100) {
                    let noise = Math.sin((x * 0.005) + (i * 0.1) + phase) * (freq * 5 * amp);
                    let j = getJitter(x*i, chaos);
                    path += `L ${x+j},${yBase + noise + j} `;
                }
            }
        }
        else {
            for (let i = 0; i < density; i++) {
                let y = ((H / density) * i);
                let drop = freq * 10 * amp;
                let j = getJitter(i, chaos);
                path += `M 0,${y} L ${midX/2},${y-drop+j} L ${midX},${y} L ${midX + midX/2},${y+drop+j} L ${W},${y} `;
            }
        }

        paths[p] = path;
    }

    // Push to HTML
    for(let i=1; i<=4; i++) {
        let lineEl = document.getElementById(`svg-p${i}-line`);
        if (lineEl) lineEl.setAttribute('d', paths[i-1]);
    }
}

// ==========================================
// HYPER-VIBRANT COLOR SHUFFLE ENGINE
// ==========================================
function randomizeColors() {
    // Ultra vibrant neon backgrounds
    const bgGradients = [
        ['#000000', '#1a1a24'], // Pitch dark
        ['#2b0255', '#e21051'], // Cyberpunk pink/purple
        ['#0f2027', '#203a43'], // Space
        ['#141e30', '#243b55'], // Deep Blue
        ['#ffecd2', '#fcb69f'], // Soft peach
        ['#0f0c29', '#302b63'], // Synthwave night
        ['#000428', '#004e92'], // Dark aqua
        ['#ece9e6', '#ffffff'], // Clean White
        ['#000000', '#000000']  // Solid Black
    ];

    // Ultra bright contrast lines
    const lineGradients = [
        ['#00ff87', '#60efff'], // Neon Green/Cyan
        ['#ff0844', '#ffb199'], // Toxic Pink
        ['#f12711', '#f5af19'], // Fire Orange
        ['#7F00FF', '#E100FF'], // Laser Purple
        ['#00c6ff', '#0072ff'], // Bright Azure
        ['#fdfc47', '#24fe41'], // Acid Green
        ['#ffe259', '#ffa751'], // Bright Gold
        ['#ffffff', '#e0e0e0'], // White Gloss
        ['#111111', '#333333']  // Dark Ink
    ];
    
    for (let i = 1; i <= 4; i++) {
        let randomBg = bgGradients[Math.floor(Math.random() * bgGradients.length)];
        let randomLine = lineGradients[Math.floor(Math.random() * lineGradients.length)];
        
        let bg1 = document.getElementById(`p${i}-bg1-stop`);
        let bg2 = document.getElementById(`p${i}-bg2-stop`);
        let l1 = document.getElementById(`p${i}-line1-stop`);
        let l2 = document.getElementById(`p${i}-line2-stop`);

        if (bg1) bg1.setAttribute('stop-color', randomBg[0]);
        if (bg2) bg2.setAttribute('stop-color', randomBg[1]);
        if (l1) l1.setAttribute('stop-color', randomLine[0]);
        if (l2) l2.setAttribute('stop-color', randomLine[1]);

        let inBg1 = document.getElementById(`p${i}-bg1`);
        let inBg2 = document.getElementById(`p${i}-bg2`);
        let inL1 = document.getElementById(`p${i}-line1`);
        let inL2 = document.getElementById(`p${i}-line2`);

        if (inBg1) inBg1.value = randomBg[0];
        if (inBg2) inBg2.value = randomBg[1];
        if (inL1) inL1.value = randomLine[0];
        if (inL2) inL2.value = randomLine[1];
    }
}

// Trigger Redraws
['eng-density', 'eng-freq', 'eng-thick', 'eng-amp', 'eng-phase', 'eng-chaos', 'eng-3d'].forEach(id => {
    const slider = document.getElementById(id);
    if (slider) {
        slider.addEventListener('input', (e) => {
            let valText = e.target.value;
            if(['eng-freq', 'eng-amp', 'eng-chaos'].includes(id)) valText += '%';
            if(['eng-thick', 'eng-3d'].includes(id)) valText += 'PX';
            if(id === 'eng-phase') valText += '°';
            
            let label = document.getElementById(`val-${id.split('eng-')[1]}`);
            if (label) label.innerText = valText;
            
            generateDynamicArt();
        });
    }
});

if (modeSelect) {
    modeSelect.addEventListener('change', () => {
        randomizeColors();
        generateDynamicArt();
    });
}

// ==========================================
// RANDOMIZATION ENGINE
// ==========================================
function randomizeEngine() {
    if (!modeSelect) return;
    
    const modes = Array.from(modeSelect.options).map(opt => opt.value);
    const randomMode = modes[Math.floor(Math.random() * modes.length)];
    
    const randomDensity = Math.floor(Math.random() * (100 - 10 + 1)) + 10;
    const randomFreq = Math.floor(Math.random() * 80) + 10;
    const randomThick = Math.floor(Math.random() * 50) + 5;
    const randomAmp = Math.floor(Math.random() * (150 - 50 + 1)) + 50; 
    const randomPhase = Math.floor(Math.random() * 360);
    const randomChaos = Math.floor(Math.random() * 15); 
    const random3d = Math.floor(Math.random() * 20); // Keep 3D effect tasteful

    modeSelect.value = randomMode;
    if(densitySlider) densitySlider.value = randomDensity;
    if(freqSlider) freqSlider.value = randomFreq;
    if(thickSlider) thickSlider.value = randomThick;
    if(ampSlider) ampSlider.value = randomAmp;
    if(phaseSlider) phaseSlider.value = randomPhase;
    if(chaosSlider) chaosSlider.value = randomChaos;
    if(depth3dSlider) depth3dSlider.value = random3d;

    if(document.getElementById('val-density')) document.getElementById('val-density').innerText = randomDensity;
    if(document.getElementById('val-freq')) document.getElementById('val-freq').innerText = randomFreq + '%';
    if(document.getElementById('val-thick')) document.getElementById('val-thick').innerText = randomThick + 'PX';
    if(document.getElementById('val-amp')) document.getElementById('val-amp').innerText = randomAmp + '%';
    if(document.getElementById('val-phase')) document.getElementById('val-phase').innerText = randomPhase + '°';
    if(document.getElementById('val-chaos')) document.getElementById('val-chaos').innerText = randomChaos + '%';
    if(document.getElementById('val-3d')) document.getElementById('val-3d').innerText = random3d + 'PX';

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
const downloadBtn = document.getElementById('downloadBtn');
if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
        let wasSafeVisible = safeAreaVisible;
        if(wasSafeVisible) {
            for(let i=1; i<=4; i++) {
                let box = document.getElementById(`safe-${i}`);
                if(box) box.style.display = 'none';
            }
        }

        const svgElement = document.getElementById('masterCanvas');
        if (!svgElement) return;
        
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

        if(wasSafeVisible) {
            for(let i=1; i<=4; i++) {
                let box = document.getElementById(`safe-${i}`);
                if(box) box.style.display = 'block';
            }
        }
    });
}
