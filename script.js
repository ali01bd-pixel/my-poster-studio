// Function to map sidebar inputs to SVG attributes
function linkInputToSVG(inputId, svgElementId, attribute) {
    const inputElement = document.getElementById(inputId);
    const svgElement = document.getElementById(svgElementId);

    if (inputElement && svgElement) {
        inputElement.addEventListener('input', (event) => {
            if (attribute === 'text') {
                svgElement.textContent = event.target.value;
            } else {
                svgElement.setAttribute(attribute, event.target.value);
            }
        });
    }
}

// Map the 4 posters' inputs to their SVG targets
for (let i = 1; i <= 4; i++) {
    linkInputToSVG(`p${i}-title`, `svg-p${i}-title`, 'text');
    linkInputToSVG(`p${i}-bg`, `svg-p${i}-bg`, 'fill');
    linkInputToSVG(`p${i}-line`, `svg-p${i}-line`, 'stroke');
    linkInputToSVG(`p${i}-box`, `svg-p${i}-box`, 'stroke');
    linkInputToSVG(`p${i}-text`, `svg-p${i}-title`, 'fill');
    
    // NEW: Map Font Size and Position
    linkInputToSVG(`p${i}-fs`, `svg-p${i}-title`, 'font-size');
    linkInputToSVG(`p${i}-pos`, `svg-p${i}-title`, 'x');
}

// ==========================================
// DYNAMIC PATTERN GENERATOR ENGINE
// ==========================================
const densitySlider = document.getElementById('eng-density');
const freqSlider = document.getElementById('eng-freq');
const thickSlider = document.getElementById('eng-thick');

function generateDynamicArt() {
    const density = parseInt(densitySlider.value); 
    const freq = parseInt(freqSlider.value);       
    const thick = parseInt(thickSlider.value);     

    const startX = 350;
    const endX = 1830;
    const midX = 1090;
    const height = 2520;

    document.getElementById('svg-p1-line').setAttribute('stroke-width', thick * 0.15); 
    document.getElementById('svg-p2-line').setAttribute('stroke-width', thick * 0.4);  
    document.getElementById('svg-p3-line').setAttribute('stroke-width', thick * 0.6);  
    document.getElementById('svg-p4-line').setAttribute('stroke-width', thick * 1.5);  

    // POSTER 1: ABSTRACT
    let p1Path = "";
    for (let i = 0; i < density; i++) {
        let yOffset = i * (1000 / density); 
        let controlDrop = freq * 15; 
        p1Path += `M ${startX},${1260 - yOffset} Q ${midX},${1260 - yOffset + controlDrop} ${endX},${1260 - yOffset} `;
        p1Path += `M ${startX},${1260 + yOffset} Q ${midX},${1260 + yOffset - controlDrop} ${endX},${1260 + yOffset} `;
    }
    document.getElementById('svg-p1-line').setAttribute('d', p1Path);

    // POSTER 2: IPSUM
    let p2Path = "";
    let denseGrid = density * 2; 
    for (let i = 0; i < denseGrid; i++) {
        let y = (height / denseGrid) * i;
        let bend = freq * 8; 
        p2Path += `M ${startX},${y} Q ${midX},${y + bend} ${endX},${y} `;
    }
    document.getElementById('svg-p2-line').setAttribute('d', p2Path);

    // POSTER 3: STUDIO
    let p3Path = "";
    for (let i = 0; i < density; i++) {
        let y = height - (i * (height / density));
        let vDrop = freq * 8; 
        p3Path += `M ${startX},${y} L ${midX},${y + vDrop} L ${endX},${y} `;
    }
    document.getElementById('svg-p3-line').setAttribute('d', p3Path);

    // POSTER 4: MINIMAL
    let p4Path = "";
    for (let i = 0; i < density; i++) {
        let y = (height / density) * i;
        let stretch = Math.abs(Math.sin((i * freq) * 0.05)) * (endX - startX);
        let lineEndX = startX + 150 + stretch;
        
        if (lineEndX > endX) lineEndX = endX;
        
        p4Path += `M ${startX},${y} L ${lineEndX},${y} `;
        
        if (Math.cos(i * freq * 0.1) > 0) {
            let fragStart = lineEndX + (freq * 1.5);
            let fragEnd = fragStart + 300 + (Math.sin(i) * 100);
            if (fragEnd < endX && fragStart < endX) {
                 p4Path += `M ${fragStart},${y} L ${fragEnd},${y} `;
            }
        }
    }
    document.getElementById('svg-p4-line').setAttribute('d', p4Path);
}

// Slider Listeners
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

generateDynamicArt();

// Master SVG Download Logic
document.getElementById('downloadBtn').addEventListener('click', () => {
    const svgElement = document.getElementById('masterCanvas');
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svgElement);
    
    if (!source.match(/^<\?xml[^>]+>/)) {
        source = '<?xml version="1.0" standalone="no"?>\r\n' + source;
    }

    const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source);
    const downloadLink = document.createElement("a");
    
    downloadLink.href = url;
    downloadLink.download = "Ali_Design_Hub_Master.svg";
    
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
});
