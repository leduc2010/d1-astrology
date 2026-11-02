/**
 * Kotlin's `Random(seed: Int)` (XorWow), ported so the starfield scatters its stars exactly where
 * the Android app does. All arithmetic is 32-bit, like the JVM `Int` it mirrors.
 */
export class KotlinRandom {
  private x: number;
  private y: number;
  private z: number;
  private w: number;
  private v: number;
  private addend: number;

  constructor(seed: number) {
    const seed1 = seed | 0;
    const seed2 = seed1 >> 31;
    this.x = seed1;
    this.y = seed2;
    this.z = 0;
    this.w = 0;
    this.v = ~seed1;
    this.addend = (seed1 << 10) ^ (seed2 >>> 4);
    for (let i = 0; i < 64; i++) this.nextInt();
  }

  nextInt(): number {
    let t = this.x;
    t ^= t >>> 2;
    this.x = this.y;
    this.y = this.z;
    this.z = this.w;
    const v0 = this.v;
    this.w = v0;
    t = t ^ (t << 1) ^ v0 ^ (v0 << 4);
    this.v = t | 0;
    this.addend = (this.addend + 362437) | 0;
    return (t + this.addend) | 0;
  }

  /** Upper [bitCount] bits of the next int, as Kotlin `nextBits`. */
  nextBits(bitCount: number): number {
    return (this.nextInt() >>> (32 - bitCount)) & (-bitCount >> 31);
  }

  /** Uniform in [0, 1) with 24 bits of precision, rounded to a 32-bit float like Kotlin. */
  nextFloat(): number {
    return Math.fround(this.nextBits(24) / (1 << 24));
  }
}
