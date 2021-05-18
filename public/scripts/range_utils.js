'use strict';

// Wenn eine Range über mehrere Container geht, alle dazwischenliegenden Nodes auswählen
const getElementsWithinRange = (range) => {
    let nodeArray = [];

    //Nur wenn Range auch wirklich über mehrere Container geht
    if (range.startContainer != range.endContainer) {

        if (range.startContainer.nodeName == '#text') nodeArray.push(range.startContainer.parentNode);
        //Nimm alle Kindelemente des commonAncestorContainers
        Array.from(range.commonAncestorContainer.querySelectorAll('[id^="elem-"]')).forEach(child => {
            // und schreib nur die in das Array, die sich mit der Range überschneiden
            if (range.intersectsNode(child) && !nodeArray.includes(child)) nodeArray.push(child);
        })
    } else {
        // Sonst gib hier nur den Parent des StartContainers zurück, der im Fall, dass die Range nur über einen Container geht, eine Textnode ist
        nodeArray.push(range.startContainer.parentNode);
    }

    return nodeArray;
}

// Text Nodes aus einem Element heraussuchen
const getTextNodesFor = (el) => {
    let currentNode;
    let textNodes = [];

    //TreeWalker Objekt geht das DOM durch und filtert Textnodes heraus
    let walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT,
        {
            acceptNode: function (node) {
                // und zwar nur die, die im Ursprungstext liegen und Inhalt haben
                if (node.parentNode.id.match('elem-') != null && ! /^\s*$/.test(node.data)) {
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        });


    while (currentNode = walker.nextNode()) textNodes.push(currentNode);

    return textNodes;
}


// Alle Textnodes innerhalb einer Range auswählen
const getTextNodesWithinRange = (range) => {
    let textNodes = [],
        parentElements = getElementsWithinRange(range); //Alle Elemente, die mit der Range intersecten
    parentElements.forEach(parentElement => {
        // Darin jeweils die TextNodes
        let auxillaryArray = getTextNodesFor(parentElement);
        //Die TextNodes, die intersecten, ins Array legen
        auxillaryArray.forEach(textNode => {
            if (range.intersectsNode(textNode) && !textNodes.includes(textNode)) textNodes.push(textNode);
        })
    })

    return textNodes;

}

// Prüfen, ob eine Textnode teilweise außerhalb der Range liegt
const isPartiallyOutOfRange = (range, textNode) => {
    // Die Länge der Textnode durchwandern
    for (let i = 0; i < textNode.length; i++) {

        if (!range.isPointInRange(textNode, i))
            // True zurückgeben, sobald ein Index außerhalb der Range liegt
            return true;
    }

    // Sonst false
    return false;
}

// Teiltextnodes heraussuchen, die in einer Range sind
const splitTextNode = (range, textNode) => {

    let content = textNode.textContent;

    return {
        inRange: range.isPointInRange(textNode, 0) ? content.substring(0, range.endOffset) : content.substring(range.startOffset),
        outOfRange: range.isPointInRange(textNode, 0) ? content.substring(range.endOffset) : content.substring(0, range.startOffset)
    }
}


// Text in einer Range hervorheben
const markText = (comment) => {
    // Range wiederherstellen
    let reconstructedRange = reconstructRangeFromCommentData(comment);
    console.log(reconstructedRange);
    console.log(comment);
    
    // Wenn Range über mehrere Container geht
    if (reconstructedRange.startContainer != reconstructedRange.endContainer) {
        
        // alle Textnodes aus der Range sammeln
        let textNodes = getTextNodesWithinRange(reconstructedRange);

        textNodes.forEach(textNode => {
            let span = document.createElement('span');
            span.classList.add('marked');
            span.style.borderBottom = `1px dashed ${comment.author.colorCode}`

            //Wenn nur Teil-Textnode in der Range ist
            if (isPartiallyOutOfRange(reconstructedRange, textNode)) {
                // Nimm den Teilstring, der in der Range ist
                let splitTextNodeObject = splitTextNode(reconstructedRange, textNode);
                let stringWithinRange = splitTextNodeObject.inRange;
                // und schreibe ihn in das span
                span.innerHTML = stringWithinRange;
                // Speichere den nicht enthaltenen Teilstring in einer Variablen
                let stringOutOfRange = splitTextNodeObject.outOfRange;

                // Wenn es der End-Container ist, füge das Span vor die reduzierte TextNode ein
                if (textNode == reconstructedRange.endContainer) {
                    // Reduziere die TextNode auf den Teilstring, der nicht in der Range ist
                    textNode.textContent = stringOutOfRange;
                    // und füge das Span davor ein
                    textNode.before(span);
                } else {
                    // sonst ersetze die Textnode mit dem Span
                    textNode.replaceWith(span);
                    // und füge den nicht enthaltenen String davor als Textnode ein
                    span.before(document.createTextNode(stringOutOfRange));
                }

            } else {
                // Sonst das ganze Element in dem Span einpacken
                span.innerHTML = textNode.textContent;
                textNode.replaceWith(span);
            }
        })
    } else {
        //TODO: Gibt es hier eine schlauere Lösung, als das Span zweimal anzulegen, ohne dass es in der Schleife oben sonst immer überschrieben wird?
        let span = document.createElement('span');
        span.classList.add('marked');
        span.style.borderBottom = `1px dashed ${comment.author.colorCode}`
        // Wenn Range innerhalb eines Containers ist, ist alles einfach :')))
        reconstructedRange.surroundContents(span);
    }
}

//Alle Markierungen im Text löschen
const unmarkText = () => {

    let markedSpans = Array.from(document.querySelectorAll('.marked'));
    if (markedSpans.length > 0) {
        markedSpans.forEach(span => {
            let textNode = document.createTextNode(span.innerText);
            span.replaceWith(textNode);
            textNode.parentNode.normalize();
        })
    }
}


// Die markierte Range aus dem Datenmodell des Kommentars rekonstruieren
const reconstructRangeFromCommentData = (comment) => {


    // Neue Range anlegen
    let commentRange = new Range();

    // Wiederfinden des Startpunktes
    let parentOfStartContainer = document.querySelector(`#${comment.rangeData.startContainer}`);
    // Überprüfung, ob der Startcontainer vorhergehende Geschwisterelemente hat


    if (comment.rangeData.previousStartSibling == null) {
        //Wenn nicht, nimm die erste Textnode im Container und darin den Offset
        commentRange.setStart(parentOfStartContainer.firstChild, comment.rangeData.startOffset);
    } else {
        // Sonst nimm die Textnode nach dem previous Sibling als StartContainer
        let startNode = document.querySelector(`#${comment.rangeData.previousStartSibling}`).nextSibling;
        commentRange.setStart(startNode, comment.rangeData.startOffset);
    }


    // Wiederfinden des Endpunktes
    let parentOfEndContainer = document.querySelector(`#${comment.rangeData.endContainer}`);
    // Überprüfung, ob der Endcontainer vorhergehende Geschwisterelemente hat
    if (comment.rangeData.previousEndSibling == null) {
        //Wenn nicht, nimm die erste Textnode im Container und darin den Offset
        /*
        Es gibt einen Bug, wenn man die Selektion bis ans Ende der Node zieht. Dann übersteigt der EndOffset die Länge der Node und das gibt Fehler.
        Um das Problem zu umgehen, fange ich den Fall in dem Ternary ab und setze das Ende händisch auf das Ende der Node
        */
        commentRange.setEnd(
            parentOfEndContainer.firstChild,
            (comment.rangeData.endOffset < parentOfEndContainer.firstChild.length)
                ? comment.rangeData.endOffset
                : parentOfEndContainer.firstChild.length
        );
    } else {
        // Sonst nimm die Textnode nach dem previous Sibling als EndContainer
        let endNode = document.querySelector(`#${comment.rangeData.previousEndSibling}`).nextSibling;

        commentRange.setEnd(endNode, (comment.rangeData.endOffset < endNode.length)
            ? comment.rangeData.endOffset
            : endNode.length
        );
    }


    return commentRange;

}
