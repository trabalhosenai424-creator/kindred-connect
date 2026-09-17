import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { ensurePushSubscription } from "./lib/push-notifications";
import { installNotificationBell } from "./lib/notification-widget";

if (typeof window !== "undefined") {
  void ensurePushSubscription();
  installNotificationBell();
}

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
