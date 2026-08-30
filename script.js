// Map inputs to SVG attributes
function linkInputToSVG(inputId, svgElementId, attribute) {
    const inputElement = document.getElementById(inputId);
    const svgElement = document.getElementById(svgElementId);
    if (inputElement && svgElement) {
        if (inputElement.tagName === 'SELECT' || inputElement.type === 'color' || inputElement.type === 'range' || inputElement.type === 'text') {
            inputElement.addEventListener('input', (event) => {
                if (attribute === 'text') svgElement.textContent = event.target.value;
                else svgElement.setAttribute(attribute, event.target.value);
            });
            if(inputElement.tagName === 'SELECT') {
                 inputElement.addEventListener('change', (event) => {
                    svgElement.setAttribute(attribute, event.target.value);
                });
            }
        }
    }
}

// Percentage label updater
function updatePercentLabel(sliderId, labelId) {
    const slider = document.getElementById(sliderId);
    const label = document.getElementById(labelId);
    if (slider && label) {
        const min = parseFloat(slider.min);
        const max = parseFloat(slider.max);
        const val = parseFloat(slider.value);
        const percent = Math.round(((val - min) / (max - min)) * 100);
        label.innerText = percent + '%';
    }
}

// Map the 4 posters' individual inputs
for (let i = 1; i <= 4; i++) {
    linkInputToSVG(`p${i}-title`, `svg-p${i}-title`, 'text');
    linkInputToSVG(`p${i}-font`, `svg-p${i}-title`, 'font-family');
    linkInputToSVG(`p${i}-bg`, `svg-p${i}-bg`, 'fill');
    linkInputToSVG(`p${i}-line`, `svg-p${i}-line`, 'stroke');
    linkInputToSVG(`p${i}-text`, `svg-p${i}-title`, 'fill');
    
    linkInputToSVG(`p${i}-fs`, `svg-p${i}-title`, 'font-size');
    linkInputToSVG(`p${i}-pos`, `svg-p${i}-title`, 'x');
    linkInputToSVG(`p${i}-pos-x`, `svg-p${i}-title`, 'y');

    ['fs', 'pos', 'pos-x'].forEach(prop => {
        document.getElementById(`p${i}-${prop}`).addEventListener('input', () => {
            updatePercentLabel(`p${i}-${prop}`, `val-p${i}-${prop}`);
        });
        updatePercentLabel(`p${i}-${prop}`, `val-p${i}-${prop}`);
    });
}

['global-fs', 'global-pos', 'global-pos-x'].forEach(id => {
    document.getElementById(id).addEventListener('input', () => {
        updatePercentLabel(id, `val-${id}`);
    });
    updatePercentLabel(id, `val-${id}`); 
});


// ==========================================
// DYNAMIC ARTBOARD COUNT SELECTOR
// ==========================================
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
// GLOBAL TEXT CONTROLS LOGIC
// ==========================================
const globalText = document.getElementById('global-text');
const globalFont = document.getElementById('global-font');
const globalFs = document.getElementById('global-fs');
const globalPos = document.getElementById('global-pos');
const globalPosX = document.getElementById('global-pos-x');

globalText.addEventListener('input', (e) => {
    let val = e.target.value;
    for (let i = 1; i <= 4; i++) {
        if(val.trim() !== "") {
            document.getElementById(`svg-p${i}-title`).textContent = val;
            document.getElementById(`p${i}-title`).value = val; 
        }
    }
});

globalFont.addEventListener('change', (e) => {
    let val = e.target.value;
    for (let i = 1; i <= 4; i++) {
        document.getElementById(`svg-p${i}-title`).setAttribute('font-family', val);
        document.getElementById(`p${i}-font`).value = val; 
    }
});

globalFs.addEventListener('input', (e) => {
    let val = e.target.value;
    for (let i = 1; i <= 4; i++) {
        document.getElementById(`svg-p${i}-title`).setAttribute('font-size', val);
        document.getElementById(`p${i}-fs`).value = val; 
        updatePercentLabel(`p${i}-fs`, `val-p${i}-fs`); 
    }
});

