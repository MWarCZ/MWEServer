
# Manuál
Toto je manuál k workflow systemu s názvem systém MWE.
> Návod na vytvoření souboru BPMN naleznete [zde](./create_bpmn_file.md).

## Obsah
- [Manuál](#manuál)
	- [Obsah](#obsah)
	- [Výchozí účty a přihlašovací údaje](#výchozí-účty-a-přihlašovací-údaje)
	- [Chráněné skupiny a role](#chráněné-skupiny-a-role)
	- [Podporované elementy BPMN](#podporované-elementy-bpmn)
		- [Definitions](#definitions)
		- [Process](#process)
		- [Colaboration](#colaboration)
		- [Pool, Lane](#pool-lane)
		- [Sequence Flow](#sequence-flow)
		- [Data Object](#data-object)
		- [Data Object Reference](#data-object-reference)
		- [Task](#task)
		- [Script Task](#script-task)
		- [Manual Task](#manual-task)
		- [User Task](#user-task)
		- [Start Event](#start-event)
		- [End Event](#end-event)
		- [Intermediate Throw Event](#intermediate-throw-event)
		- [Intermediate Catch Event](#intermediate-catch-event)
		- [Parallel Gateway](#parallel-gateway)
		- [Inclusive Gateway](#inclusive-gateway)
		- [Exclusive Gateway](#exclusive-gateway)
	- [Kontext dostupný uzlům při zpracování](#kontext-dostupný-uzlům-při-zpracování)
	- [Ukázky použití skriptů a výrazů](#ukázky-použití-skriptů-a-výrazů)

## Výchozí účty a přihlašovací údaje

Server MWE při svém zprovoznění obsahuje výchozí uživatelské účty.
Následující seznam obsahuje chráněné uživatelské účty, které mají trvalé členství v chráněných skupinách, a výchozí přihlašovací údaje pro přihlášení se k účtům.
Existence chráněných účtů zajištuje, aby nedošlo k trvalé ztrátě práv provádět některé akce pro všechny existující uživatele na serveru.

Seznam chráněmých uživatelských účtů:
- Systémový uživatel
  - Přihlašovací jméno: system
  - Není možné se přihlásit jako systémový uživatel.
  - Systémový uživatel je vyhrazen pro označení serveru neboli zjednodušeně systémový uživatel je serverem využívaný účet.
- Administrátor uživatelů
  - Přihlašovací jméno: useradmin
  - Výchozí heslo: UserAdmin
  - Je trvalým členem skupiny _UserAdmin_.
- Super administrátor uživatelů
  - Přihlašovací jméno: superuseradmin
  - Výchozí heslo: SuperUserAdmin
  - Je trvalým členem skupiny _SuperUserAdmin_.
- Administrátor skupin
  - Přihlašovací jméno: groupadmin
  - Výchozí heslo: GroupAdmin
  - Je trvalým členem skupiny _GroupAdmin_.
- Super administrátor skupin
  - Přihlašovací jméno: supergroupadmin
  - Výchozí heslo: SuperGroupAdmin
  - Je trvalým členem skupiny _SuperGroupAdmin_.
- Nejvyšší manažer 
  - Přihlašovací jméno: topmanager
  - Výchozí heslo: TopManager
  - Je trvalým členem skupiny _TopManager_.

Na serveru se po zprovoznění nacházejí i obyčejní nechárnění uživatelé.
Přihlašovací jména obyčejných úživatelů mají formát `user<číslo>` (např. `user7`, `user8`, `user9`). 
Pro výchozí přihlašovací hesla obyčejných uživatelů platí, že je stejné jako jejich uživatelské jméno.
Výchozí obyčejní uživatelé slouží jen jako ukázka uživatelských účtů v různých stavech (např. aktivní, uzamknutý, chráněný, odstraněný).


## Chráněné skupiny a role
- UserAdmin
  - Administrátor uživatelů
  - Roje je udělena uživatelům, kteří jsou členy chráněné skupiny _UserAdmin_.
  - Mezi jeho privilegia patří vytváření nových uživatelských účtů, odstraňování existujících uživatelských účtů nebo jejich uzamykání v případě potřeby.
  - Oproti roli `User` je mu umožněno upravovat osobní a přihlašovací údaje všech jemu dostupných uživatelů.
- SuperUserAdmin
  - Jedná se o speciální typ administrátora uživatelů, který má navíc některá oprávnění.
  - Roje je udělena uživatelům, kteří jsou členy chráněné skupiny _SuperUserAdmin_.
  - Může provádět destruktivní operaci trvalé smazání uživatelského účtu nebo jeho obnovení ze stavu odstraněného do stavu aktivního.
- GroupAdmin
  - Administrátor skupin
  - Roje je udělena uživatelům, kteří jsou členy chráněné skupiny _GroupAdmin_.
  - Jeho privilegia jsou vytváření nových skupin, odstraňování existujících skupin, úprava informací o skupinách.
  - Dále může také přidávat nové členy do libovolné skupiny a odebírat členy z libovolné skupiny.
- SuperGroupAdmin
  - Jde o speciální typ administrátora skupin, který má navíc některá oprávnění.
  - Roje je udělena uživatelům, kteří jsou členy chráněné skupiny _SuperGroupAdmin_.
  - Může provádět destruktivní operaci pro trvalé smazání skupiny nebo obnovení skupiny ze stavu odstraněná do stavu aktivní.
- TopManager
  - Nejvyšší manažer
  - Role je udělena na základe členství uživatele ve skupine _TopManager_.
  - Umožňuje nahrávat nové šablony procesů na server a zároveň manipulace nad všemi šablonami procesů a jejich instance včetně destruktivních akcí jakými je trvalé smazání šablony nebo instance procesu.



## Podporované elementy BPMN

### Definitions
Element je kořenovým elementem souboru BPMN.
Slouží k definování jmenných prostorů použitých pro všechny elementy obsažené v souboru BPMN.

Ukázka XML:
```xml
<definitions xmlns:name="uri" 
	xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL" 
	xmlns:camunda="http://camunda.org/schema/1.0/bpmn"
	xmlns:mwe="http://www.mwarcz.cz/mwe/bpmn/"
	...
>
	<collaboration>...</collaboration>
	<process>...</procees>
	...
</definitions>
```
Atributy:
- `xmlns`
  - Vychozi jmenny prostor pro značky XML jejihž název neobsahuje předponu oddělenou dvojtečnou.
- `xmlns:foo`
  - Definuje alias pro jmenný prostor, který je použit jako předpona u názvů značek XML.
  - V definici za dvojtečkou je specifikován název aliasu. 

Jmenné prostory (NameSpaces): 
- xsi - `http://www.w3.org/2001/XMLSchema-instance`
  - ...
- bpmn - `http://www.omg.org/spec/BPMN/20100524/MODEL`
  - Prvky/elementy bpmn 2.0.
  - Definování struktury BP, propojení, názvy, výrazy, atd. 
- bpmndi - `http://www.omg.org/spec/BPMN/20100524/DI`
  - Grafická reprezentace elementů/prvků 
- dc - `http://www.omg.org/spec/DD/20100524/DC`
  - Určování pozice/polohy a rozměrů v diagramu.
- di - `http://www.omg.org/spec/DD/20100524/DI`
  - Určení pozic odkud kam vede čára/šipka.
- mwe - `http://www.mwarcz.cz/mwe/bpmn/`
  - Prostor pro mnou definovane elementy a atributy.


### Process
Element představuje podnikový proces.
Je přímím potomkem elementu `definitions`.

Ukázka XML:
```xml
<process id="id" name="string" isExecutable="bool" processType="none | private | public" camunda:versionTag="number | semver" mwe:versionType="number | semver" mwe:version="number | semver">
	...
</process>
```
Atributy: 
- `id`
  - Unikátní identifikátor vrámci souboru BPMN.
- `name`
  - Název procesu.
- `isExecutable`
  - Příznak spustitelnosti procesu.
- `processType`
  - Typ podnikového procesu.
- `mwe:versionType`
  - Formát verze.
  - Platné volby: `number` (Celé číslo), `semver` (Dle definice semver. Major.Minor.Path )
- `mwe:version`
  - Verze procesu.
  - Důležité při stejném `id` pro rozlišení procesu. 
- `camunda:versionTag`
  - Verze procesu.
  - Stejný učel jako `mwe:version`.
  - Při existenci obou dvou atributů je použit atribut `mwe:version`

### Colaboration
Kolaborace současný systém využívá pro identifikaci skupin uživatelů, kteří se stávají potencionálními manažery.
Těmto uživatelům systém přiděluje práva provádět nad podnikovými procesu některé úkony pro správu šablon procesů a instancí procesů.
Element kolaborace je přímím potomkem elementu `definitions`.

Ukázka XML:
```xml
<collaboration>
	<participant name="string" processRef="id_process" />
	...
</collaboration>
```
Atributy:
- `participant`
  - `name`
    - Název účastníka.
    - Pro systém představuje rovněž název skupiny uživatelů, která obsahuje potencionální manažery.
  - `processRef`
    - Reference na proces, ke kterému bude navázán název skupiny.

### Pool, Lane
Následující elementy hrají pro systém důležitou roli.
Systém následující elementy využívá pro identifikaci skupin uživatelů, kteří se stávají kandidáty na nabyvatele uzlů či aktéry.
Elementy `lane` nesou název, který je systémem vnímán jako názvem skupiny uživatelů.
Název skupiny je přiřazen všem uzlů, jejichž reference se v `lane` nachází.
Identifikovaní uživatelé následně mohou obsadit a obslužit instance uzlů nebo zahájit instanci procesu přes daný uzel. 
Element `laneSet` je přímím potomkem elementu `process`.

Ukázka XML:
```xml
<laneSet>
	<lane name="string">
		<flowNodeRef>
			<!-- id_taks | id_gateway | id_event | id_data -->
		</flowNodeRef>
	</lane>
	<!-- ... -->
</laneSet>
```

### Sequence Flow
Jedná se o element představující sekvenční tok.
Určuje průběh vytváření instancí uzlů během postupu při vykonávání instance procesu.
Podpora různých typů sekvenčních toků závisí na konkrétních implemenací pro zpracování uzlů (viz. Task, Gateway, StartEvent, EndEvet atd.).
V základu systém rozlišuje dva typy sekvenčních toků.
- Běžný sekvenční tok
  - K provedení sekvenčního toku dojde vždy.
- Podmíněný sekvenční tok
  - K provedení sekvenčního toku dojde jen za splnění výrazu, který obsahuje.
  - Současná verze systému podporuje výrazy, které jsou tvořeny kódem jazyka JavaScript.
  - Ve výrazech je možné využívat položky kontextu (viz. [kontext](#kontext-dostupn%c3%bd-uzl%c5%afm-p%c5%99i-zpracov%c3%a1n%c3%ad)).

Ukázka XML:
```xml
<!-- Běžný sekvenční tok -->
<sequenceFlow id="id" name="string" sourceRef="id_taks | id_gateway | id_event" targetRef="id_taks | id_gateway | id_event" />
<!-- Podmíněný sekvenční tok -->
<sequenceFlow id="id" name="string" sourceRef="id_taks | id_gateway | id_event" targetRef="id_taks | id_gateway | id_event">
	<conditionExpression xsi:type="bpmn2:tFormalExpression">1=='1'</conditionExpression>
</sequenceFlow>
```
Atributy:
- `id`
  - Unikátní identifikátor v rámci souboru BPMN.
- `name`
  - Název sekvenčního toku.
- `sourceRef`
  - Reference na uzel, ze kterého sekvenční tok vychází.
  - Uzlem může být úloha, událost nebo brána.
- `targetRef`
  - Reference na uzel, do kterého sekvenční tok vstupuje.
  - Uzlem může být úloha, událost nebo brána.

### Data Object
Datový objekt pro uchovávání dat, které v podnikových procesech jsou součástí datových toků.
Systém umožňuje do datového objektu vložit výchozí data za využití rozšiřujícího elementu json, v němž je možné uvést data, která budou formátována do podoby textového řetezce ve formátu JSON.

Ukázka XML:
```xml
<!-- Prázdný datový objekt -->
<dataObject id="id" name="string"/>
<!-- Datový objekt obsahující výchozí data -->
<dataObject id="id" name="string" mwe:strict="bool">
	<extensionElements>
		<mwe:json>
			{ "json": "with", "data": 1 }
		</mwe:json>
	</extensionElements>
</dataObject>
```
Atributy:
- `id`
  - Unikátní identifikátor v rámci souboru BPMN.
- `name`
  - Název datového objektu.
  - Pod tímto názvem objekt bude dostupný v systému.
- `mwe:strict`
  - Příznak upravující chování uzlů, které ukládají data do datového objektu.
  - Příznat se týká pouze výchozích údajů, které uzly mohou generovat po svém zpracování.
- `mwe:json`
  - Výchozí data poskytovaná datovým objektem.
  - Očekávána je textová hodnota obsahující data ve formátu JSON.

### Data Object Reference
Reference ukazující na datový objekt.
Zastupuje datový objekt v diagramu a umožňuje jeden datový objket použit na více místech a zároveň zachovat přehlednost diagramu.
V případě, že datový objekt není pojmenován, je datový objekt pojmenován po jménu reference na datový objekt.

Ukázka XML:
```xml
<dataObjectReference id="id" name="string" dataObjectRef="id_dataObject"/>
```
Atributy:
- `id`
  - Unikátní identifikátor v rámci souboru BPMN.
- `name`
  - Název reference.
  - Pokud datový objekt není pojmenován je pro jeho jméno použit název první pojmenované datové reference, která na datový objekt odkazuje. 
- `dataObjectRef`
  - Reference/Odkaz na datový objekt s odpovídajícím unikátním identifikátorem. 


### Task
Abstraktní úloha slouží převážně pro účely ladění a testování.
Ve výchozím stavu je její chování nastoveno na úspěšné delání ničeho.
Abstraktní úloha v systému spadá mezi uzly a všechny uzly mohou systému oznámit, jakou implementací chtejí být zpracovávány.

Ukázka XML:
```xml
<task id="id" name="string" mwe:implementation="implementation_name">
	<dataInputAssociation>
		<sourceRef>
			<!-- id_dataObject -->
		</sourceRef>
		...
	</dataInputAssociation>
	<dataOutputAssociation>
		<targetRef>
			<!-- id_dataObject -->
		</targetRef>
		...
	</dataOutputAssociation>
</task>
```
Atributy:
- `id`
  - Unikátní identifikátor v rámci souboru BPMN
- `name`
  - Název úlohy.
- `mwe:implementation`
  - Název implementace uzlu v systému MWE, která bude použita pro danou úlohu místo výchozího chování pro tento typ uzlu.
- `dataInputAssociation`
  - Definuje vstupující datové toky, které nesou data dostupná pro uzel při zpracování.
  - `sourceRef`
    - Odkaz/Reference na datový objekt ze kterého proudí data do uzlu.
- `dataOutputAssociation`
  - Definuje výstupní datové toky, které nesou data vzniklá po zpracování uzlu.
  - `targerRef`
    - Odkaz/Reference na datový objket do kterého proudí data z uzlu pro uložení.

Zásuvný modul s implementací uzlu:
Výchozí implementace pro abstraktvní ulohu se nazývá `Task` a obstarává ji zásuvný modul, jehož zdrojové kódy se nalézají v souboru `src/bpmnRunnerPlugins/task.ts`.
Implementace uzel vždy zpracuje úspěšně a při dokončování dochází k výběru dalších uzlů pro spuštění na základě sekvenčních toků.
Podporuje i výcenásobné a podmíněné odchozí sekvenční toky.
Na obrázku je znázorněno, jak jsou chápány jednotlivé typy sekvenčních toků.

![Task s ruznymi sekvencnimi toky](./img/sequence_flow.svg)

Při vyhodnocování podmíněných toků je možné využívat globálních objektů, které tvoří kontext.
Vstupní a výstupní datové objekty dostupné zkrze kontext jsou pouze datové objekty, které odpovídají datovým toků vedocích z/do uzlu (viz. [Kontext](#kontext-dostupn%c3%bd-uzl%c5%afm-p%c5%99i-zpracov%c3%a1n%c3%ad)).

### Script Task
Úloha umožnující spuštět/provádět skript v ní obsažený.
Struktura je podobná elementu `task` a rozšiřuje ji o několik dalších částí.

Ukázka XML:
```xml
<scriptTask scriptFormat="js | javascript" id="id" name="string" mwe:implementation="implementation_name">
	<script>
		<!-- Skript v jazyce JavaScript -->
	</script>
	<!-- Viz. Task-->
</scriptTask>
```
Atributy:
- Společné atributy s elementem `Task` jsou k nalezeni u elementu `Task`
- `scriptFormat`
  - V současném stavu je podporován jen jazyk JavaScript.
  - V budoucnosti je možné uvožovat o rozšířené podpoře skriptovacích jazyků.
- `script`
  - Skript ve zvoleném jazyce, který bude uzlem provedem při zpracování.
  - (Neplatí pokud je výchozí implementace změněna atributem `mwe:implementation`.)

Zásuvný modul s implementací uzlu:
Výchozí implementace pro úlohu skriptu se nazývá `ScriptTask` a obstarává ji zásuvný modul, jehož zdrojové kódy se nalézají v souboru `src/bpmnRunnerPlugins/scriptTask.ts`.
Implementace během zpracování se pokusí provést skript.
Implementace částečně využívá implementace `Task` a díky tomu při výběru dalších uzlů při svém dokončování je schopná pracovat s vícenásobnými a podmíněnými odchozími sekvenčními toky (viz. `Task`).

### Manual Task
Manuální úloha definuje úlohu externího charakteru.
Jedná se o typ úlohy, která je vykonána externě mimo systém a v systému dochází jen k potvrzení jejího dokončení.
(Například úloha *Výjezd elektrikářů k opravě elektrického vedení* je manuální úlohou a její dokončení potvrdí osoba pracující se systémem třeba po telefonické komunikaci s elektrikáři.)

Ukázka XML:
```xml
<manualTask id="id" name="string" mwe:implementation="implementation_name">
	<!-- Viz. Task-->
</manualTask>
```
Atributy:
- Společné atributy s elementem `Task` jsou k nalezeni u elementu `Task`
- Neobsahuje žádné další odlišné atributy.

Zásuvný modul s implementací uzlu:
Výchozí implementace pro manuální úlohu se nazývá `ManualTask` a obstarává ji zásuvný modul, jehož zdrojové kódy se nalézají v souboru `src/bpmnRunnerPlugins/manualTask.ts`.
Implementace provede zpracování úlohy až po jejím potvrzení.
K potvrzení dojde vlivem uživatele, který zabral obsluhovaný uzel a obsloužil jej.
Pro obsluhu uživatelem generuje implementace požadavky na dodatky.
Dodatkem je položka s názvem `state`, která představuje typ potvrzení manuální úlohy (`completed` = splněná, `storno` = zrušená).
Vlastní fáze zpracování proběhne vždy úspěšně a behěm dokončování dochází k výběru následujících uzlů.
Výběr následujících uzlů je vykonáván za pomocí implementace `Task` a je tedy možné využívat vícenásobné a podmíněné výchozí sekvenční toky (viz. `Task`).
Implementace dále vkládá do výchozích datových objektů položku `_state`, která obsahuje stav/typ potvrzení (`completed`, `storno`).

### User Task
Uživatelská úloha slouží k modelování práce, jenž vykonává pracovník firmy, který je v systému.
Uživatelská úloha může být zabrána potencionálními pracovníky pro obsluhu a následně jimi může být obsloužena.

Ukázka XML:
```xml
<userTask id="id" name="string" mwe:implementation="implementation_name">
	<!-- Viz. Task-->
</userTask>
```
Atributy:
- Společné atributy s elementem `Task` jsou k nalezeni u elementu `Task`
- Neobsahuje žádné další odlišné atributy.

Zásuvný modul s implementací uzlu:
Výchozí implementace pro uživatelskou úlohu se nazývá `UserTask` a obstarává ji zásuvný modul, jehož zdrojové kódy se nalézají v souboru `src/bpmnRunnerPlugins/userTask.ts`.
Implementace provede zpracování úlohy až po jejím obsloužení uživatelem.
Pro obsloužení je nutné doplňit dodatky, které jsou definovány ve vstupním datovém objektu.
Ve vstupním datovém objektu je vyhledávána položka `$form` jejíž obsah tvoří požadavky na dodatky.
Až po doplnění dodatků probíhá fáze zpracování, při které dojde k uložení získaných dat od uživatele do výstupních datových objektů (Název dodatku v požadavcích se shoduje s názvem, pod kterým bude uložen do datových objektů. Např. dodatek `Jmeno` bude uložen do datového objektu do položky `Jmeno`).
Ve fázi dokončení probíhá výběr následujících uzlů, který je vykonáván za pomocí implementace `Task` a je tedy možné využívat vícenásobné a podmíněné výchozí sekvenční toky (viz. `Task`).
Zároveň

Vstupní formulář a požadavky na dodatky:
Příklad obsahu datového objektu, který obsahuje formulář, je vidět na následující ukázce kódu.
```json
{ 
	"$form": {
		"Jmeno": { "type": "text", "hints": "Doplnte cele jmeno." },
		"Plat": { "type": "number", "default": 110, "hints": "Plat na hodinu (Kc)." },
		"Vek": { "type": "range", "default": 18, "possibilities": [ 1, 18, 70 ] },
		"Cizinec": { "type": "checkbox", "default": false },
		"Pohlavi": { "type": "select", "possibilities": [ "Muz", "Zena" ], "default": "Muz" }
	}
}
```
Položky tvořící požadavky na dodatky musí obsahovat typ (type) a dále mohou obsahovat nápovědu (hints), výchozí hodnotu (default) a pole s možnostmi (possibilities).
Podporované typy požadavků a obsah jejich položek záleží převážně na schopnostech klientské aplikace.
Zde je seznam možných typů požadavků na dodatky (položek formuláře), které by měli být podporovány:
- text
  - Očekává se textový řetezec.
  - `default`: Volitelná výchozí textová hodnota položky formuláře.
  - `hints`: Volitelná textová nápověda pro položku formuláře.
- password
  - Očekáván je textový řetezec.
  - `default`: Volitelná výchozí textová hodnota položky formuláře.
  - `hints`: Volitelná textová nápověda pro položku formuláře.
- number
  - Je očekávána číselná hodnota.
  - `default`: Volitelná výchozí číselná hodnota položky formuláře.
  - `hints`: Volitelná textová nápověda pro položku formuláře.
- checkbox
  - Je očekávána pravdivostní hodnota (true, false).
  - `default`: Volitelná výchozí pravdivostní hodnota položky formuláře.
  - `hints`: Volitelná textová nápověda pro položku formuláře.
- range
  - Je očekávána číselná hodnota.
  - `default`: Volitelná výchozí číselná hodnota položky formuláře.
  - `hints`: Volitelná textová nápověda pro položku formuláře.
  - `possibilities`: Volitelné číselné tříprvkové pole ve formátu [velikost kroku, minimální hodnota, maximální hodnota]. 
- select
  - Je očekáváno vybrání jedné z položek z pole `possibilities`.
  - `default`: Volitelná výchozí hodnota položky formuláře.
  - `hints`: Volitelná textová nápověda pro položku formuláře.
  - `possibilities`: Poviné pole obsahující povolené hodnoty pro výběr. 
- hidden
  - Očekává se, že bude odeslána výchozí hodnota.
  - `default`: Poviná výchozí hodnota položky formuláře.
- html
  - Slouží za účelem zobrazení informací uživateli.
  - `hints`: Poviny textový řetezec obsahující HTML


### Start Event
Počáteční událost pro započetí nové instance procesu.
V aktuální podobě systému jsou všechny počáteční události brány za běžné události čekající na manuální spuštění procesu.

Ukázka XML:
```xml
<startEvent id="id" name="string" mwe:implementation="implementation_name">
	<dataOutputAssociation>
		<targetRef>
			<!-- id_dataObject -->
		</targetRef>
	</dataOutputAssociation>
</startEvent>
```
Atributy:
- `id`
  - Unikátní identifikátor v rámci souboru BPMN
- `name`
  - Název události.
- `mwe:implementation`
  - Název implementace uzlu v systému MWE, která bude použita pro daný uzel místo výchozího chování pro tento typ uzlu.
- `dataOutputAssociation`
  - Definuje výstupní datové toky, které nesou data vzniklá po zpracování uzlu.
  - `targerRef`
    - Odkaz/Reference na datový objket do kterého proudí data z uzlu pro uložení.

Zásuvný modul s implementací uzlu:
Výchozí implementace pro počáteční událost se nazývá `StartEvent` a obstarává ji zásuvný modul, jehož zdrojové kódy se nalézají v souboru `src/bpmnRunnerPlugins/startEvent.ts`.
Implementace je provedena vždy úspěšně a při dokončování dochází k výběru následujících uzlů na základě výstupních sekvenčních toků.
Jsou podporovány jen jednoduché sekvenční toky (tj. mimo výchozí a podmíněné).
V případě výskytu vícero odchozích sekvenčních toků, jsou následující uzly spuštěny jako paralelně.

### End Event
Účelem ukončovací události je předat informaci o ukončení instance procesu.
Systém rozlišuje zatím dva typy ukončovacích událostí:
- Běžná ukončovací událost
  - Událost pouze informuje, že proces dospěl do jednoho ze svých konců a je možné proces ukončit, pokud již neexistují žádné uzly čekající na zpracování.
- Přerušující ukočující událost (Obsahuje element `terminateEventDefinition`)
  - Událost vynutí násilně ukončení procesu a přeruší všechny uzly, které ještě čekají na zpracování.

Ukázka XML:
```xml
<!-- Běžná ukončovací událost -->
<endEvent id="id" name="string" mwe:implementation="implementation_name">
	<dataInputAssociation>
		<sourceRef>
			<!-- id_dataObject -->
		</sourceRef>
		...
	</dataInputAssociation>
</endEvent>
<!-- Přerušující ukončující událost -->
<endEvent id="id" name="string" mwe:implementation="implementation_name">
	<dataInputAssociation>
		<sourceRef>
			<!-- id_dataObject -->
		</sourceRef>
		...
	</dataInputAssociation>
	<terminateEventDefinition />
</endEvent>
```
Atributy:
- `id`
  - Unikátní identifikátor v rámci souboru BPMN
- `name`
  - Název úlohy.
- `mwe:implementation`
  - Název implementace uzlu v systému MWE, která bude použita pro daný uzel místo výchozího chování pro tento typ uzlu.
- `dataInputAssociation`
  - Definuje vstupující datové toky, které nesou data dostupná pro uzel při zpracování.
  - `sourceRef`
    - Odkaz/Reference na datový objekt ze kterého proudí data do uzlu.

Zásuvný modul s implementací uzlu:

Výchozí implementace pro běžnou ukončovací událost se nazývá `EndEvent` a obstarává ji zásuvný modul, jehož zdrojové kódy se nalézají v souboru `src/bpmnRunnerPlugins/endEvent.ts`.
Implementace je provedena vždy úspěšně a při dokončování nedochází k výběru následujících uzlů.
Implementace nevynucuje ukončení, ale pouze oznamuje, že jedna z větví dosáhla konce a je možné v tento okamžik prohlásit proces za dokončený pokud se jedná o poslední větev.

Výchozí implementace pro přerušující ukončovací událost se nazývá `TerminateEndEvent` a obstarává ji zásuvný modul, jehož zdrojové kódy se nalézají v souboru `src/bpmnRunnerPlugins/terminateEndEvent.ts`.
Implementace je provedena vždy úspěšně a při dokončování nedochází k výběru následujících uzlů.
Implementace vynucuje ukončení procesu a všechny nedokončené uzly budou přerušeny.

### Intermediate Throw Event
Jedná se o přechodnou událost, do které vstupuje sekvenční tok, který je odkloněn dle zvolené definice události.
Systém aktuálně podporuje jen jeden typ přechodné události a to konkrétně přechodnou vstupní spojující událost.
Jedná se o událost, která přehodí sekvenční tok na přechodnou výstupní spojující událost.

Ukázka XML:
```xml
<!-- Přechodná vstupní spojující událost -->
<intermediateThrowEvent id="id" name="string">
	<linkEventDefinition />
</intermediateThrowEvent>
```
Atributy:
- `id`
  - Unikátní identifikátor v rámci souboru BPMN.
- `name`
  - Název události.
  - Hraje roli při vyhledávání výstupních uzlů k přesměrování sekvenčního toku.
- `linkEventDefinition` Přechodná vstupní spojující událost
  - Sekvenční tok vstupující do události je odkloněn na všechny uzly typu Přechodná výstupní spojující událost, která mají stejný název.

Zásuvný modul s implementací uzlu:

Výchozí implementace pro přechodnou vstupní spojující událost se nazývá `LinkIntermediateThrowEvent` a obstarává ji zásuvný modul, jehož zdrojové kódy se nalézají v souboru `src/bpmnRunnerPlugins/linkIntermediateEvent.ts`.
Implementace vyhledá v procesu uzly typu Přechodná výstupní spojující událost a vybere je za následující uzly pro provádění procesu.

### Intermediate Catch Event
Přechodná událost ze které vystupuje sekvenční tok, který je na ní odkloněn dle zvolené definice události.
Systém aktuálně podporuje jen jeden typ přechodné události a to konkrétně přechodnou výstupní spojující událost.
Jedná se o událost, která zachytí sekvenční tok, jenž je na ní přehozen přechodnou vstupní spojující událost.

Ukázka XML:
```xml
<!-- Přechodná výstupní spojující událost -->
<intermediateCatchEvent id="id" name="string">
	<linkEventDefinition />
</intermediateCatchEvent>
```
Atributy:
- `id`
  - Unikátní identifikátor v rámci souboru BPMN.
- `name`
  - Název události.
  - Hraje roli při vyhledávání výstupních uzlů k přesměrování sekvenčního toku.
- `linkEventDefinition` Přechodná výstupní spojující událost
  - Tvoří výstupní konec pro uzly typu Přechodná vstupní spojující událost, které na něj přehazují sekvenční tok.

Zásuvný modul s implementací uzlu:

Výchozí implementace pro přechodnou výstupní spojující událost se nazývá `LinkIntermediateCatchEvent` a obstarává ji zásuvný modul, jehož zdrojové kódy se nalézají v souboru `src/bpmnRunnerPlugins/linkIntermediateEvent.ts`.
Pro výběr následujících uzlů jsou podporovány jen jednoduché sekvenční toky (tj. mimo výchozí a podmíněné).

### Parallel Gateway
Paralelní brána je uzlem sloužícím k rozvětvení či sloučení sekvenčního toku.
Při rozdělení dochází k paralelnímu vytvoření následujících uzlů.
Při slučování dochází k synchronizaci sekvenčních toků před pokračováním sekvenčního toku.

Ukázka XML:
```xml
<parallelGateway id="id" name="string"></parallelGateway>
```
Atributy:
- `id`
  - Unikátní identifikátor v rámci souboru BPMN.
- `name`
  - Název brány.

Zásuvný modul s implementací uzlu:

Výchozí implementace pro paralelní bránu se nazývá `ParallelGateway` a obstarává ji zásuvný modul, jehož zdrojové kódy se nalézají v souboru `src/bpmnRunnerPlugins/gateway.ts`.
Během první fáze vykonává slučování sekvenčních toků.
Čeká dokud nedojde k jeho aktivaci prostřednictvím všech příchozích sekvenčních toků.
Až bude evidován příchod zkrze všechny příchozí sekvenční toky, tak započne zpracování uzlu implementací.
Implementace během zpracování vybere následující uzly pro vytvoření.
Vybírá všechny uzly, ke kterým vedou výstupní sekvenční toky. 

### Inclusive Gateway
Inkluzivní brána umožňuje rozdělovat sekvenční tok na základně podmínek.
Při rozdělování sekvenčního toku jsou vyhodnoceny výrazy tvořící podmínky sekvenčních toků a všechny pozitivně vyhodnocené sekvenční toky budou provedeny.
V případě neexistence pozitivně vyhodnocených sekvenčních toků bude proveden výchozí sekvenční tok.
Současná verze systému nepodporuje slučování více sekvenčních toků skrze inkluzivní bránu.

Ukázka XML:
```xml
<inclusiveGateway id="id" name="string" default="id_sequenceFlow">
</inclusiveGateway>
```
Atributy:
- `id`
  - Unikátní identifikátor v rámci souboru BPMN.
- `name`
  - Název brány.
- `default`
  - Reference na sekvenční tok, který nastane po neúspěšném vyhodnocení všech předchozích podmíněných sekvenčních toků.

Zásuvný modul s implementací uzlu:

Výchozí implementace pro inkluzivní bránu se nazývá `InclusiveGateway` a obstarává ji zásuvný modul, jehož zdrojové kódy se nalézají v souboru `src/bpmnRunnerPlugins/gateway.ts`.
Implementace vyhodnotí výrazy pro všechny odchozí podmíněné sekvenční toky a následně vybere cílové uzly všech sekvenčních toků s pozitivním výsledkem.
Prázdný nebo neexistující výraz je implementací vyhodnocen jako pozitivní.
Pokud neexistuje žádný sekvenční tok s pozitivním výsledkem, tak budou vybrány cílové uzly výchozích sekvenčních toků.
 
### Exclusive Gateway
Exkluzivní brána umožňuje řídit sekvenční tok na základně podmínek a vybírá jen jeden sekvenční tok.
Při rozhodování o výběru následujícího uzlu dochází k vyhodnocení vyrazů obsažených v podmíněných sekvenčních tocích.
Odchozí podmíněné sekvenční toky jsou vyhodnocovány v pořadí, v jakém byli definovány při modelování procesu.
Je zvolen první pozitivně vyhodnocený sekvenční tok.
Současná verze systému nepodporuje slučování více sekvenčních toků skrze exkluzivní bránu.

Ukázka XML:
```xml
<exclusiveGateway id="id" name="string" default="id_sequenceFlow">
</exclusiveGateway>
```
Atributy:
- `id`
  - Unikátní identifikátor v rámci souboru BPMN.
- `name`
  - Název brány.
- `default`
  - Reference na sekvenční tok, který nastane po neúspěšném vyhodnocení všech předchozích podmíněných sekvenčních toků.

Zásuvný modul s implementací uzlu:

Výchozí implementace pro exkluzivní bránu se nazývá `ExclusiveGateway` a obstarává ji zásuvný modul, jehož zdrojové kódy se nalézají v souboru `src/bpmnRunnerPlugins/gateway.ts`.
Implementace vyhodnocuje postupně výrazy podmíněných sekvenčních toků v pořadí, ve kterém byly definovány.
Vyhodnocování výrazů končí po prvním pozitivně vyhodnoceném vyrazu.
Cílový uzle patřící sekvenčnímu toku, keterý obsahuje pozitivně vyhodnocený výraz, je vybrán pro pokračování v provádění procesu.
Prázdný nebo neexistující výraz je implementací vyhodnocen jako pozitivní.
Pokud neexistuje žádný sekvenční tok s pozitivním výsledkem, tak budou vybrány cílové uzly výchozích sekvenčních toků.


## Kontext dostupný uzlům při zpracování
Položky kontextu jsou dostupné během provádění instancí uzlů a mnohé elementy umožňují jejich použití.
V současnosti je lze využívat ve skriptech pro ScriptTask nebo ve výrazech u podmíněných sekvenčních toků.

Obsah kontextu a význam jednotlivých položek:
- `$GLOBAL`: JsonMap,
  - Data uložená v registru dat v rámci instance procesu.
  - K těmto datům mají přístup všechny instance uzlů patřící pod stejnou instanci procesu.
  - Data jsou určená jen ke čtení.
  - Zápis dat do globálního registru dat je možný jen skrze funkce poskytující tuto službu.
- `$LOCAL`: JsonMap,
  - Data uložená v registru dat v rámci instance uzlu.
  - K těmto datům má přístup pouze instance uzlu, které daný lokální registr dat patří.
  - Data jsou určená jen ke čtení.
  - Zápis dat do lokálního registru dat je možný jen skrze funkce poskytující tuto službu.
- `$INCOMING`: RunContextIncoming[]
  - Obsahuje informace o příchozích sekvenčních tocích.
  - Obsah je určen jen ke čtení a změny v nich se neprojeví v systému.
  - `id`: Number
    - Identifikátor šablony sekvenčního toku  
  - `came`: Boolean
    - Příznak, zda přes tento sekvenční tok došlo k přechodu na instanci uzlu.
  - `flag`: String
    - Pomocné označení pro rozpoznaní speciálních sekvenčních toků.
    - Např. pro rozpoznání výchozích sekvenčních toků u elementů typu brána.
- `$OUTGOING`: RunContextOutgoing[]
  - Obsahuje informace o odchozích sekvenčních tocích.
  - Obsah je určen jen ke čtení a změny v nich se neprojeví v systému.
  - `id`: Number
    - Identifikátor šablony uzlu, ke kterému vede sekvenční tok.
  - `expression`: String
    - Jedná se o logický výraz.
    - Může být použit při rozhodování o budoucím sekvenčním toku.
  - `flag`: String
    - Pomocné označení pro rozpoznaní speciálních sekvenčních toků.
    - Např. pro rozpoznání výchozích sekvenčních toků u elementů typu brána.
- `$INPUT`: RunContextInput,
  - Obsahem jsou objekty představující datové objekty nesoucí vstupní data.
  - K objektům je možné přistoupit prostřednictvím názvu datového objektu.
  - Např. Datový objekt s názvem `Vaše Pošta` je dostupný v `$INPUT['Vaše Pošta']`.
  - Datové objekty a jejich data jsou určena jen ke čtení a změna v nich se neprojeví v systému.
- `$OUTPUT`: RunContextOutput
  - Obsahem jsou objekty představující datové objekty nesoucí výstupní data.
  - K objektům je možné přistupovat prostřednictvím názvu datového objektu.
  - Pozor! Změny provedené ve zde přítomných datových objektech se projeví v systému.
  - Po dokončení instance uzlu jsou data obsažená v datových objektech uložena. 
- `$SELF`: RunContextNodeElement
  - Část informací o aktuální instanci uzlu a k ní patřící šabloně uzlu.
  - `id`: Number
    - Identifikátor instance uzlu.
  - `startDateTime`: Date
    - Datum a čas vytvoření instance uzlu.
  - `endDateTime`: Date
    - Datum a čas ukončení instance uzlu.
  - `name`: String
    - Název šablony uzlu.
  - `bpmnId`: String
    - Identifikátor šablony uzlu, který byl načten ze souboru BPMN.
  - `implementation`: String
    - Název implementace, která obstarává zpracování uzlu.
- `$NODES`: RunContextProvideNodes[]
  - Obsahuje seznam šablon uzlů, o který si požádala implementace zpracovávající instanci uzlu.
  - `id`: Number
    - Identifikátor šablony uzlu.
  - `bpmnId`: String
    - Identifikátor šablony uzlu, který byl načten ze souboru BPMN.
  - `name`: String
    - Název šablony uzlu.
  - `implementation`: String
    - Název implementace, která bude obstarávat zpracování uzlu.
  - `data`: JsonMap
    - Výchozí data, která budou obsahem lokálního registru instancí vycházejících ze šablony uzlu.

## Ukázky použití skriptů a výrazů

Následující ukázka zobrazuje různé možnosti využití výrazu v podmíněných sekvenčních tocích:
```xml
<dataObject id="qwert0" name="Moje data">
	<extensionElements>
		<mwe:json>
			{ "A": 101, "B": 1 }
		</mwe:json>
	</extensionElements>
</dataObject>
<!-- Jednořádková varianta, která nebere v úvahu možné problémy s existencí datového objektu. -->
<sequenceFlow id="qwert3" sourceRef="qwert1" targetRef="qwert2">
	<conditionExpression xsi:type="bpmn2:tFormalExpression">
		$INPUT['Moje data'].A > 10
	</conditionExpression>
</sequenceFlow>
<!-- Jednořádková bezpečná varianta 1, která počítá i s možnou neexistencí datového objektu. -->
<sequenceFlow id="qwert4" sourceRef="qwert1" targetRef="qwert2">
	<conditionExpression xsi:type="bpmn2:tFormalExpression">
		$INPUT && $INPUT['Moje data'] && ($INPUT['Moje data'].A > 10)
	</conditionExpression>
</sequenceFlow>
<!-- Jednořádková bezpečná varianta 2, která počítá i s možnou neexistencí datového objektu. -->
<sequenceFlow id="qwert5" sourceRef="qwert1" targetRef="qwert2">
	<conditionExpression xsi:type="bpmn2:tFormalExpression">
		try { $INPUT['Moje data'].A > 10 } catch { false }
	</conditionExpression>
</sequenceFlow>
<!-- 
  Víceřádková varianta, která nebere v úvahu možné problémy s existencí datového objektu.
  Vyhodnocená hodnota posledního prováděného řádku skriptu určuje pravdivostní hodnotu výrazu. 
-->
<sequenceFlow id="qwert6" sourceRef="qwert1" targetRef="qwert2">
	<conditionExpression xsi:type="bpmn2:tFormalExpression">
		let data = $INPUT['Moje data']
    data.A > 10 // => (true | false)
	</conditionExpression>
</sequenceFlow>
<!-- 
  Víceřádková bezpečná varianta, která počítá i s možnou neexistencí datového objektu. 
  Vyhodnocená hodnota posledního prováděného řádku skriptu určuje pravdivostní hodnotu výrazu. 
-->
<sequenceFlow id="qwert7" sourceRef="qwert1" targetRef="qwert2">
	<conditionExpression xsi:type="bpmn2:tFormalExpression">
		try {
      let data = $INPUT['Moje data'];
      data.A > 10 // => (true | false)
    } catch { 
      false; // => false
    }
	</conditionExpression>
</sequenceFlow>
<!-- ... -->
```

Ukázka využití ScriptTask ke generování formuláře pro UserTask:
```xml
<!-- Prázdný datový objekt pro uložení formuláře -->
<dataObject id="asd1" name="Formulář Alfa"/>
<!-- SkriptTask pro pomocné generovaní formulře pro UserTask. -->
<scriptTask id="asd2" name="Generovani formuláře Alfa" scriptFormat="js">
	<dataOutputAssociation>
		<targetRef>asd1</targetRef>
	</dataOutputAssociation>
	<script>
		// Vytvoření objektu formuláře.
		let formA = {
    		Trojúhelník: { 
				type: 'select', 
				possibilities: ['obecný', 'pravoúhlý', 'rovnoramenný', 'rovnostranný'],
				hints: 'Vyber typ svého trojúhelníku.',
			},
    		'Strana a': { type: 'number', hints: 'Velikost strany a.' },
    		'Strana b': { type: 'number', hints: 'Velikost strany b.' },
    		'Strana c': { type: 'number', hints: 'Velikost strany c.' },
  		}
		// Uložení formuláře do datového objektu s názvem 'Formulář Alfa'.
		$OUTPUT['Formulář Alfa'] = { $form: formA }
	</script>
</scriptTask>
<!-- ... -->
<userTask id="asd3" name="Vyplnění rozměrů trojúhelníku">
	<dataInputAssociation>
		<sourceRef>asd1</sourceRef>
	</dataInputAssociation>
</userTask>
<!-- ... -->
```

