'use strict';

const saveComment = (commentBody, range) => {

    // Den Kommentar anlegen
    let comment = new Comment({
        author: currentUser,
        commentBody,
        rangeData: getRangeData(range)
    })
    // und an den Server schicken
    socket.emit('postComment', JSON.stringify(comment));
}



// Die Daten zur Rekonstruktion einer Range für einen Kommentar wegspeichern
//Die Start- und Endcontainer sind immer Textnodes, darum speichere ich die Elternelemente und eventuelle Geschwisterelemente, um die Textnodes wieder zu finden
const getRangeData = (range) => {

    let rangeData = {
        startContainer: range.startContainer.parentNode.id, 
        startOffset: range.startOffset,
        endContainer: range.endContainer.parentNode.id,
        endOffset: range.endOffset,
        previousStartSibling: range.startContainer.previousSibling != null ? range.startContainer.previousSibling.id : null,
        previousEndSibling: range.endContainer.previousSibling != null ? range.endContainer.previousSibling.id : null
    };

    return rangeData;
}

const markCommentedParagraphs = (comments) => {
    // Alle Absätze selektieren
    let allParagraphs = textWrapper.querySelectorAll('p');

    //Durchgehen
    allParagraphs.forEach(paragraph => {
        // Zähl-Array anlegen
        let count = [];

        // Absatz-ID mit dem Startcontainer jedes Kommentars vergleichen und gegebenenfalls ins Zähl-Array legen
        comments.forEach((comment, index) => {
            // Die Oder-Abfrage fängt den Fall ab, dass die Range in einem HTML-Tag mit eigener ID *innerhalb* des Absatzes anfängt
            if (paragraph.id == comment.rangeData.startContainer || paragraph.id == document.querySelector(`#${comment.rangeData.startContainer}`).parentNode.id) count.push(index);
        })

        // Wenn Kommentare im Zähl-Array sind;
        if (count.length > 0) {
            // Leg ein Marker-Div an
            let markerDiv = markedParagraph();

            //Schreib die Indizes der Kommentare in ein Data-Attribute
            markerDiv.setAttribute('data-comments', count.join(','));

            // Schreib die Anzahl der Kommentare in das dafür vorgesehene Span
            let commentCount = markerDiv.querySelector('.commentCount');
            commentCount.innerHTML = count.length;

            // Den entsprechenden Absatz am Anfang des Divs einfügen
            markerDiv.prepend(paragraph.cloneNode(true));

            // und Absatz damit austauschen

            paragraph.replaceWith(markerDiv);
        }

    })
}

const unmarkParagraphs = () => {
    // Alle Marker-divs
    let markedParagraphs = document.querySelectorAll('.markedParagraph');

    markedParagraphs.forEach(paragraph => {
        // Das P aus dem Div holen
        let innerElement = paragraph.firstElementChild;
        // Und das Div damit ersetzen
        paragraph.replaceWith(innerElement);

    })
}


// Kommentare neu einladen
const reloadComments = (comments) => {
    // Nur wenn überhaupt welche da sind
    if (comments.length > 0) {
        // Wenn schon Absätze als kommentiert ausgewiesen sind, entferne die Marker-Divs erstmal, damit sich nichts doppelt
        if (document.querySelectorAll('.markedParagraph').length > 0) unmarkParagraphs();
        // Und zeichne sie neu
        markCommentedParagraphs(comments);
    } else {
        console.log('No comments so far.');
    }

}

