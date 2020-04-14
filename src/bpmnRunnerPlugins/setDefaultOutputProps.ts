import { RunContext } from '../bpmnRunner'
import { Json } from '../types/json'

export interface Prop {
  name: string,
  value: Json,
}

export function setDefaultOutputProps(options: {
  context: RunContext,
  props: Prop[],
}) {
  const {context, props} = options

  for (let key in context.$OUTPUT) {
    if (context.$OUTPUT[key]) {
      const dataObj = context.$OUTPUT[key]
      try {
        let keys = Object.keys(context.$OUTPUT[key])
        for (const prop of props) {
          // Pokud neni nastaveno $strict a nebo pokud je nastaveno a klic/nazev je v objektu
          if (!dataObj.$strict || keys.includes(prop.name)) {
            dataObj[prop.name] = prop.value
          }
        }
      } catch { }
    }
  }

}
