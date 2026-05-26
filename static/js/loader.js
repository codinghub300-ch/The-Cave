let progress = document.querySelector(".progress");

let width = 0;

let interval = setInterval(() => {

width += 1;

progress.style.width = width + "%";

if(width >= 100){

clearInterval(interval);

setTimeout(()=>{
window.location.href="/home";
},500);

}

},40);