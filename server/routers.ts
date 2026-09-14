import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { adminRouter } from "./routers/admin";
import { actionsRouter } from "./routers/actions";
import { changelogRouter } from "./routers/changelog";
import { dashboardRouter } from "./routers/dashboard";
import { documentsRouter } from "./routers/documents";
import { governanceRouter } from "./routers/governance";
import { indicatorsRouter } from "./routers/indicators";
import { mediaRouter } from "./routers/media";
import { notificationsRouter } from "./routers/notifications";
import { projectsRouter } from "./routers/projects";
import { expansionRouter } from "./routers/expansion";
import { financeRouter } from "./routers/finance";
import { marketFinanceRouter } from "./routers/marketFinance";
export const appRouter = router({
  // If you need socket.io, register its route in server/_core/index.ts.
  // All API paths must start with /api/ so the gateway can route them correctly.
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  dashboard: dashboardRouter,
  admin: adminRouter,
  projects: projectsRouter,
  expansion: expansionRouter,
  finance: financeRouter,
  marketFinance: marketFinanceRouter,
  actions: actionsRouter,
  governance: governanceRouter,
  indicators: indicatorsRouter,
  media: mediaRouter,
  documents: documentsRouter,
  notifications: notificationsRouter,
  changelog: changelogRouter,
});
export type AppRouter = typeof appRouter;
