
import { MyNumber } from '../src/sample'

let myNumber: MyNumber

describe('Sample1 unit tests', () => {
  test('1+2', () => {
    let num = new MyNumber(1)
    expect(num.value).toBe(1)
    expect(num.add(2).value).toBe(3)
  })
})

describe('Sample2 unit tests', () => {
  beforeEach(() => {
    myNumber = new MyNumber()
  })

  test('0', () => {
    expect(myNumber.value).toBe(0)
  })
  test('0+1', () => {
    expect(myNumber.add(1).value).toBe(1)
  })
  test('0+10+5', () => {
    expect(myNumber.add(10).add(5).value).toBe(15)
  })
  test('0+5-2', () => {
    expect(myNumber.add(5).sub(2).value).toBe(3)
  })
  test.each([
    [2, 2], [0, 0], [-3, -3],
  ])('0+%i=%i', (valueA, expected) => {
    expect(myNumber.add(valueA).value).toBe(expected)
  })
})

