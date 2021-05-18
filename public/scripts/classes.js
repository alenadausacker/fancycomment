"use strict";

// KLASSEN

class Comment {
    constructor({
        author = false, // Der Autor ist ein User-Objekt
        commentBody = false, // Text des Kommentars
        rangeData = false // Die Range, die markiert wurde
    } = {}) {
        this.author = author;
        this.commentBody = commentBody;
        this.rangeData = rangeData;
    }

    get commentID() {
        //TODO Es wäre für eventuelle Ausbaustufen, insbesondere für die Anbindung an CMS nützlich, wenn jeder Kommentar einen Unique Identifies bekäme, im Moment brauche ich es aber noch nicht
    }
}

class User {
    constructor({
        id = false, // Nutze ich bisher auch noch nicht, wäre ebenfalls für Ausbaustufen (Session-übergreifendes Nutzermanagement) notwendig
        alias = 'anonymous', // Nutzername
        colorCode = '#e03a3a', // Color-Code, um die Kommentare entsprechend einzufärben
    } = {}) {
        this.id = id;
        this.alias = alias;
        this.colorCode = colorCode;
    }

}
