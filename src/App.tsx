import { lazy, Suspense, useMemo } from "react";
import { createPortal } from "react-dom";
import { Outlet, useLocation } from "react-router-dom";
import { useAtom } from "jotai";
import { AnimatePresence, motion } from "motion/react";
import Modal from "./components/Modal";
import {
  FocusedIngredientAtom,
  HelpModalVisibleAtom,
  IngredientProfilesVisibleMetaAtom,
  IsSacredScrollOpenAtom,
} from "./state";
import { useToast } from "./components/Toast/Context";
import Toast from "./components/Toast";
import SacredScroll, {
  type SacredScrollBlock,
} from "./components/Forest/SacredScroll";
import ultimateTruthHTML from "./components/Forest/ultimate_truth.html?raw";

const IngredientPropertyProfiles = lazy(
  () => import("./components/IngredientsPage/PropertyProfiles"),
);
const IngredientQualities = lazy(
  () => import("./components/IngredientsPage/Qualities"),
);
const HelpModal = lazy(() => import("./components/HelpModal"));
const AppMenu = lazy(() => import("./components/AppMenu"));

type UltimateTruthMetadata = {
  title: string;
  imageSrc: string;
  imageAlt: string;
  imageAnchor: string;
};

const DEFAULT_ULTIMATE_TRUTH_METADATA: UltimateTruthMetadata = {
  title: "PerillaCove",
  imageSrc: "https://infoimages.perillacove.com/nature.webp",
  imageAlt: "Nature's integrated system",
  imageAnchor: "waste approaches zero",
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const getMetadataString = (
  metadata: Record<string, unknown>,
  key: keyof UltimateTruthMetadata,
) => {
  const value = metadata[key];
  return typeof value === "string" && value.trim()
    ? value
    : DEFAULT_ULTIMATE_TRUTH_METADATA[key];
};

const parseUltimateTruthMetadata = (html: string): UltimateTruthMetadata => {
  const metadataMatch = html.match(/<!--\s*({[\s\S]*?})\s*-->/);
  if (!metadataMatch) return DEFAULT_ULTIMATE_TRUTH_METADATA;

  try {
    const parsed = JSON.parse(metadataMatch[1]) as unknown;
    if (!isRecord(parsed)) return DEFAULT_ULTIMATE_TRUTH_METADATA;

    return {
      title: getMetadataString(parsed, "title"),
      imageSrc: getMetadataString(parsed, "imageSrc"),
      imageAlt: getMetadataString(parsed, "imageAlt"),
      imageAnchor: getMetadataString(parsed, "imageAnchor"),
    };
  } catch {
    return DEFAULT_ULTIMATE_TRUTH_METADATA;
  }
};

const parseUltimateTruth = (html: string) => {
  const metadata = parseUltimateTruthMetadata(html);
  const rawBlocks = html.match(/<p>[\s\S]*?<\/p>|<hr\s*\/?>/gi) ?? [];
  const blocks: SacredScrollBlock[] = rawBlocks
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      if (/^<hr\s*\/?>$/i.test(block)) {
        return { type: "rule" };
      }

      return {
        type: "paragraph",
        html: block
          .replace(/^<p>/i, "")
          .replace(/<\/p>$/i, "")
          .trim(),
      };
    });

  const imageAnchorIndex = blocks.findIndex(
    (block) =>
      block.type === "paragraph" &&
      block.html.toLowerCase().includes(metadata.imageAnchor.toLowerCase()),
  );
  const splitIndex =
    imageAnchorIndex >= 0 ? imageAnchorIndex : Math.min(1, blocks.length - 1);

  return {
    metadata,
    beforeImageBlocks: blocks.slice(0, splitIndex + 1),
    afterImageBlocks: blocks.slice(splitIndex + 1),
  };
};

