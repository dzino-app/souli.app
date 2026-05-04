import { STYLE_ANCHORS, type StyleAnchor } from "./style-anchors-inventory.generated";

export type { StyleAnchor };

export function getStyleAnchors(): StyleAnchor[] {
  return STYLE_ANCHORS;
}

export function styleAnchorStats(anchors: StyleAnchor[]): {
  total: number;
  exists: number;
  painted: number;
  placeholders: number;
  missing: number;
} {
  const total = anchors.length;
  const exists = anchors.filter((a) => a.exists).length;
  const placeholders = anchors.filter((a) => a.exists && a.isPlaceholder).length;
  const painted = anchors.filter((a) => a.exists && !a.isPlaceholder).length;
  return { total, exists, painted, placeholders, missing: total - exists };
}
