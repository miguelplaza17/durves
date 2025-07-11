import {readMatrix, readRoundSize, readAmplitude, readWaves, readFrequency, readAspect, readColor, readGradientSize, readAnimationSpeed} from './inputReadFunctions.js';
import {canvasSettings, userSettings} from './settings.js';

const canvasSketch = require("canvas-sketch");
const random = require("canvas-sketch-util/random");
const { optimize } = require("svgo");


let canva;
let color = userSettings.color;
let svgFile = '';
let svgPoints = '';
let animationFrame = null;
let animationTime = 0;

const canvasSection = document.querySelector('.center');

// Animation control functions
const startAnimation = () => {
  if (animationFrame) return; // Already animating
  
  const animate = () => {
    animationTime += 0.016; // Approximately 60fps
    if (canva) {
      canva.update();
    }
    
    if (userSettings.isAnimating) {
      animationFrame = requestAnimationFrame(animate);
    }
  };
  
  animationFrame = requestAnimationFrame(animate);
};

const stopAnimation = () => {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
    animationFrame = null;
  }
};

const sketch = async ({context, width, height, exportFrame }) => {
  
    let cols = userSettings.cols;
    let rows = userSettings.rows;
    let numCells = cols * rows;
   
    let gridWidth = width * userSettings.size;
    let gridHeight = height * userSettings.size;
   
    let cellWidth = gridWidth / cols;
    let cellHeight = gridHeight / rows;
   
    let positionX = (width - gridWidth) * 0.5;
    let positionY = (height - gridHeight) * 0.5;
  
    let points = [];

    let transparency = userSettings.transparency;

    var size = document.querySelectorAll("#aspectSlider, #valueAspect");
    var dotRadius = document.querySelectorAll("#roundSizeSlider, #valueRoundSize");
    var amplitude = document.querySelectorAll("#amplitudeSlider, #valueAmplitude");
    var waves = document.querySelectorAll("#wavesSlider, #valueWaves");
    var frequency = document.querySelectorAll("#frequencySlider, #valueFrequency");

    const canvasWrapper = document.createElement('div');
    canvasWrapper.appendChild(context.canvas);
    
    const drawPoints = () => {
      // Clear previous points to avoid accumulation and enable smooth animation
      points = [];
      const waves = userSettings.waves;
      const frequency = userSettings.frequency;
      const amplitude = userSettings.amplitude;
      
      // Add animation time offset if animating
      // Amplify speed by 100×
      const timeOffset = userSettings.isAnimating ? animationTime * userSettings.animationSpeed * 100 : 0;
    
      let x = 0;
      let y = 0;

      for (let i = 0; i < numCells; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
    
        x = col * cellWidth;
        y = row * cellHeight;
    
        // Add time offset to create animation
        const noise = Math.round(random.noise2D(x * waves + timeOffset, y * waves + timeOffset, frequency, amplitude));
        x += noise;
        y += noise;
    
        points.push(new Point({ x, y }));
      }
      
      svgPoints = points.map(point => point.toSVG()).join('');
      svgFile = `<svg xmlns="http://www.w3.org/2000/svg" viewbox="0 0 ${width} ${height}">${svgPoints}</svg>`;
      
    };

    document.getElementById("matrixSlider").addEventListener("input", (e) => {
      cols = Number(readMatrix());
      rows = Number(readMatrix());
  
      numCells = cols * rows;
  
      cellWidth = gridWidth / cols;
      cellHeight = gridHeight / rows;
  
      points = []
      
      canva.update()
    });

    size.forEach(function(size) {
      size.addEventListener("input", function(e) {
        userSettings.size = readAspect();

        gridWidth = width * userSettings.size;
        gridHeight = width * userSettings.size;
    
        cellWidth = gridWidth / cols;
        cellHeight = gridHeight / rows;
    
        positionX = (width - gridWidth) * 0.5;
        positionY = (height - gridHeight) * 0.5;
    
        points = [];
    
        canva.update();
      });
    });

    document.getElementById("colorpicker").addEventListener("input", (e) => {
      color = String(readColor());
  
      points = []
      
      canva.update()
    });

    dotRadius.forEach(function(dotRadius) {
      dotRadius.addEventListener("input", function(e) {
        userSettings.roundSize = readRoundSize();
        points = []
      
        canva.update()
      });
    });

    amplitude.forEach(function(amplitude) {
      amplitude.addEventListener("input", function(e) {
        userSettings.amplitude = readAmplitude();
        points = []
      
        canva.update()
      });
    });

    waves.forEach(function(waves) {
      waves.addEventListener("input", function(e) {
        userSettings.waves = readWaves();
        points = []
      
        canva.update()
      });
    });

    frequency.forEach(function(frequency) {
      frequency.addEventListener("input", function(e) {
        userSettings.frequency = readFrequency();
        points = []
        
        canva.update()
      });
    });

    // Gradient size event listener
    document.getElementById("gradientSizeSlider").addEventListener("input", function(e) {
      userSettings.gradientSize = readGradientSize();
      points = [];
      canva.update();
    });

    // Animation speed event listener
    document.getElementById("animationSpeedSlider").addEventListener("input", function(e) {
      userSettings.animationSpeed = readAnimationSpeed();
    });

    // Animation toggle event listener
    document.getElementById("toggleAnimation").addEventListener("click", function(e) {
      userSettings.isAnimating = !userSettings.isAnimating;
      
      if (userSettings.isAnimating) {
        startAnimation();
        e.target.textContent = "Stop Animation";
      } else {
        stopAnimation();
        e.target.textContent = "Start Animation";
      }
    });

  
    document.getElementById("restartSettings").addEventListener('click', () => { 
      
      location.reload();
  
    });
  
    document.getElementById("downloadPNG").addEventListener('click', () => { 

      exportFrame();
  
    });

    document.getElementById("downloadSVG").addEventListener('click', () => { 

      const svgOptimizer = optimize(svgFile);
      const optimizedSvg = svgOptimizer.data;
      
      const blob = new Blob([optimizedSvg], { type: "image/svg+xml" });
  
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement("a");
      a.href = url;
      a.download = "my-durves-vector.svg";
      
      a.click();
      
      URL.revokeObjectURL(url);

    });

  return (({ context, width, height }) => {
    
    context.fillStyle = "black";
    context.fillRect(0, 0, width, height);

    if(transparency){
      context.clearRect(0, 0, width, height);
    }

    context.save();
      context.translate(positionX, positionY);
      context.translate(cellWidth * 0.5, cellHeight * 0.5);

      drawPoints();

      // Always draw with gradient
      const centerX = gridWidth * 0.5;
      const centerY = gridHeight * 0.5;
      const maxDistance = Math.max(gridWidth, gridHeight) * 0.5 * userSettings.gradientSize;

      points.forEach((point) => {
        point.drawWithGradient(context, userSettings.roundSize, centerX, centerY, maxDistance);
      });
      
    context.restore();

    canvasSection.appendChild(canvasWrapper);
    // canvasSection.appendChild(context.canvas);

  });
};

