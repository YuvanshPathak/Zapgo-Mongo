import { useCallback } from "react";
import Particles from "react-tsparticles";
import { loadFull } from "tsparticles";

export default function AdminParticles() {
  const particlesInit = useCallback(async (engine) => {
    await loadFull(engine);
  }, []);

  const particlesLoaded = useCallback(async () => {}, []);

  return (
    <Particles
      id="tsparticles"
      init={particlesInit}
      loaded={particlesLoaded}
      options={{
        background: {
          color: "#0A0A19",
        },
        fpsLimit: 120,
        fullScreen: { enable: true, zIndex: 0 },

        particles: {
          number: { value: 250, density: { enable: true, area: 800 } },
          color: { value: "#ffffff" },
          size: { value: { min: 1, max: 2 } },
          move: { enable: true, speed: 0.5 },
          opacity: {
            value: { min: 0.1, max: 0.8 },
            animation: { enable: true, speed: 0.4 },
          },
        },

        interactivity: {
          events: {
            onClick: { enable: true, mode: "repulse" },
          },
          modes: {
            repulse: { distance: 150, duration: 0.3 },
          },
        },

        detectRetina: true,
      }}
    />
  );
}
