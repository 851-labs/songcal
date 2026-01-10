import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";

import { db } from "../../db";
import { appleMusicTokens } from "../../db/schema";
import { throwIfUnauthenticatedMiddleware } from "../middleware";

const getConnectionStatus = createServerFn({ method: "GET" })
  .middleware([throwIfUnauthenticatedMiddleware])
  .handler(async ({ context }) => {
    const userId = context.session.user.id;

    const token = await db
      .select({ id: appleMusicTokens.id })
      .from(appleMusicTokens)
      .where(eq(appleMusicTokens.userId, userId))
      .get();

    return { connected: !!token };
  });

const appleMusicRouter = {
  getConnectionStatus,
};

export { appleMusicRouter };
