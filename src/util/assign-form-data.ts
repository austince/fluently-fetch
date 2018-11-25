/**
 * Similar to {@link ObjectConstructor#assign} but for {@link FormData}.
 *
 * @param base The base FormData object to assign into.
 * @param others Other FormData objects to
 */
export default (base: FormData, ...others: FormData[]): FormData => {
  others
    .forEach(other =>
      Array.from(other.entries())
        .forEach(([key, val]) => {
          base.set(key, val)
        }),
    )

  return base
}
