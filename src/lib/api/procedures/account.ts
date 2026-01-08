import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";

import { db } from "../../db";
import { users } from "../../db/schema";
import { throwIfUnauthenticatedMiddleware } from "../middleware";

const deleteAccount = createServerFn({ method: "POST" })
  .middleware([throwIfUnauthenticatedMiddleware])
  .handler(async ({ context }) => {
    await db.delete(users).where(eq(users.id, context.session.user.id));
    return { success: true };
  });

const accountRouter = {
  delete: deleteAccount,
};

export { accountRouter };
