import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import * as THREE from "three";

const PALETTE = ["#e0607a", "#a9ddce", "#f6dc74", "#c6b6ec", "#f2a7c6", "#e3a85e"];

function fuzzBall(radius, seed) {
  const geometry = new THREE.IcosahedronGeometry(radius, 3);
  const position = geometry.attributes.position;
  const vertex = new THREE.Vector3();
  for (let index = 0; index < position.count; index += 1) {
    vertex.fromBufferAttribute(position, index);
    const noise = Math.sin(vertex.x * 9 + seed) * Math.cos(vertex.y * 9 + seed) * Math.sin(vertex.z * 9 + seed);
    vertex.multiplyScalar(1 + noise * 0.045);
    position.setXYZ(index, vertex.x, vertex.y, vertex.z);
  }
  geometry.computeVertexNormals();
  return geometry;
}

function needleGeometry() {
  return new THREE.LatheGeometry([
    new THREE.Vector2(0.028, -1.9),
    new THREE.Vector2(0.028, 1.5),
    new THREE.Vector2(0.02, 1.76),
    new THREE.Vector2(0.005, 1.94),
  ], 16);
}

export default function StoreScene() {
  const mount = useRef(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const host = mount.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    const rig = new THREE.Group();
    const pointer = { x: 0, y: 0, inside: false, downX: 0, downY: 0 };
    let paletteShift = 0;

    camera.position.set(0, 0.4, 7.2);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;

    const balls = [
      { radius: 0.62, position: [-1.05, -0.35, 0.3], color: 0 },
      { radius: 0.5, position: [0.15, -0.55, 0.65], color: 1 },
      { radius: 0.56, position: [1.05, -0.3, 0.05], color: 2 },
      { radius: 0.42, position: [-0.35, 0.15, 0.85], color: 3 },
      { radius: 0.4, position: [0.75, 0.28, 0.55], color: 4 },
    ];
    const ballMeshes = balls.map((ball, index) => {
      const material = new THREE.MeshStandardMaterial({ color: PALETTE[ball.color % PALETTE.length], roughness: 0.72, metalness: 0.02 });
      const mesh = new THREE.Mesh(fuzzBall(ball.radius, index * 1.7), material);
      mesh.position.set(...ball.position);
      mesh.userData = { base: ball.position, bob: index * 0.9, colorIndex: ball.color };
      rig.add(mesh);
      return mesh;
    });

    const tail = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
        new THREE.Vector3(1.4, -0.2, 0.1),
        new THREE.Vector3(2.05, -0.75, 0.3),
        new THREE.Vector3(2.6, -0.35, 0.15),
        new THREE.Vector3(3.15, -0.8, 0.05),
      ]), 50, 0.032, 8, false),
      new THREE.MeshStandardMaterial({ color: PALETTE[2], roughness: 0.72, metalness: 0.02 }),
    );
    rig.add(tail);

    const needleMaterial = new THREE.MeshStandardMaterial({ color: "#efe3d0", roughness: 0.5, metalness: 0.05 });
    const needleGeo = needleGeometry();
    [-1, 1].forEach((direction) => {
      const needle = new THREE.Group();
      const shaft = new THREE.Mesh(needleGeo, needleMaterial);
      const end = new THREE.Mesh(new THREE.SphereGeometry(0.048, 16, 12), needleMaterial);
      end.position.y = -1.92;
      needle.add(shaft, end);
      needle.position.set(direction * 0.32, 0.35, -0.5);
      needle.rotation.z = direction * 0.5;
      needle.rotation.x = 0.18;
      rig.add(needle);
    });

    scene.add(rig);
    scene.add(new THREE.HemisphereLight("#fff8ea", "#6f5b86", 2.6));
    const key = new THREE.DirectionalLight("#ffffff", 4);
    key.position.set(3, 4, 5);
    scene.add(key);
    const glow = new THREE.PointLight("#f6dc74", 14, 9);
    glow.position.set(-2.5, 1, 3);
    scene.add(glow);

    let targetX = -0.06;
    let targetY = 0.18;

    const resize = () => {
      const { clientWidth, clientHeight } = host;
      renderer.setSize(clientWidth, clientHeight, false);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
    };

    const move = (event) => {
      const bounds = host.getBoundingClientRect();
      pointer.x = THREE.MathUtils.clamp(((event.clientX - bounds.left) / bounds.width - 0.5) * 2, -1, 1);
      pointer.y = THREE.MathUtils.clamp(-((event.clientY - bounds.top) / bounds.height - 0.5) * 2, -1, 1);
      if (pointer.inside) {
        targetY = 0.18 + pointer.x * 0.32;
        targetX = -0.06 - pointer.y * 0.16;
      }
    };
    const enter = () => { pointer.inside = true; };
    const leave = () => { pointer.inside = false; targetX = -0.06; targetY = 0.18; };
    const down = (event) => { pointer.downX = event.clientX; pointer.downY = event.clientY; };
    const up = (event) => {
      if (Math.hypot(event.clientX - pointer.downX, event.clientY - pointer.downY) < 6) {
        paletteShift = (paletteShift + 1) % PALETTE.length;
        ballMeshes.forEach((mesh) => {
          mesh.material.color.set(PALETTE[(mesh.userData.colorIndex + paletteShift) % PALETTE.length]);
        });
        glow.color.set(PALETTE[(paletteShift + 2) % PALETTE.length]);
      }
    };

    let frame;
    const clock = new THREE.Clock();
    const animate = () => {
      const time = clock.getElapsedTime();
      rig.rotation.x += (targetX - rig.rotation.x) * 0.07;
      rig.rotation.y += (targetY - rig.rotation.y) * 0.07;
      rig.position.y = 0.55 + (reduceMotion ? 0 : Math.sin(time * 0.7) * 0.08);
      ballMeshes.forEach((mesh) => {
        const { base, bob } = mesh.userData;
        mesh.position.y = base[1] + (reduceMotion ? 0 : Math.sin(time * 1.4 + bob) * 0.05);
        mesh.rotation.y = time * 0.15 + bob;
      });
      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    };

    host.appendChild(renderer.domElement);
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    host.addEventListener("pointerenter", enter);
    host.addEventListener("pointerleave", leave);
    host.addEventListener("pointermove", move);
    host.addEventListener("pointerdown", down);
    host.addEventListener("pointerup", up);
    resize();
    animate();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      host.removeEventListener("pointerenter", enter);
      host.removeEventListener("pointerleave", leave);
      host.removeEventListener("pointermove", move);
      host.removeEventListener("pointerdown", down);
      host.removeEventListener("pointerup", up);
      host.replaceChildren();
      scene.traverse((object) => {
        object.geometry?.dispose();
        if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
        else object.material?.dispose();
      });
      renderer.dispose();
    };
  }, [reduceMotion]);

  return (
    <div
      className="h-full min-h-[20rem] w-full cursor-pointer touch-pan-y [&>canvas]:block [&>canvas]:size-full"
      ref={mount}
      aria-hidden="true"
    />
  );
}
