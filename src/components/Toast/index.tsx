import clsx from "clsx";

interface ToastProps {
  data: {
    title: string;
    subtitle: string;
    iconClasses: string;
    error?: boolean;
  };
  closeToast: () => void;
}

const Toast = ({ data, closeToast }: ToastProps) => {
  const containerClasses = clsx({
    "w-[300px] rounded-xl shadow-lg relative": true,
    "bg-combo text-white": true,
    // "bg-cove-gradient text-black": !isDarkMode && !data.error,
  });

  const iconContainerClasses = clsx({
    "flex w-6 h-6 items-center justify-center rounded-md border mr-3 mt-1": true,
    "border-red-300": data.error,
    "border-white": !data.error,
  });

  return (
    <div className={containerClasses}>
      <div className="flex items-center py-2.5 px-4">
        <div className={iconContainerClasses}>
          <i
            className={`${data.iconClasses} ${data.error ? "text-red-300" : ""} fa-sm`}
          ></i>
        </div>
        <div className="ml-3 w-0 flex-1">
          <p
            className={`text-sm font-bold ${data.error ? "text-red-300" : ""}`}
          >
            {data.title}
          </p>
          <p className="mt-1 text-sm">{data.subtitle}</p>
        </div>
      </div>
      <div
        className="absolute top-2 right-2 cursor-pointer hide-feature"
        onClick={closeToast}
      >
        <button className="inline-flex text-white rounded-md hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-purple-500 focus:ring-pink-500">
          <span className="sr-only">Close</span>
          <svg
            className="h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Toast;
