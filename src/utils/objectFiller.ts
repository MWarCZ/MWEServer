
export type NonFunctionPropertyNames<T> = {
  [K in keyof T]: T[K] extends Function ? never : K
}[keyof T]

export type NonFunctionProerties<T> = Pick<T, NonFunctionPropertyNames<T>>

export type OptionsConstructor<T> = Partial<NonFunctionProerties<T>>

export function objectFiller<T>(element: any, options?: OptionsConstructor<T>) {
  if (!!options) {
    Object.keys(options).forEach(key => {
      let value = (options as any)[key]
      if (typeof value !== 'undefined') {
        element[key] = (options as any)[key]
      }
    })
  }
}
