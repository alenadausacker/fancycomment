'use strict';


// Bedienelement zum Verfassen eines Kommentars
const commentInput = (range) => {
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
            saveComment(document.querySelector('#currentComment').value, range);
        }
        // In jedem Fall das Eingabe-Element wieder entfernen
        document.querySelector('#postComment').remove();
    })

    // Element zusammenbauen 
    inputWrapper.appendChild(commentInput);
    inputWrapper.appendChild(btn);

    return inputWrapper;
}


const showCommentInput = (x, y, range) => {
    let inputWrapper = commentInput(range);

    // Element die Koordinaten des Mouseevents geben, das die Funktion ausgelöst hat, um die Position festzulegen
    inputWrapper.style.left = `${x}px`;
    inputWrapper.style.top = `${y}px`;

    // Element einhängen
    textWrapper.appendChild(inputWrapper);
}


// Bedienelement zur Konfiguration des Client-Users
const userConfig = () => {
    // ein Wrapper!
    let configWrapper = document.createElement('div');
    configWrapper.id = 'userConfig';

    // Ein Input für den Namen!
    let nameInput = document.createElement('input');
    nameInput.setAttribute('placeholder', 'Name');
    nameInput.id = 'userName';

    // Ein Input für die Farbe
    let colorWrapper = document.createElement('div');
    let colorInput = document.createElement('input');

    colorInput.setAttribute('type', 'color');
    colorInput.setAttribute('name', 'user-color');
    colorInput.setAttribute('value', '#e66465');
    colorInput.id = 'userColor';

    // Mit Label!
    let colorInputLabel = document.createElement('label');
    colorInputLabel.setAttribute('for', 'user-color');
    colorInputLabel.innerHTML = 'Deine Farbe';

    // Zusammensetzen
    colorWrapper.appendChild(colorInput);
    colorWrapper.appendChild(colorInputLabel);

    // SpeicherButton
    let btn = document.createElement('button');
    btn.innerHTML = 'Speichern';

    // Der den User updatet und das Config-Element versteckt
    btn.addEventListener('click', e => {
        updateUser(nameInput.value, colorInput.value);
        hide(document.querySelector('#userConfig'));
    })

    // Zusammensetzen
    configWrapper.appendChild(nameInput);
    configWrapper.appendChild(colorWrapper);
    configWrapper.appendChild(btn);

    return configWrapper;
}

// User-Konfig einhängen

const initUserConfig = () => {
    document.body.appendChild(userConfig());
}

// User-Konfig ein- und ausblenden

toggleUserConfig.addEventListener('click', e => {
    e.preventDefault();
    document.querySelector('#userConfig').classList.toggle('invisible');
})


// Irgendwas zeigen
const show = (element) => {
    element.classList.remove('invisible');
}

// Irgendwas verstecken
const hide = (element) => {
    element.classList.add('invisible');
}

// Element zur Anzeige eines Kommentars
const commentDisplay = (commentList) => {
    // Mache ein Div
    let display = document.createElement('div');
    display.classList.add('commentDisplay');
    display.setAttribute('data-current-comment', '0')

    // Mache ein P für den Namen der's Verfasser'in
    let nameTag = document.createElement('p');
    nameTag.innerHTML = `${comments.allComments[commentList[0]].author.alias}:`;
    nameTag.classList.add('commentAuthor');

    // mach ein P für den Kommentartext
    let commentBody = document.createElement('p');
    commentBody.innerHTML = comments.allComments[commentList[0]].commentBody;
    commentBody.classList.add('commentBody');

    // Füg das schon mal ein
    display.appendChild(nameTag);
    display.appendChild(commentBody);

    // Wenn mehr als ein Kommentar beim Paragraphen hinterlegt ist
    if (commentList.length > 1) {

        // Mach eine Navigationsleiste
        let navDiv = document.createElement('div');
        navDiv.classList.add('commentNav');

        // Mit Button Next
        let buttonNext = document.createElement('button');
        buttonNext.innerText = '»';
        buttonNext.classList.add('nextComment')
        buttonNext.addEventListener('click', e => {
            selectNextComment(e, commentList)
        });

        // Und Button Previous
        let buttonPrev = document.createElement('button');
        buttonPrev.innerText = '«';
        buttonPrev.setAttribute('disabled', 'true');
        buttonPrev.classList.add('previousComment');
        buttonPrev.addEventListener('click', e => {
            selectPreviousComment(e, commentList)
        });

        // Bau zusammen
        navDiv.appendChild(buttonPrev);
        navDiv.appendChild(buttonNext);

        display.appendChild(navDiv);
    }



    return display;
}


