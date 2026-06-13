import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";
import SuspenseFallback from "./components/SuspenseFallback";

import App from "./App";

import { ToastProvider } from "./components/Toast/Context";

const Terms = lazy(() => import("./components/Terms"));

const IntegrationQuiz = lazy(() => import("./components/IntegrationQuiz"));

const PanoramicTour = lazy(() => import("./components/PanoramicTour"));
const HotspotPickerPage = lazy(
  () => import("./components/PanoramicTour/HotspotPickerPage"),
);

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: <Navigate to="/panoramic-tour/sample-tropical" replace />,
      },
      {
        path: "terms",
        element: (
          <Suspense fallback={<SuspenseFallback />}>
            <Terms />
          </Suspense>
        ),
      },
      {
        path: "integration-audit",
        element: (
          <Suspense fallback={<SuspenseFallback />}>
            <IntegrationQuiz />
          </Suspense>
        ),
      },
      {
        path: "panoramic-tour",
        element: <Navigate to="/panoramic-tour/sample-tropical" replace />,
      },
      {
        path: "panoramic-tour/picker",
        element: (
          <Suspense fallback={<SuspenseFallback />}>
            <HotspotPickerPage />
          </Suspense>
        ),
      },
      {
        path: "panoramic-tour/sample-tropical",
        element: (
          <Suspense fallback={<SuspenseFallback />}>
            <PanoramicTour isImmersiveMode />
          </Suspense>
        ),
      },
      {
        path: "panoramic-tour/:tourId",
        element: (
          <Suspense fallback={<SuspenseFallback />}>
            <PanoramicTour />
          </Suspense>
        ),
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>
  </React.StrictMode>,
);
