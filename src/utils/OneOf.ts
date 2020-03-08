
export type OneOf_ItemX = [boolean, (() => any) | undefined]

/**
 * Funkce prijima libovolne mnozstvi polozek, ktere maji tvar pole s velikosti 2.
 * Prvni v poli je pravdivostni hodota a druha je funkce.
 * Funkce vrati funkci z polozky, ktera jako prvni obsahuje hodnotu 'true'.
 */
export function OneOfX(...args: OneOf_Item[]): () => any {
  let item = args.find(x => x[0])
  return (item && item[1]) ? item[1] : () => {}
}
// OneOf(
//   [false, () => { }],
//   [true, OneOf(
//     [2 > 4, () => { }],
//     [1 === 1, OneOf(
//     )]
//   )]
// )()
export type OneOf_Item = [() => boolean, (() => any) | undefined]

export function OneOf(...args: OneOf_Item[]): () => any {
  let item = args.find(x => x[0] && x[0]())
  return (item && item[1]) ? item[1] : () => { }
}
