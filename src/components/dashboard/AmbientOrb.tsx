import React, { useEffect, useRef } from "react";
import * as THREE from "three";

export default function AmbientOrb() {
  const mountRef = useRef(null);

  useEffect(() => {
    const host = mountRef.current;
    if (!host || !window.WebGLRenderingContext) return undefined;

    let renderer;
    try {
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
      camera.position.z = 5.2;
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(host.clientWidth, host.clientHeight);
      host.appendChild(renderer.domElement);

      const geometry = new THREE.IcosahedronGeometry(1.28, 5);
      const material = new THREE.MeshPhysicalMaterial({
        color: "#c4e9e0",
        metalness: 0.08,
        roughness: 0.22,
        transmission: 0.15,
        clearcoat: 0.8,
      });
      const orb = new THREE.Mesh(geometry, material);
      scene.add(orb, new THREE.AmbientLight("#ffffff", 2.2));
      const light = new THREE.PointLight("#27a78d", 22);
      light.position.set(2, 2, 4);
      scene.add(light);

      let frame;
      const render = () => {
        orb.rotation.y += 0.0018;
        orb.rotation.x += 0.0007;
        renderer.render(scene, camera);
        frame = requestAnimationFrame(render);
      };
      render();

      const resize = () => {
        if (!host.clientWidth || !host.clientHeight) return;
        camera.aspect = host.clientWidth / host.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(host.clientWidth, host.clientHeight);
      };
      const observer = new ResizeObserver(resize);
      observer.observe(host);

      return () => {
        cancelAnimationFrame(frame);
        observer.disconnect();
        geometry.dispose();
        material.dispose();
        renderer.dispose();
        host.replaceChildren();
      };
    } catch (error) {
      console.error("Impossible d’initialiser l’animation 3D du tableau de bord.", error);
      renderer?.dispose();
      return undefined;
    }
  }, []);

  return <div className="orb-canvas" ref={mountRef} aria-hidden="true" />;
}