globalPos.addEventListener('input', (e) => {
    let val = e.target.value;
    for (let i = 1; i <= 4; i++) {
        document.getElementById(`svg-p${i}-title`).setAttribute('x', val);
        document.getElementById(`p${i}-pos`).value = val; 
        updatePercentLabel(`p${i}-pos`, `val-p${i}-pos`); 
    }
});

globalPosX.addEventListener('input', (e) => {
    let val = e.target.value;
    for (let i = 1; i <= 4; i++) {
        document.getElementById(`svg-p${i}-title`).setAttribute('y', val);
        document.getElementById(`p${i}-pos-x`).value = val; 
        updatePercentLabel(`p${i}-pos-x`, `val-p${i}-pos-x`); 
    }
});

// ==========================================
// ADVANCED PATTERN GENERATOR ENGINE
// ==========================================
const densitySlider = document.getElementById('eng-density');
const freqSlider = document.getElementById('eng-freq');
const thickSlider = document.getElementById('eng-thick');
const modeSelect = document.getElementById('design-mode');
const ampSlider = document.getElementById('eng-amp');
const phaseSlider = document.getElementById('eng-phase');
const chaosSlider = document.getElementById('eng-chaos');

// Pseudo-random noise function for deterministic chaos
function getJitter(seed, chaosLevel) {
    let noise = (Math.sin(seed * 12.9898 + seed * 78.233) * 43758.5453) % 1;
    return noise * chaosLevel * 5; 
}