function App() {
  const [isHelpModalVisible, setIsHelpModalVisible] =
    useAtom(HelpModalVisibleAtom);
  const [focusedIngredientState, setFocusedIngredientState] = useAtom(
    FocusedIngredientAtom,
  );
  const [isSacredScrollOpen, setIsSacredScrollOpen] = useAtom(
    IsSacredScrollOpenAtom,
  );
  const [ingredientProfilesVisibleMeta, setIngredientProfilesVisibleMeta] =
    useAtom(IngredientProfilesVisibleMetaAtom);
  const { toastData, isToastVisible, hideToast } = useToast();
  const { pathname } = useLocation();
  const normalizedPathname = pathname.replace(/\/+$/, "") || "/";
  const isPanoramicTourRoute =
    normalizedPathname.startsWith("/panoramic-tour/") &&
    !normalizedPathname.startsWith("/panoramic-tour/picker");
  const isImmersivePanoramicHomeRoute =
    normalizedPathname === "/panoramic-tour/sample-tropical";
  const shouldShowScrollControl =
    isPanoramicTourRoute && !isImmersivePanoramicHomeRoute;
  const ultimateTruthSections = useMemo(
    () => parseUltimateTruth(ultimateTruthHTML),
    [],
  );
  const toastVariants = {
    initial: { opacity: 0, x: "100%" },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: "100%" },
  };

  return (
    <div
      id="AppComponent"
      className="relative flex h-dvh min-h-dvh w-full flex-col items-center justify-center bg-[#0d1712] font-cormorant-garamond"
    >
      <Outlet />

      {shouldShowScrollControl ? (
        <div className="fixed right-14 top-[calc(env(safe-area-inset-top)+0.75rem)] z-[11000] sm:right-16">
          <button
            type="button"
            onClick={() => setIsSacredScrollOpen(true)}
            className="inline-flex items-center overflow-hidden rounded-full border border-white/20 bg-black/50 px-2 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-amber-100/70 shadow-[0_4px_14px_rgba(0,0,0,0.24)] backdrop-blur-sm transition-colors hover:bg-black/20 hover:text-amber-50 sm:px-3 sm:py-1.5 sm:text-xs sm:tracking-[0.22em]"
            aria-label="Open sacred scroll"
          >
            <i className="fa-regular fa-scroll-old ml-1" aria-hidden="true" />
          </button>
        </div>
      ) : null}

      <Suspense>
        <AppMenu />
      </Suspense>

      <SacredScroll
        isOpen={isSacredScrollOpen}
        onClose={() => setIsSacredScrollOpen(false)}
        beforeImageBlocks={ultimateTruthSections.beforeImageBlocks}
        afterImageBlocks={ultimateTruthSections.afterImageBlocks}
        imageSrc={ultimateTruthSections.metadata.imageSrc}
        imageAlt={ultimateTruthSections.metadata.imageAlt}
        backdropOpacity={0.46}
      />

      {createPortal(
        <Suspense>
          {isHelpModalVisible ? (
            <Modal
              widthClasses="lg:w-[560px] w-[95%]"
              heightClasses="h-auto max-h-[90%]"
              onDismiss={() => setIsHelpModalVisible(false)}
              scrollable={false}
            >
              <HelpModal onClose={() => setIsHelpModalVisible(false)} />
            </Modal>
          ) : null}
        </Suspense>,
        document.body,
      )}

      {createPortal(
        <Suspense>
          {ingredientProfilesVisibleMeta ? (
            <Modal
              widthClasses="lg:w-[60%] w-[95%]"
              heightClasses="h-auto max-h-[90%]"
              backgroundColorClasses={
                isPanoramicTourRoute
                  ? "bg-dark-gradient"
                  : "bg-light-gradient dark:bg-dark-gradient"
              }
              zIndexClasses="z-[200000]"
              onDismiss={() => setIngredientProfilesVisibleMeta(null)}
              key={ingredientProfilesVisibleMeta.ingredientPropertyId}
              scrollable={false}
            >
              <IngredientPropertyProfiles
                {...ingredientProfilesVisibleMeta}
                enforceDarkMode={isPanoramicTourRoute}
              />
            </Modal>
          ) : null}
        </Suspense>,
        document.body,
      )}

      {createPortal(
        <Suspense>
          {focusedIngredientState ? (
            <Modal
              widthClasses="lg:w-fit w-[95%]"
              heightClasses="h-auto max-h-[90%]"
              zIndexClasses={isPanoramicTourRoute ? "z-[160000]" : undefined}
              backgroundColorClasses={
                isPanoramicTourRoute
                  ? "bg-dark-gradient"
                  : "bg-light-gradient dark:bg-dark-gradient"
              }
              backdropOpacity={0.46}
              onDismiss={() => setFocusedIngredientState(null)}
              key={focusedIngredientState.ingredient.id}
            >
              <IngredientQualities
                ingredient={focusedIngredientState.ingredient}
                onClose={() => setFocusedIngredientState(null)}
                showComboButton={focusedIngredientState.showComboButton}
                ingredientsInPlay={focusedIngredientState.ingredientsInPlay}
                storyText={focusedIngredientState.storyText}
                embedded
                storyLabel={focusedIngredientState.storyLabel}
                integrationProfileContext={
                  focusedIngredientState.integrationProfileContext
                }
                enforceDarkMode={isPanoramicTourRoute}
              />
            </Modal>
          ) : null}
        </Suspense>,
        document.body,
      )}

      <AnimatePresence>
        {isToastVisible && toastData ? (
          <motion.div
            className="fixed right-4 top-4 z-50"
            variants={toastVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <Toast data={toastData} closeToast={hideToast} />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export default App;
