'use strict';


// Verbindung zum Server aufbauen
let socket = io.connect();


// INTERFACE ELEMENTE

let textWrapper = document.querySelector('#text-wrapper');
let toggleUserConfig = document.querySelector('#toggleUserConfig');


// VARIABLEN
// globales User Objekt
let currentUser = new User();
// globales Comments Objekt
let comments = {};

// FUNKTIONEN

// User aus Konfig updaten
const updateUser = (name, color) => {
    // Wenn ein leerer String übergeben wird, wird der Name auf anonymous gesetzt
    currentUser.alias = name == '' ? 'anonymous' : name;
    // Die Farbe hat immer zumindest einen Standardwert
    currentUser.colorCode = color;
}


// Init-Stuff

const init = () => {
    // Alle Elemente im Text selektieren
    let elements = Array.from(textWrapper.querySelectorAll('*'));

    // Jedem eine ID geben, um hinterher die Kommentar-Range rekonstruieren zu können
    elements.forEach((el, index) => {
        el.id = `elem-${index + 1}`;
    })
}

// SELECTION EVENT LISTENER
// EventListener für die Markierungsfunktionalität
// mouseup im Kontext von selectstart identifiziert das Ende eines Markierungsvorgangs
document.addEventListener('selectstart', e => {
    // Erstmal alle dynamischen Markierungen aus dem Text nehmen, falls es welche gibt, sonst gibt das Fehler beim Abspeichern der Range, weil Textnodes anders aufgeteilt werden
    unmarkText();

    document.addEventListener('mouseup', evt => {

        //Nimm die Selection
        let selection = window.getSelection();

        //Nur weiter machen, wenn bei der Selektion Start- und Endpunkt verschieden sind    
        if (!selection.isCollapsed) {

            // Range aus Selection holen
            let range = selection.getRangeAt(0);

            // Kommentar-Input einblenden
            showCommentInput(evt.clientX, evt.clientY, range);
            
            // Auswahl loslassen, um keine Fehler zu provozieren
            selection.empty();
        }

    })

})


// WEBSOCKET EVENTLISTENER

socket.on('register', data => {
    currentUser.id = data;
    initUserConfig();
})

socket.on('loadComments', data => {

    data = JSON.parse(data);
    // Wenn ein Kommentar hinterlegt ist
    if (data.length > 0) {
        // Fülle das Array in die Variable
        comments.allComments = data;
        // Und zeige die Kommentare an
        reloadComments(comments.allComments);
    } else {
        comments.allComments = [];
        console.log('No comments so far');
        
    }
})

socket.on('updateComments', data => {
    // Erfolgskontrolle
    console.log('comment Posted') 
    // Die neue Kommentarliste einladen
    comments.allComments = JSON.parse(data);

    //Und Kommentaranzeige neu laden
    reloadComments(comments.allComments);
})


// init

init();

