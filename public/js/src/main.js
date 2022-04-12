"use strict";
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
        try{
          this.target.addEventListener(eventName, this._onHoldStart.bind(this));
        }
        catch(e){
          console.log(e);
        }
      });
      ["touchmove", "mousemove"].forEach(eventName => {
        try{
          this.target.addEventListener(eventName, this._onHoldMove.bind(this));
        }
        catch(e){
          console.log(e);
        }
      });
      ["mouseup", "touchend", "mouseleave", "mouseout", "touchcancel"].forEach(eventName => {
        try{
          this.target.addEventListener(eventName, this._onHoldEnd.bind(this));
        }
        catch(e){
          console.log(e);
        }
      });
  }
  _onHoldStart(evt){
      this.isHeld = true;
      this.activeHoldTimeoutId = setTimeout(() => {
          if (this.isHeld) {
              this.callback(evt);
          }
      }, this.timeOut);
  }
  _onHoldMove(){
    this.isHeld = false;
  }
  _onHoldEnd(){
      this.isHeld = false;
      clearTimeout(this.activeHoldTimeoutId);
  }
  static applyTo(target, timeOut, callback){
    try{
      new ClickAndHold(target, timeOut, callback);
    }
    catch(e){
      console.log(e);
    }
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
  try{
    $(`#${replaceId}`).attr('id', id);
    $(`#${id} .sent`).attr('class', 'fa-solid fa-circle-check sent');
  }
  catch(e){
    console.log(e);
  }
});


