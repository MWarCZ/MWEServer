///////////////////////////////////////
// Soubor: src/graphql/subscriptionChanel.ts
// Projekt: MWEServer
// Autor: Miroslav Válka
///////////////////////////////////////

/** Nazvy konalu, ktere jsou v serveru GraphQL k dispozici */
export enum SubscriptionChanel {
  newProcessTemplates = 'newProcessTemplates',
  deletedProcessTemplates = 'deletedProcessTemplates',
  changedProcessTemplates = 'changedProcessTemplates',

  newProcessInstance = 'newProcessInstance',
  deletedProcessInstance = 'deletedProcessInstance',
  changedProcessInstance = 'changedProcessInstance',

  // changedNodeInstance = 'changedNodeInstance',
  changedNodeInstances = 'changedNodeInstances',
}
