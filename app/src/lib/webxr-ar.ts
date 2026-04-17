"use client";

/**
 * WebXR AR session manager with Three.js.
 *
 * Provides hit-testing for surface detection + 3D Souli placement
 * as a billboard sprite. Souli is rendered by reusing the existing
 * pixel-art renderer to a canvas, then used as a texture.
 *
 * Device support: Chrome on Android. Falls back cleanly on iOS /
 * unsupported browsers — caller should check isWebXRARSupported() first.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function isWebXRARSupported(): Promise<boolean> {
  if (typeof navigator === "undefined") return false;
  const xr = (navigator as any).xr;
  if (!xr) return false;
  try {
    return await xr.isSessionSupported("immersive-ar");
  } catch {
    return false;
  }
}

export interface ARSessionHandle {
  stop: () => Promise<void>;
  placeAtHitTest: () => void;
  reset: () => void;
}

interface StartARSessionOptions {
  container: HTMLElement;
  /** PNG data URL of the pixel Souli to place */
  textureUrl: string;
  onPlaced?: () => void;
  onError?: (err: Error) => void;
}

export async function startARSession({
  container,
  textureUrl,
  onPlaced,
  onError,
}: StartARSessionOptions): Promise<ARSessionHandle | null> {
  const THREE = await import("three");

  const xr = (navigator as any).xr;
  if (!xr) {
    onError?.(new Error("WebXR not available"));
    return null;
  }

  let session: any;
  try {
    session = await xr.requestSession("immersive-ar", {
      requiredFeatures: ["hit-test", "local"],
      optionalFeatures: ["dom-overlay"],
      domOverlay: { root: container },
    });
  } catch (err) {
    onError?.(err instanceof Error ? err : new Error("Failed to start AR"));
    return null;
  }

  // Canvas + renderer
  const canvas = document.createElement("canvas");
  canvas.className = "absolute inset-0 w-full h-full";
  container.appendChild(canvas);

  const gl = canvas.getContext("webgl2", { xrCompatible: true, alpha: true }) as WebGL2RenderingContext;
  if (!gl) {
    await session.end();
    canvas.remove();
    onError?.(new Error("WebGL2 unavailable"));
    return null;
  }

  const renderer = new THREE.WebGLRenderer({ canvas, context: gl, alpha: true, antialias: false });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  renderer.xr.setReferenceSpaceType("local");
  await renderer.xr.setSession(session);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera();

  // Load Souli texture
  const loader = new THREE.TextureLoader();
  const texture = await new Promise<any>((resolve, reject) => {
    loader.load(textureUrl, resolve, undefined, reject);
  });
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;

  // Reticle (ring that appears on detected surfaces)
  const reticle = new THREE.Mesh(
    new THREE.RingGeometry(0.08, 0.1, 32).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0x6c5ce7 }),
  );
  reticle.matrixAutoUpdate = false;
  reticle.visible = false;
  scene.add(reticle);

  // Souli billboard sprite (empty until placed)
  const soulisGroup = new THREE.Group();
  scene.add(soulisGroup);

  // Hit-test setup
  let hitTestSource: any = null;
  const viewerSpace = await session.requestReferenceSpace("viewer");
  hitTestSource = await session.requestHitTestSource({ space: viewerSpace });
  const localRefSpace = await session.requestReferenceSpace("local");

  function addSouliAt(matrix: any) {
    const sprite = new THREE.Mesh(
      new THREE.PlaneGeometry(0.3, 0.3),
      new THREE.MeshBasicMaterial({ map: texture, transparent: true, alphaTest: 0.1 }),
    );
    sprite.position.setFromMatrixPosition(matrix);
    // Slight offset up so it sits ON the surface, not IN it
    sprite.position.y += 0.15;
    soulisGroup.add(sprite);
    onPlaced?.();
  }

  let lastHitMatrix: any = null;

  function render(_time: number, frame: any) {
    if (!frame) return;

    // Hit-test against detected surfaces
    const results = frame.getHitTestResults(hitTestSource);
    if (results.length > 0) {
      const hitPose = results[0].getPose(localRefSpace);
      if (hitPose) {
        reticle.visible = true;
        reticle.matrix.fromArray(hitPose.transform.matrix);
        lastHitMatrix = new THREE.Matrix4().fromArray(hitPose.transform.matrix);
      }
    } else {
      reticle.visible = false;
      lastHitMatrix = null;
    }

    // Billboard: all placed Soulis face the camera
    const xrCamera = renderer.xr.getCamera();
    const cameraPos = new THREE.Vector3();
    xrCamera.getWorldPosition(cameraPos);
    soulisGroup.children.forEach((c) => {
      c.lookAt(cameraPos.x, c.position.y, cameraPos.z);
    });

    renderer.render(scene, camera);
  }

  renderer.setAnimationLoop(render);

  return {
    stop: async () => {
      renderer.setAnimationLoop(null);
      if (hitTestSource) hitTestSource.cancel?.();
      await session.end().catch(() => {});
      renderer.dispose();
      canvas.remove();
    },
    placeAtHitTest: () => {
      if (lastHitMatrix) addSouliAt(lastHitMatrix);
    },
    reset: () => {
      while (soulisGroup.children.length > 0) {
        soulisGroup.remove(soulisGroup.children[0]);
      }
    },
  };
}
