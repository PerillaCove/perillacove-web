import {
  createContext,
  useState,
  useContext,
  useCallback,
  ReactNode,
  useRef,
  useEffect,
} from "react";

interface ToastDataContext {
  title: string;
  subtitle: string;
  iconClasses: string;
  error?: boolean;
}

interface ToastContextType {
  toastData: ToastDataContext | null;
  isToastVisible: boolean;
  showToast: (data: ToastDataContext, duration?: number) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toastData, setToastData] = useState<ToastDataContext | null>(null);
  const [isToastVisible, setIsToastVisible] = useState(false);
  const autoDismissTimerRef = useRef<number | undefined>(undefined);

  const hideToast = useCallback(() => {
    if (autoDismissTimerRef.current) {
      clearTimeout(autoDismissTimerRef.current);
      autoDismissTimerRef.current = undefined;
    }
    setIsToastVisible(false);
    // Consider a delay for setToastData(null) if you have exit animations
    // and want data to persist during animation.
    // For now, it's immediate, which is fine.
  }, []);

  const showToast = useCallback(
    (data: ToastDataContext, duration: number = 5000) => {
      // Clear any existing timer
      if (autoDismissTimerRef.current) {
        clearTimeout(autoDismissTimerRef.current);
      }

      setToastData(data);
      setIsToastVisible(true);

      // Set new timer
      autoDismissTimerRef.current = window.setTimeout(() => {
        setIsToastVisible(false);
      }, duration);
    },
    [],
  );

  // Clear timeout on component unmount
  useEffect(() => {
    return () => {
      if (autoDismissTimerRef.current) {
        clearTimeout(autoDismissTimerRef.current);
      }
    };
  }, []);

  return (
    <ToastContext.Provider
      value={{ toastData, isToastVisible, showToast, hideToast }}
    >
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
