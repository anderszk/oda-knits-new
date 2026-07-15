declare module "nearest-color" {
  interface RGB {
    r: number;
    g: number;
    b: number;
  }

  interface ColorMatch {
    name: string;
    value: string;
    rgb: RGB;
    distance: number;
  }

  interface NearestColor {
    (hex: string): ColorMatch;
    from(colors: Record<string, string>): (hex: string) => ColorMatch;
  }

  const nearestColor: NearestColor;
  export default nearestColor;
}
