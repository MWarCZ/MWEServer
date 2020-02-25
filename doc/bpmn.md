
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
- [definitions](#definitions) (xmlns:, ...)
  - [process](#process) (id, name, isExecutable, processType, mwe:versionType, mwe:version)
    - [task](#task) (id, name)
      - [incoming](#incoming)
      - [outgoing](#outgoing)
      - [property](#property)
      - [dataOutputAssociation](#dataOutputAssociation)
        - [sourceRef](#sourceRef)
        - [targetRef](#targetRef)
      - [dataInputAssociation](#dataInputAssociation)
        - [sourceRef](#sourceRef)
        - [targetRef](#targetRef)
    - [scriptTask](#scriptTask) (id, name, scriptFormat)
      - script
    - manualTask
      - ...
    - [serviceTask](#serviceTask) (id, name, mwe:implementation)
      - ...
    - userTask
      - ...
    - sendTask
      - ...
    - [startEvent](#startEvent) (id, name, eventDefinitionRefs)
      - [outgoing](#outgoing)
      - [conditionalEventDefinition](#conditionalEventDefinition)
        - condition
      - [timerEventDefinition](#timerEventDefinition)
      - [messageEventDefinition](#messageEventDefinition)
      - [signalEventDefinition](#signalEventDefinition)
	- [intermediateThrowEvent](#intermediateThrowEvent)
      - outgoing
    	- ...
  	- [intermediateCatchEvent](#intermediateCatchEvent)
      - incoming
    	- ...
    - [endEvent](#endEvent) (id, name, eventDefinitionRefs)
      - [incoming](#incoming)
      - [messageEventDefinition](#messageEventDefinition)
      - [errorEventDefinition](#errorEventDefinition)
      - [signalEventDefinition](#signalEventDefinition)
    - [sequenceFlow](#sequenceflow) (id, name, sourceRef, targetRef)
      - Expression (id, name)
      - FormalExpression (id, name, language)
      - conditionExpression (id, name, xsi:type)
    - [parallelGateway](#parallelGateway) (id, name, gatewayDirections)
      - [incoming](#incoming) 
      - [outgoing](#outgoing) 
	- [exclusiveGateway](#exclusiveGateway) (id, name, gatewayDirections, default)
      - [incoming](#incoming) 
      - [outgoing](#outgoing) 
	- [inclusiveGateway](#inclusiveGateway) (id, name, gatewayDirections, default)
      - [incoming](#incoming) 
      - [outgoing](#outgoing) 
    - [dataObject](#dataObject)  (id, name, mwe:strict)
      - extensionElements
        - mwe:json
    - [dataObjectReference](#dataObjectReference) (id, name, dataObjectRef)
    - [laneSet](#laneSet)
      - lane
        - flowNodeRef
    - textAnnotation
      - text
    - association
  - collaboration
    - participant
    - messageFlow
  - eventDefinition
    - [timerEventDefinition](#timerEventDefinition)
    - [signalEventDefinition](#signalEventDefinition)
    - [messageEventDefinition](#messageEventDefinition)
    - [errorEventDefinition](#errorEventDefinition)
  - [signal](#signal)
  - [message](#message)
  - [error](#error)
  - escalation

### definitions
- __NS:__ bpmn
- Slouží k definování jmenných prostorů a obalení diagramu BPM.
```xml
<definitions xmlns:foo="uri" ...>
	<collaboration>...</collaboration>
	<process>...</procees>
	...
</definitions>
```

## process
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
- `mwe:implementation`
  - Název služby v systému.
  - V systemu můze byt vice implementaci, kdy kazda ma unikatni nazev.
  - Služba může přijímat data (Obdrží jen kopii dat z dataObject.).
  - Služba může vracet data (Pozor! Před uložením data budou serializována do JSON.)
```xml
<task id="id" name="string" mwe:implementation="task_implementation_name">
	<incoming id="id">
		id_sequenceFlow
	</incoming>
	<outgoing id="id">
		id_sequenceFlow
	</outgoing>
	<property id="id" name="string" />
	<dataInputAssociation id="id">
		<sourceRef>
			id_dataObject | id_task | id_property
		</sourceRef>
		<targetRef>
			id_dataObject | id_task | id_property
		</targetRef>
	</dataInputAssociation>
	<dataOutputAssociation id="id">
		<sourceRef>
			id_dataObject | id_task | id_property
		</sourceRef>
		<targetRef>
			id_dataObject | id_task | id_property
		</targetRef>
	</dataOutputAssociation>
</task>
```
### serviceTask 
- Úloha spouští interní program plnící nějakou službu.
- `mwe:implementation`
  - viz. task
```xml
<serviceTask id="id" name="string" mwe:implementation="task_implementation_name">
	...(viz. task)
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
	...(Viz. task)
</scriptTask>
```

#### incoming
- Vstupující tok.
```xml
<incoming id="id">
	id_sequenceFlow
</incoming>
```
#### outgoing
- Vystupující tok.
```xml
<outgoing id="id">
	id_sequenceFlow
</outgoing>
```
#### property
```xml
<property id="id" name="string" />
```
#### dataInputAssociation
```xml
<dataInputAssociation id="id">
	...
</dataInputAssociation>
```
#### dataOutputAssociation
```xml
<dataOutputAssociation id="id">
	...
</dataOutputAssociation>
```
#### sourceRef
```xml
<sourceRef id="id">
	id_dataObject | id_task | id_property
</sourceRef>
```
#### targetRef
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
	<outgoing id="id">
		id_sequenceFlow
	</outgoing>
	...EventDefinition
</startEvent>
```
### endEvent 
```xml
<endEvent id="id" name="string" eventDefinitionRefs="Id_eventDefinitions">
	<incoming id="id">
		id_sequenceFlow
	</incoming>
	...EventDefinition
</endEvent>
```
### intermediateThrowEvent
```xml
<intermediateThrowEvent id="id" name="string">
	<incoming>id_sequenceFlow</incoming>
	...EventDefinition
	<linkEventDefinition id="id" name="string" />
</intermediateThrowEvent>
```
### intermediateCatchEvent
```xml
<intermediateCatchEvent id="id" name="string">
	<outgoing>id_sequenceFlow</outgoing>
	...EventDefinition
	<linkEventDefinition id="id" name="string" />
</intermediateCatchEvent>
```
### sequenceFlow
```xml
<sequenceFlow id="id" name="string" sourceRef="id_taks | id_gateway | id_event" targetRef="id_taks | id_gateway | id_event" />

<sequenceFlow id="id" name="string" sourceRef="id_taks | id_gateway | id_event" targetRef="id_taks | id_gateway | id_event">
	<conditionExpression xsi:type="bpmn2:tFormalExpression">O===Z</conditionExpression>
</sequenceFlow>
```

### parallelGateway
```xml
<parallelGateway id="id" name="string">
	<incoming id="id">
		id_sequenceFlow
	</incoming>
	<outgoing id="id">
		id_sequenceFlow
	</outgoing>
</parallelGateway>
```
### exclusiveGateway
```xml
<exclusiveGateway id="id" name="string" default="id_sequenceFlow">
	<incoming id="id">
		id_sequenceFlow
	</incoming>
	<outgoing id="id">
		id_sequenceFlow
	</outgoing>
</exclusiveGateway>
```
### inclusiveGateway
```xml
<inclusiveGateway id="id" name="string" default="id_sequenceFlow">
	<incoming id="id">
		id_sequenceFlow
	</incoming>
	<outgoing id="id">
		id_sequenceFlow
	</outgoing>
</inclusiveGateway>
```
### laneSet
```xml
<laneSet id="id" name="string">
	<lane id="id" name="string">
		<flowNodeRef>
			id_taks | id_gateway | id_event | id_data
		</flowNodeRef>
	</lane>
</laneSet>
```

### EventDefinition 

#### timerEventDefinition
```xml
<timerEventDefinition id="id" />

<timerEventDefinition id="id">
	<timeDuration xsi:type="tFormalExpression">
		1000
	</timeDuration>
</timerEventDefinition>

<timerEventDefinition id="id">
	<timeDate xsi:type="tFormalExpression">
		1.2.2021
	</timeDate>
</timerEventDefinition>

<timerEventDefinition id="id">
	<timeCycle xsi:type="tFormalExpression">
		2000
	</timeCycle>
</timerEventDefinition>
```
#### signalEventDefinition
```xml
<signalEventDefinition id="id" signalRef="id_signal" />
```
#### messageEventDefinition
```xml
<messageEventDefinition id="id" messageRef="id_message" />
```
#### errorEventDefinition
```xml
<errorEventDefinition id="id" errorRef="id_error" />
```
#### conditionalEventDefinition
```xml
<conditionalEventDefinition id="id">
	<condition xsi:type="tFormalExpression">
		a=1
	</condition>
</conditionalEventDefinition>
```

## collaboration
```xml
<collaboration id="id">
	<participant id="id" name="string" processRef="id_process" />
</collaboration>
```

## signal
```xml
<signam id="id" name="string" />
```
## message
```xml
<message id="id" name="string" />
```
## error
```xml
<error id="id" name="string" errorCode="string" camunda:errorMessage="string"/>
```