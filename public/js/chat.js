//Variables
const socket = io();
const incommingmessage = new Audio('./../sounds/incommingmessage.wav');
const outgoingmessage = new Audio('./../sounds/outgoingmessage.wav');
const joinsound = new Audio('./../sounds/join.wav');
const leavesound = new Audio('./../sounds/leave.wav');
const typingsound = new Audio('./../sounds/typing.wav');
let myname;
let myid;
let scrolling = false;
let lastPageLength = $('#messages').scrollTop();;
let scroll = 0;
const userMap = new Map();
const maxTypeShow = 2;
let typing = false;
let timeout = undefined;
let isReply = false;
let replyTo, replyText;
let targetId;
const emoji_regex = /^(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|[\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|[\ud83c[\ude32-\ude3a]|[\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])+$/;

class ClickAndHold{
  /**
   * @param {EventTarget} target The html elemnt to target
   * @param {TimeOut} timeOut The time out in milliseconds
   * @param {Function} callback The callback to call when the user clicks and holds
   */
  constructor(target, timeOut, callback){
      this.target = target;
      this.callback = callback;
      this.isHeld = false;
      this.activeHoldTimeoutId = null;
      this.timeOut = timeOut;
      ["touchstart", "mousedown"].forEach(eventName => {
          this.target.addEventListener(eventName, this._onHoldStart.bind(this));
      });
      ["mouseup", "touchend", "mouseleave", "mouseout", "touchcancel"].forEach(eventName => {
          this.target.addEventListener(eventName, this._onHoldEnd.bind(this));
      });
  }
  _onHoldStart(evt){
      this.isHeld = true;
      this.activeHoldTimeoutId = setTimeout(() => {
          if (this.isHeld){
              this.callback(evt);
          }
      }, this.timeOut);
  }
  _onHoldEnd(){
      this.isHeld = false;
      clearTimeout(this.activeHoldTimeoutId);
  }
  static applyTo(target, timeOut, callback){
      new ClickAndHold(target, timeOut, callback);
  }
}

const myMessageTemplate = $('#my-message-template').html();
const messageTemplate = $('#message-template').html();
const serverMessageTemplate = $('#server-message-template').html();
const locationMessageTemplate = $('#location-message-template').html();
const imageMessageTemplate = $('#image-message-template').html();
const myImageMessageTemplate = $('#my-image-message-template').html();

$('#my-message-template').remove();
$('#message-template').remove();
$('#server-message-template').remove();
$('#location-message-template').remove();
$('#image-message-template').remove();
$('#my-image-message-template').remove();

//Socket Connections
socket.on('connect', function () {
  let name = $('#myname').text();
  let key = $('#mykey').text();
  let avatar = $('#myavatar').text();
  let maxuser = $('#maxuser').text();
  let params = {
    name: name,
    key: key,
    avatar: avatar,
    maxuser: maxuser
  };
  socket.emit('join', params, function (err) {
    if (err) {
     console.log(err);
     popupMessage(err);
    } else {
      console.log('No error');
      popupMessage(`Connected to server`);
      $('#main-screen').css('visibility', 'visible');
      $('#preloader').css('visibility', 'hidden');
      $('#preloader').remove();
    }
  });
});

socket.on('disconnect', function () {
  console.log('Disconnected from server');
  popupMessage(`Disconnected from server`);
});

socket.on('updateUserList', function (users, ids, key, avatars) {
  let ol = $('<ul></ul>');
  for (let i = 0; i < users.length; i++) {
    ol.append($(`<li class='user' id='${ids[i]}'></li>`).html(`<img height='30px' width='30px' src='images/avatars/${avatars[i]}(custom).png'> ${users[i]}`));
  }
  $('.menu').html(`<i class="fa-solid fa-user"></i> ${users.length}`);
  $('.keyname1').text(`${key}`);
  $('.keyname2').text(`${key}`);
  $('.users').html(ol);
});

socket.on('newMessage', function (message, avatar, isReply, replyTo, replyText, id, targetId) {
  incommingmessage.play();
  let formattedTime = moment(message.createdAt).format('hh:mm a');
  let html;
  if (isReply) {
    if (replyTo == myname) replyTo = 'You';
    //template = $('#message-template').html();
    html = Mustache.render(messageTemplate, {
      text: linkify(message.text),
      from: `${message.from} replied to ${replyTo}`,
      reply: replyText,
      id: id,
      repId: targetId,
      repIcon: `<i class="fa-solid fa-reply"></i>`,
      createdAt: formattedTime,
      attr: "style",
      replyMessageStyle: `display: block; transform: translateY(20px);`,
      messageTitleStyle: `transform: translateY(20px)`,
      attrVal: `images/avatars/${avatar}(custom).png`
    });
  } else {
    //template = $('#message-template').html();
    html = Mustache.render(messageTemplate, {
      text: linkify(message.text),
      from: message.from,
      id: id,
      attr: "style",
      replyMessageStyle: `display: none; transform: translateY(0px);`,
      messageTitleStyle: `transform: translateY(0px)`,
      createdAt: formattedTime,
      attrVal: `images/avatars/${avatar}(custom).png`
    });
  }
  html = html.replace(/¶/g, '<br>');
  $('#messages').append(html);
  if (emo_test(message.text)) {
    $("#messages li:last div p").css({
      "background": "none",
      "font-size": "30px",
      "padding": "0px"
    });
  }
  //closePopup();
  updateScroll(avatar, message.text);
});


socket.on('messageSent', function (replaceId, id) {
  outgoingmessage.play();
  $(`#${replaceId}`).attr('id', id);
  $(`#${id} .sent`).attr('class', 'fa-solid fa-circle-check sent');
});


socket.on('server_message', function (message, name = null, id = null) {
  myname = name || myname;
  myid = id || myid;

  let formattedTime = moment(message.createdAt).format('hh:mm a');
  let html = Mustache.render(serverMessageTemplate, {
    text: message.text,
    from: message.from,
    createdAt: formattedTime
  });
  if (message.text.includes('joined')) {
    html = html.replace(/<p>/g, `<p style='color: limegreen;'>`);
    joinsound.play();
  }
  if (message.text.includes('left')) {
    html = html.replace(/<p>/g, `<p style='color: orangered;'>`);
    leavesound.play();
  } else {
    html = html.replace(/<p>/g, `<p style='color: var(--blue);'>`);
  }

  $('#messages').append(html);
  updateScroll();
});

socket.on('newLocationMessage', function (message) {
  let formattedTime = moment(message.createdAt).format('hh:mm a');
  let html = Mustache.render(locationMessageTemplate, {
    from: message.from,
    url: message.url,
    createdAt: formattedTime
  });
  incommingmessage.play();
  $('#messages').append(html);
  updateScroll();
});

socket.on('typing', (user, id) => {
  typingsound.play();

  userMap.set(id, user);
  let _typing = '';

  let mapkeys = userMap.values();

  for (let i = 1; i <= userMap.size; i++) {
    _typing += `${mapkeys.next().value}, `;
    if (userMap.size > maxTypeShow){
      if (i == maxTypeShow) { 
        _typing = _typing.slice(0, -2);
        _typing += ` and ${userMap.size - maxTypeShow} others  `;
      }
      break;
    }
  }
  _typing = _typing.slice(0, -2);
  $('#typingindicator').text(`${_typing} ${(userMap.size > 1 ) ? 'are' : 'is'} typing...`);
});

socket.on('stoptyping', (id) => {
  userMap.delete(id);
  if (userMap.size == 0) {
    $('#typingindicator').text('');
  }else{
    let _typing = '';

    let mapkeys = userMap.values();
  
    for (let i = 1; i <= userMap.size; i++) {
      _typing += `${mapkeys.next().value}, `;
      //check if last
      if (userMap.size > maxTypeShow){
        if (i == maxTypeShow) { 
          _typing = _typing.slice(0, -2);
          _typing += ` and ${userMap.size - maxTypeShow} others  `;
        }
        break;
      }
    }
    _typing = _typing.slice(0, -2);
    $('#typingindicator').text(`${_typing} ${(userMap.size > 1 ) ? 'are' : 'is'} typing...`);
  }
});

socket.on('vibrateResponse', (sender_name, id) => {
  if (id == myid) {
    navigator.vibrate(1000);
    popupMessage(`${sender_name == myname ? 'You' : sender_name} just vibrated your Device`);
  }
});

socket.on('imageGet', (sendername, imagefile, avatar, id) => {
  let html = Mustache.render(imageMessageTemplate, {
    from: sendername,
    id: id,
    attrVal: `images/avatars/${avatar}(custom).png`,
    image: `<img class='image-message' src='${imagefile}'>`,
    createdAt: moment().format('hh:mm a')
  });
  incommingmessage.play();
  $('#messages').append(html);
  $(`#${id}`).find('.image-message').on('load', function () {
  updateScroll(avatar, 'Photo');
  });
});

socket.on('deleteMessage', (messageId, user) => {
  $(`#${messageId} .textMessage`).css('background', '#ff0000');
  setTimeout(() => {
    $(`#${messageId}`).remove();
    if (user == myname) {
      popupMessage(`You deleted a message`);
    }else{
      popupMessage(`${user} deleted a message`);
    }
    updateScroll();
  }, 1000);
});

socket.on('deleteImage', (messageId, user) => {
  $(`#${messageId} .imageMessage`).css('outline', '2px solid red');
  setTimeout(() => {
    $(`#${messageId}`).remove();
    if (user == myname) {
      popupMessage(`You deleted an image`);
    }else{
      popupMessage(`${user} deleted an image`);
    }
    updateScroll();
  }, 1000);
});


//functions
function appHeight () {
  const doc = document.documentElement;
  doc.style.setProperty('--app-height', `${window.innerHeight}px`);
}

function updateScroll(avatar = null, text = '') {
  if (scrolling) {
    if (text.length > 0) {
      $('.newmessagepopup img').attr('src', `./../images/avatars/${avatar}(custom).png`);
      $('.newmessagepopup .msg').text(text.length > 20 ? `${text.substring(0, 20)} ...` : text);
      $('.newmessagepopup').fadeIn(200);
    }
    return;
  }
  let element = document.getElementById("messages");
  element.scrollTop = element.scrollHeight;
  lastPageLength = $('#messages').scrollTop();
  removeNewMessagePopup();
}

function removeNewMessagePopup() {
  $('.newmessagepopup').fadeOut(200);
}

function scrollToBottom() {
  let messages = $('#messages');
  let newMessage = messages.children('li:last-child')
  let clientHeight = messages.prop('clientHeight');
  let scrollTop = messages.prop('scrollTop');
  let scrollHeight = messages.prop('scrollHeight');
  let newMessageHeight = newMessage.innerHeight();
  let lastMessageHeight = newMessage.prev().innerHeight();
  if (clientHeight + scrollTop + newMessageHeight + lastMessageHeight >= scrollHeight) {
    messages.scrollTop(scrollHeight);
  }
}

function censorBadWords(text) {
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

function makeid(length) {
  let result = '';
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() *
      charactersLength));
  }
  return result;
}

