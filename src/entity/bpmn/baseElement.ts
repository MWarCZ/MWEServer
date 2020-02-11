import { BeforeInsert, Column, PrimaryGeneratedColumn } from 'typeorm'
import { v4 as uuid } from 'uuid'


export interface OptionsBaseElement {
  bpmnId: string,
  name: string,
}

/**
 * Zakladni entita obsahujici spolecne vlstnosti pro vsechny elementy sablony BPMN.
 */
export abstract class BaseElementTemplate {
  @PrimaryGeneratedColumn()
  id?: number

  @Column('text')
  bpmnId?: string

  @Column('varchar', { length: 255, default: '' })
  name?: string

  @BeforeInsert()
  genBpmnId() {
    if (!this.bpmnId)
      this.bpmnId = uuid()
  }

  constructor(options?: {[key: string]: any}) {
    if (!!options) {
      Object.keys(options).forEach(key => {
        (this as any)[key] = (options as any)[key]
      })
    }
  }
}

/**
 * Zakladni entita obsahujici spolecne vlastnosti pro vsechny elementy instance BPMN.
 */
export abstract class BaseElementInstance {
  @PrimaryGeneratedColumn()
  id?: number
}

/**
 * Stav aktivity. Aktivita jest napr. instance ulohy nebo procesu.
 * viz. diagram ve specifikaci BPMN Figure 13.2
 */
export enum ActivityStatus {
  None = 'None',
  Ready = 'Ready', // Pri vytvoreni instance
  Active = 'Active', // Pri dostupnosti vstupnich pozadavku (dat)
  Completing = 'Completing', // Pri dokonceni akce (konec skriptu, ulohy)
  Completed = 'Completed', // Pri ulozeni vystupu akce (ulozeni dat)
  Falling = 'Falling', // Pri chybe (Aktivita byla prerusene nebo chyba pri provadeni aktivity)
  Failled = 'Failled', // Akce skoncila s chybou
  Terminating = 'Terminating', // Pri preruseni akce vlivem udalosti
  Terminated = 'Terminated', // Akce je ukoncena
  Withdrawn = 'Withdrawn',  // Pri ukoncovani/ruseni akce (pr. Klient stornoval obednavku)

  Compensating = 'Compensating', Compensated = 'Compensated', // Zatim nezajem ;-)
}
