let socket = io();

let pop = new Audio('./../sounds/pop.wav');
let juntos = new Audio('./../sounds/juntos.wav');
let elegant = new Audio('./../sounds/elegant.wav');

const appHeight = () => {
  const doc = document.documentElement
  doc.style.setProperty('--app-height', `${window.innerHeight}px`)
}
window.addEventListener('resize', appHeight);
appHeight();

function scrollToBottom () {
  // Selectors
  let messages = jQuery('#messages');
  let newMessage = messages.children('li:last-child')
  // Heights
  let clientHeight = messages.prop('clientHeight');
  let scrollTop = messages.prop('scrollTop');
  let scrollHeight = messages.prop('scrollHeight');
  let newMessageHeight = newMessage.innerHeight();
  let lastMessageHeight = newMessage.prev().innerHeight();

  if (clientHeight + scrollTop + newMessageHeight + lastMessageHeight >= scrollHeight) {
    messages.scrollTop(scrollHeight);
  }
}

socket.on('connect', function () {
  let params = jQuery.deparam(window.location.search);
  console.log("Connected to server");
  elegant.play();
  socket.emit('join', params, function (err) {
    if (err) {
      alert(err);
      window.location.href = '/';
    } else {
      console.log('No error');
    }
  });
});

socket.on('disconnect', function () {
  console.log('Disconnected from server');
});

socket.on('updateUserList', function (users) {
  let ol = jQuery('<ol></ol>');

  users.forEach(function (user) {
    ol.append(jQuery('<li></li>').text(user));
  });
  jQuery('.menu').text(`Online: ${users.length}`);
  jQuery('.users').html(ol);
});

socket.on('newMessage', function (message) {
  pop.play();
  let formattedTime = moment(message.createdAt).format('h:mm a');
  let template = jQuery('#message-template').html();
  let html = Mustache.render(template, {
    text: message.text,
    from: message.from,
    createdAt: formattedTime,
    firstletter: message.from.charAt(0).toUpperCase()
  });
  //pop.play();
  html = html.replace(/¶/g ,'<br>');
  jQuery('#messages').append(html);
  scrollToBottom();
});

socket.on('my__message', function (message) {
  pop.play();
  let formattedTime = moment(message.createdAt).format('h:mm a');
  let template = jQuery('#my-message-template').html();
  let html = Mustache.render(template, {
    text: message.text,
    from: message.from,
    createdAt: formattedTime
  });
  //pop.play();
  html = html.replace(/¶/g ,'<br>');
  //html = linkify(html);
  //console.log(html);
  jQuery('#messages').append(html);
  scrollToBottom();
});



socket.on('server_message', function(message){
  juntos.play();
  let formattedTime = moment(message.createdAt).format('h:mm a');
  let template = jQuery('#server-message-template').html();
  let html = Mustache.render(template, {
    text: message.text,
    from: message.from,
    createdAt: formattedTime
  });
  html = html.replace(/<p>Welcome/g, `<p style='color: var(--blue);'>Welcome to the chat room!`);
  html = html.replace(/<p>[a-z]+ joined/i, `<p style='color: limegreen;'>${message.from} joined`);
  html = html.replace(/<p>[a-z]+ left/i, `<p style='color: orangered;'>${message.from} left`);
  
  jQuery('#messages').append(html);
  //console.log(html);
  scrollToBottom();
});

socket.on('newLocationMessage', function (message) {
  let formattedTime = moment(message.createdAt).format('h:mm a');
  let template = jQuery('#location-message-template').html();
  let html = Mustache.render(template, {
    from: message.from,
    url: message.url,
    createdAt: formattedTime
  });

  jQuery('#messages').append(html);
  scrollToBottom();
});

jQuery('#message-form').on('submit', function (e) {
  e.preventDefault();
  let messageTextbox = jQuery('[name=message]');
  let text = messageTextbox.val();
  //trim text to 255 charecters
  if (text.length > 10000) {
    text = text.substring(0, 10000);
  }
  //replace all newline with socket.io newline
  text = text.replace(/\n/g, '¶');

  socket.emit('createMessage', {
    text: text
  }, function () {
    //console.log(text);
    messageTextbox.val('')
    //document.getElementById('textbox').style.background = '#f0f';
    document.getElementById('textbox').style.height = '52px';
  });
});

let locationButton = jQuery('#send-location');
locationButton.on('click', function () {
  if (!navigator.geolocation) {
    return alert('Geolocation not supported by your browser.');
  }

  locationButton.attr('disabled', 'disabled').html(`<img id="sendlocation" height='25px' width="25px" src="./icons8-gps-48.png" alt="" srcset="">`);

  navigator.geolocation.getCurrentPosition(function (position) {
    locationButton.removeAttr('disabled').html(`<img id="sendlocation" height='25px' width="25px" src="./icons8-gps-48.png" alt="" srcset="">`);
    socket.emit('createLocationMessage', {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    });
  }, function () {
    locationButton.removeAttr('disabled').html(`<img id="sendlocation" height='25px' width="25px" src="./icons8-gps-48.png" alt="" srcset="">`);
    alert('Unable to fetch location.');
  });
});


jQuery('.menu').on('click', function () {
  jQuery('.menuwrapper').addClass('active');
});

jQuery('.chat').on('click', function () {
  jQuery('.menuwrapper').removeClass('active');
});

jQuery('#textbox').on('focus', function () {
  document.getElementById('textbox').style.background = '#f0f';
  socket.emit('typing', {isTtyping: true});
});

jQuery('#textbox').on('blur', function () {
  document.getElementById('textbox').style.background = '#fff';
  socket.emit('typing', {isTyping: false});
});

socket.on('typingStatus', function(message){
  let template = jQuery('#is-typing-template').html();
  console.log(message);
  let html = Mustache.render(template, {
    from: message.from
  });
  jQuery('#messages').append(html);
  //console.log(html);
  scrollToBottom();
});



$("textarea").each(function () {
  this.setAttribute("style", "height:" + (this.scrollHeight) + "px;overflow-y:hidden;");
}).on("input", function () {
  this.style.height = "auto";
  this.style.height = (this.scrollHeight) + "px";
});

function linkify(inputText) {
  var replacedText, replacePattern1, replacePattern2, replacePattern3;

  //URLs starting with http://, https://, or ftp://
  replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
  replacedText = inputText.replace(replacePattern1, '<a href="$1" target="_blank">$1</a>');

  //URLs starting with "www." (without // before it, or it'd re-link the ones done above).
  replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
  replacedText = replacedText.replace(replacePattern2, '$1<a href="http://$2" target="_blank">$2</a>');

  //Change email addresses to mailto:: links.
  replacePattern3 = /(([a-zA-Z0-9\-\_\.])+@[a-zA-Z\_]+?(\.[a-zA-Z]{2,6})+)/gim;
  replacedText = replacedText.replace(replacePattern3, '<a href="mailto:$1">$1</a>');
  return replacedText;
}

/*
$("textarea").on("keypress", function(e) {
  if (e.keyCode === 13) {
    $(".send").click();
  }
});
*/
