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

// Map the 4 posters' inputs to their SVG targets based on the new UI
for (let i = 1; i <= 4; i++) {
    // 1. Text Title Update
    linkInputToSVG(`p${i}-title`, `svg-p${i}-title`, 'text');
    
    // 2. Background Color
    linkInputToSVG(`p${i}-bg`, `svg-p${i}-bg`, 'fill');

    // 3. Line & Shape Color (Updates stroke color of the main art path)
    linkInputToSVG(`p${i}-line`, `svg-p${i}-line`, 'stroke');

    // 4. Typo Box Color (Updates stroke of the tiny box in the sidebar)
    linkInputToSVG(`p${i}-box`, `svg-p${i}-box`, 'stroke');

    // 5. Main Text Color (Updates color of the rotated text)
    linkInputToSVG(`p${i}-text`, `svg-p${i}-title`, 'fill');
}

// Map Engine Setting Sliders to update text labels in the UI
const densitySlider = document.getElementById('eng-density');
const freqSlider = document.getElementById('eng-freq');
const thickSlider = document.getElementById('eng-thick');

densitySlider.addEventListener('input', (e) => {
    document.getElementById('val-density').innerText = e.target.value;
});

freqSlider.addEventListener('input', (e) => {
    document.getElementById('val-freq').innerText = e.target.value + '%';
});

thickSlider.addEventListener('input', (e) => {
    document.getElementById('val-thick').innerText = e.target.value + 'PX';
});

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
