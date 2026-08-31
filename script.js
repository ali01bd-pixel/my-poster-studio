// ==========================================
// SAFE AREA TOGGLE
// ==========================================
let safeAreaVisible = false;
const toggleSafeBtn = document.getElementById('toggle-safe-area');
if (toggleSafeBtn) {
    toggleSafeBtn.addEventListener('click', () => {
        safeAreaVisible = !safeAreaVisible;
        for(let i=1; i<=4; i++) {
            let safeBox = document.getElementById(`safe-${i}`);
            if(safeBox) safeBox.style.display = safeAreaVisible ? 'block' : 'none';
        }
    });
}

// ==========================================
// BIND COLOR INPUTS TO SVG GRADIENTS
// ==========================================
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

// ==========================================
// DYNAMIC ARTBOARD COUNT SELECTOR
// ==========================================
const posterCountSelect = document.getElementById('poster-count');

function updatePosterCount() {
    if (!posterCountSelect) return;
    let count = parseInt(posterCountSelect.value);
    let canvasWidths = { 1: 1830, 2: 3860, 3: 5890, 4: 7920 };
    
    for (let i = 1; i <= 4; i++) {
        const sidebarPanel = document.getElementById(`panel-${i}`);
        const artGroup = document.getElementById(`art-${i}`);
        if (i <= count) {
            if (sidebarPanel) sidebarPanel.style.display = 'block';
            if (artGroup) artGroup.style.display = 'block';
        } else {
            if (sidebarPanel) sidebarPanel.style.display = 'none';
            if (artGroup) artGroup.style.display = 'none';
        }
    }
    
    let newWidth = canvasWidths[count];
    const masterCanvas = document.getElementById('masterCanvas');
    if (masterCanvas) masterCanvas.setAttribute('viewBox', `0 0 ${newWidth} 2520`);
    
    const footerSize = document.getElementById('footer-size');
    if (footerSize) footerSize.innerText = `Master Artboard: ${newWidth} x 2520 px`;
}

if (posterCountSelect) posterCountSelect.addEventListener('change', updatePosterCount);


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

// Deterministic Pseudo-Random Number Generator for smooth chaos
function randomSeed(seed) {
    let x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}

function getJitter(seed, chaosLevel) {
    return (randomSeed(seed) - 0.5) * chaosLevel * 10; 
}

function generateDynamicArt() {
    if (!densitySlider || !modeSelect) return;

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
        if (!el) continue;
        
        if (useFill) {
            el.setAttribute('fill', `url(#stroke-grad-${i})`);
            el.setAttribute('stroke', 'none');
            // Give fill modes a beautiful glassy transparency so overlapping shapes look good
            el.setAttribute('style', 'opacity: 0.85;');
        } else {
            el.setAttribute('fill', 'none');
            el.setAttribute('stroke', `url(#stroke-grad-${i})`);
            el.setAttribute('stroke-width', thick * (1 + (i*0.1))); 
            el.setAttribute('style', 'opacity: 1;');
        }
    }

    for (let p = 0; p < 4; p++) {
        let path = "";
        
        // 1. MINIMALIST CONTINUOUS LINE ART
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
        
        // 2. BAUHAUS GEOMETRIC
        else if (mode === 'bauhaus') {
            let shapes = Math.floor(density / 10) + 2;
            for(let i=0; i<shapes; i++) {
                let s = (freq * 5 * amp) + (randomSeed(i*p+1)*200);
                let x = randomSeed(i*p+2) * W; 
                let y = randomSeed(i*p+3) * H;
                let type = Math.floor(randomSeed(i*p+4) * 3);
                
                if (type === 0) { // Circle
                    path += `M ${x},${y} m -${s},0 a ${s},${s} 0 1,0 ${s*2},0 a ${s},${s} 0 1,0 -${s*2},0 `;
                } else if (type === 1) { // Rectangle
                    path += `M ${x},${y} L ${x+s*1.5},${y} L ${x+s*1.5},${y+s} L ${x},${y+s} Z `;
                } else { // Triangle
                    path += `M ${x},${y} L ${x+s*2},${y+s*2} L ${x},${y+s*2} Z `;
                }
            }
        }

        // 3. BOHO TERRAZZO & ARCH
        else if (mode === 'boho_terrazzo') {
            let archW = 400 * amp + (p*50);
            let archH = 1000 * amp;
            let ax = midX - archW;
            let ay = midY + 500;
            path += `M ${ax},${ay} L ${ax},${ay - archH} A ${archW},${archW} 0 0,1 ${ax + archW*2},${ay - archH} L ${ax + archW*2},${ay} Z `;
            
            let flakes = density;
            for(let i=0; i<flakes; i++) {
                let fx = randomSeed(i*p+5) * W;
                let fy = randomSeed(i*p+6) * H;
                let fs = randomSeed(i*p+7) * freq * amp;
                path += `M ${fx},${fy} L ${fx+fs},${fy+fs*0.5} L ${fx+fs*0.8},${fy+fs*1.2} L ${fx-fs*0.2},${fy+fs} Z `;
            }
        }

        // 4. 80s SYNTHWAVE GRID
        else if (mode === 'synth
