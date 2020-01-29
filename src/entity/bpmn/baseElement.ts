import { BeforeInsert, Column, PrimaryGeneratedColumn } from 'typeorm'
import { v4 as uuid } from 'uuid'

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
  None,
  Ready, // Pri vytvoreni instance
  Active, // Pri dostupnosti vstupnich pozadavku (dat)
  Completing, // Pri dokonceni akce (konec skriptu, ulohy)
  Completed, // Pri ulozeni vystupu akce (ulozeni dat)
  Falling, // Pri chybe (Aktivita byla prerusene nebo chyba pri provadeni aktivity)
  Failled, // Akce skoncila s chybou
  Terminating, // Pri preruseni akce vlivem udalosti
  Terminated, // Akce je ukoncena
  Withdrawn,  // Pri ukoncovani/ruseni akce (pr. Klient stornoval obednavku)

  Compensating, Compensated, // Zatim nezajem ;-)
}
