export class Visualizer {
    constructor(containerId) {
        this.containerId = containerId;
        this.sketch = null;
        this.isRunning = false;
        
        const container = document.getElementById(this.containerId);
        
        const s = (p) => {
            let particles = [];
            let harmony = 0; // 0 (chaotic) to 1 (harmonic)

            p.setup = () => {
                let canvas = p.createCanvas(container.offsetWidth, container.offsetHeight);
                canvas.parent(this.containerId);
                p.noStroke();

                for (let i = 0; i < 150; i++) {
                    particles.push(new Particle(p));
                }
                 p.noLoop(); // Start paused
            };

            p.draw = () => {
                p.background(13, 17, 23, 150); // Corresponds to --background-color with some alpha

                for (let particle of particles) {
                    particle.update(harmony);
                    particle.show(harmony);
                }
            };
            
            p.windowResized = () => {
                p.resizeCanvas(container.offsetWidth, container.offsetHeight);
            };

            this.start = () => {
                p.loop();
            };

            this.stop = () => {
                p.noLoop();
                p.background(13, 17, 23); // Draw a final static frame
            };

            this.updateHarmony = (newHarmony) => {
                harmony = newHarmony;
            };

            class Particle {
                constructor(p5) {
                    this.p = p5;
                    this.pos = this.p.createVector(this.p.random(this.p.width), this.p.random(this.p.height));
                    this.vel = this.p.createVector(this.p.random(-1, 1), this.p.random(-1, 1));
                    this.acc = this.p.createVector(0, 0);
                    this.maxSpeed = 4;
                    this.color = [255, 80, 80]; // Start with a chaotic red color
                }

                update(harmony) {
                    // More harmony = less chaos/noise, more directed movement
                    let chaosFactor = 1 - harmony;
                    
                    let angle = this.p.noise(this.pos.x * 0.01, this.pos.y * 0.01, this.p.frameCount * 0.005) * this.p.TWO_PI * (1 + chaosFactor);
                    let noiseForce = p5.Vector.fromAngle(angle);
                    noiseForce.mult(0.1 + (chaosFactor * 0.2));
                    this.acc.add(noiseForce);

                    this.vel.add(this.acc);
                    this.vel.limit(this.maxSpeed * (0.2 + chaosFactor)); // Slower and more controlled with harmony
                    this.pos.add(this.vel);
                    this.acc.mult(0);
                    this.edges();
                }

                show(harmony) {
                    // Lerp color from chaotic red to harmonious blue
                    const fromColor = this.p.color(255, 80, 80, 100); // Red, semi-transparent
                    const toColor = this.p.color(88, 166, 255, 200); // Blue, more opaque
                    const particleColor = this.p.lerpColor(fromColor, toColor, harmony);
                    this.p.fill(particleColor);
                    
                    // Size increases with harmony
                    const size = this.p.lerp(2, 6, harmony);
                    this.p.ellipse(this.pos.x, this.pos.y, size, size);
                }

                edges() {
                    if (this.pos.x > this.p.width) this.pos.x = 0;
                    if (this.pos.x < 0) this.pos.x = this.p.width;
                    if (this.pos.y > this.p.height) this.pos.y = 0;
                    if (this.pos.y < 0) this.pos.y = this.p.height;
                }
            }
        };

        this.sketch = new p5(s);
    }
    
    start() {
        if(this.sketch) this.sketch.start();
    }
    
    stop() {
        if(this.sketch) this.sketch.stop();
    }

    updateHarmony(newHarmony) {
        if(this.sketch) this.sketch.updateHarmony(newHarmony);
    }
}