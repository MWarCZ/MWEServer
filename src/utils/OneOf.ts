
export type OneOf_Item = [boolean, Function | undefined]

/**
 * Vraci funkci, ktera vyhleda a zavola prvni funkci s pravdivou hodnotou.
 */
export function OneOf(...args: OneOf_Item[]) {
  return () => args.find(x => {
    x[0] && x[1] && x[1]()
    return x[0]
  })
}
// OneOf(
//   [false, () => { }],
//   [true, OneOf(
//     [2 > 4, () => { }],
//     [1 === 1, OneOf(
//     )]
//   )]
// )()

