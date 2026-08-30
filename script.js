// Function to map sidebar inputs to SVG attributes
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

// NEW: Function to calculate and update percentage label for Typography sliders
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

    // Attach Percentage Updater to Individual Sliders
    ['fs', 'pos', 'pos-x'].forEach(prop => {
        document.getElementById(`p${i}-${prop}`).addEventListener('input', () => {
            updatePercentLabel(`p${i}-${prop}`, `val-p${i}-${prop}`);
        });
        updatePercentLabel(`p${i}-${prop}`, `val-p${i}-${prop}`); // Initial Load
    });
}

// Attach Percentage Updater to Global Sliders
['global-fs', 'global-pos', 'global-pos-x'].forEach(id => {
    document.getElementById(id).addEventListener('input', () => {
        updatePercentLabel(id, `val-${id}`);
    });
    updatePercentLabel(id, `val-${id}`); // Initial Load
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
        updatePercentLabel(`p${i}-fs`, `val-p${i}-fs`); // Sync the percentage text
    }
});

globalPos.addEventListener('input', (e) => {
    let val = e.target.value;
    for (let i = 1; i <= 4; i++) {
        document.getElementById(`svg-p${i}-title`).setAttribute('x', val);
        document.getElementById(`p${i}-pos`).value = val; 
        updatePercentLabel(`p${i}-pos`, `val-p${i}-pos`); // Sync the percentage text
    }
});

globalPosX.addEventListener('input', (e) => {
    let val = e.target.value;
    for (let i = 1; i <= 4; i++) {
        document.getElementById(`svg-p${i}-title`).setAttribute('y', val);
        document.getElementById(`p${i}-pos-x`).value = val; 
        updatePercentLabel(`p${i}-pos-x`, `val-p${i}-pos-x`); // Sync the percentage text
    }
});

// ==========================================
// DYNAMIC PATTERN GENERATOR ENGINE
// ==========================================
const densitySlider = document.getElementById('eng-density');
const freqSlider = document.getElementById('eng-freq');
const thickSlider = document.getElementById('eng-thick');
const modeSelect = document.getElementById('design-mode');

