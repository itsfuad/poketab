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