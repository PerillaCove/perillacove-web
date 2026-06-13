import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useAtom, useSetAtom } from "jotai";
import { useLocation, useNavigate } from "react-router-dom";
import clsx from "clsx";
import AppMenuItem from "./AppMenuItem";
import KeyboardNavigationGuide from "../IngredientsPage/KeyboardNavigationGuide";
import KeyboardShortcutTooltip from "../Tooltip/KeyboardShortcut";
import { useCircadianTheme } from "../../util/hooks/general";
import { HelpModalVisibleAtom, IsMenuOpenAtom } from "../../state";

const XTwitterIcon: FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    aria-hidden="true"
    focusable="false"
  >
    <path
      fill="currentColor"
      d="M18.244 2H21.5L14.38 10.135L22.76 22H16.2L11.06 14.805L4.78 22H1.52L9.14 13.29L1 2H7.72L12.36 8.577L18.244 2ZM17.1 20.025H18.9L6.74 3.873H4.8L17.1 20.025Z"
    />
  </svg>
);

const AppMenu: FC = () => {
  const setIsHelpModalVisible = useSetAtom(HelpModalVisibleAtom);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useAtom(IsMenuOpenAtom);
  const [selectedMenuIndex, setSelectedMenuIndex] = useState(-1);
  const [keyboardNavigationActive, setKeyboardNavigationActive] =
    useState(false);
  const { isDarkMode } = useCircadianTheme();
  const isOnForestRoute = pathname.includes("/panoramic-tour/");

  const menuItems = useMemo(
    () => [
      ...(!isOnForestRoute
        ? [
            {
              icon: "fa-regular fa-tree",
              text: "Forest",
              action: () => {
                setIsMenuOpen(false);
                navigate("/panoramic-tour/sample-tropical");
              },
            },
          ]
        : []),
      {
        icon: <XTwitterIcon className="h-4 w-4" />,
        text: "@perillacove",
        action: () => window.open("https://twitter.com/perillacove", "_blank"),
      },
      {
        icon: "fa-regular fa-pencil",
        text: "Writing",
        action: () =>
          window.open(
            "https://perillacove.com/writing/integrated-system-becoming-nature",
            "_blank",
          ),
      },
      {
        icon: "fa-regular fa-code",
        text: "Code",
        action: () => window.open("https://github.com/PerillaCove", "_blank"),
      },
      {
        icon: "fa-regular fa-question",
        text: "Contact",
        action: () => {
          setIsMenuOpen(false);
          setIsHelpModalVisible(true);
        },
      },
    ],
    [isOnForestRoute, navigate, setIsHelpModalVisible, setIsMenuOpen],
  );

  useEffect(() => {
    if (isMenuOpen) {
      setSelectedMenuIndex(-1);
      setKeyboardNavigationActive(false);
    }
  }, [isMenuOpen]);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "m") {
        event.preventDefault();
        setIsMenuOpen((prev) => !prev);
      }

      if (!isMenuOpen) return;

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          setKeyboardNavigationActive(true);
          setSelectedMenuIndex((prev) =>
            prev === -1 ? 0 : prev < menuItems.length - 1 ? prev + 1 : 0,
          );
          break;
        case "ArrowUp":
          event.preventDefault();
          setKeyboardNavigationActive(true);
          setSelectedMenuIndex((prev) =>
            prev === -1
              ? menuItems.length - 1
              : prev > 0
                ? prev - 1
                : menuItems.length - 1,
          );
          break;
        case "Enter":
          event.preventDefault();
          if (menuItems[selectedMenuIndex]) {
            menuItems[selectedMenuIndex].action();
          }
          break;
        case "Escape":
          event.preventDefault();
          setIsMenuOpen(false);
          break;
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [isMenuOpen, menuItems, selectedMenuIndex, setIsMenuOpen]);

  const getMenuPortalClasses = useCallback(
    () =>
      clsx(
        "cursor-pointer transition-all flex items-center text-white",
        "flex-col justify-center py-3 rounded-xl color-ai",
        "gap-5 px-3 w-full mb-3",
        "lg:text-base text-sm",
        "w-9 h-9",
      ),
    [],
  );

  const containerClasses = useMemo(
    () =>
      clsx(
        "fixed right-0 top-0 z-[13000] flex h-screen w-[88vw] max-w-[300px] flex-col items-start overflow-y-auto p-5 shadow-lg lg:w-[300px] lg:pt-3",
        "dark:bg-black",
        "lg:border-l lg:border-white/10 lg:bg-gradient-to-br lg:from-slate-950/65 lg:via-emerald-950/55 lg:to-stone-950/60 lg:text-neutral-50 lg:shadow-2xl lg:backdrop-blur-xl dark:lg:bg-transparent",
        {
          "bg-gradient-to-r from-white to-neutral-100": !isDarkMode,
        },
      ),
    [isDarkMode],
  );

  return (
    <>
      <AnimatePresence>
        {isMenuOpen
          ? [
              <motion.div
                key="app-menu-backdrop"
                className="fixed inset-0 z-[12990] cursor-default bg-transparent"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.16 }}
                onClick={() => setIsMenuOpen(false)}
                aria-hidden="true"
              />,
              <motion.div
                key="app-menu-panel"
                className={containerClasses}
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                onClick={(event) => event.stopPropagation()}
              >
                <div className="mb-6 flex w-full justify-end lg:hidden">
                  <button
                    type="button"
                    onClick={() => setIsMenuOpen(false)}
                    className="text-xl"
                    aria-label="Close menu"
                  >
                    <i className="fa-regular fa-xmark" aria-hidden="true" />
                  </button>
                </div>

                {menuItems.map((item, index) => (
                  <AppMenuItem
                    key={item.text}
                    icon={item.icon}
                    text={item.text}
                    action={item.action}
                    isSelected={index === selectedMenuIndex}
                    keyboardNavigationActive={keyboardNavigationActive}
                    onMouseEnter={() => setSelectedMenuIndex(index)}
                    onMouseLeave={() => setSelectedMenuIndex(-1)}
                  />
                ))}

                <div className="absolute bottom-10 left-1/2 hidden -translate-x-1/2 text-sm lg:block">
                  <KeyboardNavigationGuide
                    showLeft={false}
                    showRight={false}
                    textClasses="text-neutral-100"
                    bgClasses="bg-white/15"
                    additionalTitleClasses="text-neutral-100"
                  />
                </div>
              </motion.div>,
            ]
          : null}
      </AnimatePresence>

      {!isMenuOpen ? (
        <div className="fixed right-3 top-[calc(env(safe-area-inset-top)+0.75rem)] z-[12000]">
          <KeyboardShortcutTooltip
            shortcut="⌘M"
            show
            position="left"
            styleAsNormalText
          >
            <div
              onClick={(event) => {
                event.stopPropagation();
                setIsMenuOpen(true);
              }}
              className={getMenuPortalClasses()}
              role="button"
              aria-label="Open menu"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key !== "Enter" && event.key !== " ") return;
                event.preventDefault();
                setIsMenuOpen(true);
              }}
            >
              <i className="fa-regular fa-bars" aria-hidden="true" />
            </div>
          </KeyboardShortcutTooltip>
        </div>
      ) : null}
    </>
  );
};

export default AppMenu;
