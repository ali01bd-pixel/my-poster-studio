// Function to link a sidebar input to an SVG element
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

// Map the 4 posters' inputs to their SVG counterparts
for (let i = 1; i <= 4; i++) {
    // Link Titles
    linkInputToSVG(`p${i}-title`, `svg-p${i}-title`, 'text');
    
    // Link Background Colors
    linkInputToSVG(`p${i}-bg`, `svg-p${i}-bg`, 'fill');

    // Link Wave Colors (colors both front and back wave)
    linkInputToSVG(`p${i}-waveColor`, `svg-p${i}-wave`, 'fill');
    linkInputToSVG(`p${i}-waveColor`, `svg-p${i}-wave-back`, 'fill');
}

// Master Download Logic (SVG)
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
    downloadLink.download = "DDL_Master_Artboard.svg";
    
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
});

// ==========================================
// WAVE GENERATOR ENGINE (3D Overlapping Waves)
// ==========================================

const waveSlider = document.getElementById('waveFrequency');

function drawWaves() {
    const frequency = waveSlider.value; 
    const width = 1830;                 
    const height = 2520;                
    const amplitude = 150;              
    const yCenter = 1900;               

    // PATH 1: The Front Wave
    let pathDataFront = `M 0,${height} L 0,${yCenter}`;
    for (let x = 0; x <= width; x += 10) {
        let y = yCenter + Math.sin((x / width) * Math.PI * 2 * frequency) * amplitude;
        pathDataFront += ` L ${x},${y}`;
    }
    pathDataFront += ` L ${width},${height} Z`;

    // PATH 2: The Back Wave (shifted higher and out of phase)
    const yCenterBack = 1800;
    let pathDataBack = `M 0,${height} L 0,${yCenterBack}`;
    for (let x = 0; x <= width; x += 10) {
        let y = yCenterBack + Math.sin(((x / width) * Math.PI * 2 * frequency) + 1.5) * (amplitude * 1.1);
        pathDataBack += ` L ${x},${y}`;
    }
    pathDataBack += ` L ${width},${height} Z`;

    // Inject both paths into all 4 posters
    for (let i = 1; i <= 4; i++) {
        const frontWave = document.getElementById(`svg-p${i}-wave`);
        const backWave = document.getElementById(`svg-p${i}-wave-back`);
        
        if (frontWave) frontWave.setAttribute('d', pathDataFront);
        if (backWave) backWave.setAttribute('d', pathDataBack);
    }
}

// Listen for slider movement to redraw instantly
waveSlider.addEventListener('input', drawWaves);

// Draw the initial waves as soon as the page loads
drawWaves();
