// Avatar visual progression — each level adds something visible

export interface AvatarResolution {
  level: number;
  gridSize: number;
  bodyWidth: number;
  bodyHeight: number;
  pixelSize: number;
  label: string;

  // Feature unlocks — each level 1-5 adds something
  showEyes: boolean;
  showMouth: boolean;
  showShading: boolean;
  showAccessory: boolean;
  showEars: boolean;
  showSkin: boolean;
  showHair: boolean;
  showBlush: boolean;
  showExpressions: boolean;
  showParticles: boolean;
}

export function getAvatarResolution(level: number): AvatarResolution {
  return {
    level,
    gridSize: level <= 5 ? 4 : level <= 10 ? 8 : level <= 15 ? 12 : level <= 20 ? 16 : 20,
    bodyWidth: level <= 5 ? 48 + level * 4 : level <= 10 ? 64 + (level - 5) * 2 : 80,
    bodyHeight: level <= 5 ? 48 + level * 4 : level <= 10 ? 64 + (level - 5) * 2 : 80,
    pixelSize: level <= 5 ? 14 - level : level <= 10 ? 8 : level <= 15 ? 6 : level <= 20 ? 5 : 4,
    label: level <= 5 ? "4×4" : level <= 10 ? "8×8" : level <= 15 ? "12×12" : level <= 20 ? "16×16" : "20×20",

    // Level 1: colored blob only
    // Level 2: + eyes
    // Level 3: + mouth
    // Level 4: + 3D shading
    // Level 5: + accessory slot
    showEyes: level >= 2,
    showMouth: level >= 3,
    showShading: level >= 4,
    showAccessory: level >= 5,

    // Level 6+: 8×8 resolution
    showEars: level >= 6,
    showSkin: level >= 7,

    // Level 11+: 12×12
    showHair: level >= 11,
    showBlush: level >= 12,

    // Level 16+: full expressions
    showExpressions: level >= 16,

    // Level 21+: particle effects
    showParticles: level >= 21,
  };
}

export function getLevelUpMessage(newLevel: number): string {
  switch (newLevel) {
    case 2: return "Dzino dostal oči! 👀";
    case 3: return "Dzino sa usmieva! 😊";
    case 4: return "Dzino vyzerá 3D! ✨";
    case 5: return "Odomknuté: doplnky! 👑";
    case 6: return "8×8 rozlíšenie! Viac detailov!";
    case 7: return "Dzino dostal pleť!";
    case 8: return "Ostrejšie detaily!";
    case 9: return "Viac farieb!";
    case 10: return "Plné 8×8 rozlíšenie!";
    case 11: return "12×12! Dzino dostal vlasy!";
    case 12: return "Dzino sa červená! 😳";
    case 16: return "16×16! Plné výrazy!";
    case 21: return "20×20! Dzino žiari! ✨";
    default: return `Úroveň ${newLevel}! Dzino rastie!`;
  }
}

export function getFireworkColors(level: number): string[] {
  if (level <= 5) return ["#4F46E5", "#E11D48", "#F59E0B"];
  if (level <= 10) return ["#4F46E5", "#E11D48", "#16A34A", "#F59E0B", "#8B5CF6"];
  return ["#4F46E5", "#E11D48", "#16A34A", "#F59E0B", "#8B5CF6", "#06B6D4", "#EC4899", "#F97316"];
}
