import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import * as THREE from "three";

const PALETTE = ["#ef9fba", "#f3d86f", "#94d6c2", "#a99ae3", "#f0a47f"];
const HEART_ROWS: [number, number][][] = [
  [[-4, -2], [2, 4]],
  [[-5, -1], [1, 5]],
  [[-6, 6]],
  [[-6, 6]],
  [[-5, 5]],
  [[-4, 4]],
  [[-3, 3]],
  [[-2, 2]],
  [[-1, 1]],
  [[0, 0]],
];

interface StitchLayout {
  row: number;
  column: number;
  x: number;
  y: number;
  scale: number;
  color: number;
}

function disposeMaterial(material: THREE.Material | THREE.Material[] | undefined) {
  if (Array.isArray(material)) material.forEach((item) => item.dispose());
  else material?.dispose();
}

function makeStitch() {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.16, 0.18, 0),
    new THREE.Vector3(-0.11, 0.31, 0.02),
    new THREE.Vector3(0, 0.04, 0.06),
    new THREE.Vector3(0.11, 0.31, 0.02),
    new THREE.Vector3(0.16, 0.18, 0),
    new THREE.Vector3(0.1, -0.18, 0.02),
    new THREE.Vector3(0, -0.3, 0.05),
    new THREE.Vector3(-0.1, -0.18, 0.02),
  ]);
  return new THREE.TubeGeometry(curve, 28, 0.035, 7, false);
}

function makeNeedleGeometry() {
  return new THREE.LatheGeometry([
    new THREE.Vector2(0.03, -2.2),
    new THREE.Vector2(0.03, 1.72),
    new THREE.Vector2(0.022, 2.02),
    new THREE.Vector2(0.006, 2.22),
  ], 18);
}