socket.on('server_message', function (message, name = null, id = null) {
  myname = name || myname;
  myid = id || myid;

  let html = Mustache.render(serverMessageTemplate, {
    text: message.text,
    from: message.from
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
  let html = Mustache.render(locationMessageTemplate, {
    from: message.from,
    url: message.url
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
  if (navigator.vibrate) {
    if (id == myid) {
      navigator.vibrate(1000);
      popupMessage(`${sender_name == myname ? 'You' : sender_name} just vibrated your Device`);
    }
  }
  else{
    popupMessage('Device does not support web Vibration');
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
  try{
    $(`#${messageId} .object`).css('background', '#dd0000');
    setTimeout(() => {
      $(`#${messageId}`).remove();
      //console.log($(`[data-repid='${messageId}']`));
      $(`[data-repid='${messageId}']`).text(`${user === myname ? 'You' : user} deleted this message`);
      $(`[data-repid='${messageId}']`).css('background', '#000000b5');
      if (user == myname) {
        popupMessage(`You deleted a message`);
      }else{
        popupMessage(`${user} deleted a message`);
      }
      updateScroll();
    }, 1000);
  }
  catch(e){
    console.log(e);
  }
});

socket.on('deleteImage', (messageId, user) => {
  try{
    $(`#${messageId} .object`).css('outline', '1px solid orangered');
    setTimeout(() => {
      $(`#${messageId}`).remove();
      $(`[data-repid='${messageId}']`).text(`${user} deleted this message`);
      $(`[data-repid='${messageId}']`).css('background', '#000000b5');
      if (user == myname) {
        popupMessage(`You deleted an image`);
      }else{
        popupMessage(`${user} deleted an image`);
      }
      updateScroll();
    }, 1000);
  }catch(e){
    console.log(e);
  }
});

socket.on('reactionResponse', (target, userName, react)=>{
  addReact(target, userName, react);
});


socket.on('removeReactResponse', (u_name, id)=>{
  //console.log(u_name, id);
  removeReaction(u_name, id);
});




//functions
function addReact(target, userName, react){
  let user = userName == myname ? 'You' : userName;
  let emoji;
  switch(react){
    case 'senti':
      emoji = '👍🏻';
      break;
    case 'haha':
      emoji = '😂';
      break;
    case 'sad':
      emoji = '😢';
      break;
    case 'wow':
      emoji = '😮';
      break;
    case 'love':
      emoji = '❤️';
      break;
    case 'angry':
      emoji = '😠';
      break;
  }
  //check if userName exists in .reactor ul
  if ($(`#${target} .reactor ul`).find(`li:contains(${user})`)) {
    //console.log($(`#${target} .reactor ul .react-or-${user}`).text());
    if ($(`#${target} .reactor ul .react-or-${user} .emoticon`).text() == emoji){
      //console.log('already reacted');
      socket.emit('removeReact', userName, target);
      return;
    }else{
      $(`#${target} .reactor ul`).find(`li:contains(${user})`).remove();
      $(`#${target} .reactor ul`).append(`<li class='react-or-${user}'><span>${user}</span><span class='emoticon' data-name='${react}'>${emoji}</span></li>`);
    }
  }
  loadReact(target);
  // get list count
  let count = $(`#${target} .reactions`).children().length;
  //console.log(count);

  if (count >= 3){
    //delete first li 
    $(`#${target} .reactions`).children().first().remove();
  }
  //$(`#${target} .reactions`).append(`<li class='emo ${userName}'>${emoji}</li>`);
  
  //delete if username exists
  let prev = user;
  $(`#${target} .reactions li`).each((index, elem)=>{
    let now = elem.classList[1];
    if (now == prev){
      $(elem).remove();
    }
  });
  $(`#${target} .reactions`).append(`<li class='emo ${user}'>${emoji}</li>`);
  $(`#${target} .object`).css('margin-bottom', '10px');
  updateScroll();
}


function removeReaction(u_name, id){
  $(`#${id} .reactions .${u_name == myname? 'You': u_name}`).remove();
  $(`#${id} .react-or-${u_name == myname? 'You': u_name}`).remove();
  if ($(`#${id} .reactions`).children().length == 0){
    $(`#${id} .object`).css('margin-bottom', '');
  }
}

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
  setTimeout(() => {
    let element = document.getElementById("messages");
    element.scrollTop = element.scrollHeight;
    lastPageLength = $('#messages').scrollTop();
    removeNewMessagePopup();
  }, 100);
}

function removeNewMessagePopup() {
  $('.newmessagepopup').fadeOut(200);
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
  try{
    let a = document.createElement('a');
    a.href = $('.lightbox__image img').attr('src');
    a.download = `save-${moment().valueOf()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }catch(e){
    console.log(e);
  }
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
  try{
  let target = evt.target;
  $('.lightbox__image').html('');
  $('.lightbox__image').append(`<img src="${target.src}" alt="">`);
  $('.lightbox').fadeIn(100);
  }
  catch(e){
    console.log(e);
  }
}

function imageReply(evt)
{
  try{
  let target = evt.target;
  targetId = target.closest('._message').id;
  //console.log(target.closest('._message').id);
  replyText = 'Image';
  replyTo = $(target).closest('._body').find('.title').text();
  //console.log(replyTo);
  replyTo = replyTo.replace(/ replied to [a-zA-Z]+/g, '');
  let replyToPop = replyTo;
  if (replyToPop == myname) replyToPop = 'You';
  if (replyTo == 'You') replyTo = myname;
  isReply = true;
  $('.toast-popup').show();
  $('.toast-popup-name').html(`<i class="fa-solid fa-reply"></i> Replying to ${replyToPop}`);
  $('.toast-popup-message').text(`Image`);
  $('#textbox').trigger('focus');
  }
  catch(e){
    console.log(e);
  }
}

function textReply(evt)
{
  try{
  let target = evt.target;
  targetId = target.closest('._message').id;
  //console.log(target.closest('._message').id);
  replyText = target.innerText.length > 200 ? `${target.innerText.substring(0, 200)} ...` : target.innerText;
  replyTo = $(target).closest('._body').find('.title').text();
  //console.log(replyTo);
  replyTo = replyTo.replace(/ replied to [a-zA-Z]+/g, '');
  let replyToPop = replyTo;
  if (replyToPop == myname) replyToPop = 'You';
  if (replyTo == 'You') replyTo = myname;
  isReply = true;
  $('.toast-popup').show();
  $('.toast-popup-name').html(`<i class="fa-solid fa-reply"></i> Replying to ${replyToPop}`);
  $('.toast-popup-message').text(target.innerText.length > 50 ? `${target.innerText.substring(0, 50)} ...` : target.innerText);
  $('#textbox').trigger('focus');
  }catch(e){
    console.log(e);
  }
}

function clickOptionHide()
{
  repPop = false;
  unbindClicks();
  $('.click-option').hide();
  $('.reactionContainer').hide();
  $('.reactorContainer').hide();
  //$('.view-action').hide();
  $('.store-action').hide();
  $('.copy-action').hide();
}

function unbindClicks(){
  $('.click-option').unbind('click');
  $('.reactionContainer').unbind('click');
}

function deleteMessage(evt, type){
  try{
    if (type == 'text'){
      targetId = targetId = evt.target.closest('._message').id;
      socket.emit('delete message', targetId, myname);
    }
    else if (type == 'image'){
      targetId = evt.target.closest('._message').id;
      socket.emit('delete image', targetId, myname);
    }
  }catch(e){
    console.log(e);
  }
}

function sendReaction(evt, reaction){
  try{
    targetId = evt.target.closest('._message').id;
    socket.emit('reaction', targetId, myname, reaction);
  }catch(e){
    console.log(e);
  }
}

function lightboxClose()
{
  $('.lightbox').fadeOut(100, ()=>{
    $('.lightbox__image').html("");
  });
}

function clickOptionShow(type, evt1)
{
  repPop = true;
  unbindClicks();
  $('.click-option').show();
  if(type === 'text'){

    $('.store-action').hide();
    $('.copy-action').show();
    $('.delete-action').show();
    $('.reactorContainer').hide();
    $('.click-option').on('click', (evt)=>{
      //console.log(evt.target.classList);
      if (evt.target.classList.contains('fa-reply')){
        textReply(evt1);
        clickOptionHide();
      }
      else if (evt.target.classList.contains('fa-clone')){
        copyText(evt1.target.innerText);
        clickOptionHide();
      }
      else if(evt.target.classList.contains('fa-trash')){
        deleteMessage(evt1, 'text');
        clickOptionHide();
      }
    });
    $('.reactionContainer').on('click', evt => {
      if (evt.target.className.includes('senti')){
        sendReaction(evt1, 'senti');
      }
      else if (evt.target.className.includes('haha')){
        sendReaction(evt1, 'haha');
      }
      else if (evt.target.className.includes('sad')){
        sendReaction(evt1, 'sad');
      }
      else if (evt.target.className.includes('wow')){
        sendReaction(evt1, 'wow');
      }
      else if (evt.target.className.includes('love')){
        sendReaction(evt1, 'love');
      }
      else if (evt.target.className.includes('angry')){
        sendReaction(evt1, 'angry');
      }
      clickOptionHide();
    });
  }
  else if (type === 'image'){

    $('.store-action').show();
    $('.copy-action').hide();
    $('.delete-action').show();
    $('.reactorContainer').hide();
    $('.click-option').on('click', (evt)=>{
      //console.log(evt.target.classList);
      if (evt.target.classList.contains('fa-reply')){
        imageReply(evt1);
        clickOptionHide();
      }
      else if (evt.target.classList.contains('fa-download')){
        $('.lightbox__image').html('');
        $('.lightbox__image').append(`<img src="${evt1.target.src}" alt="">`);
        saveImage();
        clickOptionHide();
      }
      else if(evt.target.classList.contains('fa-trash')){
        deleteMessage(evt1, 'image');
        clickOptionHide();
      }
    });
    $('.reactionContainer').on('click', evt => {
      if (evt.target.className.includes('senti')){
        sendReaction(evt1, 'senti');
      }
      else if (evt.target.className.includes('haha')){
        sendReaction(evt1, 'haha');
      }
      else if (evt.target.className.includes('sad')){
        sendReaction(evt1, 'sad');
      }
      else if (evt.target.className.includes('wow')){
        sendReaction(evt1, 'wow');
      }
      else if (evt.target.className.includes('love')){
        sendReaction(evt1, 'love');
      }
      else if (evt.target.className.includes('angry')){
        sendReaction(evt1, 'angry');
      }
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

function reactOptionShow(evt){
  let target = evt.target.closest('._message').id;
  let emoji = $(`#${target} .react-or-You .emoticon`).text();
  //console.log(emoji);
  let reactionName = $(`#${target} .react-or-You .emoticon`).data('name');
  $(`.reactionContainer > div`).css('background', '');
  if (reactionName){
    $(`.reactionContainer .${reactionName}`).css('background', '#7f7f7fc2');
  }
  //console.log(reactionName);
  $('.reactionContainer').show();
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


function loadReact(id, show = false){
  //console.log(id);
  $('.reactorContainer ul').html('');
  let elem = $(`#${id} .reactor ul`).html();
  $('.reactorContainer ul').append(elem);
  if (show){
    if (elem !== ''){
      $('.reactorContainer').show();
    }
    else{
      $('.reactorContainer').hide();
    }
  }
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
    $('.send').trigger('click');
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

  text = text.replace(/>/gi, "&gt;").replace(/</gi, "&lt;");

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
  $('#textbox').trigger('focus');
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

$('.back').on('click', ()=>{
  window.location.href = '/';
});

const Messages = document.querySelector('#messages'); 
let repPop = false;
//click on image event
Messages.addEventListener('click', (e)=>{
  //console.log(e.target);
  if(e.target.className.includes('image-message')){
    if (!repPop) {
      openImageView(e);
    }
  }
  else if(e.target.className.includes('emo')){
    //console.log(e.target);
    const id = e.target.closest('._message').id;
    //console.log(id);
    clickOptionHide();
    loadReact(id, true);
  }
  else if (e.target.className.includes('replyMessage')) {
    const msgId = e.target.dataset.repid;
    const element = document.getElementById(msgId);
    try{
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
    }
    catch(err){
      popupMessage('Deleted message');
    }
  }
});

window.addEventListener('click', ({target}) => {
  //console.log(target, target.className.includes('reactorContainer') == false && target.className.includes('emo') == false && target.className.includes('react-or-') == false);
  if (target.className.includes('reactorContainer') == false && target.className.includes('emo') == false && target.className.includes('react-or-') == false) {
    $('.reactorContainer').hide();
    //$(`.time`).fadeOut(100);
  }
});

ClickAndHold.applyTo(Messages, 200, function (evt) {
  lightboxClose();
  let target = evt.target;
  if (target.className.includes('textMessage')) {
    clickOptionShow('text', evt);
    reactOptionShow(evt);
    navigator.vibrate(100);
  } else if(target.className.includes('image-message')){
    clickOptionShow('image', evt);
    reactOptionShow(evt);
    navigator.vibrate(100);
  }
});

$('#textbox').on('blur', ()=>{
  $('#textbox').trigger('focus');
});

window.addEventListener('resize',()=>{
  appHeight();
  updateScroll();
});
document.addEventListener('contextmenu', event => event.preventDefault());
appHeight();