// // TODO Add documentation

// import Particle, { DISTANCE_SQUARED_IMPORTANCE } from "./particle.mjs";

// export default class ParticleSystem {
//     static id = 0;

//     constructor(particle = new Particle(), numberOfParticles = 1) {
//         this.id = ParticleSystem.id++;
//         this.commonParticle = particle;
//         this.particles = Array.from({ length: numberOfParticles }, () => this.commonParticle);
//         this.time = Date.now();
//         this.frameRate = 60;
//         this.update();
//     }

//     addParticles(numberOfParticles = 1, particle = this.commonParticle) {
//         for(let idx = 0; idx < numberOfParticles; idx++) {
//             this.particles.push(particle);
//         }
//     }

//     deleteParticles(
//         start = 0,
//         end = this.particles.length,
//     ) {
//         for(let idx = start; idx < end; idx++) {
//             if (this.particles[idx]) {
//                 this.particles[idx].release();
//                 delete this.particles[idx];
//             }
//         }
//         this.particles = this.particles.filter(p => p != null);
//     }

//     updateParticles(
//         start = 0,
//         end = this.particles.length,
//         timeDelta = (this.time - Date.now())/1000,
//         options = {}
//     ) {
//         this.frameRate = 1/timeDelta;
//         for(let idx = start; idx < end; idx++) {
//             this.particles[idx].update(timeDelta, options);
//         }
//     }

//     sortParticles(importanceFunction = DISTANCE_SQUARED_IMPORTANCE) {
//         this.particles.sort(
//             (a, b) => {
//                 return a.importance(importanceFunction) - b.importance(this.importance);
//             }
//         );
//     }

//     releaseParticles(
//         start = 0,
//         end = this.particles.length,
//         time = 0
//     ) {
//         for(let idx = start; i < end; i++) {
//             this.particles[idx].release(time = time);
//         }
//     }

//     get numberOfParticles() {
//         return this.numberOfParticles;
//     }
// }
