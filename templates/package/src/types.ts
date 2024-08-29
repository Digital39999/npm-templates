/**
 * Type that removes null and undefined from a type.
 * @export
 * @typedef {DeepNonNullable}
 * @template {unknown} T - The type to remove null and undefined from.
 */
export type DeepNonNullable<T> = T extends NonNullable<T> ? T : DeepNonNullable<NonNullable<T>>;