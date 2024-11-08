document.addEventListener('DOMContentLoaded', () => {
    // Initialization
    const canvas = document.getElementById("drawing-canvas");
    const ctx = canvas.getContext("2d");
    const colorPicker = document.getElementById("color-picker");
    const brushSize = document.getElementById("brush-size");
    const colorTool = document.getElementById("color-tool");
    const brushTool = document.getElementById("brush-tool");
    const colorOptions = document.getElementById("color-options");
    const brushOptions = document.getElementById("brush-options");
    const character = document.getElementById("character");
    const container = document.getElementById("game-container");

    // Ensure canvas dimensions match container dimensions
    function resizeCanvas() {
        canvas.width = container.offsetWidth;
        canvas.height = container.offsetHeight;
    }
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Dynamic brush variables
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    let lastTime = 0;

    // Offset calculation for precise drawing
    function getCanvasOffset() {
        const rect = canvas.getBoundingClientRect();
        return { x: rect.left, y: rect.top };
    }

    // Show or hide tool options on icon click
    colorTool.addEventListener("click", () => {
        colorOptions.style.display = colorOptions.style.display === "flex" ? "none" : "flex";
        brushOptions.style.display = "none";
    });
    brushTool.addEventListener("click", () => {
        brushOptions.style.display = brushOptions.style.display === "flex" ? "none" : "flex";
        colorOptions.style.display = "none";
    });

    // Function to calculate line width based on speed
    function calculateLineWidth(distance, deltaTime) {
        const minLineWidth = 1;
        const maxLineWidth = parseInt(brushSize.value);
        const maxSpeed = 20; // Adjust this to tune sensitivity

        let speed = distance / deltaTime;
        let lineWidth = maxLineWidth - (speed / maxSpeed) * maxLineWidth;
        return Math.max(minLineWidth, Math.min(maxLineWidth, lineWidth));
    }

    // Drawing function with speed-sensitive brush width
    function draw(event) {
        if (!isDrawing) return;

        const offset = getCanvasOffset();
        const currentX = event.clientX - offset.x;
        const currentY = event.clientY - offset.y;
        const currentTime = new Date().getTime();

        const distance = Math.hypot(currentX - lastX, currentY - lastY);
        const deltaTime = currentTime - lastTime || 1; // Avoid division by zero
        const dynamicLineWidth = calculateLineWidth(distance, deltaTime);

        ctx.lineWidth = dynamicLineWidth;
        ctx.lineCap = "round";
        ctx.strokeStyle = colorPicker.value;

        ctx.lineTo(currentX, currentY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(currentX, currentY);

        // Update last coordinates and time
        lastX = currentX;
        lastY = currentY;
        lastTime = currentTime;

        // Save the canvas state after each stroke
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        currentStep++;
        drawingHistory[currentStep] = imageData;
        // Clear redo stack when new drawing occurs
        redoStack = [];
    }

    // Event Listeners for Drawing
    canvas.addEventListener("mousedown", (event) => {
        isDrawing = true;
        lastX = event.clientX - getCanvasOffset().x;
        lastY = event.clientY - getCanvasOffset().y;
        lastTime = new Date().getTime();
    });
    canvas.addEventListener("mouseup", () => { isDrawing = false; ctx.beginPath(); });
    canvas.addEventListener("mousemove", draw);

    // Add these lines after the existing initialization
    let drawingHistory = [];
    let redoStack = [];
    let currentStep = -1;

    // Character movement variables
    let characterX = container.offsetWidth / 2;
    let characterY = container.offsetHeight / 2;
    const moveSpeed = 5;

    // Add keyboard state tracking
    const keys = {};
    window.addEventListener('keydown', (e) => keys[e.key] = true);
    window.addEventListener('keyup', (e) => keys[e.key] = false);

    // Add this function for character movement
    function moveCharacter() {
        if (keys['ArrowLeft'] || keys['a']) characterX -= moveSpeed;
        if (keys['ArrowRight'] || keys['d']) characterX += moveSpeed;
        if (keys['ArrowUp'] || keys['w']) characterY -= moveSpeed;
        if (keys['ArrowDown'] || keys['s']) characterY += moveSpeed;

        // Keep character within bounds
        characterX = Math.max(50, Math.min(container.offsetWidth - 50, characterX));
        characterY = Math.max(50, Math.min(container.offsetHeight - 50, characterY));

        character.style.left = characterX + 'px';
        character.style.top = characterY + 'px';
        character.classList.add('rocking');

        // Remove rocking if not moving
        if (!keys['ArrowLeft'] && !keys['ArrowRight'] && !keys['ArrowUp'] && !keys['ArrowDown'] &&
            !keys['a'] && !keys['d'] && !keys['w'] && !keys['s']) {
            character.classList.remove('rocking');
        }
    }

    // Add game loop
    function gameLoop() {
        moveCharacter();
        requestAnimationFrame(gameLoop);
    }
    gameLoop();

    // Add undo/redo functionality
    window.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'z') {
            e.preventDefault();
            if (currentStep >= 0) {
                redoStack.push(drawingHistory[currentStep]);
                currentStep--;
                if (currentStep >= 0) {
                    ctx.putImageData(drawingHistory[currentStep], 0, 0);
                } else {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                }
            }
        }
        if (e.ctrlKey && e.key === 'y') {
            e.preventDefault();
            if (redoStack.length > 0) {
                currentStep++;
                const imageData = redoStack.pop();
                drawingHistory[currentStep] = imageData;
                ctx.putImageData(imageData, 0, 0);
            }
        }
    });

    // Ensure character has absolute positioning
    character.style.position = 'absolute';
    
    // Initialize character position
    character.style.left = characterX + 'px';
    character.style.top = characterY + 'px';
});
