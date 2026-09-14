import { CHANGELOG_ENTRIES, LEGACY_MANUS_CHECKPOINTS } from "../data/changelog";
import { protectedProcedure, router } from "../_core/trpc";

export const changelogRouter = router({
  list: protectedProcedure.query(() => ({
    entries: CHANGELOG_ENTRIES,
    legacyCheckpoints: LEGACY_MANUS_CHECKPOINTS,
  })),
});
