const path = require('path');
const http = require('http');
const express = require('express');
const socketIO = require('socket.io');

const {generateMessage, generateLocationMessage} = require('./utils/message');
const {isRealString} = require('./utils/validation');
const {Users} = require('./utils/users');

const publicPath = path.join(__dirname, '../public');
const port = process.env.PORT || 3000;
let app = express();
let server = http.createServer(app);
let io = socketIO(server);
let users = new Users();

app.use(express.static(publicPath));

function censorBadWords(text)
{
  text = text.replace(/fuck/g, 'f**k');
  text = text.replace(/shit/g, 's**t');
  text = text.replace(/bitch/g, 'b**t');
  text = text.replace(/asshole/g, 'a**hole');
  text = text.replace(/dick/g, 'd**k');
  text = text.replace(/pussy/g, 'p**s');
  text = text.replace(/cock/g, 'c**k');
  text = text.replace(/baal/g, 'b**l');
  text = text.replace(/sex/g, 's*x');

  text = text.replace(/Fuck/g, 'F**k');
  text = text.replace(/Shit/g, 'S**t');
  text = text.replace(/Bitch/g, 'B**t');
  text = text.replace(/Asshole/g, 'A**hole');
  text = text.replace(/Dick/g, 'D**k');
  text = text.replace(/Pussy/g, 'P**s');
  text = text.replace(/Cock/g, 'C**k');
  text = text.replace(/Baal/g, 'B**l');
  text = text.replace(/Sex/g, 'S*x');
  return text;
}

io.on('connection', (socket) => {
  
  socket.on('join', (params, callback) => {
    //console.log(params);
    if (!isRealString(params.name) || !isRealString(params.key)) {
      return callback('empty');
    }
    if(params.avatar === undefined){
      return callback('avatar');
    }
    //check if username already exists in key
    let userList = users.getUserList(params.key);
    let user = userList.includes(params.name);
    let avatar = params.avatar;
    //console.log(users.getUserList(params.key));
    //console.log(userList.includes(params.name));
   // console.log(params);
    if (user) {
      return callback('exists');
    }

    console.log(`New user ${params.name} connected on key ${params.key}`);
    //console.log(getActivekeys(io));

    socket.join(params.key);
    users.removeUser(socket.id);
    users.addUser(socket.id, params.name, params.key, avatar);
    io.to(params.key).emit('updateUserList', users.getUserList(params.key), params.key, users.getAvatarList(params.key));
    socket.emit('server_message', generateMessage('', `You joined the chat.🔥`));
    socket.broadcast.to(params.key).emit('server_message', generateMessage(params.name, `${params.name} joined the chat.🔥`));
    callback();
  });

  socket.on('createMessage', (message, callback) => {
    let user = users.getUser(socket.id);
    if (user && isRealString(message.text)) {
      text = censorBadWords(message.text);
      //console.log(user);
      //io.to(user.key).emit('newMessage', generateMessage(user.name, text));
      //console.log(user.avatar);
      socket.emit('my__message', generateMessage(user.name, text), user.avatar);
      socket.broadcast.to(user.key).emit('newMessage', generateMessage(user.name, text), user.avatar);
    }
    callback();
  });

  socket.on('createLocationMessage', (coords) => {
    let user = users.getUser(socket.id);

    if (user) {
      io.to(user.key).emit('newLocationMessage', generateLocationMessage(user.name, coords.latitude, coords.longitude));  
    }
  });
  
  socket.on('call', stream => {
    let user = users.getUser(socket.id);
    if (user) {
      socket.broadcast.to(user.key).emit('incomingCall', stream);
    }
  });

  socket.on('disconnect', () => {
    let user = users.removeUser(socket.id);
    if (user) {
      io.to(user.key).emit('updateUserList', users.getUserList(user.key), user.key, users.getAvatarList(user.key));
      io.to(user.key).emit('server_message', generateMessage(user.name, `${user.name} left the chat.🐸`));
      console.log(`User ${user.name} disconnected from key ${user.key}`);
    }
  });

  socket.on('typing', () => {
    let user = users.getUser(socket.id);
    if (user) {
      socket.broadcast.emit('typing', user.name);
    }
  });
  socket.on('stoptyping', () => {
    let user = users.getUser(socket.id);
    if (user) {
      socket.broadcast.emit('stoptyping', user.name);
    }
  });
  socket.on('newUserRequest', key => {
    console.log('New User Attempt');
    let userlist = users.getUserList(key);
    let avatarList = users.getAvatarList(key);
    socket.emit('newUserResponse', userlist, avatarList);
  });
});



server.listen(port, () => {
  console.log(`Server is up on ${port}`);
});