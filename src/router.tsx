import { createRouter } from "@tanstack/react-router";

import { routeTree } from "./routeTree.gen";

const getRouter = () => {
  const router = createRouter({
    routeTree,
    context: {},
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};

export { getRouter };
