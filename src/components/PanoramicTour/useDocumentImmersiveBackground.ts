import { useEffect } from "react";

const DOCUMENT_BACKGROUND_CLASS = "perillacove-immersive-panorama";
const DOCUMENT_BACKGROUND_IMAGE_VAR = "--perillacove-document-bg-image";
const DOCUMENT_BACKGROUND_COLOR_VAR = "--perillacove-document-bg-color";
const DEFAULT_DOCUMENT_BACKGROUND_COLOR = "#0d1712";

interface UseDocumentImmersiveBackgroundParams {
  enabled: boolean;
  imageSrc?: string | null;
  backgroundColor?: string;
}

const toCssUrl = (url: string): string =>
  `url("${url.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}")`;

// iOS Safari and in-app browsers may paint status/safe-area chrome from the
// document background before React's immersive surface reaches those pixels.
// Mirror the active panorama on html/body/root so the forest stays continuous.
export function useDocumentImmersiveBackground({
  enabled,
  imageSrc,
  backgroundColor = DEFAULT_DOCUMENT_BACKGROUND_COLOR,
}: UseDocumentImmersiveBackgroundParams) {
  useEffect(() => {
    if (!enabled || !imageSrc) return undefined;

    const root = document.documentElement;
    const previousBackgroundImage = root.style.getPropertyValue(
      DOCUMENT_BACKGROUND_IMAGE_VAR,
    );
    const previousBackgroundColor = root.style.getPropertyValue(
      DOCUMENT_BACKGROUND_COLOR_VAR,
    );

    root.classList.add(DOCUMENT_BACKGROUND_CLASS);
    root.style.setProperty(DOCUMENT_BACKGROUND_IMAGE_VAR, toCssUrl(imageSrc));
    root.style.setProperty(DOCUMENT_BACKGROUND_COLOR_VAR, backgroundColor);

    return () => {
      root.classList.remove(DOCUMENT_BACKGROUND_CLASS);

      if (previousBackgroundImage) {
        root.style.setProperty(
          DOCUMENT_BACKGROUND_IMAGE_VAR,
          previousBackgroundImage,
        );
      } else {
        root.style.removeProperty(DOCUMENT_BACKGROUND_IMAGE_VAR);
      }

      if (previousBackgroundColor) {
        root.style.setProperty(
          DOCUMENT_BACKGROUND_COLOR_VAR,
          previousBackgroundColor,
        );
      } else {
        root.style.removeProperty(DOCUMENT_BACKGROUND_COLOR_VAR);
      }
    };
  }, [backgroundColor, enabled, imageSrc]);
}