function saveImage()
{
  //console.log('Saving image');
  let a = document.createElement('a');
  a.href = $('.lightbox__image img').attr('src');
  a.download = `save-${moment().valueOf()}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function resizeImage(img, mimetype) {
  let canvas = document.createElement('canvas');
  let width = img.width;
  let height = img.height;
  let max_height = 480;
  let max_width = 480;
  // calculate the width and height, constraining the proportions
  if (width > height) {
    if (width > max_width) {
      //height *= max_width / width;
      height = Math.round(height *= max_width / width);
      width = max_width;
    }
  } else {
    if (height > max_height) {
      //width *= max_height / height;
      width = Math.round(width *= max_height / height);
      height = max_height;
    }
  }
  canvas.width = width;
  canvas.height = height;
  let ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL(mimetype, 0.7); 
}

function linkify(inputText) {
  let replacedText, replacePattern1, replacePattern2, replacePattern3;
  replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
  replacedText = inputText.replace(replacePattern1, '<a href="$1" target="_blank">$1</a>');
  replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
  replacedText = replacedText.replace(replacePattern2, '$1<a href="http://$2" target="_blank">$2</a>');
  replacePattern3 = /(([a-zA-Z0-9\-\_\.])+@[a-zA-Z\_]+?(\.[a-zA-Z]{2,6})+)/gim;
  replacedText = replacedText.replace(replacePattern3, '<a href="mailto:$1">$1</a>');
  return replacedText;
}

function emo_test(str) {
  return emoji_regex.test(str);
}

function copyText(text){
  navigator.clipboard.writeText(text);
  popupMessage(`Copied to clipboard`);
}

function popupMessage(text){
  $('.popup-message').text(text);
  $('.popup-message').fadeIn(500);
  setTimeout(function () {
    $('.popup-message').fadeOut(500);
  }, 1000);
}

function openImageView(evt)
{
  let target = evt.target;
  $('.lightbox__image').html('');
  $('.lightbox__image').append(`<img src="${target.src}" alt="">`);
  $('.lightbox').fadeIn(100);
}

function imageReply(evt)
{
  //console.log(evt);
  let target = evt.target;
  targetId = target.parentElement.parentElement.parentElement.parentElement.id;
  replyText = `Image`;
  replyTo = target.parentElement.parentElement.previousElementSibling.innerText;
  replyTo = replyTo.replace(/ replied to [a-zA-Z]+/g, '');
  let replyToPop = replyTo;
  if (replyToPop == myname) replyToPop = 'You';
  if (replyTo == 'You') replyTo = myname;
  isReply = true;
  $('.toast-popup').show();
  $('.toast-popup-name').html(`<i class="fa-solid fa-reply"></i> Replying to ${replyToPop}`);
  $('.toast-popup-message').text(`Image`);
  $('#textbox').focus();
}

function textReply(evt)
{
  let target = evt.target;
  targetId = target.parentElement.parentElement.parentElement.id;
  replyText = target.innerText.length > 200 ? `${target.innerText.substring(0, 200)} ...` : target.innerText;
  replyTo = evt.target.parentElement.previousElementSibling.previousElementSibling.innerText;
  replyTo = replyTo.replace(/ replied to [a-zA-Z]+/g, '');
  let replyToPop = replyTo;
  if (replyToPop == myname) replyToPop = 'You';
  if (replyTo == 'You') replyTo = myname;
  isReply = true;
  $('.toast-popup').show();
  $('.toast-popup-name').html(`<i class="fa-solid fa-reply"></i> Replying to ${replyToPop}`);
  $('.toast-popup-message').text(target.innerText.length > 50 ? `${target.innerText.substring(0, 50)} ...` : target.innerText);
  $('#textbox').focus();
}

function clickOptionHide()
{
  //console.log('hide');
  repPop = false;
  unbindClicks();
  $('.click-option').hide();
  //$('.view-action').hide();
  $('.store-action').hide();
  $('.copy-action').hide();
}

function unbindClicks(){
  $('.reply-action').unbind('click');
  //$('.view-action').unbind('click');
  $('.store-action').unbind('click');
  $('.copy-action').unbind('click');
  $('.delete-action').unbind('click');
}

function deleteMessage(evt, type){

  if (type == 'text'){
    targetId = evt.target.parentElement.parentElement.parentElement.id;
    //console.log(evt.target.parentElement.parentElement);
    socket.emit('delete message', targetId, myname);
  }
  else if (type == 'image'){
    targetId = evt.target.parentElement.parentElement.parentElement.parentElement.id;
    //console.log(targetId);
    socket.emit('delete image', targetId, myname);
  }
}

function lightboxClose()
{
  $('.lightbox').fadeOut(100, ()=>{
    $('.lightbox__image').html("");
  });
}

function clickOptionShow(type, evt)
{
  repPop = true;
  unbindClicks();
  $('.click-option').show();
  if(type === 'text'){
    //$('.view-action').hide();
    $('.store-action').hide();
    $('.copy-action').show();
    $('.delete-action').show();
    $('.reply-action').on('click', () => {
      //console.log('Click on reply');
      textReply(evt);
      clickOptionHide();
    });
    $('.copy-action').on('click', ()=>{
      //console.log('Click on Copy');
      copyText(evt.target.innerText);
      clickOptionHide();
    });
    $('.delete-action').on('click', ()=>{
      //console.log('Click on Delete');
      deleteMessage(evt, 'text');
      clickOptionHide();
    });
  }
  else if (type === 'image'){
    //$('.view-action').show();
    $('.store-action').show();
    $('.copy-action').hide();
    $('.delete-action').show();
    $('.reply-action').on('click', () => {
      //console.log('Click on reply image');
      imageReply(evt);
      clickOptionHide();
    });
    /*$('.view-action').on('click', () => {
      //console.log('Click on view image');
      openImageView(evt);
      clickOptionHide();
    });*/
    $('.store-action').on('click', () => {
      saveImage();
      clickOptionHide();
    });
    $('.delete-action').on('click', ()=>{
      //console.log('Click on Delete');
      deleteMessage(evt, 'image');
      clickOptionHide();
    });
  }
}

function closePopup() {
  isReply = false;
  $('.toast-popup').hide();
  $('.toast-popup-name').text('');
  $('.toast-popup-message').text('');
  $('.about').hide();
  $('.menuwrapper').removeClass('active');
}

//Check online status
if (navigator.onLine) {
  console.log('online');
  $('.offline').fadeOut(400);
} else {
  console.log('offline');
  $('.offline').text('You are offline!');
  $('.offline').css('background', 'orangered');
  $('.offline').fadeIn(400);
}

//Event listeners
window.addEventListener('offline', function(e) { 
  console.log('offline'); 
  $('.offline').text('You are offline!');
  $('.offline').css('background', 'orangered');
  $('.offline').fadeIn(400);
});

window.addEventListener('online', function(e) {
  console.log('Back to online');
  $('.offline').text('Back to online!');
  $('.offline').css('background', 'limegreen');
  setTimeout(() => {
    $('.offline').fadeOut(400);
  }, 1500);
});

$('#textbox').on('keydown', (evt) => {
  if (evt.ctrlKey && (evt.key === 'Enter')) {
    $('.send').click();
  }
});

$('.toast-popup-close').on('click', () => {
  closePopup();
});

$('.close-action').on('click', function (evt) {
  clickOptionHide();
});

$('#messages').scroll(function (event) {
  scroll = $('#messages').scrollTop();

  if (scroll >= lastPageLength) {
    lastPageLength = scroll;
    removeNewMessagePopup();
    scrolling = false;
  } 
  else {
    scrolling = true;
  }
  //console.log(scrolling);
});

$('.newmessagepopup').click(function () {
  scrolling = false;
  updateScroll();
  removeNewMessagePopup();
});


$('#message-form').on('submit', function (e) {
  e.preventDefault();
  let messageTextbox = $('[name=message]');
  let text = messageTextbox.val();
  messageTextbox.val('');
  if (text.length > 10000) {
    text = text.substring(0, 10000);
  }
  if (text.replace(/\n/g, '').replace(/ /g, '').length == 0) {
    $('#textbox').css('height', 'auto');
    return;
  }
  text = text.trim();
  text = censorBadWords(text);
  text = text.replace(/\n/g, '¶');
  let replaceId = makeid(10);
  let formattedTime = moment().format('hh:mm a');
  let html;
  if (isReply) {
    html = Mustache.render(myMessageTemplate, {
      text: linkify(text),
      from: `You replied to ${replyTo == myname ? 'You': replyTo}`,
      id: replaceId,
      repId: targetId,
      reply: replyText,
      repIcon: `<i class="fa-solid fa-reply"></i>`,
      createdAt: formattedTime,
      attr: "style",
      replyMessageStyle: `display: block; transform: translateY(20px);`,
      messageTitleStyle: `display: block; transform: translateY(20px)`,
    });
  } else {
    html = Mustache.render(myMessageTemplate, {
      text: linkify(text),
      id: replaceId,
      from: myname,
      attr: "style",
      replyMessageStyle: `display: none; transform: translateY(0px);`,
      messageTitleStyle: `display: none; transform: translateY(0px)`,
      createdAt: formattedTime,
    });
  }
  html = html.replace(/¶/g, '<br>');
  $('#messages').append(html);
  if (emo_test(text)) {
    $("#messages li:last div p").css({
      "background": "none",
      "font-size": "30px",
      "padding": "0px"
    });
  }
  typing = false;
  socket.emit('stoptyping');
  socket.emit('createMessage', {
      text: text
    }, replaceId, isReply, replyTo, replyText, targetId,
    function () {
      $('#textbox').css('height', 'auto');
    });
  $('#textbox').css('height', 'auto');
  
  scrolling = false;
  closePopup();
  clickOptionHide();
  updateScroll();
});

$('#send-location').on('click', function () {
  if (!navigator.geolocation) {
    popupMessage('Geolocation not supported by your browser.');
    return;
  }

  $('#send-location').attr('disabled', 'disabled').html(`<i class="fa-solid fa-location-crosshairs"></i>`);
  navigator.geolocation.getCurrentPosition(function (position) {
    $('#send-location').removeAttr('disabled').html(`<i class="fa-solid fa-location-crosshairs"></i>`);
    socket.emit('createLocationMessage', {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    });
  }, function () {
    $('#send-location').removeAttr('disabled').html(`<i class="fa-solid fa-location-crosshairs"></i>`);
    popupMessage('Unable to fetch location.');
  });
});


$('#textbox').on('keydown', function () {
  if (timeout) {
    clearTimeout(timeout);
    timeout = undefined;
  }
  if (!typing) {
    typing = true;
    socket.emit('typing');
  }
  timeout = setTimeout(function () {
    typing = false;
    socket.emit('stoptyping');
  }, 1000);
});


$('.menu').on('click', function () {
  $('.menuwrapper').addClass('active');
});


$('#textbox').on('focus', function () {
  updateScroll();
});

$('.info').on('click', ()=> {
  $('.about').fadeIn(200);
});

$('.close').on('click', ()=> {
  $('.about').fadeOut(200);
});

$('.key').on('click', () => {
  //console.log('clicked');
  let text = $('.keyname1').text();
  copyText(text);
});

$('.users').on('click', function (evt) {
  evt.preventDefault();
  //console.log('clicked on users');
  let target = evt.target;
  if (target.className === 'user') {
    let targetId = target.id;
    socket.emit('vibrate', myname, targetId);
    if (targetId !== myid) {
      $('.popup-message').text(`You just vibrated ${target.innerText}'s Device`);
      $('.popup-message').fadeIn(500);
      setTimeout(function () {
        $('.popup-message').fadeOut(500);
      }, 1000);
    }
  }
});