// Element erzeugen, um einen kommentierten Absatz zu Markieren
const markedParagraph = () => {
    // Element, das später den Absatz umschließen soll
    let paragraphWrapper = document.createElement('div');
    paragraphWrapper.classList.add('markedParagraph');

    // Ein Span, in dem die Anzahl der Kommentare stehen soll
    let commentCount = document.createElement('span');
    commentCount.classList.add('commentCount');

    // Das Span bekommt einen Event-Listener, um die Kommentare anzuzeigen, wenn man es anklickt
    commentCount.addEventListener('click', e => {

        // Zeig die Kommentare nur an, wenn gerade nicht wo anders welche angezeigt werden
        if (document.querySelectorAll('.commentDisplay').length == 0) {
        // Hol dir die Kommentarliste aus dem Data-Attribute
        let commentList = paragraphWrapper.getAttribute('data-comments').split(',');
         // und markier den dazugehörigen Text
         markText(comments.allComments[commentList[0]]);
        // Zeige Kommentare an
        paragraphWrapper.appendChild(commentDisplay(commentList));
        } else {
            // Sonst entferne die Anzeige und hebe die Textmarkierungen auf
            let display = document.querySelectorAll('.commentDisplay');
            display.forEach(comment => comment.remove());
            unmarkText();
        }
       
    })

    // Zusammensetzen
    paragraphWrapper.appendChild(commentCount);

    return paragraphWrapper;
}

const selectNextComment = (e, commentList) => {
    // Falls Button Prev disabled ist, wieder enablen
    if (document.querySelector('.previousComment').getAttribute('disabled') == 'true') document.querySelector('.previousComment').disabled = false; 
    // Lies aus, welcher Kommentar gerade angezeigt wird
    let i = Number(document.querySelector('.commentDisplay').getAttribute('data-current-comment'));

    let nextComment = comments.allComments[commentList[i+1]];
    
    // Schreib die Daten des nächsten Kommentars in die entsprechenden Felder
    document.querySelector('.commentBody').innerHTML = nextComment.commentBody;
    document.querySelector('.commentAuthor').innerHTML = nextComment.author.alias;
    unmarkText();
    markText(nextComment);

    // Und update das Data-Atribute
    document.querySelector('.commentDisplay').setAttribute('data-current-comment', String(i+1));

    // Disable den Button, wenn ganz am Ende
    if (i + 2 >= commentList.length) e.target.setAttribute('disabled', 'true');
    
}

const selectPreviousComment = (e, commentList) => {
    // Falls Button Next disabled ist, wieder enablen
    if (document.querySelector('.nextComment').getAttribute('disabled') == 'true') 
    document.querySelector('.nextComment').disabled = false;
    // Lies aus, welcher Kommentar gerade angezeigt wird
    let i = Number(document.querySelector('.commentDisplay').getAttribute('data-current-comment'));
    let prevComment = comments.allComments[commentList[i-1]];

    // Schreib die Daten des nächsten Kommentars in die entsprechenden Felder
    document.querySelector('.commentBody').innerHTML = prevComment.commentBody;
    document.querySelector('.commentAuthor').innerHTML = prevComment.author.alias;
    unmarkText();
    markText(prevComment);

    // Und update das Data-Atribute
    document.querySelector('.commentDisplay').setAttribute('data-current-comment', String(i-1));

    // Disable den Button, wenn ganz am Anfang
    if (i - 2 < 0) e.target.setAttribute('disabled', 'true');
}

