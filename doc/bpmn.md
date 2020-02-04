
# BPMN

## Jmenné prostory (NameSpaces)
- __common_alias__ - `NS_URI`
  - O elementech jmenného prostoru.
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

## Elementy BPMN
Strom elementů:
- extensionElements
  - > Může býti kdekoliv a obsahuje custom elementy.
- definitions (xmlns:, ...)
  - process (id, name, isExecutable, processType, mwe:versionType, mwe:version)
    - task (id, name)
      - incoming
      - outgoing
      - property
      - dataOutputAssociation
        - sourceRef
        - targetRef
      - dataInputAssociation
        - sourceRef
        - targetRef
    - scriptTask (id, name, scriptFormat)
      - script
    - manualTask
      - ...
    - serviceTask (id, name, mwe:implementation)
      - ...
    - userTask
      - ...
    - sendTask
      - ...
    - startEvent (id, name, eventDefinitionRefs)
      - outgoing
      - conditionalEventDefinition
        - condition
      - timerEventDefinition
      - linkEventDefinition
      - messageEventDefinition
      - errorEventDefinition
      - signalEventDefinition
	- intermediateThrowEvent
      - outgoing
    	- ...
  	- intermediateCatchEvent
      - incoming
    	- ...
    - endEvent (id, name, eventDefinitionRefs)
      - incoming
      - linkEventDefinition
      - messageEventDefinition
      - errorEventDefinition
      - signalEventDefinition
    - sequenceFlow (id, name, sourceRef, targetRef)
      - Expression (id, name)
      - FormalExpression (id, name, language)
      - conditionExpression (id, name, xsi:type)
    - parallelGateway (id, name, gatewayDirections)
      - incoming 
      - outgoing 
	- exclusiveGateway (id, name, gatewayDirections)
      - incoming
      - outgoing
	- inclusiveGateway (id, name, gatewayDirections)
      - incoming
      - outgoing
    - dataObject  (id, name, mwe:strict)
      - extensionElements
        - mwe:json
    - dataObjectReference (id, name, dataObjectRef)
    - laneSet
      - lane
        - flowNodeRef
    - textAnnotation
      - text
    - association
  - collaboration
    - participant

### definitions
- __NS:__ bpmn
- Slouží k definování jmenných prostorů a obalení diagramu BPM.
```xml
<definitions xmlns:foo="uri" ...>
	...
</definitions>
```

### process 
- `mwe:versionType`
  - Formát verze.
  - Platné: `number` (Celé číslo), `semver` (Dle definice semver. Major.Minor.Path )
- `mwe:version`
  - Verze procesu.
  - Důležité při stejném `id`. 
```xml
<process id="id" name="string" isExecutable="bool" processType="none | private | public" mwe:versionType="number | semver" mwe:version="number | semver">
	...
</process>
```

### dataObject
- Datový objekt pro uložení dat.
- např. Výsledek skriptu, výsledek služby, data vyplněná uživatelem.
- Zatím volím JSON:
  - Možné snadno uložit v db.
  - Rychlý převod dat JSON na objekt JS.
  - `mwe:strict`
    - Datový typ Boolean.
    - Výchozí hodnota `false`.
    - Nelze odebírat či přidávat nové položky jen měnit jejich hodnotu.
    - Hodnota `null` lze zněnit na jakýkoliv typ hodnoty. 
```xml
<dataObject id="id" name="string"/>

<dataObject id="id" name="string" mwe:strict="bool">
	<extensionElements>
		<mwe:json>
		{ "json": "with", "data": 1 }
		</mwe:json>
	</extensionElements>
</dataObject>
```
### dataObjectReference 
```xml
<dataObjectReference id="id" name="string" dataObjectRef="id_dataObject"/>
```

### task 
- Abstraktní úloha sloužící pro ladění.
- Ve výchozím stavu se chová jako `scriptTask` bez skriptu.
```xml
<task id="id" name="string" ...>
	...
</task>
```
### serviceTask 
- Úloha spouští interní program plnící nějakou službu.
- `mwe:implementation`
  - Název služby v systému.
  - Pokud služba není nalezena v systému je vyhozena chyba při spuštění.
  - Služba může přijímat data (Obdrží jen kopii dat z dataObject.).
  - Služba může vracet data (Pozor! Před uložením data budou serializována do JSON.)
```xml
<serviceTask id="id" name="string" mwe:implementation="task_implementation_name">
	...
</serviceTask>
```
### scriptTask 
- Úloha spouštící v ní definovaný skript.
- Výchozí chování je dobře dělat nic.
- Skript může přijímat data (Obdrží jen kopii dat z dataObject.).
- Skript může vracet data.
```xml
<scriptTask id="id" name="string" scriptFormat="js | javascript">
	<script>
		Some code ...
	</script>
</scriptTask>
```

### incoming
- Vstupující tok.
```xml
<incoming id="id">
	id_sequenceFlow
</incoming>
```
### outgoing
- Vystupující tok.
```xml
<outgoing id="id">
	id_sequenceFlow
</outgoing>
```
### property
```xml
<property id="id" name="string" />
```
### dataInputAssociation
```xml
<dataInputAssociation id="id">
	...
</dataInputAssociation>
```
### dataOutputAssociation
```xml
<dataOutputAssociation id="id">
	...
</dataOutputAssociation>
```
### sourceRef
```xml
<sourceRef id="id">
	id_dataObject | id_task | id_property
</sourceRef>
```
### targetRef
```xml
<targetRef id="id">
	id_dataObject | id_task | id_property
</targetRef>
```

### startEvent 
```xml
<startEvent id="id" name="string">
	...
</startEvent>

<startEvent id="id" name="string" eventDefinitionRefs="Id_eventDefinitions">
	...
</startEvent>
```
### endEvent 
```xml
<endEvent id="id" name="string" eventDefinitionRefs="Id_eventDefinitions">
	...
</endEvent>
```
### sequenceFlow
```xml
<sequenceFlow id="id" name="string" sourceRef="id_taks | id_gateway | id_event" targetRef="id_taks | id_gateway | id_event" />

<sequenceFlow id="id" name="string" sourceRef="id_taks | id_gateway | id_event" targetRef="id_taks | id_gateway | id_event">
	<conditionExpression xsi:type="bpmn2:tFormalExpression">O===Z</conditionExpression>
</sequenceFlow>
```
