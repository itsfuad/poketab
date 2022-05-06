"use strict";

let socket = io();

let e_users = [];
let e_avatars = [];


$('#next').on('click',()=>{
    //alert('sadasd');
   
    const key_format = /^[0-9a-zA-Z]{3}-[0-9a-zA-Z]{3}-[0-9a-zA-Z]{3}-[0-9a-zA-Z]{3}$/;
    let key = $('#key').val();
    if (key === '') {
        errorLog('key-error', '*Key is required <i class="fa-solid fa-triangle-exclamation" style="color: orange;"></i>')
        return;
    }
    //check if key is in xxx-xxx-xxx-xxx format
    if (!key_format.test(key)){
        errorLog('key-error', 'Invalid key <i class="fa-solid fa-triangle-exclamation" style="color: orange;"></i>');
        return;
    }
    else{
        $('#key-label').css('color','white');
        $('#key-label').html('Checking <i class="fa-solid fa-circle-notch fa-spin"></i>');
        socket.emit('joinRequest', key, function(err){
            if (err){
                console.log(err);
                $('#key-label').html('Chat Key <i class="fa-solid fa-key"></i>');
                errorLog('key-error', 'Invalid key <i class="fa-solid fa-triangle-exclamation" style="color: orange;"></i>');
            }
        });
    }
});

socket.on('joinResponse', (keyExists, users, avatars, maxuser) => {
    //console.log(maxuser);
    
    $('#key-label').html('Chat Key <i class="fa-solid fa-key"></i>');
    if (!keyExists){
        errorLog('key-error', 'Key does not exists <i class="fa-solid fa-ghost" style="color: white;"></i>');
     }
     else{
         e_users = users;
         e_avatars = avatars;
         if(e_users.length >= maxuser){
             $('.form-2').html("<img src='/images/sad-cry.gif' loop=infinite height='80px' width='80px'><p>Access denied on this Key</p><a href='/' style='color: var(--blue);'>Back</a>");
             $('.form-2').css({'text-align':'center','color': 'red', 'display': 'flex','flex-direction': 'column', 'gap': '20px', 'justify-content': 'center', 'align-items': 'center'});
             $('.form-2 img').css('border-radius','50%');
         }
         e_avatars.forEach(avatar => {
             $(`label[for='${avatar}']`).hide();
         });
         $('.form-1').hide(100);
         $('.howtouse').hide(100);
         $('.form-2').show(100);
     }
});

function errorLog(target, msg){
    $(`#${target}`).html(msg);
}

function check(){
    //alert("Sen?");
    //check if any radio button is checked
    errorLog('username-error', '');
    errorLog('avatar-error', '');
    let allow = false;
    let name = $('#name').val().trim();
    $('#name').val(name);
    let nameRegex = /^[a-zA-Z]{3,20}$/;
    if (name === '') {
        errorLog('username-error', '*Name is required');
        allow = false;
        return allow;
    }
    else if(name.length < 3 || name.length > 20){
        errorLog('username-error', '*Name must be between 3 and 20 characters');
        allow = false;
        return allow;
    }
    else{
        //if e_users array contains name
        if (e_users.includes(name)){
            errorLog('username-error', 'Username exists <i class="fa-solid fa-triangle-exclamation" style="color: orange;"></i>');
            allow = false;
            return allow;
        }
        else if (!nameRegex.test(name)){
            errorLog('username-error', 'Username can contain only letters <i class="fa-solid fa-triangle-exclamation" style="color: orange;"></i>');
            allow = false;
            return allow;
        }
        else{
            allow = true;
        }
    }
    let radios = document.getElementsByName('avatar');
    let checked = false;
    for (var i = 0; i < radios.length; i++) {
        if (radios[i].checked) {
            checked = true;
            break;
        }
    }
    if (!checked){
        errorLog('avatar-error', 'Select avatar <i class="fa-solid fa-triangle-exclamation" style="color: orange;"></i>');
    }
    if (allow && checked){
        $('#join').val('Joining...');
        setTimeout(()=>{
            $('#join').val('Join');
        }, 2000);
    }
    return (allow && checked);
}


if ('serviceWorker' in navigator){
    
    window.addEventListener('load', () => {
        navigator.serviceWorker
        .register('serviceWorkerPoketab.js')
        .then(reg => console.log("Service Worker Registered"))
        .catch(err => console.log(`Service Worker: Error ${err}`));
    });
}

if (navigator.onLine) {
  console.log('online');
  $('.offline').fadeOut(400);
} else {
  console.log('offline');
  $('.offline').html('You are offline <i class="fa-solid fa-triangle-exclamation" style="color: orange;"></i>');
  $('.offline').css('background', 'orangered');
  $('.offline').fadeIn(400);
}

window.addEventListener('offline', function(e) { 
  console.log('offline'); 
  $('.offline').html('You are offline <i class="fa-solid fa-triangle-exclamation" style="color: orange;"></i>');
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

document.addEventListener('contextmenu', event => event.preventDefault());
