import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";

import { db } from "../../db";
import { users } from "../../db/schema";
import { createMutationProcedure, createQueryProcedure } from "../create-procedure";
import { throwIfUnauthenticatedMiddleware } from "../middleware";

const getFn = createServerFn({ method: "GET" })
  .middleware([throwIfUnauthenticatedMiddleware])
  .handler(async ({ context }) => {
    const { user } = context.session;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
    };
  });

const deleteAccountFn = createServerFn({ method: "POST" })
  .middleware([throwIfUnauthenticatedMiddleware])
  .handler(async ({ context }) => {
    await db.delete(users).where(eq(users.id, context.session.user.id));
    return { success: true };
  });

const accountRouter = {
  get: createQueryProcedure(["account"], getFn),
  delete: createMutationProcedure(["account", "delete"], deleteAccountFn),
};

export { accountRouter };
