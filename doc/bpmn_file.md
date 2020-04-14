
# Příloha A
# Jak vytvořit BPMN soubor

## Uvodni seznameni

Prozatím existuje jedíným způsobem, jak vytvořit/nahrát proces do MWEServeru.
MWEServer je schopen zpracovat textový soubor obsahující definici procesu dle specifikace BPMN.
Pro vytváření souborů BPMN určených k testování MWEServeru byl využíván jeden z ukázkouvých příkladů používající balíček [bpmn-js](https://github.com/bpmn-io/bpmn-js) a [bpmn-js-properties-panel](https://github.com/bpmn-io/bpmn-js-properties-panel).
Konkrétně se jedná o jeden z ukázkových příkladů [bpmn-js-examples](https://github.com/bpmn-io/bpmn-js-examples/tree/master/properties-panel), který je volně dostupný na webu GitHub.
Tento nástroj byl zprovozněn a to s panelem určeným původně pro vytváření souborů BPMN pro nástroje od společnosti Camunda.
V současné době je dostupný na mém osobním serveru na URL [bpmnio.mwarcz.cz](http://bpmnio.mwarcz.cz).
Většinu potřebných úkonů potřebných k modelování potřebného procesu lze v tomto nástroji vykonot.
Vyjímku činí pouze elementy a atributy spadající pod jmenný prostor `http://www.mwarcz.cz/mwe/bpmn/` (Dále označován jen jako jmenný prostor mwe.). 

## Omezení
Při modelování je možné použít veškeré elementy, které jsou vyjmenovány a popsány v kapitole __Plně podporované elementy__.
MWEServer v aktuální verzi nepodporuje podprocesy (SubProcess) a je schopen zpracovat jen základní procesy.
Pro základní procesy platí dle specifikace BPMN, že v jednom bazénu (Pool) může být jen jeden základní proces. 
Dále MWEServer nepodporuje zasílání zpráv mezi základními procesy, které je možné vymodelovat v nástroji.
Základní proces lze vymodelovat a nahrát na MWEServer i když není umístěn do žádného bazénu.

## Modelování a manuální úpravy
Modelování v nástroji je dosti intuitivní. 
Po vložení elementu a jeho označení je možné změnit jeho druh za pomocí ikony klíče.
(Např. element Task lze změnit na ScriptTask, ManualTask, aj.)
Přidávání a uprava atributů je možné pomocí bočního panelu.
Po označení elementu se v tomto panelu ukáže sada vlastností.
Podporované vlastnosti/atributy naleznete popsány v kapitole __Plně podporované elementy__ u jednotlivých elementů.
Mezi nejdůležitější patří následující:
- Element Lane
  - Atribut Name: Určuje název skupiny, která má vliv na některé elementy v něm umístěné.
- Element ScriptTask
  - Script: Zde umístěný skript bude spouštěn při provádění uzlu.
- Element SequenceFlow.ConditionExpression
  - Expression: Podminka zde přítomná ovlivňuje sekvenční tok procesu.
- Element DataObject, DataObjectReference
  - Atribut Name: Ovlivňuje pod jakým názvem budou data dostupná pro uzly či podmíněné sekvenční toky.

Výsledný vymodelovaný proces/procesy lze stáhnout ve formě souboru BPMN a SVG. 

Jak již bylo zmíněno dříve, tak některé důležité elementy a atributy ze jmenného prostoru mwe je nutné přidat manuálně do staženého souboru BPMN vygenerovaného nástrojem.
Nejdůležitější je úprava elementu DataObject.
Jmenný prostor mwe přidává možnost vložit do datového objektu výchozí data.
Pro použití jmenného prostoru mwe je nutné jej přidat do jmenných prostorů definovaných v kořenovém elementu `definitions`, tak jako je možné vidět na následujícím příkladu. 
```xml
<bpmn2:definitions ...
	xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" 
	xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" 
	xmlns:mwe="http://www.mwarcz.cz/mwe/bpmn/"
	... > ... </bpmn2:definitions>
```
Další ukázka kódu ukazuje přidání podelementů do elementu datového objektu, který přidává do objektu výchozí data. 
V datovém objektu je hledán element `json` z jmenného prostoru mwe, který obsahuje text. 
Jak název elementu napovídá, tak obsahem je text ve formátu JSON.
(MWEServer v aktuální verzi vyžaduje, aby obsah elementu json začínal objektem.) 
```xml
<bpmn2:dataObject id="DataObject_0xhy3ix">
	<bpmn2:extensionElements>
		<mwe:json>
		{ "text": "lorem", "isIt": true }
		</mwe:json>
	</bpmn2:extensionElements>
</bpmn2:dataObject>
```

## Závěr
Před samotným modelováním procesů pro MWEServer je doporučeno nastudovat minimálně kapitolu __Plně podporované elementy__.