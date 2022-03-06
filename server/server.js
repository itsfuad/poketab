const path = require('path');
const http = require('http');
const express = require('express');
const socketIO = require('socket.io');

const {generateMessage, generateLocationMessage} = require('./utils/message');
const {isRealString} = require('./utils/validation');
const {Users} = require('./utils/users');

const publicPath = path.join(__dirname, '../public');
const port = process.env.PORT || 3000;
var app = express();
var server = http.createServer(app);
var io = socketIO(server);
var users = new Users();

app.use(express.static(publicPath));

function getActiveRooms(io) {
  // Convert map into 2D list:
  // ==> [['4ziBKG9XFS06NdtVAAAH', Set(1)], ['room1', Set(2)], ...]
  const arr = Array.from(io.sockets.adapter.rooms);
  // Filter rooms whose name exist in set:
  // ==> [['room1', Set(2)], ['room2', Set(2)]]
  const filtered = arr.filter(room => !room[1].has(room[0]))
  // Return only the room name: 
  // ==> ['room1', 'room2']
  const res = filtered.map(i => i[0]);
  return res;
}

io.on('connection', (socket) => {
  
  socket.on('join', (params, callback) => {
    if (!isRealString(params.name) || !isRealString(params.room)) {
      return callback('Name and room name are required.');
    }
    //check if username already exists in room
    var userList = users.getUserList(params.room);
    var user = userList.includes(params.name);
    //console.log(users.getUserList(params.room));
    //console.log(userList.includes(params.name));
    if (user) {
      return callback('Name already exists in room.');
    }

    console.log('New user connected');
    //console.log(getActiveRooms(io));

    socket.join(params.room);
    users.removeUser(socket.id);
    users.addUser(socket.id, params.name, params.room);
    io.to(params.room).emit('updateUserList', users.getUserList(params.room), params.room);
    socket.emit('server_message', generateMessage('', `Welcome ${params.name}😃!`));
    socket.broadcast.to(params.room).emit('server_message', generateMessage(params.name, `${params.name} joined the chat.🔥`));
    callback();
  });

  socket.on('createMessage', (message, callback) => {
    var user = users.getUser(socket.id);

    if (user && isRealString(message.text)) {
      text = message.text;
      text = text.replace(/fuck/g, 'f**k');
      text = text.replace(/shit/g, 's**t');
      text = text.replace(/bitch/g, 'b**t');
      text = text.replace(/asshole/g, 'a**hole');
      text = text.replace(/dick/g, 'd**k');
      text = text.replace(/pussy/g, 'p**s');
      text = text.replace(/cock/g, 'c**k');
      text = text.replace(/baal/g, 'b**l');

      text = text.replace(/Fuck/g, 'F**k');
      text = text.replace(/Shit/g, 'S**t');
      text = text.replace(/Bitch/g, 'B**t');
      text = text.replace(/Asshole/g, 'A**hole');
      text = text.replace(/Dick/g, 'D**k');
      text = text.replace(/Pussy/g, 'P**s');
      text = text.replace(/Cock/g, 'C**k');
      text = text.replace(/Baal/g, 'B**l');
      //io.to(user.room).emit('newMessage', generateMessage(user.name, text));
      socket.emit('my__message', generateMessage(user.name, text));
      socket.broadcast.to(user.room).emit('newMessage', generateMessage(user.name, text));
    }

    callback();
  });

  socket.on('createLocationMessage', (coords) => {
    var user = users.getUser(socket.id);

    if (user) {
      io.to(user.room).emit('newLocationMessage', generateLocationMessage(user.name, coords.latitude, coords.longitude));  
    }
  });
  
  socket.on('disconnect', () => {
    var user = users.removeUser(socket.id);

    if (user) {
      io.to(user.room).emit('updateUserList', users.getUserList(user.room));
      io.to(user.room).emit('server_message', generateMessage(user.name, `${user.name} left the chat.🙃`));
      //console.log(getActiveRooms(io));
    }
  });
});

server.listen(port, () => {
  console.log(`Server is up on ${port}`);
});