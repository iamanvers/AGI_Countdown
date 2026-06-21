import type { RegistryIndex } from "./types.js";

export function indexById<T extends { id: string }>(
  entries: readonly T[],
): RegistryIndex<T> {
  return entries.reduce<RegistryIndex<T>>((index, entry) => {
    index[entry.id as T["id"]] = entry;
    return index;
  }, {} as RegistryIndex<T>);
}
