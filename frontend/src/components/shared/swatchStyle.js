export function swatchGradient(colors) {
  const first = colors?.[0]?.hex || "#f2b7c6";
  const second = colors?.[1]?.hex || colors?.[0]?.hex || "#dff3ec";
  return `linear-gradient(135deg, ${first}, ${second})`;
}

export function swatchStyle(colors) {
  const stops = (colors?.length ? colors : [{ hex: "#f2b7c6" }, { hex: "#dff3ec" }]).map((color) => color.hex);
  const gradient = stops.length > 1 ? `linear-gradient(135deg, ${stops.join(", ")})` : `linear-gradient(135deg, ${stops[0]}, ${stops[0]})`;
  return {
    backgroundImage: `${gradient}, repeating-linear-gradient(45deg, rgba(255,255,255,.22) 0 2px, transparent 2px 10px)`,
  };
}
