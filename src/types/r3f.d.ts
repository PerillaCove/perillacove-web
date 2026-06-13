/**
 * Type declarations for React Three Fiber JSX elements.
 * This extends the JSX namespace to include Three.js primitives.
 */

import type { ThreeElements } from "@react-three/fiber";

declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElements {}
  }
}
