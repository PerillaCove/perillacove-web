import { useAtom } from "jotai";
import { useEffect, useState } from "react";
import { DarkModeAtom } from "../../state";

import clsx from "clsx";
import { useLocation } from "react-router-dom";

export const useIsWidescreen = () => {
  const [isWidescreen, setIsWidescreen] = useState(true);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const listener = (event: MediaQueryListEvent) => {
      setIsWidescreen(event.matches);
    };

    mediaQuery.addEventListener("change", listener);
    setIsWidescreen(mediaQuery.matches);

    return () => {
      mediaQuery.removeEventListener("change", listener);
    };
  }, []);

  return isWidescreen;
};

export const useCircadianTheme = () => {
  const [isDarkMode, setDarkMode] = useAtom(DarkModeAtom);
  const resolvedDarkMode = isDarkMode ?? true;

  useEffect(() => {
    if (isDarkMode === null) {
      setDarkMode(true);
      return;
    }

    const classList = document.documentElement.classList;
    if (resolvedDarkMode) {
      classList.add("dark");
    } else {
      classList.remove("dark");
    }
  }, [isDarkMode, resolvedDarkMode, setDarkMode]);

  const toggleDarkMode = () => {
    setDarkMode((prevMode) => !(prevMode ?? true));
  };

  const getPreferredColorScheme = () => {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  };

  return {
    isDarkMode: resolvedDarkMode,
    toggleDarkMode,
    setDarkMode,
    getPreferredColorScheme,
  };
};

export function useFadeInAnimation(delay: number = 100) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const animationClasses = clsx("transition-opacity duration-300 ease-in-out", {
    "opacity-100": isVisible,
    "opacity-0": !isVisible,
  });

  return animationClasses;
}

export function useUrlPath() {
  const location = useLocation();
  const urlPath = location.pathname.startsWith("/")
    ? location.pathname.substring(1) + location.search
    : location.pathname + location.search;
  return urlPath;
}
