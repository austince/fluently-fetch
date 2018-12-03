/**
 * Similar to {@link ObjectConstructor#assign} but for {@link FormData}.
 *
 * @param base The base FormData object to assign into. Mutates!
 * @param others Other FormData objects to
 * @throws Error If assigning is unsupported
 */
export default (base: FormData, ...others: FormData[]): FormData => {
  if (!base.entries) {
    throw new Error('Cannot assign FormData.')
  }

  others
    .forEach(other =>
      Array.from(other.entries())
        .forEach(([key, val]) => {
          base.set(key, val)
        }),
    )

  return base
}