$('.chat').on('click', function (evt) {
    $('.menuwrapper').removeClass('active');
    $('.about').fadeOut(200);
});

window.addEventListener('resize', () => {
  updateScroll();
});

$('.send').on('focus', function () {
  $('#textbox').focus();
});

$("textarea").each(function () {
  this.setAttribute("style", "height:" + (this.scrollHeight) + "px;overflow-y:hidden;");
}).on("input", function () {
  this.style.height = "auto";
  this.style.height = (this.scrollHeight) + "px";
});

$('#photo').on('change', ()=>{
  let file = $('#photo')[0].files[0];
  let reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = function(e)
  {
    $('.previewimage__image').html("<img src='"+e.target.result+"' alt='image'/>");
  }
  $('.previewimage').show();
});

$('.previewimage__close').on('click', () => {
  $('.previewimage').hide(100);
});


$('.sendimage').on('click', () => {
  let file = $('#photo')[0].files[0];
  let reader = new FileReader();
  reader.readAsArrayBuffer(file);
  reader.onload = function(e){
    let blob = new Blob([e.target.result]);
    window.URL = window.URL || window.webkitURL;
    let blobURL = window.URL.createObjectURL(blob);
    let image = new Image();
    image.src = blobURL;
    image.onload = function() {
      let resized = resizeImage(image, file.mimetype);
      let tempId = makeid(10);
      let html = Mustache.render(myImageMessageTemplate, {
        from: myname,
        id: tempId,
        image: `<img class='image-message' src='${resized}'>`,
        createdAt: moment(moment().valueOf()).format('hh:mm a')
      });
      $('#messages').append(html).ready(()=>{
        scrolling = false;
        updateScroll();
      });
      socket.emit('image', myname, tempId, resized);
    }
    $('.previewimage').hide();
    $('.previewimage__image').html("");
    clickOptionHide();
  }  
});

