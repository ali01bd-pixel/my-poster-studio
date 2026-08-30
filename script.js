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
    // Link Titles (updates text content)
    linkInputToSVG(`p${i}-title`, `svg-p${i}-title`, 'text');
    
    // Link Background Colors (updates fill attribute)
    linkInputToSVG(`p${i}-bg`, `svg-p${i}-bg`, 'fill');
}

// Master Download Logic
document.getElementById('downloadBtn').addEventListener('click', () => {
    const svgElement = document.getElementById('masterCanvas');
    
    // Convert the SVG to code
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svgElement);
    
    // Add XML declaration required for standard SVG files
    if (!source.match(/^<\?xml[^>]+>/)) {
        source = '<?xml version="1.0" standalone="no"?>\r\n' + source;
    }

    // Create a download link
    const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source);
    const downloadLink = document.createElement("a");
    
    downloadLink.href = url;
    downloadLink.download = "DDL_Master_Artboard.svg";
    
    // Trigger download
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
});

// ==========================================
// WAVE GENERATOR ENGINE
// ==========================================

const waveSlider = document.getElementById('waveFrequency');

function drawWaves() {
    const frequency = waveSlider.value; // Get the slider value
    const width = 1830;                 // Width of a single poster
    const height = 2520;                // Height of a single poster
    const amplitude = 150;              // How tall the wave peaks are
    const yCenter = 1900;               // Vertical position of the wave

    // 1. Calculate the math for the wave path
    // M = Move to starting point, L = Draw Line to next point
    let pathData = `M 0,${height} L 0,${yCenter}`;
    
    // Create the smooth curve using Sine math (step by 10 pixels)
    for (let x = 0; x <= width; x += 10) {
        let y = yCenter + Math.sin((x / width) * Math.PI * 2 * frequency) * amplitude;
        pathData += ` L ${x},${y}`;
    }
    
    // Close the shape at the bottom right corner
    pathData += ` L ${width},${height} Z`;

    // 2. Inject this path into all 4 posters
    for (let i = 1; i <= 4; i++) {
        const waveElement = document.getElementById(`svg-p${i}-wave`);
        if (waveElement) {
            waveElement.setAttribute('d', pathData);
        }
    }
}

// 3. Listen for slider movement to redraw instantly
waveSlider.addEventListener('input', drawWaves);

// 4. Draw the initial wave as soon as the page loads
drawWaves();