export default function YarnScene() {
  const mount = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const host = mount.current;
    if (!host) return undefined;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    const knit = new THREE.Group();
    const rows = HEART_ROWS.length;
    const layout: StitchLayout[] = HEART_ROWS.flatMap((segments, row) => (
      segments.flatMap(([from, to]) => (
        Array.from({ length: to - from + 1 }, (_, offset) => {
          const column = from + offset;
          const edge = Math.abs(column) / 6;
          return {
            row,
            column,
            x: column * 0.29 + (row % 2) * 0.05,
            y: ((rows - 1) / 2 - row) * 0.34,
            scale: 0.9 + (1 - edge) * 0.12,
            color: column + Math.floor(row / 2) + 8,
          };
        })
      ))
    ));
    const count = layout.length;
    const stitch = makeStitch();
    const yarn = new THREE.MeshStandardMaterial({ roughness: 0.62, metalness: 0.04 });
    const stitches = new THREE.InstancedMesh(stitch, yarn, count);
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const rotation = new THREE.Quaternion();
    const scale = new THREE.Vector3(1, 1, 1);
    const pointer = { x: 0, y: 0, inside: false, dragging: false, lastX: 0, lastY: 0, downX: 0, downY: 0 };
    let targetX = -0.12;
    let targetY = -0.25;
    let paletteShift = 0;

    camera.position.set(0, 0, 6.3);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    stitches.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    for (let index = 0; index < count; index += 1) {
      stitches.setColorAt(index, new THREE.Color(PALETTE[layout[index].color % PALETTE.length]));
    }
    if (stitches.instanceColor) stitches.instanceColor.needsUpdate = true;
    knit.add(stitches);

    const tail = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.16, -1.58, 0.03),
        new THREE.Vector3(0.82, -1.98, 0.08),
        new THREE.Vector3(1.48, -1.38, 0.04),
        new THREE.Vector3(2.22, -1.72, 0.02),
      ]), 60, 0.035, 8, false),
      new THREE.MeshStandardMaterial({ color: "#ef9fba", roughness: 0.72, metalness: 0.02 }),
    );
    knit.add(tail);

    const needleMaterial = new THREE.MeshStandardMaterial({ color: "#d6a35d", roughness: 0.58, metalness: 0.02 });
    const needleGeometry = makeNeedleGeometry();
    ([-1, 1] as const).forEach((direction) => {
      const needle = new THREE.Group();
      const shaft = new THREE.Mesh(needleGeometry, needleMaterial);
      const end = new THREE.Mesh(new THREE.SphereGeometry(0.052, 16, 12), needleMaterial);
      end.position.y = -2.24;
      needle.add(shaft, end);
      needle.position.set(direction * 0.58, 0.24, -0.42);
      needle.rotation.z = direction * 0.72;
      knit.add(needle);
    });

    scene.add(knit);
    scene.add(new THREE.HemisphereLight("#fff8ea", "#6f5b86", 2.8));
    const keyLight = new THREE.DirectionalLight("#ffffff", 4.2);
    keyLight.position.set(3, 4, 5);
    scene.add(keyLight);
    const pinkLight = new THREE.PointLight("#f19ab6", 18, 8);
    pinkLight.position.set(-3, -1, 3);
    scene.add(pinkLight);

    const updateStitches = (time = 0) => {
      for (let index = 0; index < count; index += 1) {
        const { row, column, x, y, scale: stitchScale } = layout[index];
        const distance = Math.hypot(x / 2.2 - pointer.x, y / 1.8 - pointer.y);
        const touch = pointer.inside ? Math.max(0, 0.32 - distance * 0.16) : 0;
        const wave = reduceMotion ? 0 : Math.sin(time * 1.7 + column * 0.48 + row * 0.2) * 0.055;
        position.set(x, y, wave + touch);
        rotation.setFromEuler(new THREE.Euler(0, 0, Math.sin(time + column * 0.25) * 0.025));
        scale.setScalar(stitchScale);
        matrix.compose(position, rotation, scale);
        stitches.setMatrixAt(index, matrix);
      }
      stitches.instanceMatrix.needsUpdate = true;
    };

    const resize = () => {
      const { clientWidth, clientHeight } = host;
      renderer.setSize(clientWidth, clientHeight, false);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
    };

    const locate = (event: PointerEvent) => {
      const bounds = host.getBoundingClientRect();
      pointer.x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
      pointer.y = -((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
    };

    const onPointerMove = (event: PointerEvent) => {
      locate(event);
      if (pointer.dragging) {
        targetY += (event.clientX - pointer.lastX) * 0.009;
        targetX += (event.clientY - pointer.lastY) * 0.006;
        targetX = THREE.MathUtils.clamp(targetX, -0.8, 0.55);
        pointer.lastX = event.clientX;
        pointer.lastY = event.clientY;
      } else {
        targetY = pointer.x * 0.34;
        targetX = -0.12 - pointer.y * 0.14;
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      pointer.dragging = true;
      pointer.lastX = event.clientX;
      pointer.lastY = event.clientY;
      pointer.downX = event.clientX;
      pointer.downY = event.clientY;
      host.setPointerCapture(event.pointerId);
      host.classList.add("is-dragging");
    };

    const onPointerUp = (event: PointerEvent) => {
      if (event && Math.hypot(event.clientX - pointer.downX, event.clientY - pointer.downY) < 6) {
        paletteShift = (paletteShift + 1) % PALETTE.length;
        for (let index = 0; index < count; index += 1) {
          stitches.setColorAt(index, new THREE.Color(PALETTE[(layout[index].color + paletteShift) % PALETTE.length]));
        }
        if (stitches.instanceColor) stitches.instanceColor.needsUpdate = true;
        pinkLight.color.set(PALETTE[(paletteShift + 3) % PALETTE.length]);
      }
      pointer.dragging = false;
      host.classList.remove("is-dragging");
    };
    const onPointerEnter = () => { pointer.inside = true; };
    const onPointerLeave = () => {
      pointer.inside = false;
      pointer.dragging = false;
      host.classList.remove("is-dragging");
    };

    let frame: number;
    let visible = true;
    const clock = new THREE.Clock();
    const animate = () => {
      const time = clock.getElapsedTime();
      knit.rotation.x += (targetX - knit.rotation.x) * 0.06;
      knit.rotation.y += (targetY - knit.rotation.y) * 0.06;
      knit.position.y = reduceMotion ? 0 : Math.sin(time * 0.8) * 0.06;
      updateStitches(time);
      renderer.render(scene, camera);
      if (visible) frame = requestAnimationFrame(animate);
    };

    host.appendChild(renderer.domElement);
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    // Decorative and continuous — no reason to keep rendering every frame while
    // scrolled offscreen.
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      const wasVisible = visible;
      visible = entry.isIntersecting;
      if (visible && !wasVisible) animate();
    });
    visibilityObserver.observe(host);
    host.addEventListener("pointerenter", onPointerEnter);
    host.addEventListener("pointerleave", onPointerLeave);
    host.addEventListener("pointermove", onPointerMove);
    host.addEventListener("pointerdown", onPointerDown);
    host.addEventListener("pointerup", onPointerUp);
    resize();
    animate();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      visibilityObserver.disconnect();
      host.removeEventListener("pointerenter", onPointerEnter);
      host.removeEventListener("pointerleave", onPointerLeave);
      host.removeEventListener("pointermove", onPointerMove);
      host.removeEventListener("pointerdown", onPointerDown);
      host.removeEventListener("pointerup", onPointerUp);
      host.replaceChildren();
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        mesh.geometry?.dispose();
        disposeMaterial(mesh.material);
      });
      renderer.dispose();
    };
  }, [reduceMotion]);

  return <div className="h-full w-full cursor-grab touch-pan-y [&.is-dragging]:cursor-grabbing [&>canvas]:block [&>canvas]:size-full" ref={mount} aria-hidden="true" />;
}
