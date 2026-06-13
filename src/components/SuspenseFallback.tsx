import BrandRevealLoader from "./BrandRevealLoader";

/**
 * Generic universal fallback for lazy-loaded routes.
 */
export default function SuspenseFallback() {
  return <BrandRevealLoader />;
}
