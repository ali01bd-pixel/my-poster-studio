// 1. Get references to HTML elements
const bgColorInput = document.getElementById('bgColor');
const titleTextInput = document.getElementById('titleText');
const fontSizeInput = document.getElementById('fontSize');

// 2. Get references to SVG elements inside the canvas
const bgRect = document.getElementById('bgRect');
const mainText = document.getElementById('mainText');

// 3. Add Event Listeners to update SVG in real-time
bgColorInput.addEventListener('input', (event) => {
    bgRect.setAttribute('fill', event.target.value);
});

titleTextInput.addEventListener('input', (event) => {
    mainText.textContent = event.target.value;
});

fontSizeInput.addEventListener('input', (event) => {
    mainText.setAttribute('font-size', event.target.value);
});

// 4. Implement SVG Download Feature
const downloadBtn = document.getElementById('downloadBtn');

downloadBtn.addEventListener('click', () => {
    const svgElement = document.getElementById('posterCanvas');
    
    // Convert SVG to a readable string format
    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svgElement);
    
    // Add XML declaration
    if (!source.match(/^<\?xml[^>]+>/)) {
        source = '<?xml version="1.0" standalone="no"?>\r\n' + source;
    }

    // Create a downloadable Blob file
    const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source);
    
    // Create a temporary hidden link and click it
    const downloadLink = document.createElement("a");
    downloadLink.href = url;
    downloadLink.download = "My_Custom_Poster.svg";
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
});