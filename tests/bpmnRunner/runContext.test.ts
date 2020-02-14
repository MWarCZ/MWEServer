import 'jest-extended'

import * as RunContext from '../../src/bpmnRunner/runContext'

describe('Testy s RunContext: synchronni funkce', () => {
  it('createEmptyContext', () => {
    let context = RunContext.createEmptyContext()
    expect(context.$GLOBAL).toMatchObject({})
    expect(context.$SELF).toMatchObject({})
    expect(context.$INPUT).toMatchObject({})
    expect(context.$OUTPUT).toMatchObject({})
  })
})
