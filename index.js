'use strict';

// Express Webserver initialisieren
const express = require('express');
let expressServer = express();
expressServer.use(express.static('public'));

// HTTP
const http = require('http');
let httpServer = http.Server(expressServer);

// Websocket-Funktionalität für Multi-User-Anwendung
const socketIo = require('socket.io');
let io = socketIo(httpServer, { timeout: 2000 });

// File Server zum Speichern und Laden
const fs = require('fs');
let filePath = './data/comments.json';

// FUNKTIONEN

// Beliebige JSON-Datei um ein Element erweitern
const jsonAppend = (path, newContent, multiple = false) => {
    fs.readFile(path, (err, content) => {
        if (err) content = [];
        else content = JSON.parse(content.toString());

        if (multiple) {
            newContent.forEach(el => content.push(el));
        } else {
            content.push(newContent);
        }

        fs.writeFile(path, JSON.stringify(content), err => {
            if (err) console.log(err);
        });
    })
}


// Kommentare aus der Datei auslesen



// VARIABLEN
const sockets = {};
let comments = {commentList: []};



// FUNKTIONEN
const loadComments = (socket) => {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, (err, comments) => {
            if (err) reject(err);
            else comments = JSON.parse(comments.toString());
            resolve(comments);
        })
    }).then(
        data => {
            comments.commentList = data;
            socket.emit('loadComments', JSON.stringify(comments.commentList));
        },
        data => console.log(data)
        
    )
}


// EVENTLISTENER
io.on('connect', socket => {
    console.log(socket.id);

    socket.emit('register', socket.id);
    loadComments(socket);
     sockets[socket.id] = socket;


// Kommentare in JSON-Datei speichern
    socket.on('postComment', data => {
        jsonAppend(filePath, JSON.parse(data));
        comments.commentList.push(JSON.parse(data));
        io.emit('updateComments', JSON.stringify(comments.commentList));
   
    })

    // Bei disconnect Client aus der Liste nehmen
    socket.on('disconnect', () => {
        delete sockets[socket.id];
    })
})



httpServer.listen(8080, err => console.log(err || 'Running'));
