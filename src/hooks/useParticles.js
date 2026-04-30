import { useEffect } from "react";

export default function useParticles() {
  useEffect(() => {
    const container = document.getElementById("particles");
    if (!container) return;

    container.innerHTML = "";

    for (let i = 0; i < 50; i++) {
      const particle = document.createElement("div");
      particle.className = "particle";
      particle.style.width = Math.random() * 60 + 20 + "px";
      particle.style.height = particle.style.width;
      particle.style.left = Math.random() * 100 + "%";
      particle.style.top = Math.random() * 100 + "%";
      particle.style.animationDelay = Math.random() * 20 + "s";
      particle.style.animationDuration = Math.random() * 10 + 15 + "s";
      container.appendChild(particle);
    }
  }, []);
}
