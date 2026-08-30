// Map inputs to SVG attributes
function linkInputToSVG(inputId, svgElementId, attribute) {
    const inputElement = document.getElementById(inputId);
    const svgElement = document.getElementById(svgElementId);
    if (inputElement && svgElement) {
        if (inputElement.tagName === 'SELECT' || inputElement.type === 'color' || inputElement.type === 'range' || inputElement.type === 'text') {
            inputElement.addEventListener('input', (event) => {
                svgElement.setAttribute(attribute, event.target.value);
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

// Map the 4 posters' background and line colors
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
    let count = parseInt(posterCountSelect.value);
    // Adjusted widths based on 1080px wide panels + 20px gap spacing
    let canvasWidths = { 1: 1080, 2: 2180, 3: 3280, 4: 4380 };
    
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
    document.getElementById('masterCanvas').setAttribute('viewBox', `0 0 ${newWidth} 1350`);
    document.getElementById('footer-size').innerText = `Master Artboard: ${newWidth} x 1350 px`;
}

posterCountSelect.addEventListener('change', updatePosterCount);

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

    // Rescaled to exactly 1080x1350 Standard Size Canvas
    const startX = 0; const endX = 1080; const midX = 540; const height = 1350; const halfH = height / 2;
    
    let p1Path = "", p2Path = "", p3Path = "", p4Path = "";

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
            
            p1Path += `M ${startX},${halfH - yOffset + yShift + j1} Q ${midX + j2},${halfH - yOffset + controlDrop + yShift} ${endX},${halfH - yOffset + yShift + j1} `;
            p1Path += `M ${startX},${halfH + yOffset + yShift + j1} Q ${midX - j2},${halfH + yOffset - controlDrop + yShift} ${endX},${halfH + yOffset + yShift + j1} `;
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
    else if (mode === 'retro') {
        document.getElementById('svg-p1-line').setAttribute('stroke-width', thick * 0.4); 
        document.getElementById('svg-p2-line').setAttribute('stroke-width', thick * 0.5);  
        document.getElementById('svg-p3-line').setAttribute('stroke-width', thick * 0.3);  
        document.getElementById('svg-p4-line').setAttribute('stroke-width', thick * 0.8);

        for (let i = 0; i < density; i++) {
            let y = ((height / density) * i) + (phase * 5); 
            let a = freq * 5 * amp;
            let j = getJitter(i, chaos);
            p1Path += `M ${startX},${y+j} C ${startX+150+j},${y-a} ${midX-150-j},${y+a} ${midX},${y+j} C ${midX+150+j},${y-a} ${endX-150-j},${y+a} ${endX},${y+j} `;
        }
        for (let i = 0; i < density; i++) {
            let y = height - (i * (height / density)) + (phase * 5); 
            let arch = freq * 12 * amp;
            let j = getJitter(i, chaos);
            p2Path += `M ${startX},${height+j} Q ${midX+j},${y - arch} ${endX},${height+j} `;
        }
        for (let i = 0; i < density * 1.5; i++) {
            let r = i * (halfH / density) * amp; 
            let waveOffset = Math.sin((i+phase) * 0.2) * (freq * 2);
            let j = getJitter(i, chaos);
            p3Path += `M ${startX},${height - r + j} A ${r+waveOffset+j} ${r+waveOffset+j} 0 0 1 ${startX + r + j},${height} `;
        }
        for (let i = 0; i < density; i++) {
            let startY = ((height / density) * i) + (phase * 5); 
            let endY = startY - (freq * 15 * amp);
            let j = getJitter(i, chaos);
            p4Path += `M ${startX},${startY+j} C ${startX+300},${startY+j} ${endX-300},${endY+j} ${endX},${endY+j} `;
        }
    }
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
            
            for(let x = startX; x <= endX; x += 50) {
                let px = x + (phase * 2);
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
    else if (mode === 'mandala') {
        document.getElementById('svg-p1-line').setAttribute('stroke-width', thick * 0.2); 
        document.getElementById('svg-p2-line').setAttribute('stroke-width', thick * 0.3);  
        document.getElementById('svg-p3-line').setAttribute('stroke-width', thick * 0.4);  
        document.getElementById('svg-p4-line').setAttribute('stroke-width', thick * 0.6);

        let centerX = midX; let centerY = height / 2;
        let layers = Math.floor(density / 3) + 4; let petals = Math.floor(freq / 3) + 6;    
        let maxRadius = 500 * amp; 
        let phaseRad = phase * (Math.PI / 180); 

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
// BACKGROUND & LINE GRADIENT SHUFFLE ENGINE
// ==========================================
function randomizeColors() {
    const bgGradients = [
        ['#0f2027', '#203a43'], ['#2c3e50', '#000000'], ['#141e30', '#243b55'],
        ['#23074d', '#cc5333'], ['#1a2a6c', '#b21f1f'], ['#000000', '#434343'],
        ['#111111', '#111111'], ['#3E5151', '#DECBA4']
    ];

    const lineGradients = [
        ['#00c6ff', '#0072ff'], ['#f12711', '#f5af19'], ['#fc4a1a', '#f7b733'],
        ['#7F00FF', '#E100FF'], ['#11998e', '#38ef7d'], ['#ff0084', '#33001b'],
        ['#00d2ff', '#3a7bd5'], ['#f85032', '#e73827']
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
    const modes = ['geometric', 'retro', 'topology', 'mandala'];
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

const shuffleBtn = document.querySelector('.btn-shuffle');
if (shuffleBtn) shuffleBtn.addEventListener('click', randomizeEngine);

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
