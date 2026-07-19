import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import * as THREE from "three";

const AILEEN_GREEN = "#1cab58";

type Vec3 = [number, number, number];

function material(color: string, roughness = 0.82): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.01 });
}

function sphere(parent: THREE.Object3D, mat: THREE.Material, scale: Vec3, position: Vec3, rotation: Vec3 = [0, 0, 0]): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 56, 36), mat);
  mesh.scale.set(...scale);
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  parent.add(mesh);
  return mesh;
}

function eyePatch(parent: THREE.Object3D, mat: THREE.Material, scale: Vec3, position: Vec3, rotation: Vec3 = [0, 0, 0]): THREE.Mesh {
  const shape = new THREE.Shape();
  shape.moveTo(0.18, 1);
  shape.bezierCurveTo(0.95, 0.58, 0.8, -0.72, 0.05, -1);
  shape.bezierCurveTo(-0.72, -0.7, -0.62, 0.48, 0.18, 1);
  const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape, 32), mat);
  mesh.scale.set(...scale);
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  parent.add(mesh);
  return mesh;
}

function flatOval(parent: THREE.Object3D, mat: THREE.Material, scale: Vec3, position: Vec3, rotation: Vec3 = [0, 0, 0]): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.CircleGeometry(1, 36), mat);
  mesh.scale.set(...scale);
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  parent.add(mesh);
  return mesh;
}

function triangle(parent: THREE.Object3D, mat: THREE.Material, scale: Vec3, position: Vec3, rotation: Vec3 = [0, 0, 0]): THREE.Mesh {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(
      [0, 1, 0, -0.86, -0.5, 0, 0.86, -0.5, 0],
      3,
    ),
  );
  const mesh = new THREE.Mesh(geometry, mat);
  mesh.scale.set(...scale);
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  parent.add(mesh);
  return mesh;
}

function disposeMaterial(material: THREE.Material | THREE.Material[] | undefined) {
  if (Array.isArray(material)) material.forEach((item) => item.dispose());
  else material?.dispose();
}

