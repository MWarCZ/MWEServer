
/**
 * Zakladni entita obsahujici spolecne vlstnosti pro vsechny elementy sablony BPMN.
 */
export interface BaseElementTemplate {
  id?: number
  bpmnId?: string
  name?: string
  genBpmnId: () => void
}

/**
 * Zakladni entita obsahujici spolecne vlastnosti pro vsechny elementy instance BPMN.
 */
export interface BaseElementInstance {
  id?: number
  startDateTime: Date | null
  endDateTime: Date | null
}

/**
 * Stav aktivity. Aktivita jest napr. instance ulohy nebo procesu.
 * viz. diagram ve specifikaci BPMN Figure 13.2
 */
export enum ActivityStatus {
  None = 'None',
  Ready = 'Ready', // Pri vytvoreni instance
  Active = 'Active', // Pri dostupnosti vstupnich pozadavku (dat)
  Waiting = 'Waiting', // Ceakani na dalsi oziveni
  Completing = 'Completing', // Pri dokonceni akce (konec skriptu, ulohy)
  Completed = 'Completed', // Pri ulozeni vystupu akce (ulozeni dat)
  Falling = 'Falling', // Pri chybe (Aktivita byla prerusene nebo chyba pri provadeni aktivity)
  Failled = 'Failled', // Akce skoncila s chybou

  Withdrawn = 'Withdrawn',  // Pri ukoncovani/ruseni akce (pr. Klient stornoval obednavku)
}

export enum ProcessStatus {
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
