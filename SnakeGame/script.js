// Game constants & variables
let inputDir = {x:0 , y:0};
const foodsound = new Audio('food.mp3');
const gameoversound = new Audio('gameover.mp3');
const movesound = new Audio('move.mp3');
const musicsound = new Audio('musicsound.mp3');
let speed = 10;
let lastpainttime = 0;
let snakeArr = [{x:13, y:15}];
let food = {x:6, y:8};
let score = 0;
musicsound.play();


// Game functions
function main(ctime){
    window.requestAnimationFrame(main);
    if((ctime-lastpainttime)/1000< 1/speed){
        return;
    }
    lastpainttime = ctime;
    gameEngine();
}
function isCollide(snake){

    //if you bump into your snake
    for(let i=1; i<snakeArr.length; i++){
        if(snake[i].x === snake[0].x && snake[i].y === snake[0].y){
            return true;
        }
    }
    //if you bump into the wall
    if(snake[0].x >= 18 || snake[0].x <= 0 || snake[0].y >= 18 || snake[0].y <= 0){
        return true;
    }
    
}
function gameEngine(){

    //Part 1: Updating the snake array means position of snake body parts
    if(isCollide(snakeArr)){
        gameoversound.play();
        musicsound.pause();
        inputDir = {x: 0, y: 0};
        alert("Game over. Press any key to restart thes game");
        snakeArr = [{x: 13, y: 15}];
        musicsound.play();
        score = 0;

        
    }
    //if snake eat the food , increase the score and regenerate the food
    if(snakeArr[0].y === food.y && snakeArr[0].x === food.x){
        foodsound.play();
        score += 1;
        if(score>highscoreval){
            highscoreval = score;
            localStorage.setItem("highscore",JSON.stringify(highscore));
            highscorebox.innerHTML = "HighScore:" + highscoreval
        }
        scorebox.innerHTML ="Score:" + score;
        snakeArr.unshift({x:snakeArr[0].x + inputDir.x, y:snakeArr[0].y + inputDir.y});
        let a = 2;
        let b = 16;
        food ={x: + Math.round(a+(b-a)*Math.random()), y: + Math.round(a+(b-a)*Math.random())}
    }

    //Moving the snake
    for(let i=snakeArr.length-2; i>=0; i--){
        snakeArr[i+1] = {...snakeArr[i]};    //to solve reference problem
    }
    snakeArr[0].x += inputDir.x;
    snakeArr[0].y += inputDir.y;

    //Part 2 :Display the snake and food
    //Display the snake
    board.innerHTML = "";
    snakeArr.forEach((e,index)=>{
        snakeElement = document.createElement('div');
        snakeElement.style.gridRowStart = e.y;
        snakeElement.style.gridColumnStart = e.x;
        
        if(index ==0){
            snakeElement.classList.add('head');
        }
        else{
            snakeElement.classList.add('snake');
        }
        board.appendChild(snakeElement);

    })

    //Display the food
    foodElement = document.createElement('div');
    foodElement.style.gridRowStart = food.y;
    foodElement.style.gridColumnStart = food.x;
    foodElement.classList.add('food');
    board.appendChild(foodElement);
}






// Game main logic
let highscore = localStorage.getItem("highscore");
if(highscore === null){
    let highscoreval = 0;
    localStorage.setItem("highscore",JSON.stringify(highscore));
}
else{
    highscoreval = JSON.parse(highscore);
    highscorebox.innerHTML = "HighScore:" + highscore;
}
window.requestAnimationFrame(main);
window.addEventListener('keydown',e=>{
    
    // Start the game
    inputDir = {x:0, y:1}
    movesound.play();
    switch (e.key) {
        case "ArrowUp":
            console.log("ArrowUp");
            inputDir.x = 0;
            inputDir.y = -1;
            break;

        case "ArrowDown":
            console.log("ArrowDown");
            inputDir.x = 0;
            inputDir.y = 1;
            break;

        case "ArrowLeft":
            console.log("ArrowLeft");
            inputDir.x = -1;
            inputDir.y = 0;
            break;

        case "ArrowRight":
            console.log("ArrowRight");
            inputDir.x = 1;
            inputDir.y = 0;   
            break;
    
        default:
            break;
    }
});