export default function AboutCharmScene() {
  const mount = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const host = mount.current;
    if (!host) return undefined;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 80);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    const doll = new THREE.Group();
    const head = new THREE.Group();
    const eyes = new THREE.Group();
    const rightArm = new THREE.Group();
    const leftArm = new THREE.Group();
    const palmMarks: THREE.Group[] = [];
    const pointer = { x: 0, y: 0, inside: false };
    let greetingStarted = 0;
    let waveUntil = 0;

    camera.position.set(0, 0, 9.5);
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const green = material(AILEEN_GREEN, 0.92);
    const dark = material("#121018", 0.72);
    const white = material("#f4f4ef", 0.55);
    const blue = material("#153a7a", 0.62);
    const pink = material("#f2a3c5", 0.7);
    const yellow = material("#f6bd45", 0.65);

    sphere(head, green, [1.28, 0.88, 0.58], [0, 0.48, 0]);
    sphere(doll, green, [0.5, 0.86, 0.3], [0, -0.9, 0]);
    ([-1, 1] as const).forEach((side) => {
      const stalk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.082, 1.12, 18),
        green,
      );
      stalk.position.set(side * 0.54, 1.31, -0.04);
      stalk.rotation.z = side * -0.34;
      head.add(stalk);

      const clip = new THREE.Group();
      const clipBar = new THREE.Mesh(
        new THREE.BoxGeometry(0.42, 0.14, 0.07),
        pink,
      );
      clipBar.position.set(0, 0, 0);
      clip.add(clipBar);
      for (let tooth = -1.5; tooth <= 1.5; tooth += 1) {
        const prong = new THREE.Mesh(
          new THREE.BoxGeometry(0.045, 0.24, 0.06),
          pink,
        );
        prong.position.set(tooth * 0.085, -0.14, 0.01);
        prong.rotation.z = tooth * -0.08;
        clip.add(prong);
      }
      clip.position.set(side * 0.7, 1.54, 0.02);
      clip.rotation.set(0.28, side * 0.2, side * -0.36 + Math.PI / 2);
      clip.scale.setScalar(0.62);
      head.add(clip);

      sphere(head, green, [0.22, 0.22, 0.18], [side * 0.84, 1.8, -0.05]);
      sphere(
        head,
        side < 0 ? white : blue,
        [0.105, 0.105, 0.018],
        [side * 0.82, 1.81, 0.12],
      );

      eyePatch(
        eyes,
        dark,
        [0.34, 0.58, 1],
        [side * 0.62, 0.32, 0.62],
        [0, side * 0.18, side * -0.34],
      );
      flatOval(
        eyes,
        white,
        [0.075, 0.095, 1],
        [side * 0.6, 0.5, 0.67],
        [0, side * 0.18, side * -0.34],
      );
      flatOval(
        eyes,
        white,
        [0.04, 0.055, 1],
        [side * 0.64, 0.23, 0.67],
        [0, side * 0.18, side * -0.34],
      );
    });
    head.add(eyes);

    sphere(head, dark, [0.07, 0.03, 0.018], [0, -0.08, 0.64]);
    head.position.set(0, 0.18, 0);
    doll.add(head);

    ([-1, 1] as const).forEach((side) => {
      const arm = side < 0 ? leftArm : rightArm;
      sphere(arm, green, [0.17, 0.66, 0.16], [0, -0.36, 0]);
      const palm = new THREE.Group();
      palm.visible = false;
      triangle(
        palm,
        yellow,
        [0.09, 0.09, 1],
        [0.02, -0.72, 0.18],
        [0, 0, 0.45],
      );
      flatOval(palm, white, [0.035, 0.035, 1], [-0.08, -0.52, 0.18]);
      flatOval(palm, white, [0.04, 0.04, 1], [0.09, -0.5, 0.18]);
      flatOval(palm, blue, [0.045, 0.045, 1], [0.02, -0.39, 0.18], [0, 0, 0.8]);
      palmMarks.push(palm);
      arm.add(palm);
      arm.position.set(side * 0.53, -0.56, 0.02);
      arm.rotation.z = side * -0.28;
      doll.add(arm);
      sphere(
        doll,
        green,
        [0.23, 0.58, 0.2],
        [side * 0.28, -1.84, 0.03],
        [0, 0, side * -0.12],
      );
      sphere(doll, white, [0.05, 0.03, 0.018], [side * 0.43, -1.62, 0.22]);
    });

    scene.add(doll);
    scene.add(new THREE.HemisphereLight("#fff9f0", "#245637", 3.4));
    const key = new THREE.DirectionalLight("#ffffff", 4.5);
    key.position.set(3, 4, 5);
    scene.add(key);
    const rim = new THREE.PointLight("#a8ffd0", 8, 8);
    rim.position.set(-2.5, 0, 3);
    scene.add(rim);

    const resize = () => {
      const { clientWidth, clientHeight } = host;
      renderer.setSize(clientWidth, clientHeight, false);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
    };
    const move = (event: PointerEvent) => {
      const bounds = host.getBoundingClientRect();
      const centerX = bounds.left + bounds.width / 2;
      const centerY = bounds.top + bounds.height / 2;
      pointer.x = THREE.MathUtils.clamp(
        ((event.clientX - centerX) / bounds.width) * 2,
        -1,
        1,
      );
      pointer.y = THREE.MathUtils.clamp(
        (-(event.clientY - centerY) / bounds.height) * 2,
        -1,
        1,
      );
    };
    const enter = () => {
      pointer.inside = true;
    };
    const leave = () => {
      pointer.inside = false;
    };
    const click = () => {
      greetingStarted = performance.now();
      waveUntil = greetingStarted + 1500;
    };

    host.appendChild(renderer.domElement);
    const trackTarget = document.getElementById("about") || host;
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    trackTarget.addEventListener("pointerenter", enter);
    trackTarget.addEventListener("pointerleave", leave);
    trackTarget.addEventListener("pointermove", move);
    host.addEventListener("pointerdown", click);

    let frame: number;
    let visible = true;
    const clock = new THREE.Clock();
    const animate = () => {
      const time = clock.getElapsedTime();
      const now = performance.now();
      const greeting = now < waveUntil;
      doll.rotation.y +=
        ((pointer.inside ? pointer.x * 0.18 : Math.sin(time * 0.5) * 0.1) -
          doll.rotation.y) *
        0.08;
      doll.position.y = reduceMotion
        ? 0
        : 0.035 + Math.sin(time * 1.25) * 0.045;
      head.rotation.y +=
        ((pointer.inside ? pointer.x * 0.32 : 0) - head.rotation.y) * 0.13;
      head.rotation.x +=
        ((pointer.inside ? -pointer.y * 0.17 : 0) - head.rotation.x) * 0.13;
      eyes.position.x +=
        ((pointer.inside ? pointer.x * 0.035 : 0) - eyes.position.x) * 0.18;
      eyes.position.y +=
        ((pointer.inside ? pointer.y * 0.025 : 0) - eyes.position.y) * 0.18;
      const progress = greeting
        ? THREE.MathUtils.clamp((now - greetingStarted) / 1500, 0, 1)
        : 0;
      const lift =
        greeting && !reduceMotion ? Math.sin(progress * Math.PI) ** 0.55 : 0;
      const waveWindow =
        THREE.MathUtils.smoothstep(progress, 0.18, 0.32) *
        (1 - THREE.MathUtils.smoothstep(progress, 0.78, 0.94));
      const wave =
        greeting && !reduceMotion
          ? Math.sin(progress * Math.PI * 2.5) * 0.14 * waveWindow
          : 0;
      palmMarks.forEach((mark, index) => {
        mark.visible = index === 1 && lift > 0.25;
      });
      rightArm.rotation.z = THREE.MathUtils.lerp(0.28, 2.0, lift) + wave;
      rightArm.rotation.x = THREE.MathUtils.lerp(0, -0.3, lift);
      leftArm.rotation.z =
        -0.28 + (pointer.inside && !greeting ? pointer.x * 0.08 : 0);
      leftArm.rotation.x = 0;
      renderer.render(scene, camera);
      if (visible) frame = requestAnimationFrame(animate);
    };
    // Decorative and continuous — no reason to keep rendering every frame while
    // scrolled offscreen.
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      const wasVisible = visible;
      visible = entry.isIntersecting;
      if (visible && !wasVisible) animate();
    });
    visibilityObserver.observe(host);
    resize();
    animate();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      visibilityObserver.disconnect();
      trackTarget.removeEventListener("pointerenter", enter);
      trackTarget.removeEventListener("pointerleave", leave);
      trackTarget.removeEventListener("pointermove", move);
      host.removeEventListener("pointerdown", click);
      host.replaceChildren();
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        mesh.geometry?.dispose();
        disposeMaterial(mesh.material);
      });
      renderer.dispose();
    };
  }, [reduceMotion]);

  return (
    <div
      className="h-full min-h-[31rem] w-full cursor-pointer touch-pan-y max-[900px]:min-h-[28rem] max-[620px]:min-h-[22rem] [&>canvas]:block [&>canvas]:size-full"
      ref={mount}
      aria-hidden="true"
    />
  );
}
