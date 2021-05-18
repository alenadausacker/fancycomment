# Case Study: Kollaborative Textannotationen mit der Range API

Diese Node.js-Applikation zeigt eine Möglichkeit, HTML-Dokumente über eine Selektion kollaborativ zu annotieren.


## Installation


```
cd PROJEKTVERZEICHNIS
npm install 
```

## Ausführen der Node.js-Instanz

```
node index.js
```

Standardmäßig startet der Server auf localhost:8080.

## Funktionsumfang

In jeder Session kann der User seinen Namen und eine Farbe auswählen. Kommentare können per Markierung an eine spezifische Stelle im HTML-Textdokument gehangen werden. Die Anzahl an hinterlegten Kommentaren wird in einem Element neben dem jeweiligen Absatz angezeigt. Durch Klick auf dieses Element können die gespeicherten Kommentare aufgerufen und durchgeblättert werden. Die Textstelle, auf die sich der Kommentar bezieht, wird dabei in der Farbe des jeweiligen Users unterstrichen.

