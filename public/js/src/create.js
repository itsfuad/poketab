"use strict";

let socket = io();

let e_users = [];
let e_avatars = [];


$('#key').on('click', ()=>{
    let text = `${location.origin}/login/${$('#key').val()}`;
    //console.log(`${location.href}/${text}`);
    navigator.clipboard.writeText(text);
    //alert('Copied to clipboard');
    $('#key-label').css('color', 'limegreen');
    $('#key-label').html('Copied <i class="fa-solid fa-check"></i>');
    setTimeout(()=>{
        $('#key-label').css('color', 'white');
        $('#key-label').html('Tap to Copy <i class="fa-regular fa-clone"></i>');
    }, 2000);
});

//slider on input
$('#maxuser').on('input', ()=>{
    $('#rangeValue').text($('#maxuser').val());
});

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
        errorLog('key-error', 'Invalid key <i class="fa-solid fa-triangle-exclamation" style="color: orange;"></i>')
        return;
    }
    else{
        $('#key-label').css('color','white');
        $('#key-label').html('Checking <i class="fa-solid fa-circle-notch fa-spin"></i>');
        socket.emit('createRequest', key, function(err){
            if (err){
                $('#key-label').html('Chat Key <i class="fa-solid fa-key"></i>');
                errorLog('key-error', 'Expired key <i class="fa-solid fa-triangle-exclamation" style="color: orange;"></i>');
                $('#next').val('Reload');

                //remove event listener
                $('#next').off('click');
                $('#next').on('click', ()=>{
                    location.reload();
                });
            }
        });
    }
});

socket.on('createResponse', (keyExists, users, avatars) => {
    $('#key-label').html('Chat Key <i class="fa-solid fa-key"></i>');
    if (keyExists){
        errorLog('key-error', 'Key does already exists <i class="fa-solid fa-triangle-exclamation" style="color: orange;"></i>');
    }
    else{
        e_users = users;
        e_avatars = avatars;
        if (e_avatars){
            e_avatars.forEach(avatar => {
                $(`label[for='${avatar}']`).hide();
            });
        }
        $('.form-1').hide(100);
        $('.howtouse').hide(100);
        $('.form-2').show(100);
    }
});