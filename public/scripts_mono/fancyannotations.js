'use strict';


// Verbindung zum Server aufbauen
let socket = io.connect();

// KLASSEN

// PROBLEM: RANGES / NODES LASSEN SICH NICHT ÜBER JSON WEGSPEICHERN

class Comment {
    constructor({
        author = false,
        commentBody = false,
        rangeData = false
    } = {}) {
        this.author = author;
        this.commentBody = commentBody;
        this.rangeData = rangeData;
    }

    get commentID() {
        //TODO
    }
}

class User {
    constructor({
        id = false,
        alias = 'anonymous',
        colorCode = '#',
    }) {
        this.id = id;
        this.alias = alias;
        this.colorCode = colorCode;
    }

    get userSocket() {
        //TODO
    }
}

// INTERFACE ELEMENTE

let textWrapper = document.querySelector('#text-wrapper');

// VARIABLEN

let currentUser = new User({
    id: 1,
    alias: 'Alena',
    colorCode: 'red'
})

// FUNKTIONEN

// Init-Stuff

const init = () => {
    // Alle Absätze im Text selektieren
    let paragraphs = Array.from(textWrapper.querySelectorAll('*'));

    // Jedem eine ID geben, um hinterher die Kommentar-Range rekonstruieren zu können
    paragraphs.forEach((paragraph, index) => {
        paragraph.id = `elem-${index + 1}`;
    })
}

// Nodes am Anfang und Ende einer Range einfügen
const wrapRange = (range, nodeStart, nodeEnd) => {

    //Diese Methode bringt Range mit, am Ende einfügen gibt es leider nicht
    range.insertNode(nodeStart);

    // neue Range anlegen
    let secondRange = new Range();

    // Start der neuen Range auf das Ende der übergebenen Range setzen            
    secondRange.setStart(range.endContainer, range.endOffset);

    // Dann die Node für das Ende einfügen
    secondRange.insertNode(nodeEnd);

    // Helfer-Range wieder detatchen für die Performance
    secondRange.detach();
}



// Kommentare am Anfang und Ende einer Node einfügen
const wrapRangeInComments = (range, contentStartComment, contentEndComment = contentStartComment) => {

    //Kommentare erzeugen
    let startComment = document.createComment(contentStartComment);
    let endComment = document.createComment(contentEndComment);

    // Kommentare an Anfang und Ende der Range einfügen
    wrapRange(range, startComment, endComment);
}



// Wenn eine Range über mehrere Container geht, alle dazwischenliegenden Nodes auswählen
const getElementsWithinRange = (range) => {
    let nodeArray = [];

    //Nur wenn Range auch wirklich über mehrere Container geht
    if (range.startContainer != range.endContainer) {

        //Nimm alle Kindelemente des commonAncestorContainers
        Array.from(range.commonAncestorContainer.children).forEach(child => {
            // und schreib nur die in das Array, die sich mit der Range überschneiden
            if (range.intersectsNode(child)) nodeArray.push(child);
        })
    }

    return nodeArray;

}

// Text Nodes aus einem Element heraussuchen
const getTextNodesFor = (el) => {
    let currentNode,
        textNodes = [],
        walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);

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
            if (range.intersectsNode(textNode)) textNodes.push(textNode);
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

    // Ist die erste oder die zweite Hälfte der Textnode in der Range?
    let offset = (range.isPointInRange(textNode, 1)) ? range.endOffset : range.startOffset;
    return {
        inRange: textNode === range.startContainer ? textNode.textContent.substring(offset) : textNode.textContent.substring(0, offset),
        outOfRange: textNode === range.startContainer ? textNode.textContent.substring(0, offset) : textNode.textContent.substring(offset)
    }
}



// JEDEN BUCHSTABEN IN SPANS PACKEN

// String in getaggten String umwandeln
const wrapEachLetter = (string) => {

    //Jedes Zeichen aus der Textnode vereinzeln
    let letters = string.split('');

    //Jedes Zeichen in ein Tag packen
    letters.forEach((letter, index) => {

        letters[index] = `<strong>${letter}</strong>`;

    })

    // Neuen String initialisieren
    let spannedMotherfucker = "";

    // Jeden Buchstaben an den String anhängen
    for (let i = 0; i < letters.length; i++) {
        spannedMotherfucker += letters[i];
    }

    return spannedMotherfucker;

}

const spanTheFuckOutOf = (range) => {
    // TODO: FUNKTIONIERT NOCH NICHT, WENN IM ELTERNCONTAINER SCHON MARKUP ENTHALTEN IST
    // TODO: FUNKTIONIERT NOCH NICHT, WENN DIE RANGE INNERHALB EINES CONTAINERS IST

    // Die Textnodes raussuchen
    let textNodes = getTextNodesWithinRange(range);



    textNodes.forEach(textNode => {

        let newContent;

        if (isPartiallyOutOfRange(range, textNode)) { //Wenn nur Teil-Textnode in der Range ist

            console.log(splitTextNode(range, textNode));


            // setzt sich der neue Inhalt je nachdem, ob es Start- oder Endcontainer ist aus den entsprechenden Teilstücken zusammen
            newContent = (textNode === range.startContainer)
                ? splitTextNode(range, textNode).outOfRange + wrapEachLetter(splitTextNode(range, textNode).inRange)
                : wrapEachLetter(splitTextNode(range, textNode).inRange) + splitTextNode(range, textNode).outOfRange;


        } else {
            // Sonst halt das ganze Element einpacken
            newContent = wrapEachLetter(textNode.textContent);
        }

        //This does not work when there is any Markup in the parent Element prior to the function call
        textNode.parentElement.innerHTML = newContent;

    })
}

