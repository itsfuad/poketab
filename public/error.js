const error = document.getElementById('error-callback');

const url = window.location.href;
const error_code = url.substring(url.indexOf('?') + 1);

console.log(error_code);

if (error_code == 'UE_1'){
    error.innerText = '*Name Exists*';
}
else if (error_code == 'NR_0'){
    error.innerText = '*Name and Room Name required*';
}
else if (error_code == url){
    error.innerText = '';
}
else{
    error.innerText = '*Unknown Error*';
}
