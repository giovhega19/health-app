import { ok } from "@/shared/domain/Result";
import { DEFAULT_SCHEDULING_PREFERENCES } from "@/features/scheduling/domain/SchedulingPreferences";
import type { SchedulingPreferences } from "@/features/scheduling/domain/SchedulingPreferences";
import type { SchedulingPreferencesRepository } from "@/features/scheduling/application/ports";

/** Fake en memoria de `SchedulingPreferencesRepository` (`features/scheduling/application/ports.ts`). */
export class FakeSchedulingPreferencesRepository implements SchedulingPreferencesRepository {
  current: SchedulingPreferences;

  constructor(seed: SchedulingPreferences = DEFAULT_SCHEDULING_PREFERENCES) {
    this.current = seed;
  }

  async load() {
    return ok(this.current);
  }

  async save(preferences: SchedulingPreferences) {
    this.current = preferences;
    return ok(undefined);
  }
}