function generateDynamicArt() {
    const density = parseInt(densitySlider.value); 
    const freq = parseInt(freqSlider.value);       
    const thick = parseInt(thickSlider.value);     
    const amp = parseInt(ampSlider.value) / 100;    // Scale multiplier: 0.1 to 3.0
    const phase = parseInt(phaseSlider.value);      // Offset: 0 to 360
    const chaos = parseInt(chaosSlider.value);      // Jitter multiplier: 0 to 150
    const mode = modeSelect.value;

    const startX = 200; const endX = 1830; const midX = 1015; const height = 2520;
    
    let p1Path = "", p2Path = "", p3Path = "", p4Path = "";

    // ----------------------------------------------------
    // MODE 1: GEOMETRIC
    // ----------------------------------------------------
    if (mode === 'geometric') {
        document.getElementById('svg-p1-line').setAttribute('stroke-width', thick * 0.15); 
        document.getElementById('svg-p2-line').setAttribute('stroke-width', thick * 0.4);  
        document.getElementById('svg-p3-line').setAttribute('stroke-width', thick * 0.6);  
        document.getElementById('svg-p4-line').setAttribute('stroke-width', thick * 1.5);  

        for (let i = 0; i < density; i++) {
            let yOffset = i * (1000 / density) * amp; 
            let controlDrop = freq * 15 * amp; 
            let yShift = phase * 5;
            let j1 = getJitter(i, chaos); let j2 = getJitter(i+100, chaos);
            
            p1Path += `M ${startX},${1260 - yOffset + yShift + j1} Q ${midX + j2},${1260 - yOffset + controlDrop + yShift} ${endX},${1260 - yOffset + yShift + j1} `;
            p1Path += `M ${startX},${1260 + yOffset + yShift + j1} Q ${midX - j2},${1260 + yOffset - controlDrop + yShift} ${endX},${1260 + yOffset + yShift + j1} `;
        }
        for (let i = 0; i < density * 2; i++) {
            let y = ((height / (density * 2)) * i) + (phase * 5); 
            let bend = freq * 8 * amp; 
            let j = getJitter(i, chaos);
            p2Path += `M ${startX},${y + j} Q ${midX},${y + bend + j} ${endX},${y + j} `;
        }
        for (let i = 0; i < density; i++) {
            let y = height - (i * (height / density) * amp) + (phase * 5); 
            let vDrop = freq * 8 * amp; 
            let j = getJitter(i, chaos);
            p3Path += `M ${startX},${y + j} L ${midX + j},${y + vDrop} L ${endX},${y + j} `;
        }
        for (let i = 0; i < density; i++) {
            let y = ((height / density) * i) + (phase * 5);
            let stretch = Math.abs(Math.sin(((i + phase) * freq) * 0.05)) * (endX - startX) * amp;
            let lineEndX = startX + 150 + stretch + getJitter(i, chaos);
            if (lineEndX > endX) lineEndX = endX;
            p4Path += `M ${startX},${y} L ${lineEndX},${y} `;
            if (Math.cos((i+phase) * freq * 0.1) > 0) {
                let fragStart = lineEndX + (freq * 1.5); 
                let fragEnd = fragStart + (300 * amp) + (Math.sin(i) * 100);
                if (fragEnd < endX && fragStart < endX) p4Path += `M ${fragStart},${y} L ${fragEnd},${y} `;
            }
        }
    }
    // ----------------------------------------------------
    // MODE 2: RETRO WAVES
    // ----------------------------------------------------
    else if (mode === 'retro') {
        document.getElementById('svg-p1-line').setAttribute('stroke-width', thick * 0.4); 
        document.getElementById('svg-p2-line').setAttribute('stroke-width', thick * 0.5);  
        document.getElementById('svg-p3-line').setAttribute('stroke-width', thick * 0.3);  
        document.getElementById('svg-p4-line').setAttribute('stroke-width', thick * 0.8);

        for (let i = 0; i < density; i++) {
            let y = ((height / density) * i) + (phase * 5); 
            let a = freq * 5 * amp;
            let j = getJitter(i, chaos);
            p1Path += `M ${startX},${y+j} C ${startX+250+j},${y-a} ${midX-250-j},${y+a} ${midX},${y+j} C ${midX+250+j},${y-a} ${endX-250-j},${y+a} ${endX},${y+j} `;
        }
        for (let i = 0; i < density; i++) {
            let y = height - (i * (height / density)) + (phase * 5); 
            let arch = freq * 12 * amp;
            let j = getJitter(i, chaos);
            p2Path += `M ${startX},${height+j} Q ${midX+j},${y - arch} ${endX},${height+j} `;
        }
        for (let i = 0; i < density * 1.5; i++) {
            let r = i * (1200 / density) * amp; 
            let waveOffset = Math.sin((i+phase) * 0.2) * (freq * 2);
            let j = getJitter(i, chaos);
            p3Path += `M ${startX},${height - r + j} A ${r+waveOffset+j} ${r+waveOffset+j} 0 0 1 ${startX + r + j},${height} `;
        }
        for (let i = 0; i < density; i++) {
            let startY = ((height / density) * i) + (phase * 5); 
            let endY = startY - (freq * 15 * amp);
            let j = getJitter(i, chaos);
            p4Path += `M ${startX},${startY+j} C ${startX+500},${startY+j} ${endX-500},${endY+j} ${endX},${endY+j} `;
        }
    }
    // ----------------------------------------------------
    // MODE 3: COMPLEX TOPOLOGY
    // ----------------------------------------------------
    else if (mode === 'topology') {
        document.getElementById('svg-p1-line').setAttribute('stroke-width', thick * 0.2); 
        document.getElementById('svg-p2-line').setAttribute('stroke-width', thick * 0.25);  
        document.getElementById('svg-p3-line').setAttribute('stroke-width', thick * 0.3);  
        document.getElementById('svg-p4-line').setAttribute('stroke-width', thick * 0.4);

        for (let i = 0; i < density; i++) {
            let yBase = ((height / density) * i) + (phase * 5);
            let jStart = getJitter(i, chaos);
            p1Path += `M ${startX},${yBase+jStart} `; p2Path += `M ${startX},${yBase+jStart} `; 
            p3Path += `M ${startX},${yBase+jStart} `; p4Path += `M ${startX},${yBase+jStart} `;
            
            for(let x = startX; x <= endX; x += 80) {
                let px = x + (phase * 2); // Phase shifting horizontally for noise
                let j = getJitter(x*i, chaos);

                let n1 = yBase + Math.sin((px * 0.005) + (i * 0.1)) * (freq * 3 * amp) + Math.cos(px * 0.01) * 50 * amp;
                let n2 = yBase + Math.sin(px * 0.01) * (freq * 5 * amp) * Math.cos(i * 0.05);
                let n3 = yBase + Math.sin((px * 0.008) - (i * 0.2)) * (freq * 4 * amp) + Math.tan(px * 0.001) * 20;
                let n4 = yBase + Math.sin(px * 0.003) * (freq * 8 * amp) + Math.sin(i * 0.1) * 100 * amp;
                
                if (n1 > height) n1 = height; if (n1 < 0) n1 = 0;
                if (n2 > height) n2 = height; if (n2 < 0) n2 = 0;
                if (n3 > height) n3 = height; if (n3 < 0) n3 = 0;
                if (n4 > height) n4 = height; if (n4 < 0) n4 = 0;

                p1Path += `L ${x+j},${n1+j} `; p2Path += `L ${x+j},${n2+j} `; p3Path += `L ${x+j},${n3+j} `; p4Path += `L ${x+j},${n4+j} `;
            }
        }
    }
    // ----------------------------------------------------
    // MODE 4: MANDALA 
    // ----------------------------------------------------
    else if (mode === 'mandala') {
        document.getElementById('svg-p1-line').setAttribute('stroke-width', thick * 0.2); 
        document.getElementById('svg-p2-line').setAttribute('stroke-width', thick * 0.3);  
        document.getElementById('svg-p3-line').setAttribute('stroke-width', thick * 0.4);  
        document.getElementById('svg-p4-line').setAttribute('stroke-width', thick * 0.6);

        let centerX = midX; let centerY = height / 2;
        let layers = Math.floor(density / 3) + 4; let petals = Math.floor(freq / 3) + 6;    
        let maxRadius = 1000 * amp; 
        let phaseRad = phase * (Math.PI / 180); // convert deg to radians

        for(let i=1; i<=layers; i++) {
            let rBase = (maxRadius / layers) * i;
            for(let j=0; j<=petals; j++) {
                let angle = ((j / petals) * Math.PI * 2) + phaseRad + (i * 0.05); 
                let spike = (j % 2 === 0) ? (freq * 1.5 * amp) : -(freq * 1.5 * amp);
                let jx = getJitter(i*j, chaos); let jy = getJitter(j*i, chaos);
                
                let x = centerX + Math.cos(angle) * (rBase + spike) + jx; 
                let y = centerY + Math.sin(angle) * (rBase + spike) + jy;
                if (j === 0) p1Path += `M ${x},${y} `; else p1Path += `L ${x},${y} `;
            }
        }

        for(let i=1; i<=layers; i++) {
            let rBase = (maxRadius / layers) * i;
            for(let j=0; j<petals; j++) {
                let angle1 = ((j / petals) * Math.PI * 2) + phaseRad;
                let angle2 = (((j + 0.5) / petals) * Math.PI * 2) + phaseRad;
                let angle3 = (((j + 1) / petals) * Math.PI * 2) + phaseRad;
                let jx = getJitter(i, chaos);
                
                let x1 = centerX + Math.cos(angle1) * rBase; let y1 = centerY + Math.sin(angle1) * rBase;
                let x2 = centerX + Math.cos(angle2) * (rBase + freq * 3 * amp) + jx; let y2 = centerY + Math.sin(angle2) * (rBase + freq * 3 * amp) + jx;
                let x3 = centerX + Math.cos(angle3) * rBase; let y3 = centerY + Math.sin(angle3) * rBase;
                p2Path += `M ${x1},${y1} Q ${x2},${y2} ${x3},${y3} `;
            }
        }

        let sides = Math.floor(freq / 8) + 3; 
        for(let i=1; i<=density; i++) {
            let r = (maxRadius / density) * i; let offset = (i % 2 === 0) ? phaseRad : (Math.PI / sides) + phaseRad;
            for(let j=0; j<=sides; j++) {
                let angle = (j / sides) * Math.PI * 2 + offset;
                let jx = getJitter(i*j, chaos);
                let x = centerX + Math.cos(angle) * r + jx; let y = centerY + Math.sin(angle) * r + jx;
                if (j === 0) p3Path += `M ${x},${y} `; else p3Path += `L ${x},${y} `;
            }
        }

        let dashCount = Math.floor(freq / 5) + 3;
        for(let i=1; i<=density; i++) {
            let r = (maxRadius / density) * i;
            for(let j=0; j<dashCount; j++) {
                let startAngle = ((j / dashCount) * Math.PI * 2) + (i * 0.1) + phaseRad;
                let endAngle = startAngle + (Math.PI * 2 / dashCount) * 0.6; 
                let jx = getJitter(i*j, chaos);
                
                let x1 = centerX + Math.cos(startAngle) * r + jx; let y1 = centerY + Math.sin(startAngle) * r + jx;
                let x2 = centerX + Math.cos(endAngle) * r + jx; let y2 = centerY + Math.sin(endAngle) * r + jx;
                p4Path += `M ${x1},${y1} A ${r} ${r} 0 0 1 ${x2},${y2} `;
            }
        }
    }

    document.getElementById('svg-p1-line').setAttribute('d', p1Path);
    document.getElementById('svg-p2-line').setAttribute('d', p2Path);
    document.getElementById('svg-p3-line').setAttribute('d', p3Path);
    document.getElementById('svg-p4-line').setAttribute('d', p4Path);
}

