
# MWEServer
> My Workflow Engine Server

## Zprovoznění

### Prerekvizity
- Operační systém
  - _Linux_
  - _WSL_ či _WSL 2_ pro Windows 10
- Node.js verze 11 a vyšší
  - Testováno na verzích: _v11.15.0_, _v12.16.1_
- Yarn
  - Je doporučeno používat Yarn
  - _Yarn_ byl aktivně využíván při vývoji
  - Neměl by být problém použít _npm_

### Začínáme
1. Instalace všech závislostí
```bash
yarn
# nebo
npm install
```
2. Nastavení serveru GraphQL
   - V souboru [src/config.ts](./src/config.ts)
3. Nastavení připojení k databázi.
   - V souboru [ormconfig.js](./ormconfig.js)
5. Kompilace a sestavení distribuce.
```bash
yarn build
# nebo
npm run build
```
6. První start serveru
	- Dojde k vymazání a synchronizaci schématu databáze, nahrání výchozích dat a spuštení serveru.
```bash
yarn start:first
# nebo
npm run start:first
# nebo je možné nahradit sekvencí
yarn setup:db # Smazání a synchronizace schématu databáze
yarn loag:ugm # Nahrání výchozích dat (Uživatelů, skupin, členství)
yarn start # Spustění produkční verze serveru
```

### Odlehčení pro dlouhodobé nasazení
Pro dlouhodobější nasazení na serveru je možné zmenšit velikost adresáře `node_modules`.
1. Projít celý postup __Začínáme__
2. Smazat adresáře `node_modules`
```bash
yarn clean:node
```
3. Nainstalovat jen nezbytné závislosti pro provoz
```bash
yarn --prod --link-duplicates
```
4. Spustit server
```bash
yarn start
```

### Použití dalších užitečných skriptů

- Automatizované testy
```bash
# Pokud jsou v databázi nějaká produkční data, 
# tak je nutné nejprve vyčistit databázi
yarn setup:db # Smazání a synchronizace schématu databáze
yarn test # Spustění testů
yarn test:cov # Spuštění testů včetně generování pokrytí
```
- Úprava kódu
```bash
yarn lint # Jen kontrola
yarn lint:fix # Oprava
yarn test:lint --fix # Oprava 
```
- Rychlé spuštění serveru při vývoji ze souborů `*.ts`
```bash
yarn serve:gql # Spustí sever GraphQL 
yarn serve:runner # Spustí běhové jádro BPMN
```
- Čištění 
```bash
yarn build:clean # Vymaže složku distribuce
yarn test:clean # Vymaže složku testu pokrití 
yarn clean # Vymaže složky distribuce a testu pokrití
yarn clean:node # Vymaže složku s nainstalovanými balíčky
yarn clean:all # Spustí všechny čistící skripty
```
