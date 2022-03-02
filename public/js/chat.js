let socket = io();

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
  let formattedTime = moment(message.createdAt).format('h:mm:ss a');
  let template = jQuery('#message-template').html();
  let html = Mustache.render(template, {
    text: message.text,
    from: message.from,
    createdAt: formattedTime
  });

  jQuery('#messages').append(html);
  scrollToBottom();
});

socket.on('newLocationMessage', function (message) {
  let formattedTime = moment(message.createdAt).format('h:mm:ss a');
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
  if (text.length > 1000) {
    text = text.substring(0, 1000);
  }
  //replace all newline with socket.io newline
  //text = text.replaceAll(/\n/g, '');
  socket.emit('createMessage', {
    text: text
  }, function () {
    console.log(text);
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


$("textarea").each(function () {
  this.setAttribute("style", "height:" + (this.scrollHeight) + "px;overflow-y:hidden;");
}).on("input", function () {
  this.style.height = "auto";
  this.style.height = (this.scrollHeight) + "px";
});

const appHeight = () => {
  const doc = document.documentElement
  doc.style.setProperty('--app-height', `${window.innerHeight}px`)
}
window.addEventListener('resize', appHeight)
appHeight()