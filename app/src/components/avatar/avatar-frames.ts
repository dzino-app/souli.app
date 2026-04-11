// Each activity has visual frames that define how the avatar looks
// The avatar component cycles through these at a given FPS

export interface AvatarFrame {
  eyeVariant: "open" | "wide" | "closed" | "half" | "up-left" | "up-right" | "squeezed";
  mouthVariant: "smile" | "open" | "big-smile" | "frown" | "o-shape" | "closed" | "tongue";
  bodyOffsetY: number;   // pixels to shift body up/down
  bodyOffsetX: number;   // pixels to shift body left/right
  bodyRotation: number;  // degrees to rotate
  accessoryBounce: number; // pixels to shift accessory
  blush: boolean;        // show blush marks
  sweatDrop: boolean;    // show sweat drop
  zzz: boolean;          // show zzz
  sparkle: boolean;      // show sparkle effect
}

export interface ActivityAnimation {
  frames: AvatarFrame[];
  fps: number;
  loop: boolean;
}

const NEUTRAL: AvatarFrame = {
  eyeVariant: "open",
  mouthVariant: "smile",
  bodyOffsetY: 0,
  bodyOffsetX: 0,
  bodyRotation: 0,
  accessoryBounce: 0,
  blush: false,
  sweatDrop: false,
  zzz: false,
  sparkle: false,
};

function frame(overrides: Partial<AvatarFrame>): AvatarFrame {
  return { ...NEUTRAL, ...overrides };
}

export const ACTIVITY_ANIMATIONS: Record<string, ActivityAnimation> = {
  idle: {
    fps: 2,
    loop: true,
    frames: [
      frame({ bodyOffsetY: 0 }),
      frame({ bodyOffsetY: -2 }),
      frame({ bodyOffsetY: 0 }),
      frame({ bodyOffsetY: 1 }),
    ],
  },

  talking: {
    fps: 6,
    loop: true,
    frames: [
      frame({ mouthVariant: "open", bodyOffsetY: -1 }),
      frame({ mouthVariant: "closed", bodyOffsetY: 0 }),
      frame({ mouthVariant: "o-shape", bodyOffsetY: -1 }),
      frame({ mouthVariant: "closed", bodyOffsetY: 0 }),
    ],
  },

  thinking: {
    fps: 2,
    loop: true,
    frames: [
      frame({ eyeVariant: "up-left", mouthVariant: "closed", bodyRotation: 3 }),
      frame({ eyeVariant: "up-left", mouthVariant: "closed", bodyRotation: 5, bodyOffsetY: -1 }),
      frame({ eyeVariant: "up-right", mouthVariant: "closed", bodyRotation: -3 }),
      frame({ eyeVariant: "up-right", mouthVariant: "closed", bodyRotation: -5, bodyOffsetY: -1 }),
    ],
  },

  happy: {
    fps: 4,
    loop: true,
    frames: [
      frame({ eyeVariant: "squeezed", mouthVariant: "big-smile", bodyOffsetY: -6, sparkle: true, blush: true }),
      frame({ eyeVariant: "wide", mouthVariant: "big-smile", bodyOffsetY: -10, sparkle: true, blush: true }),
      frame({ eyeVariant: "squeezed", mouthVariant: "big-smile", bodyOffsetY: -6, sparkle: true, blush: true }),
      frame({ eyeVariant: "open", mouthVariant: "big-smile", bodyOffsetY: -2, blush: true }),
    ],
  },

  sad: {
    fps: 1.5,
    loop: true,
    frames: [
      frame({ eyeVariant: "half", mouthVariant: "frown", bodyOffsetY: 2, bodyRotation: -2 }),
      frame({ eyeVariant: "half", mouthVariant: "frown", bodyOffsetY: 3, bodyRotation: 0 }),
      frame({ eyeVariant: "half", mouthVariant: "frown", bodyOffsetY: 2, bodyRotation: 2 }),
      frame({ eyeVariant: "half", mouthVariant: "frown", bodyOffsetY: 3, bodyRotation: 0 }),
    ],
  },

  waving: {
    fps: 4,
    loop: false,
    frames: [
      frame({ mouthVariant: "big-smile", bodyRotation: -5, bodyOffsetX: -2 }),
      frame({ mouthVariant: "big-smile", bodyRotation: 5, bodyOffsetX: 2 }),
      frame({ mouthVariant: "big-smile", bodyRotation: -8, bodyOffsetX: -3 }),
      frame({ mouthVariant: "big-smile", bodyRotation: 8, bodyOffsetX: 3 }),
      frame({ mouthVariant: "big-smile", bodyRotation: -5, bodyOffsetX: -2 }),
      frame({ mouthVariant: "smile", bodyRotation: 0, bodyOffsetX: 0 }),
    ],
  },

  walking: {
    fps: 3,
    loop: true,
    frames: [
      frame({ bodyOffsetX: 3, bodyOffsetY: -2 }),
      frame({ bodyOffsetX: 0, bodyOffsetY: 0 }),
      frame({ bodyOffsetX: -3, bodyOffsetY: -2 }),
      frame({ bodyOffsetX: 0, bodyOffsetY: 0 }),
    ],
  },

  eating: {
    fps: 3,
    loop: true,
    frames: [
      frame({ mouthVariant: "open", bodyOffsetY: -1, blush: true }),
      frame({ mouthVariant: "closed", bodyOffsetY: 0, blush: true }),
      frame({ mouthVariant: "o-shape", bodyOffsetY: -2, blush: true }),
      frame({ mouthVariant: "closed", bodyOffsetY: 0, blush: true }),
      frame({ mouthVariant: "tongue", bodyOffsetY: -1, blush: true }),
      frame({ mouthVariant: "closed", bodyOffsetY: 0, blush: true }),
    ],
  },

  sleeping: {
    fps: 1,
    loop: true,
    frames: [
      frame({ eyeVariant: "closed", mouthVariant: "closed", bodyOffsetY: 2, zzz: true }),
      frame({ eyeVariant: "closed", mouthVariant: "closed", bodyOffsetY: 3, zzz: true }),
    ],
  },

  dancing: {
    fps: 8,
    loop: true,
    frames: [
      frame({ eyeVariant: "squeezed", mouthVariant: "big-smile", bodyOffsetX: -3, bodyOffsetY: -4, bodyRotation: -8, blush: true, sparkle: true }),
      frame({ eyeVariant: "wide",     mouthVariant: "big-smile", bodyOffsetX: -2, bodyOffsetY: -8, bodyRotation: -4, blush: true }),
      frame({ eyeVariant: "squeezed", mouthVariant: "open",      bodyOffsetX:  0, bodyOffsetY: -2, bodyRotation:  0, blush: true, sparkle: true }),
      frame({ eyeVariant: "wide",     mouthVariant: "big-smile", bodyOffsetX:  2, bodyOffsetY: -8, bodyRotation:  4, blush: true }),
      frame({ eyeVariant: "squeezed", mouthVariant: "big-smile", bodyOffsetX:  3, bodyOffsetY: -4, bodyRotation:  8, blush: true, sparkle: true }),
      frame({ eyeVariant: "wide",     mouthVariant: "o-shape",   bodyOffsetX:  2, bodyOffsetY: -1, bodyRotation:  4, blush: true }),
      frame({ eyeVariant: "squeezed", mouthVariant: "big-smile", bodyOffsetX:  0, bodyOffsetY: -6, bodyRotation:  0, blush: true, sparkle: true }),
      frame({ eyeVariant: "wide",     mouthVariant: "tongue",    bodyOffsetX: -2, bodyOffsetY: -1, bodyRotation: -4, blush: true }),
    ],
  },
};
