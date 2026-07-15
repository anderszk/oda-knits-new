export default function ColorSwatchList({ colors, className, label }) {
  if (!colors?.length) return null;
  return (
    <div className={className} aria-label={label}>
      {colors.map((color) => (
        <span className="flex items-center gap-1.5 rounded-full border border-ink/10 bg-white px-2 py-1 text-xs font-bold" key={color.name}>
          <i className="size-4 rounded-full border border-ink/20" style={{ background: color.hex }} />{color.name}
        </span>
      ))}
    </div>
  );
}
