const dropdown = document.querySelector('.drop-down')
const list = document.querySelector('.list')
const selected = document.querySelector('.selected')

dropdown.addEventListener('click',()=>{
    list.classList.toggle('show');
})

list.addEventListener('click',(e)=>{
    const text = e.target.querySelector(".text")
    selected.innerHTML = text.innerHTML;
})