$('.lightbox__close').on('click', ()=>{
  lightboxClose();
});

$('.lightbox__save').on('click', ()=>{
  saveImage();
});

const Messages = document.querySelector('#messages'); 
let repPop = false;
//click on image event
Messages.addEventListener('click', (e)=>{
  if(e.target.classList.contains('image-message')){
    if (!repPop) {
      openImageView(e);
    }
  }
});

ClickAndHold.applyTo(Messages, 300, function (evt) {
  //console.log(evt);
  lightboxClose();
  let target = evt.target;
  if (target.className === 'textMessage') {
    clickOptionShow('text', evt);
  } else if (target.className.includes('replyMessage')) {
    const msgId = target.dataset.repid;
    const element = document.getElementById(msgId);
    element.scrollIntoView({
      block: "center"
    });
    $('#messages .my__message').css('filter', 'brightness(0.5)');
    $('#messages .message').css('filter', 'brightness(0.5)');
    $(`#${msgId}`).css('filter', 'initial');
    setTimeout(function () {
      $('#messages .my__message').css('filter', '');
      $('#messages .message').css('filter', '');
      $(`#${msgId}`).css('filter', '');
    }, 1000);
  }else if(target.className.includes('image-message')){
    clickOptionShow('image', evt);
  }
});

window.addEventListener('resize',()=>{ 
  appHeight();
  updateScroll();
});
document.addEventListener('contextmenu', event => event.preventDefault());
appHeight();
