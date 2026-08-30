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