class Point {
  constructor({ x, y }) {
    this.x = x;
    this.y = y;
  }

  draw(context, roundSize) {
    const { x, y } = this;
    const halfRoundSize = roundSize * 0.5;
    const doublePI = Math.PI * 2;

    context.save();
      context.fillStyle = String(color);
      context.beginPath();
      context.arc(x, y, halfRoundSize, 0, doublePI);
      context.fill();
      context.closePath();
    context.restore();
  }

  drawWithGradient(context, roundSize, centerX, centerY, maxDistance) {
    const { x, y } = this;
    const halfRoundSize = roundSize * 0.5;
    const doublePI = Math.PI * 2;

    // Calculate distance from center
    const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
    
    // Calculate opacity based on distance (1 at center, 0 at maxDistance)
    const opacity = Math.max(0, 1 - (distance / maxDistance));
    
    // Convert color to rgba with opacity
    const baseColor = String(color);
    let rgbaColor;
    
    if (baseColor.startsWith('#')) {
      // Convert hex to rgba
      const hex = baseColor.slice(1);
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      rgbaColor = `rgba(${r}, ${g}, ${b}, ${opacity})`;
    } else {
      // Assume it's already in rgb format, convert to rgba
      rgbaColor = baseColor.replace('rgb', 'rgba').replace(')', `, ${opacity})`);
    }

    context.save();
      context.fillStyle = rgbaColor;
      context.beginPath();
      context.arc(x, y, halfRoundSize, 0, doublePI);
      context.fill();
      context.closePath();
    context.restore();
  }

  toSVG() {
    return `<circle cx="${this.x}" cy="${this.y}" r="${userSettings.roundSize/2}" fill="${color}" />`;
  }
  
}

canvasSketch(sketch, canvasSettings).then((instance) => {
  canva = instance;
});