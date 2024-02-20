// // Import the ParticleSystem class from the previous code
// import ParticleSystem from "./particle-system.mjs";
// import Particle from "./particle.mjs";

// export default class ParticleSimulation {
//     constructor(numberOfSystems = 1, particlesPerSystem = 1) {
//         this.particleSystems = Array.from(
//             { length: numberOfSystems },
//             () => new ParticleSystem(new Particle(), particlesPerSystem)
//         );
//         this.frameRate = 60;
//         this.updateTimer = null;
//         this.start();
//     }

//     start(updateInterval = this.updateInterval, desiredFrameRate = 60) {
//         this.updateTimer = setInterval(() => {
//             this.update(desiredFrameRate);
//         }, updateInterval);
//     }

//     stopSimulation() {
//         clearInterval(this.updateTimer);
//     }

//     update(desiredFrameRate = 60) {
//         this.particleSystems.forEach(particleSystem => {
//             if (particleSystem.frameRate < desiredFrameRate) {
//                 // Could be improved to use a binary search
//                 let newNumberOfParticles = Math.floor(
//                     particleSystem.frameRate/desiredFrameRate*particleSystem.numberOfParticles
//                 );
//                 particleSystem.deleteParticles(0, newNumberOfParticles);
//             } else if (particleSystem.frameRate > desiredFrameRate) {
//                 particleSystem.addParticles(1);
//                 particleSystem.sortParticles(this.sortOrder);
//             }
//             particleSystem.updateParticles();
//         });
//     }
// }
