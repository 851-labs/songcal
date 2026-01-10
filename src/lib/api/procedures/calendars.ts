import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { listCalendars, refreshAccessToken } from "../../clients/google-calendar";
import { db } from "../../db";
import { accounts, syncState } from "../../db/schema";
import { createMutationProcedureWithInput, createQueryProcedure } from "../create-procedure";
import { throwIfUnauthenticatedMiddleware } from "../middleware";

const listFn = createServerFn({ method: "GET" })
  .middleware([throwIfUnauthenticatedMiddleware])
  .handler(async ({ context }) => {
    const userId = context.session.user.id;

    // Get user's Google account - filter by providerId to ensure we get the correct OAuth provider
    const googleAccount = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.userId, userId), eq(accounts.providerId, "google")))
      .get();

    if (!googleAccount?.refreshToken) {
      throw new Error("No Google account linked");
    }

    // Refresh access token
    const { accessToken } = await refreshAccessToken(
      googleAccount.refreshToken,
      env.GOOGLE_CLIENT_ID,
      env.GOOGLE_CLIENT_SECRET,
    );

    // Get calendars
    const calendars = await listCalendars(accessToken);

    // Get user's current calendar selection
    const userSyncState = await db
      .select({ calendarId: syncState.calendarId })
      .from(syncState)
      .where(eq(syncState.userId, userId))
      .get();

    return {
      calendars,
      selectedCalendarId: userSyncState?.calendarId ?? null,
    };
  });

const selectFn = createServerFn({ method: "POST" })
  .middleware([throwIfUnauthenticatedMiddleware])
  .inputValidator(z.object({ calendarId: z.string().nullable() }))
  .handler(async ({ context, data }) => {
    const userId = context.session.user.id;
    const { calendarId } = data;

    // Upsert sync state with calendar selection
    const existing = await db.select().from(syncState).where(eq(syncState.userId, userId)).get();

    if (existing) {
      await db.update(syncState).set({ calendarId }).where(eq(syncState.userId, userId));
    } else {
      await db.insert(syncState).values({
        userId,
        calendarId,
        initialized: false,
      });
    }

    return { success: true };
  });

const getSelectedFn = createServerFn({ method: "GET" })
  .middleware([throwIfUnauthenticatedMiddleware])
  .handler(async ({ context }) => {
    const userId = context.session.user.id;

    const userSyncState = await db
      .select({ calendarId: syncState.calendarId })
      .from(syncState)
      .where(eq(syncState.userId, userId))
      .get();

    return { calendarId: userSyncState?.calendarId ?? null };
  });

const calendarsRouter = {
  list: createQueryProcedure(["calendars", "list"], listFn),
  select: createMutationProcedureWithInput(["calendars", "select"], selectFn),
  getSelected: createQueryProcedure(["calendars", "selected"], getSelectedFn),
};

export { calendarsRouter };