const saveComment = (commentBody, range) => {

    // Den Kommentar anlegen
    let comment = new Comment({
        author: currentUser,
        commentBody,
        rangeData: getRangeData(range)
    })
    console.log(comment, JSON.stringify(comment));
    // und an den Server schicken
    socket.emit('postComment', JSON.stringify(comment));
}

const showCommentInput = (x, y, selectedText) => {
    // Das umschließende Element zur Gruppierung
    let inputWrapper = document.createElement('div');
    inputWrapper.id = 'postComment'

    // Die Textarea
    let commentInput = document.createElement('textarea');
    commentInput.id = 'currentComment';

    // Der Button zum Abschicken
    let btn = document.createElement('button');
    btn.innerHTML = 'Kommentieren'
    //Event-Listener
    btn.addEventListener('click', e => {

        // Wenn der Inhalt der Textarea nicht leer ist
        if (document.querySelector('#currentComment').value != '') {
            // schick den Kommentar zum Abspeichern an den Server
            saveComment(document.querySelector('#currentComment').value, selectedText);
        } 
        // In jedem Fall das Eingabe-Element wieder entfernen
        document.querySelector('#postComment').remove();
    })

    // Element zusammenbauen 
    inputWrapper.appendChild(commentInput);
    inputWrapper.appendChild(btn);

    // Element die Koordinaten des Mouseevents geben, das die Funktion ausgelöst hat, um die Position festzulegen
    inputWrapper.style.left = `${x}px`;
    inputWrapper.style.top = `${y}px`;

    // Element einhängen
    textWrapper.appendChild(inputWrapper);
}

// Die Daten zur Rekonstruktion einer Range für einen Kommentar wegspeichern
const getRangeData = (range) => {

    let rangeData = {
        startContainer: range.startContainer.parentNode.id,
        startOffset: range.startOffset,
        endContainer: range.endContainer.parentNode.id,
        endOffset: range.endOffset,
        previousStartSibling: range.startContainer.previousSibling ? range.startContainer.previousSibling.id : null,
        previousEndSibling: range.endContainer.previousSibling ? range.endContainer.previousSibling.id : null
    };

    return rangeData;
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
    // Wiederfinden des Startpunktes
    let parentOfEndContainer = document.querySelector(`#${comment.rangeData.endContainer}`);
    // Überprüfung, ob der Endcontainer vorhergehende Geschwisterelemente hat
    if (comment.rangeData.previousEndSibling == null) {
        //Wenn nicht, nimm die erste Textnode im Container und darin den Offset
        commentRange.setEnd(parentOfEndContainer.firstChild, comment.rangeData.endOffset);
    } else {
        // Sonst nimm die Textnode nach dem previous Sibling als EndContainer
        let endNode = document.querySelector(`#${comment.rangeData.previousEndSibling}`).nextSibling;

        commentRange.setEnd(endNode, comment.rangeData.endOffset);
    }

    return commentRange;

}


// SELECTION EVENT LISTENER
document.addEventListener('selectstart', e => {
    // Weil ich keine Lust hatte, mich mit den tausend Events rumzuschlagen, die selectionchange feuert, ist der mouseup in den selectstart Event geschachtelt
    document.addEventListener('mouseup', evt => {

        let selection = window.getSelection();

        //Nur weiter machen, wenn bei der Selektion Start- und Endpunkt verschieden sind    
        if (!selection.isCollapsed) {

            // Range aus Selection holen
            let range = selection.getRangeAt(0);

            let rangeData = {
                startContainer: range.startContainer.parentNode.id,
                startOffset: range.startOffset,
                endContainer: range.endContainer.parentNode.id,
                endOffset: range.endOffset,
                previousStartSibling: range.startContainer.previousSibling ? range.startContainer.previousSibling.id : null,
                previousEndSibling: range.endContainer.previousSibling ? range.endContainer.previousSibling.id : null
            };

            console.log(rangeData);
            

            let testComment = new Comment ({
                author: currentUser,
                commentBody: 'Testkommentar',
                rangeData
            });

            let testRange = reconstructRangeFromCommentData(testComment);
            wrapRangeInComments(testRange, testComment.commentBody);

            selection.empty();
        }

    })

})
/*
let selectionFired = 0;
document.addEventListener('selectionchange', e => {

    // Doof
    let commentId = 'c1';

    if (selectionFired == 0) {
        selectionFired  = 1;
        // Logik

        let selection = window.getSelection();

        let range = selection.getRangeAt(0);
        console.log(range);

        spanTheFuckOutOf(range);

        //selection.anchorNode.previousSibling.classList.add('prevSib-' + commentId);


        

        console.log(data);
        // Timeout
        window.setTimeout(() => {
            selectionFired  = 0;
        }, 1000);

    }

});
*/
// WEBSOCKET EVENTLISTENER

socket.on('commentPosted', data => {
    console.log(data);

})

// init

init();

