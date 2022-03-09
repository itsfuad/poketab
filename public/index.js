const error = document.getElementById('error-callback');

const url = window.location.href;
const error_code = url.substring(url.indexOf('?') + 1);

//console.log(error_code);


if (error_code == 'UE_1'){
    error.innerText = '*Name Exists*';
}
else if (error_code == 'NR_0'){
    error.innerText = '*Name and Key required*';
}
else if (error_code == 'NA_0'){
    error.innerText = '*Select an avatar*';
}
else if (error_code == url){
    error.innerText = '';
}
else{
    error.innerText = '*Unknown Error*';
}


if ('serviceWorker' in navigator){
    
    window.addEventListener('load', () => {
        navigator.serviceWorker
        .register('sw-poketab.js')
        .then(reg => console.log("Service Worker Registered"))
        .catch(err => console.log(`Service Worker: Error ${err}`));
    });
}

function check(){
    //alert("Sen?");
    //check if any radio button is checked
    var radios = document.getElementsByName('avatar');
    var checked = false;
    for (var i = 0; i < radios.length; i++) {
        if (radios[i].checked) {
            checked = true;
            break;
        }
    }
    if (!checked){
        document.getElementById('error-callback').innerText = '*Select an avatar*';
    }
    return checked;    
}