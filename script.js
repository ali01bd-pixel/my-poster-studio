// ==========================================
// UI SYNC AND TOGGLES
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
// ADVANCED MATHEMATICAL ART ENGINE
// ==========================================
const densitySlider = document.getElementById('eng-density');
const freqSlider = document.getElementById('eng-freq');
const thickSlider = document.getElementById('eng-thick');
const modeSelect = document.getElementById('design-mode');
const ampSlider = document.getElementById('eng-amp');
const phaseSlider = document.getElementById('eng-phase');
const chaosSlider = document.getElementById('eng-chaos');

// Deterministic Pseudo-Random Number Generator
function randomSeed(seed) {
    let x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}

function getJitter(seed, chaosLevel) {
    return (randomSeed(seed) - 0.5) * chaosLevel * 10; 
}

function generateDynamicArt() {
    const density = parseInt(densitySlider.value); 
    const freq = parseInt(freqSlider.value);       
    const thick = parseInt(thickSlider.value);     
    const amp = parseInt(ampSlider.value) / 100;    
    const phase = parseInt(phaseSlider.value);      
    const chaos = parseInt(chaosSlider.value);      
    const mode = modeSelect.value;

    const W = 1830; 
    const H = 2520;
    const midX = W / 2;
    const midY = H / 2;
    
    let paths = ["", "", "", ""];
    
    // Determine if the design mode uses solid shapes (fill) or outlines (stroke)
    let fillModes = ['watercolor_bubble', 'bauhaus', 'boho_terrazzo', 'neo_brutalist', 'gradient_grain', 'aura', 'liquid_marble'];
    let useFill = fillModes.includes(mode);
    
    for (let i = 1; i <= 4; i++) {
        let el = document.getElementById(`svg-p${i}-line`);
        if (useFill) {
            el.setAttribute('fill', `url(#stroke-grad-${i})`);
            el.setAttribute('stroke', 'none');
            // Give specific modes a beautiful transparent overlay effect
            if (['watercolor_bubble', 'gradient_grain', 'aura'].includes(mode)) {
                el.setAttribute('style', 'mix-blend-mode: multiply; opacity: 0.85;');
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
        // 1. MINIMALIST CONTINUOUS LINE ART (Elegant Splines)
        // ----------------------------------------------------
        if (mode === 'minimalist_line') {
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
        
        // ----------------------------------------------------
        // 2. BAUHAUS GEOMETRIC (Strict Primitives)
        // ----------------------------------------------------
        else if (mode === 'bauhaus') {
            let shapes = Math.floor(density / 10) + 2;
            for(let i=0; i<shapes; i++) {
                let s = (freq * 5 * amp) + (randomSeed(i*p+1)*200);
                let x = randomSeed(i*p+2) * W; 
                let y = randomSeed(i*p+3) * H;
                let type = Math.floor(randomSeed(i*p+4) * 3);
                
                if (type === 0) {
                    // Perfect Circle
                    path += `M ${x},${y} m -${s},0 a ${s},${s} 0 1,0 ${s*2},0 a ${s},${s} 0 1,0 -${s*2},0 `;
                } else if (type === 1) {
                    // Thick Rectangle
                    path += `M ${x},${y} L ${x+s*1.5},${y} L ${x+s*1.5},${y+s} L ${x},${y+s} Z `;
                } else {
                    // Right Triangle
                    path += `M ${x},${y} L ${x+s*2},${y+s*2} L ${x},${y+s*2} Z `;
                }
            }
        }

        // ----------------------------------------------------
        // 3. BOHO TERRAZZO & ARCH
        // ----------------------------------------------------
        else if (mode === 'boho_terrazzo') {
            // Main Archway
            let archW = 400 * amp + (p*50);
            let archH = 1000 * amp;
            let ax = midX - archW;
            let ay = midY + 500;
            path += `M ${ax},${ay} L ${ax},${ay - archH} A ${archW},${archW} 0 0,1 ${ax + archW*2},${ay - archH} L ${ax + archW*2},${ay} Z `;
            
            // Terrazzo flakes
            let flakes = density;
            for(let i=0; i<flakes; i++) {
                let fx = randomSeed(i*p+5) * W;
                let fy = randomSeed(i*p+6) * H;
                let fs = randomSeed(i*p+7) * freq * amp;
                path += `M ${fx},${fy} L ${fx+fs},${fy+fs*0.5} L ${fx+fs*0.8},${fy+fs*1.2} L ${fx-fs*0.2},${fy+fs} Z `;
            }
        }

        // ----------------------------------------------------
        // 4. 80s SYNTHWAVE GRID (Perspective)
        // ----------------------------------------------------
        else if (mode === 'synthwave') {
            let horizon = midY + 200;
            // Retro Sun
            let sr = 400 * amp;
            path += `M ${midX},${horizon - 100} m -${sr},0 a ${sr},${sr} 0 1,1 ${sr*2},0 a ${sr},${sr} 0 1,1 -${sr*2},0 `;
            
            // Perspective Vertical Lines
            let lines = Math.floor(density / 3);
            for(let i=-lines; i<=lines; i++) {
                let bottomX = midX + (i * 150 * amp);
                path += `M ${midX},${horizon} L ${bottomX + (i*100)},${H} `;
            }
            
            // Horizontal lines scaling exponentially
            for(let i=0; i<15; i++) {
                let y = horizon + Math.pow(1.4, i) * (freq * 0.1);
                if (y < H) path += `M 0,${y} L ${W},${y} `;
            }
        }

        // ----------------------------------------------------
        // 5. 70s PSYCHEDELIC TYPOGRAPHY (Flowing Lava/Ribbons)
        // ----------------------------------------------------
        else if (mode === 'psychedelic' || mode === 'retro') {
            let waves = density / 2;
            for(let i=0; i<waves; i++) {
                let y = (H / waves) * i;
                let waveDepth = freq * 10 * amp;
                let j = getJitter(i, chaos);
                path += `M 0,${y+j} C 400,${y-waveDepth} 600,${y+waveDepth} 900,${y} C 1200,${y-waveDepth} 1400,${y+waveDepth} 1830,${y+j} `;
            }
        }

        // ----------------------------------------------------
        // 6. Y2K CYBER GRAPHICS (Starbursts & Wireframes)
        // ----------------------------------------------------
        else if (mode === 'y2k') {
            let stars = Math.floor(density / 10) + 1;
            for(let i=0; i<stars; i++) {
                let cx = randomSeed(i*p+8) * W;
                let cy = randomSeed(i*p+9) * H;
                let r = (freq * 3 * amp) + 50;
                // Sharp 4-point star
                path += `M ${cx},${cy-r} Q ${cx+r*0.1},${cy-r*0.1} ${cx+r},${cy} Q ${cx+r*0.1},${cy+r*0.1} ${cx},${cy+r} Q ${cx-r*0.1},${cy+r*0.1} ${cx-r},${cy} Q ${cx-r*0.1},${cy-r*0.1} ${cx},${cy-r} Z `;
            }
            // Elliptical Orbits
            let eX = W * 0.8; let eY = H * 0.2;
            for(let i=1; i<=3; i++) {
                let rx = 300 * i * amp; let ry = 100 * i * amp;
                path += `M ${eX-rx},${eY} a ${rx},${ry} 0 1,0 ${rx*2},0 a ${rx},${ry} 0 1,0 -${rx*2},0 `;
            }
        }

        // ----------------------------------------------------
        // 7. WATERCOLOR BUBBLES / AURA
        // ----------------------------------------------------
        else if (mode === 'watercolor_bubble' || mode === 'aura' || mode === 'gradient_grain') {
            let circles = density / 2;
            for(let i=0; i<circles; i++) {
                let r = (freq * 4 * amp) + randomSeed(i+p)*200;
                let cx = (mode === 'aura') ? midX : randomSeed(i*p+10) * W; 
                let cy = (mode === 'aura') ? midY + (i*50) : randomSeed(i*p+11) * H;
                path += `M ${cx-r},${cy} a ${r},${r} 0 1,0 ${r*2},0 a ${r},${r} 0 1,0 -${r*2},0 `;
            }
        }

        // ----------------------------------------------------
        // 8. MANDALA ART (Radial Symmetry)
        // ----------------------------------------------------
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

        // ----------------------------------------------------
        // 9. TOPOLOGY (Topographic Map lines)
        // ----------------------------------------------------
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

        // ----------------------------------------------------
        // 10. DEFAULT / GEOMETRIC (Angular grids)
        // ----------------------------------------------------
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

    // Apply the mathematical paths to the SVGs
    for(let i=1; i<=4; i++) {
        document.getElementById(`svg-p${i}-line`).setAttribute('d', paths[i-1]);
    }
}

// ==========================================
// BACKGROUND & LINE GRADIENT SHUFFLE ENGINE
// ==========================================
function randomizeColors() {
    // Beautiful, modern Adobe Stock-ready color palettes
    const bgGradients = [
        ['#ece9e6', '#ffffff'], // Clean Minimal White
        ['#0f2027', '#203a43'], // Deep Space
        ['#2c3e50', '#000000'], // Slate Black
        ['#fff1eb', '#ace0f9'], // Pastel Sunset
        ['#a18cd1', '#fbc2eb'], // Dreamy Purple
        ['#141e30', '#243b55'], // Midnight Blue
        ['#000000', '#1a1a1a'], // Pure Noir
        ['#e0c3fc', '#8ec5fc'], // Synth Violet
        ['#f6d365', '#fda085'], // Warm Peach
        ['#1e130c', '#9a8478']  // Boho Brown
    ];

    const lineGradients = [
        ['#111111', '#333333'], // Deep Ink
        ['#ff0844', '#ffb199'], // Vibrant Coral
        ['#00c6ff', '#0072ff'], // Cyber Cyan
        ['#f12711', '#f5af19'], // Fire Orange
        ['#7F00FF', '#E100FF'], // Neon Purple
        ['#11998e', '#38ef7d'], // Mint Green
        ['#c31432', '#240b36'], // Blood Dark
        ['#ffffff', '#f0f0f0'], // Pure White (for dark BGs)
        ['#fdfc47', '#24fe41']  // Acid Green
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

// Event Listeners for the advanced sliders
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
    
    const randomDensity = Math.floor(Math.random() * (100 - 10 + 1)) + 10;
    const randomFreq = Math.floor(Math.random() * 80) + 10;
    const randomThick = Math.floor(Math.random() * 50) + 5;
    const randomAmp = Math.floor(Math.random() * (150 - 50 + 1)) + 50; 
    const randomPhase = Math.floor(Math.random() * 360);
    const randomChaos = Math.floor(Math.random() * 15); // Keep chaos low for premium look

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

    if(wasSafeVisible) {
        for
