// import io from 'socket.io-client'
// const socket = io();
//
// document.querySelector('submit').addEventListener('click', () => {
//     let text = document.getElementById("inputText").value;
//     socket.emit('chat message', text);
// });
//
// document.getElementById("inputText").addEventListener("keyup", function(event){
//     event.preventDefault();
//     if(event.keyCode === 13){
//         document.getElementById("submit").click();
//     }
// });
//
// io.on('connection', function(socket) {
//     socket.on('chat message', (text) => {
//
//         // Get a reply from API.AI
//
//         let apiaiReq = apiai.textRequest(text, {
//             sessionId: APIAI_SESSION_ID
//         });
//
//         apiaiReq.on('response', (response) => {
//             let aiText = response;
//             socket.emit('bot reply', aiText); // Send the result back to the browser!
//         });
//
//         apiaiReq.on('error', (error) => {
//             console.log(error);
//         });
//
//         apiaiReq.end();
//
//     });
// });
