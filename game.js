//require syntax
require(['./raphael-min'],function(raphael){
	// Creates canvas  at 10, 50
var paper = Raphael(0, 50, 600, 600);
var chessDectSize = 9;//nxn
var latticeRadius = 10;
var latticeDiameter = 2*latticeRadius;
var latticeFreeColor= "#f00";;
var latticeFoucedColor="#fff";
var marginBetweenLattice=latticeRadius/4;
var offsetToNearbyRows=latticeRadius + marginBetweenLattice/2;
var freeStateTagInMatrix = false;
var focuedStateTagInMatrix = true;
var reservedPositionForCatX = Math.ceil(chessDectSize/2);
var reservedPositionForCatY = reservedPositionForCatX;
var startX=30;
var startY=30;
var controller = createController();


function createChessDeck(n,controllerRecallFunc){
	var controllerObj = this;
	controllerObj.controllerRecallFunc = controllerRecallFunc;
	controllerObj.addControllerRecallFunc = function(func){
    	controllerObj.controllerRecallFunc = func;
    }
	//create an nxn chess deck
	var lattices=[];
	var latticeHasBeenClicked = [];
	for(var i=0;i<n;i++){
		var newRowState = []
		for (var j=0;j<n;j++){
			newRowState.push(freeStateTagInMatrix);
		}
		latticeHasBeenClicked.push(newRowState);
	}
	for(var i=0;i<n;i++){
		var x=startX - (i%2)*offsetToNearbyRows;
		var y=startY + i*(marginBetweenLattice+latticeDiameter);
		var newRowOfChessboard = [];
		for(var j=0;j<n;j++){
			var circle = paper.circle(x,y,latticeRadius);
			//action of circle's state tranform
			circle.onFreeState = function(){
				this.attr("fill",latticeFreeColor);
				this.isFocused = freeStateTagInMatrix;
				latticeHasBeenClicked[this.xInChess-1][this.yInChess-1] = freeStateTagInMatrix;//coordinate start with 1 while array start with 0
			}
			circle.onFoucedState = function(){
				this.attr("fill",latticeFoucedColor);
				this.isFocused = focuedStateTagInMatrix;
				latticeHasBeenClicked[this.xInChess-1][this.yInChess-1] = focuedStateTagInMatrix;//coordinate start with 1 while array start with 0
			}
			//action of  player's movement
			circle.click(function(e){
				this.onFoucedState();
				controllerObj.controllerRecallFunc(this.xInChess,this.yInChess);//the x, y in the chess desk , treat left top as origin
			});
            //set default state            
            circle.xInChess = j+1;//the coordinate in chess desk start with 1 not 0
			circle.yInChess = i+1;
			circle.onFreeState();		
			//record the circle
			newRowOfChessboard.push(circle);
			//net lattice's x postion
			x = x + marginBetweenLattice + latticeDiameter;
		}
		lattices.push(newRowOfChessboard);
	}

	return {boardObj: controllerObj,latticesArr:lattices,latticeHasBeenClicked: latticeHasBeenClicked};
}//end createChessDeck

function createCatElemnt(customCoordinateX,customCoordianteY){
	var catObj = this;
	catObj.catCoordiantePostion = {x:customCoordinateX , y:customCoordianteY};
	var catCanvasPostion = getPixelPosition(customCoordinateX,customCoordianteY);
    var cat = paper.circle(catCanvasPostion.x,catCanvasPostion.y,latticeRadius);
    var animationTime = 2e2;
    cat.attr("fill","#000");
    function checkState(){}

	catObj.moveTo = function (coordinatePostionObj){
		catObj.catCoordiantePostion = coordinatePostionObj;
		var position=getPixelPosition(coordinatePostionObj.x,coordinatePostionObj.y);
		var anim = Raphael.animation({cx:position.x , cy:position.y},animationTime);
		cat.animate(anim);
	}
	return catObj;
}

function createController(){
	var userClickx = 0;
	var userClicky = 0;
	var chessDeckArg = createChessDeck(chessDectSize);
	var chessDeck = chessDeckArg.boardObj;
	var cat = createCatElemnt(reservedPositionForCatX,reservedPositionForCatY);
	var playerStepCounts=0;
	//cat.moveTo({x:1,y:1});

	initializeChessDeck(chessDeckArg.latticesArr);
    
    //add reaction for player's click to the global environment
    chessDeck.addControllerRecallFunc(function actionForUserClick(i,j){
		userClickx=i;
		userClicky=j;
		var effectOfThisStep = catMove();

		if(effectOfThisStep.hasWayAvailable){
			playerStepCounts = playerStepCounts+1;
		}else{
			alert("You catch the cat use "+playerStepCounts+"steps!Congrationlations!");
		}

		if(effectOfThisStep.doesEscaped){
			alert("Game over! The cat escaped! x_x!!");
		}

		//restart the game if game over
		if(effectOfThisStep.doesEscaped || !effectOfThisStep.hasWayAvailable){
			var newGameController = createController();
		}
	});

	function catMove(){
		var doesEscaped = false;
		//use greed algrithom,the cat only consider it's neighbore lattices
		var catX=cat.catCoordiantePostion.x;
		var catY=cat.catCoordiantePostion.y;
		//we randomly choose a way that is available
		var hasWayAvailable = false;
		var wayAvailable = [];
		//check the surrondings
		var rowType= catY%2 - 1;
		var prePointSameRow = {x:catX-1 , y: catY};
		var nextPointSameRow = {x:catX+1 , y: catY};
		var prePointPreRow = {x:catX + rowType , y: catY -1};//rowType =1, catX is even row, x:catX; rowType =0,catX is odd, x:catX-1
		var nextPointPreRow = {x:catX + rowType + 1 , y: catY - 1};
		var prePointNextRow = {x:catX + rowType , y: catY + 1};
		var nextPointNextRow = {x:catX + rowType + 1 , y: catY + 1};
		var surrongdingCircles = [prePointPreRow,nextPointPreRow,prePointSameRow,nextPointSameRow,prePointNextRow,nextPointNextRow];

		for(var i=0;i<6;i++){
			var tempCircle = surrongdingCircles[i];
			if((tempCircle.x > 0) && (tempCircle.y >0) && (tempCircle.x <= chessDectSize) && (tempCircle.y <= chessDectSize)){
				if(!chessDeckArg.latticeHasBeenClicked[tempCircle.x-1][tempCircle.y-1]){//array start with 0 ,while chess coordinate starts with 1
					hasWayAvailable = true;
					wayAvailable.push(tempCircle);
				}
			}else{//the cat can escape from the chessboard
				//console.log(i);
				//console.log(cat.catCoordiantePostion);
				//console.log(rowType);
				//console.log(cat.catCoordiantePostion.x-rowType);
				//console.log(tempCircle);
				//console.log(surrongdingCircles);
				//game over the cat escaped!
				doesEscaped = true;
				break;
			}
		}


		if(hasWayAvailable){
			var wayCounts = wayAvailable.length;
			var choice = Math.ceil(Math.random()*(wayCounts-1));
			console.log(prePointPreRow);
			console.log(nextPointPreRow);
			console.log(prePointSameRow);
			console.log(cat.catCoordiantePostion);
			console.log(nextPointSameRow);
			console.log(prePointNextRow);
			console.log(nextPointNextRow);
			console.log(wayAvailable);
			console.log("=====")
			cat.moveTo(wayAvailable[choice]);
		}
		return {hasWayAvailable:hasWayAvailable , doesEscaped:doesEscaped};
	}
}

function initializeChessDeck(chessDeckLattices){
		var latticeCounts = chessDectSize*chessDectSize;
		var leastFocusedCounts = Math.ceil(latticeCounts/16);
		var maxiumIncremtalFocusedCounts = Math.ceil(latticeCounts/5) - leastFocusedCounts;
		var focusedCircleCounts = Math.ceil(Math.random()*maxiumIncremtalFocusedCounts + leastFocusedCounts);
		
		for(var i=0;i<focusedCircleCounts;i++){
			var position = Math.ceil(Math.random()*(latticeCounts-1));
			var xpos = position%chessDectSize;
			var ypos = Math.floor(position/chessDectSize);
            var reservedX=reservedPositionForCatX-1;//index for array, starts with 0
            var reservedY=reservedPositionForCatY-1;

            if(xpos==reservedX && ypos==reservedY){
            	i=i-1;
            	continue;
            }
			if(!chessDeckLattices[xpos][ypos].isFocused){
				chessDeckLattices[xpos][ypos].onFoucedState();
			}else{
				i=i-1;
			}
		}
}
//accept the x,y in coordinate
function getPixelPosition(x,y){
	//x,y is the position of coordinate of chess desk
	//we need transform them to pixel position in canvas
	xp = startX - ((y-1)%2)*offsetToNearbyRows + (x-1)*(marginBetweenLattice + latticeDiameter);
	yp = startY + (y-1)*(marginBetweenLattice + latticeDiameter);
	return {x:xp,y:yp};
}
});