
export let startingBoard = [
  ['o','o','o','o','o','o','o','o','o','o','o','o'],
  ['pit',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ','pit'],
  ['pit',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ','pit'],
    ['pit',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ','pit'],
    ['pit',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ','pit'],
    ['pit',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ','pit'],
    ['pit',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ','pit'],
    ['pit',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ','pit'],
    ['pit',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ','pit'],
    ['pit',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ','pit'],
    ['pit',' ',' ',' ',' ',' ',' ',' ',' ',' ',' ','pit'],
    ['pit','pit','pit','pit','pit','pit','pit','pit','pit','pit','pit','pit'],
  ]
export let startingDeck = [['move', 1], ['move', 1], ['move', 1], ['move', 2], ['move', 2], ['move', 2], ['turn', 1], ['turn', 1], ['turn', 1], ['turn', -1], ['turn', -1], ['turn', -1],['turn', 2], ['repeat', 'x'], ['repeat', 'x'], ['move', -1]]
//export let startingDeck = [['move', 2],['move', 2],['move', 2],['move', 2],['move', 2],['move', 2],['move', 2],['move', 2], ['move', 2],['move', 2], ['move', 1], ['move', 1],['move', 1], ['move', 1], ['move', 1],['move', 1], ['move', 1], ['move', 1],]

export function orientationToString(newPos){
  return newPos === 0 || newPos === -4 || newPos === 4 ? 'up' : (newPos === -1 || newPos === 3)? 'left' : (newPos === -2 || newPos === 2)? 'down' : 'right'
  }
  
  export function shuffle(array) {
     let newArray = JSON.parse(JSON.stringify(array))
     for (let i = newArray.length - 1; i > 0; i--) {
       let j = Math.floor(Math.random() * (i + 1));
       [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
     }
     return newArray;
   }


export function findEmptyStartingPos(board){
      let startingPos = [[7,2],[7,4],[7,6],[7,8]];
    let foundEmpty = false;
    let pos;
    for(let i=0;i<startingPos.length && !foundEmpty; i++){
      if(board[startingPos[i][0]][startingPos[i][1]] === ' '){
        foundEmpty = true;
        pos = startingPos[i];
      }
    }
    return pos
  }

// export function reallyStartingGame(){
//     setBoard(startingBoard)
//     room.users.forEach((player, index)=>{
//       let startingPos = [[7,2],[7,4],[7,6],[7,8]][index];
//         let newBoard = JSON.parse(JSON.stringify(board));
//         newBoard[startingPos[0]].splice(startingPos[1], 1, player.robot);
//         setBoard(newBoard)
//         setPlayers(prevState=>[...prevState, {name:player.robot, orientation:'up', pos:[startingPos[0], startingPos[1]], actions:[['nothing',0],['nothing',0],['nothing',0],['nothing',0],['nothing',0]], deck:shuffle(startingDeck), handCards:[], cardPicked:''}])
//       });
//   }


//   searchRandomCard = (iRobot, iAct)=>{
//     setState(prevState=>{
//       let newRobots = prevState.robots;
//       let iCard;
//       while(!iCard || newRobots[iRobot].handCards[iCard][0] === 'nothing'){iCard = Math.floor(Math.random() * 8)};
//       let newHandCards = newRobots[iRobot].handCards.map((card, index)=>index === iCard ? ['nothing', 0] : card)
//       let newActions = newRobots[iRobot].actions.map((card, index)=>index === iAct ? [newRobots[iRobot].handCards[iCard][0],newRobots[iRobot].handCards[iCard][1]]: card)
//       newRobots = newRobots.map((robot, index)=>index === iRobot ? {...newRobots[iRobot], handCards:newHandCards, actions:newActions} : robot)
//       return {robots:newRobots}
//       })
//   }

//   // addRandomActions = ()=>{
//   //   state.robots.forEach((robot, iRobot)=>{
//   //     newActions = robot.actions.forEach((action, iAct)=>{
//   //       if(action[0]==='nothing'){
//   //         searchRandomCard(iRobot, iAct)
//   //       }
//   //     })
//   //   })
//   // }
  
//   handleActions = async (i=0)=>{
//       if(i>4){console.log(state.robots);return}
//       let time = (state.robots.reduce((acc, robot)=>acc+robot.actions[i][1],0)*500)+2000;
//       let handleByRobot = async (index=0)=>{
//         if(index>3){return};
//         const [action, number] = state.robots[index].actions[i][0]==='repeat'? state.robots[index].actions[i-1] : state.robots[index].actions[i] ;
//         await action === 'move' ? handleMove(number, index) : action === 'turn'? handleRotate(number, index) : handleMove(1, index);
//         await setTimeout(() => {handleByRobot(index+1)}, 1000);
//       }
//       handleByRobot()
//     await setTimeout(() => {handleActions(i+1)}, time);
//   }

//   handleMove = async(num, index) => {
//       let newNum = num === -1? -1 : 1;
//       num=Math.abs(num);
//       if(!num)return;
//       const {orientation, pos} = state.robots[index];
//       let y = pos[0];
//       let x = pos[1];
//       newNum = orientation === 'up' || orientation === 'right'? newNum : -newNum;
//       let newY = y;
//       let newX = x;
//       orientation === 'up' || orientation === 'down' ?  newY -=newNum : newX+=newNum;
//       setState(prevState=>{
//         let newBoard =JSON.parse(JSON.stringify(prevState.board));
//         let newRobots =JSON.parse(JSON.stringify(prevState.robots));
//         if(newBoard[newY][newX]===' '){
//           newBoard[y].splice(x, 1, ' '); 
//           newBoard[newY].splice(newX, 1, 'r');
//           newRobots.splice(index, 1, {...newRobots[index], pos:[newY, newX]}); 
//           return {board:newBoard, robots: newRobots};
//         } else if(newBoard[newY][newX]==='pit'){
//           let startingPos = findEmptyStartingPos()
//           newBoard[y].splice(x, 1, ' '); 
//           newBoard[startingPos[0]].splice(startingPos[1], 1, 'r');
//           newRobots.splice(index, 1, {...newRobots[index], pos:[startingPos[0],startingPos[1]]});
//           return {board:newBoard, robots: newRobots};
//         } else if(newBoard[newY][newX]==='r'){
//           let evenNewerY = y=== newY? y : y<newY? newY+1 : newY-1;
//           let evenNewerX = x=== newX? x : x<newX? newX+1 : newX-1;
//           if(newBoard[evenNewerY][evenNewerX] !== 'o'){
//             let indexOther = state.robots.find(robot=>robot.pos[0] === newY && robot.pos[1] === newX)
//             newBoard[y].splice(x, 1, ' '); 
//             newBoard[newY].splice(newX, 1, 'r'); 
//             newRobots.splice(index, 1, {...newRobots[index], pos:[newY, newX]}); 
//             if(newBoard[evenNewerY][evenNewerX] === ' '){
//               newRobots.splice(indexOther, 1, {...newRobots[indexOther], pos:[evenNewerY,evenNewerX]}); 
//               newBoard[evenNewerY].splice(evenNewerX, 1, 'r');
//             } else {
//               let startingPos = findEmptyStartingPos();
//               newRobots.splice(indexOther, 1, {...newRobots[indexOther], pos:[startingPos[0], startingPos[1]]}); 
//               newBoard[startingPos[0]].splice(startingPos[1], 1, 'r');
//             }
//             return {board:newBoard, robots:newRobots};
//           }
//         }
//       })
//       await setTimeout(() => {handleMove(num-1, index)}, 500);
//   }

//   handleRotate(rotate, index){//=== +- 1 o 2
//     const {orientation} = state.robots[index];
//     const numPos = orientation === 'up' ? 0 : orientation === 'left' ? -1 :  orientation === 'right' ? 1 : 2;
//     const newPos = orientationToString(numPos + rotate)
//     setState(prevState=>{
//       let newRobots = prevState.robots;
//       newRobots.splice(index, 1, {...newRobots[index], orientation:newPos}); 
//       return {robots:newRobots}
//     })
//   }

//   allDraw(){
//     state.players.forEach(player=>{
//       draw(player.robot)
//     })
//     console.log(state.robots)
//   }

//   draw(player){
//     let indexPlayer = state.robots.findIndex(robot=>robot.name===player);
//     let objPlayer = state.robots.find(robot=>robot.name===player);
//     let newDeck = objPlayer.deck.length? shuffle(JSON.parse(JSON.stringify(objPlayer.deck))) : JSON.parse(JSON.stringify(state.deck));
//     let handCards = newDeck.splice(0, 8); 
//     setState(prevState=>{
//       let newRobots =JSON.parse(JSON.stringify(prevState.robots));
//       newRobots.splice(indexPlayer, 1, {...newRobots[indexPlayer], deck:newDeck, handCards}); 
//       return {robots:newRobots};
//     })
//   }

//   cardPicked(iRobot, fromWhere, iCard){
//     let robot = JSON.parse(JSON.stringify(state.robots[iRobot]));
//     let newRobots =JSON.parse(JSON.stringify(state.robots));
//     if(robot.cardPicked.length){
//       if(robot.cardPicked[0] === 'handCards' && fromWhere === 'handCards')
//       {
//         newRobots.splice(iRobot, 1, {...newRobots[iRobot], cardPicked:[fromWhere, iCard]})
//         setState({robots:newRobots})
//       } else{
//         let newActions = robot.actions;
//         let newHandCards = robot.handCards;
//         if(robot.cardPicked[0] === 'actions' && fromWhere === 'actions'){
//           newActions = newActions.map((action, index)=>{
//             console.log(index, action, iCard, robot.cardPicked[1])
//             if(index === iCard){return robot[robot.cardPicked[0]][robot.cardPicked[1]] }
//             else if(index === robot.cardPicked[1]){return robot[fromWhere][iCard]}
//             else {return action}
//           })
//         } else if(robot.cardPicked[0] === 'handCards'){
//           newHandCards = newHandCards.map((card, index)=>index===robot.cardPicked[1]?robot[fromWhere][iCard] : card);
//           newActions.splice(iCard, 1, robot[robot.cardPicked[0]][robot.cardPicked[1]])
//         } else{    
//           newHandCards = newHandCards.map((card, index)=>index===iCard? robot[robot.cardPicked[0]][robot.cardPicked[1]] : card);      
//           newActions.splice(robot.cardPicked[1], 1, robot[fromWhere][iCard])
//         }
//           newRobots.splice(iRobot, 1, {...newRobots[iRobot], handCards: newHandCards, actions: newActions, cardPicked:''}); 
//           setState({robots: newRobots})
//         }
//     }else {
//       newRobots.splice(iRobot, 1, {...newRobots[iRobot], cardPicked:[fromWhere, iCard]})
//       setState({robots:newRobots})
//     }
//   }