// ==========================================
// BACKGROUND RANDOMIZATION ENGINE
// ==========================================
function randomizeBackgrounds() {
    const palettes = [
        '#1a1a24', '#e61f26', '#c3e000', '#362222', '#e3e1db', 
        '#0f172a', '#4c1d95', '#be123c', '#047857', '#b45309', 
        '#171717', '#f8fafc', '#3b82f6', '#14b8a6', '#f43f5e', 
        '#ff9800', '#673ab7', '#009688', '#e91e63', '#212121'
    ];
    
    for (let i = 1; i <= 4; i++) {
        let randomBg = palettes[Math.floor(Math.random() * palettes.length)];
        document.getElementById(`svg-p${i}-bg`).setAttribute('fill', randomBg);
        document.getElementById(`p${i}-bg`).value = randomBg;
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
    randomizeBackgrounds();
    generateDynamicArt();
});

// ==========================================
// RANDOMIZATION ENGINE (AUTO SHUFFLE)
// ==========================================
function randomizeEngine() {
    const modes = ['geometric', 'retro', 'topology', 'mandala'];
    const randomMode = modes[Math.floor(Math.random() * modes.length)];
    
    const randomDensity = Math.floor(Math.random() * (150 - 10 + 1)) + 10;
    const randomFreq = Math.floor(Math.random() * 100) + 1;
    const randomThick = Math.floor(Math.random() * 100) + 1;
    
    // New Randoms
    const randomAmp = Math.floor(Math.random() * (200 - 50 + 1)) + 50; 
    const randomPhase = Math.floor(Math.random() * 360);
    const randomChaos = Math.floor(Math.random() * 30); // Keep chaos generally low for good design

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

    randomizeBackgrounds();
    generateDynamicArt();
}

const shuffleBtn = document.querySelector('.btn-shuffle');
if (shuffleBtn) {
    shuffleBtn.addEventListener('click', randomizeEngine);
}

// INITIALIZE ON PAGE LOAD
randomizeEngine();
updatePosterCount();


// Master SVG Download Logic
document.getElementById('downloadBtn').addEventListener('click', () => {
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
});