function generateDynamicArt() {
    const density = parseInt(densitySlider.value); 
    const freq = parseInt(freqSlider.value);       
    const thick = parseInt(thickSlider.value);     
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
            let yOffset = i * (1000 / density); let controlDrop = freq * 15; 
            p1Path += `M ${startX},${1260 - yOffset} Q ${midX},${1260 - yOffset + controlDrop} ${endX},${1260 - yOffset} `;
            p1Path += `M ${startX},${1260 + yOffset} Q ${midX},${1260 + yOffset - controlDrop} ${endX},${1260 + yOffset} `;
        }
        for (let i = 0; i < density * 2; i++) {
            let y = (height / (density * 2)) * i; let bend = freq * 8; 
            p2Path += `M ${startX},${y} Q ${midX},${y + bend} ${endX},${y} `;
        }
        for (let i = 0; i < density; i++) {
            let y = height - (i * (height / density)); let vDrop = freq * 8; 
            p3Path += `M ${startX},${y} L ${midX},${y + vDrop} L ${endX},${y} `;
        }
        for (let i = 0; i < density; i++) {
            let y = (height / density) * i;
            let stretch = Math.abs(Math.sin((i * freq) * 0.05)) * (endX - startX);
            let lineEndX = startX + 150 + stretch;
            if (lineEndX > endX) lineEndX = endX;
            p4Path += `M ${startX},${y} L ${lineEndX},${y} `;
            if (Math.cos(i * freq * 0.1) > 0) {
                let fragStart = lineEndX + (freq * 1.5); let fragEnd = fragStart + 300 + (Math.sin(i) * 100);
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
            let y = (height / density) * i; let amp = freq * 5;
            p1Path += `M ${startX},${y} C ${startX+250},${y-amp} ${midX-250},${y+amp} ${midX},${y} C ${midX+250},${y-amp} ${endX-250},${y+amp} ${endX},${y} `;
        }
        for (let i = 0; i < density; i++) {
            let y = height - (i * (height / density)); let arch = freq * 12;
            p2Path += `M ${startX},${height} Q ${midX},${y - arch} ${endX},${height} `;
        }
        for (let i = 0; i < density * 1.5; i++) {
            let r = i * (1200 / density); let waveOffset = Math.sin(i * 0.2) * (freq * 2);
            p3Path += `M ${startX},${height - r} A ${r+waveOffset} ${r+waveOffset} 0 0 1 ${startX + r},${height} `;
        }
        for (let i = 0; i < density; i++) {
            let startY = (height / density) * i; let endY = startY - (freq * 15);
            p4Path += `M ${startX},${startY} C ${startX+500},${startY} ${endX-500},${endY} ${endX},${endY} `;
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
            let yBase = (height / density) * i;
            p1Path += `M ${startX},${yBase} `; p2Path += `M ${startX},${yBase} `; p3Path += `M ${startX},${yBase} `; p4Path += `M ${startX},${yBase} `;
            
            for(let x = startX; x <= endX; x += 80) {
                let n1 = yBase + Math.sin((x * 0.005) + (i * 0.1)) * (freq * 3) + Math.cos(x * 0.01) * 50;
                let n2 = yBase + Math.sin(x * 0.01) * (freq * 5) * Math.cos(i * 0.05);
                let n3 = yBase + Math.sin((x * 0.008) - (i * 0.2)) * (freq * 4) + Math.tan(x * 0.001) * 20;
                let n4 = yBase + Math.sin(x * 0.003) * (freq * 8) + Math.sin(i * 0.1) * 100;
                
                if (n1 > height) n1 = height; if (n1 < 0) n1 = 0;
                if (n2 > height) n2 = height; if (n2 < 0) n2 = 0;
                if (n3 > height) n3 = height; if (n3 < 0) n3 = 0;
                if (n4 > height) n4 = height; if (n4 < 0) n4 = 0;

                p1Path += `L ${x},${n1} `; p2Path += `L ${x},${n2} `; p3Path += `L ${x},${n3} `; p4Path += `L ${x},${n4} `;
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
        let maxRadius = 1000; 

        for(let i=1; i<=layers; i++) {
            let rBase = (maxRadius / layers) * i;
            for(let j=0; j<=petals; j++) {
                let angle = (j / petals) * Math.PI * 2; let spike = (j % 2 === 0) ? (freq * 1.5) : -(freq * 1.5);
                let x = centerX + Math.cos(angle) * (rBase + spike); let y = centerY + Math.sin(angle) * (rBase + spike);
                if (j === 0) p1Path += `M ${x},${y} `; else p1Path += `L ${x},${y} `;
            }
        }

        for(let i=1; i<=layers; i++) {
            let rBase = (maxRadius / layers) * i;
            for(let j=0; j<petals; j++) {
                let angle1 = (j / petals) * Math.PI * 2;
                let angle2 = ((j + 0.5) / petals) * Math.PI * 2;
                let angle3 = ((j + 1) / petals) * Math.PI * 2;
                let x1 = centerX + Math.cos(angle1) * rBase; let y1 = centerY + Math.sin(angle1) * rBase;
                let x2 = centerX + Math.cos(angle2) * (rBase + freq * 3); let y2 = centerY + Math.sin(angle2) * (rBase + freq * 3);
                let x3 = centerX + Math.cos(angle3) * rBase; let y3 = centerY + Math.sin(angle3) * rBase;
                p2Path += `M ${x1},${y1} Q ${x2},${y2} ${x3},${y3} `;
            }
        }

        let sides = Math.floor(freq / 8) + 3; 
        for(let i=1; i<=density; i++) {
            let r = (maxRadius / density) * i; let offset = (i % 2 === 0) ? 0 : (Math.PI / sides);
            for(let j=0; j<=sides; j++) {
                let angle = (j / sides) * Math.PI * 2 + offset;
                let x = centerX + Math.cos(angle) * r; let y = centerY + Math.sin(angle) * r;
                if (j === 0) p3Path += `M ${x},${y} `; else p3Path += `L ${x},${y} `;
            }
        }

        let dashCount = Math.floor(freq / 5) + 3;
        for(let i=1; i<=density; i++) {
            let r = (maxRadius / density) * i;
            for(let j=0; j<dashCount; j++) {
                let startAngle = (j / dashCount) * Math.PI * 2 + (i * 0.1);
                let endAngle = startAngle + (Math.PI * 2 / dashCount) * 0.6; 
                let x1 = centerX + Math.cos(startAngle) * r; let y1 = centerY + Math.sin(startAngle) * r;
                let x2 = centerX + Math.cos(endAngle) * r; let y2 = centerY + Math.sin(endAngle) * r;
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

// Listeners to trigger manual redesign
densitySlider.addEventListener('input', (e) => {
    document.getElementById('val-density').innerText = e.target.value;
    generateDynamicArt();
});
freqSlider.addEventListener('input', (e) => {
    document.getElementById('val-freq').innerText = e.target.value + '%';
    generateDynamicArt();
});
thickSlider.addEventListener('input', (e) => {
    document.getElementById('val-thick').innerText = e.target.value + 'PX';
    generateDynamicArt();
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

    modeSelect.value = randomMode;
    densitySlider.value = randomDensity;
    freqSlider.value = randomFreq;
    thickSlider.value = randomThick;

    document.getElementById('val-density').innerText = randomDensity;
    document.getElementById('val-freq').innerText = randomFreq + '%';
    document.getElementById('val-thick').innerText = randomThick + 'PX';

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
