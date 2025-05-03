class EllipticBilliard {
    constructor(canvas) {
        // Add touch event properties
        this.touchIdentifier = null;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.a = 300;
        this.c = 200;
        this.b = Math.sqrt(Math.pow(this.a, 2) - Math.pow(this.c, 2));
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        this.ballPos = { x: centerX - this.c, y: centerY };
        this.holePos = { x: centerX + this.c, y: centerY };
        this.velocity = { x: 0, y: 0 };
        this.isMoving = false;
        this.isAiming = false;
        this.aimStart = { x: 0, y: 0 };
        canvas.addEventListener('mousedown', this.startAim.bind(this));
        canvas.addEventListener('mousemove', this.updateAim.bind(this));
        canvas.addEventListener('mouseup', this.releaseBall.bind(this));
        // Add touch event listeners
        canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));
        canvas.addEventListener('touchmove', this.handleTouchMove.bind(this));
        canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
        canvas.addEventListener('touchcancel', this.handleTouchEnd.bind(this));
        window.addEventListener('orientationchange', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            this.reset();
        });
        this.draw();
        this.createTexture();
    }
    createTexture() {
        // Create off-screen canvas for texture generation
        const textureCanvas = document.createElement('canvas');
        textureCanvas.width = 64;
        textureCanvas.height = 64;
        const tctx = textureCanvas.getContext('2d');
        // Base velvet color
        tctx.fillStyle = '#2c5f2d'; // Dark racing green
        tctx.fillRect(0, 0, 64, 64);
        // Add fabric texture
        const gradient = tctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0.2)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
        tctx.fillStyle = gradient;
        tctx.fillRect(0, 0, 64, 64);
        // Add weave pattern
        tctx.strokeStyle = 'rgba(50, 90, 50, 0.3)';
        tctx.lineWidth = 2;
        for (let y = 0; y < 64; y += 8) {
            tctx.beginPath();
            tctx.moveTo(0, y);
            tctx.lineTo(64, y);
            tctx.stroke();
        }
        for (let x = 0; x < 64; x += 8) {
            tctx.beginPath();
            tctx.moveTo(x, 0);
            tctx.lineTo(x, 64);
            tctx.stroke();
        }
        // Create repeating pattern
        this.tableTexture = this.ctx.createPattern(textureCanvas, 'repeat');
    }
    // Touch handlers
    handleTouchStart(e) {
        if (!this.isMoving && e.touches.length === 1) {
            e.preventDefault();
            this.touchIdentifier = e.touches[0].identifier;
            const rect = this.canvas.getBoundingClientRect();
            this.aimStart.x = e.touches[0].clientX - rect.left;
            this.aimStart.y = e.touches[0].clientY - rect.top;
            this.isAiming = true;
        }
    }
    handleTouchMove(e) {
        if (this.isAiming && this.touchIdentifier !== null) {
            e.preventDefault();
            const touch = Array.from(e.touches).find(t => t.identifier === this.touchIdentifier);
            if (touch) {
                const rect = this.canvas.getBoundingClientRect();
                const currentX = touch.clientX - rect.left;
                const currentY = touch.clientY - rect.top;
                this.updateAimDisplay(currentX, currentY);
            }
        }
    }
    handleTouchEnd(e) {
        if (this.isAiming) {
            e.preventDefault();
            if (this.touchIdentifier !== null) {
                const touch = Array.from(e.changedTouches).find(t => t.identifier === this.touchIdentifier);
                if (touch) {
                    const rect = this.canvas.getBoundingClientRect();
                    const endX = touch.clientX - rect.left;
                    const endY = touch.clientY - rect.top;
                    this.releaseBallLogic(endX, endY);
                }
            }
            this.touchIdentifier = null;
            this.isAiming = false;
        }
    }
    startAim(e) {
        if (!this.isMoving) {
            this.isAiming = true;
            const rect = this.canvas.getBoundingClientRect();
            this.aimStart.x = e.clientX - rect.left;
            this.aimStart.y = e.clientY - rect.top;
        }
    }
    updateAim(e) {
        if (this.isAiming) {
            this.draw();
            const rect = this.canvas.getBoundingClientRect();
            const currentX = e.clientX - rect.left;
            const currentY = e.clientY - rect.top;
            this.updateAimDisplay(currentX, currentY);
            this.ctx.beginPath();
            this.ctx.moveTo(this.ballPos.x, this.ballPos.y);
            this.ctx.lineTo(currentX, currentY);
            this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }
    }
    updateAimDisplay(currentX, currentY) {
        this.draw();
        this.ctx.beginPath();
        this.ctx.moveTo(this.ballPos.x, this.ballPos.y);
        this.ctx.lineTo(currentX, currentY);
        this.ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }
    releaseBallLogic(endX, endY) {
        const dx = this.aimStart.x - endX;
        const dy = this.aimStart.y - endY;
        const distance = Math.hypot(dx, dy);
        // Mobile-optimized velocity calculation
        const speed = Math.min(distance * 0.15, 30); // Limit maximum speed
        const angle = Math.atan2(dy, dx);
        this.velocity.x = Math.cos(angle) * speed;
        this.velocity.y = Math.sin(angle) * speed;
        this.isMoving = true;
        this.animate();
    }
    releaseBall(e) {
        if (this.isAiming) {
            this.isAiming = false;
            const rect = this.canvas.getBoundingClientRect();
            const endX = e.clientX - rect.left;
            const endY = e.clientY - rect.top;
            this.releaseBallLogic(endX, endY);
            this.velocity.x = (this.aimStart.x - endX) * 0.15;
            this.velocity.y = (this.aimStart.y - endY) * 0.15;
            this.isMoving = true;
            this.animate();
        }
    }
    animate() {
        if (!this.isMoving)
            return;
        this.ballPos.x += this.velocity.x;
        this.ballPos.y += this.velocity.y;
        if (this.isOutsideEllipse(this.ballPos.x, this.ballPos.y)) {
            this.handleCollision();
        }
        if (this.checkGoal()) {
            this.reset();
            return;
        }
        // Apply minimal friction only when moving
        this.velocity.x *= 0.99;
        this.velocity.y *= 0.99;
        // Update position
        this.ballPos.x += this.velocity.x;
        this.ballPos.y += this.velocity.y;
        // Check collisions
        if (this.isOutsideEllipse(this.ballPos.x, this.ballPos.y)) {
            this.handleCollision();
        }
        if (Math.hypot(this.velocity.x, this.velocity.y) < 0.1) {
            this.isMoving = false;
        }
        this.draw();
        requestAnimationFrame(this.animate.bind(this));
    }
    isOutsideEllipse(x, y) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        return (Math.pow((x - centerX), 2)) / Math.pow(this.a, 2) + (Math.pow((y - centerY), 2)) / Math.pow(this.b, 2) > 1;
    }
    handleCollision() {
        // ### third method
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        // Convert to ellipse-centered coordinates
        const prevX = this.ballPos.x - this.velocity.x - centerX;
        const prevY = this.ballPos.y - this.velocity.y - centerY;
        const currentX = this.ballPos.x - centerX;
        const currentY = this.ballPos.y - centerY;
        // Find exact collision point using line-ellipse intersection
        const t = this.findExactCollisionTime(prevX, prevY, currentX, currentY);
        const collisionX = prevX + t * (currentX - prevX);
        const collisionY = prevY + t * (currentY - prevY);
        // Calculate normal vector at collision point (using ellipse gradient)
        const normalX = collisionX / (Math.pow(this.a, 2));
        const normalY = collisionY / (Math.pow(this.b, 2));
        const normalLength = Math.sqrt(Math.pow(normalX, 2) + Math.pow(normalY, 2));
        const unitNormalX = normalX / normalLength;
        const unitNormalY = normalY / normalLength;
        // Calculate reflection direction (perfect elastic collision)
        const dotProduct = this.velocity.x * unitNormalX + this.velocity.y * unitNormalY;
        this.velocity.x -= 2 * dotProduct * unitNormalX;
        this.velocity.y -= 2 * dotProduct * unitNormalY;
        // Reposition ball to ensure it's outside the ellipse
        const safetyOffset = 1.5;
        this.ballPos.x = centerX + collisionX + this.velocity.x * safetyOffset;
        this.ballPos.y = centerY + collisionY + this.velocity.y * safetyOffset;
    }
    findExactCollisionTime(prevX, prevY, currentX, currentY) {
        // Solve parametric line-ellipse intersection
        const dx = currentX - prevX;
        const dy = currentY - prevY;
        const a = (Math.pow(dx, 2)) / Math.pow(this.a, 2) + (Math.pow(dy, 2)) / Math.pow(this.b, 2);
        const b = 2 * (prevX * dx) / Math.pow(this.a, 2) + 2 * (prevY * dy) / Math.pow(this.b, 2);
        const c = (Math.pow(prevX, 2)) / Math.pow(this.a, 2) + (Math.pow(prevY, 2)) / Math.pow(this.b, 2) - 1;
        const discriminant = Math.pow(b, 2) - 4 * a * c;
        if (discriminant < 0)
            return 0;
        const t1 = (-b + Math.sqrt(discriminant)) / (2 * a);
        const t2 = (-b - Math.sqrt(discriminant)) / (2 * a);
        // Return smallest positive solution
        return Math.max(0, Math.min(t1, t2));
    }
    checkGoal() {
        const distance = Math.hypot(this.ballPos.x - this.holePos.x, this.ballPos.y - this.holePos.y);
        if (distance < 22) {
            alert('Goal!');
            return true;
        }
        return false;
    }
    reset() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        this.ballPos = { x: centerX - this.c, y: centerY };
        this.velocity = { x: 0, y: 0 };
        this.isMoving = false;
        this.draw();
    }
    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        // Draw wooden table background
        this.ctx.fillStyle = '#654321'; // Dark wood color
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        // Draw velvet playing surface
        this.ctx.save();
        this.ctx.beginPath();
        this.ctx.ellipse(this.canvas.width / 2, this.canvas.height / 2, this.a, this.b, 0, 0, Math.PI * 2);
        this.ctx.clip();
        this.ctx.fillStyle = this.tableTexture;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();
        // Draw table border
        this.ctx.beginPath();
        this.ctx.ellipse(this.canvas.width / 2, this.canvas.height / 2, this.a + 4, this.b + 4, 0, 0, Math.PI * 2);
        this.ctx.strokeStyle = '#372813'; // Dark wood edge
        this.ctx.lineWidth = 8;
        this.ctx.stroke();
        // Add specular highlights
        const gradient = this.ctx.createRadialGradient(this.canvas.width / 2 - 50, this.canvas.height / 2 - 30, 0, this.canvas.width / 2 - 50, this.canvas.height / 2 - 30, 300);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        // Add felt nap direction
        this.ctx.beginPath();
        for (let y = -this.b; y < this.b; y += 15) {
            const x = Math.sqrt((1 - (Math.pow(y, 2)) / (Math.pow(this.b, 2))) * Math.pow(this.a, 2));
            this.ctx.moveTo(this.canvas.width / 2 - x, this.canvas.height / 2 + y);
            this.ctx.lineTo(this.canvas.width / 2 + x, this.canvas.height / 2 + y);
        }
        this.ctx.strokeStyle = 'rgba(40, 70, 40, 0.15)';
        this.ctx.lineWidth = 1.5;
        this.ctx.stroke();
        // Draw hole
        this.ctx.beginPath();
        this.ctx.arc(this.holePos.x, this.holePos.y, 12, 0, Math.PI * 2);
        this.ctx.fillStyle = '#1a1a1a'; // Darker hole color for contrast
        this.ctx.fill();
        // Draw ball
        this.ctx.beginPath();
        this.ctx.arc(this.ballPos.x, this.ballPos.y, 10, 0, Math.PI * 2);
        this.ctx.fillStyle = '#ffffff'; // Pure white color
        this.ctx.fill();
        // Draw ball outline
        this.ctx.beginPath();
        this.ctx.arc(this.ballPos.x, this.ballPos.y, 10, 0, Math.PI * 2);
        this.ctx.strokeStyle = '#e0e0e0'; // Light gray border
        this.ctx.lineWidth = 1.5;
        this.ctx.stroke();
        // Add subtle shadow for depth
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        this.ctx.shadowBlur = 5;
        this.ctx.shadowOffsetY = 2;
        this.ctx.fill();
        // Reset shadow
        this.ctx.shadowColor = 'transparent';
        if (this.isAiming) {
            this.ctx.beginPath();
            this.ctx.arc(this.aimStart.x, this.aimStart.y, 15, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
            this.ctx.fill();
        }
        // Draw touch direction indicator
        if (this.isAiming) {
            this.ctx.beginPath();
            this.ctx.arc(this.aimStart.x, this.aimStart.y, 15, 0, Math.PI * 2);
            this.ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
            this.ctx.fill();
        }
    }
}
// Initialize the game
const canvas = document.getElementById('gameCanvas');
canvas.width = 800;
canvas.height = 500;
new EllipticBilliard(canvas);
