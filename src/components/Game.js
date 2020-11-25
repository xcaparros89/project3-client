import React, { Component, useEffect, useState, useRef } from "react";
import { withAuth } from "../lib/AuthProvider";
import { io } from "socket.io-client";
import { Link, useHistory } from "react-router-dom";
import axios from "axios";
import './Game.css'
import {startingBoard, startingDeck, shuffle, orientationToString, findEmptyStartingPos} from '../utils/gameAct'
import Draggable from 'react-draggable'; 

//const socket = io(process.env.REACT_APP_API_URL, {
const socket = io("http://localhost:4000", {
  transports: ["websocket", "polling"],
});
const Game = (props) => {
  const robotChoice= ['x', 'y', 'z', 'a', 's', 'd', 'f', 'j','1','2','3','4'];
  const history = useHistory();
    const [room, setRoom] = useState({name:props.user.username, id:props.match.params.id, users:[], messages:[]})
    const [ready, setReady] = useState(false);
    const [creator, setCreator] = useState('');
    const [start, setStart] = useState(false);
    const robots = ['x', 'y', 'z', 'a', 's', 'd', 'f', 'j']
    const [players, setPlayers] = useState([]);
    const [board, setBoard] = useState([]);
    const [yourActions, setYourActions] = useState({actions:[['disabled',0],['disabled',0],['disabled',0],['disabled',0],['disabled',0]], handCards:[['disabled',0],['disabled',0],['disabled',0],['disabled',0],['disabled',0],['disabled',0],['disabled',0],['disabled',0]], cardPicked:''})
    const [robotChosen, setRobotChosen] = useState('')
    const [id, setId] = useState('');
    const [disabled, setDisabled] = useState([])
    const [counter, setCounter] = useState(0);

    useEffect(() => {
        if(props.history.location.state){ setCreator(props.history.location.state.creator)};
        socket.emit("join", { username: props.user.username, room: props.match.params.id});
        socket.on('roomUsers', ({users, username, id}) =>{setRoom(prevRoom=>({...prevRoom, users})); if(id && username === props.user.username)setId(id)});
        socket.on('message',message=>{
            setRoom(prevState=>({...prevState, messages:[...prevState.messages, message]}))
            //Scroll down
            const chatMessages = document.querySelector('.chat-messages')
            if(chatMessages){chatMessages.scrollTop = chatMessages.scrollHeight};
          });
          socket.on('bye', ({id})=>{if(id===socket.id){history.push({pathname: `/allRooms`})}})

          
          socket.on('startGame', ({game})=>{
            setPlayers(game.players);
            setBoard(game.board);
            setStart(true)
            let newYourActions = game.players.find(player=>player.id === socket.id)
            setYourActions({actions: newYourActions.actions, handCards:newYourActions.handCards, cardPicked:''})
          })
          
          socket.on('startTurn', ({game})=>{
            setPlayers(game.players);
            setBoard(game.board);
            setDisabled([])
            let newYourActions = game.players.find(player=>player.id === socket.id)
            setYourActions({actions: newYourActions.actions, handCards:newYourActions.handCards, cardPicked:''})
          })

          socket.on('cardAdded', ({game})=>{
            console.log(game, 'cardAdded')
          })//ES POT BORRAR, DEIXAR PER ARA PER TESTS

          socket.on('addedAllActions', ({game})=>{
            let newYourActions = game.players.find(player=>player.id === socket.id)
            setYourActions({actions: newYourActions.actions, handCards:newYourActions.handCards, cardPicked:''});
            handleActions(0, 0, game.players, game.board, false);
            console.log(game)
          })

          socket.on('startCountdown', ()=>{
            console.log('before disable')
            setCounter(10)
            setDisabled(prevDisabled=>[...prevDisabled, 'endTurn'])
            setTimeout(()=>setDisabled(prevDisabled=>[...prevDisabled, 'clickCard']), 10000);
            console.log('after disable')
          })
        
          socket.on('finishGame',({winner, newBoard, newPlayers})=>{
            console.log('the winner is: ', winner)
            alert('the winner is: ', winner)
          })

          socket.on('doActions',({newIPlayer, newIAction, newBoard, newPlayers, isTwo, creator})=>{
            handleActions(newIPlayer, newIAction, newPlayers, newBoard, isTwo, creator)
          })

          document.body.classList.remove('home');
        return () => {
            socket.close();
        }
    }, [])

    useEffect(()=>{counter > 0 && setTimeout(() => setCounter(counter - 1), 1000)}, [counter])

    let handleActions = (iPlayer, iAction, newPlayers, newBoard, isTwo) =>{
      let newHandle
      const [action, number] = newPlayers[iPlayer].actions[iAction][0]!=='repeat'? newPlayers[iPlayer].actions[iAction] : iAction === 0 || newPlayers[iPlayer].actions[iAction-1][0] ==='repeat' ? ['disabled', 0] : newPlayers[iPlayer].actions[iAction-1];

      if(action === 'move'){
        newHandle = handleMove(number, iPlayer, newPlayers, newBoard)
      } else if(action === 'turn'){
        newHandle = handleRotate(number, iPlayer, newPlayers, newBoard)
       } else{
          newHandle = {newPlayers, newBoard};
       }

      if(socket.id === newPlayers[0].id){
      let newIPlayer = iPlayer;
      let newIAction = iAction;
      let newIsTwo = number === 2 && isTwo === false ? true : false;

        if(newIsTwo){
          console.log('is two')
        } else if(iPlayer === newPlayers.length-1 && iAction === 4){
          socket.emit('prepareTurn', {room:room.id, newPlayers, newBoard});
          return
        } else if (iPlayer === newPlayers.length-1){
          newIPlayer = 0;
          newIAction += 1;        
        } else{
          newIPlayer +=1;
        }

        newPlayers=newHandle.newPlayers; newBoard=newHandle.newBoard;
        setTimeout(()=>socket.emit('sendActions', {room:room.id, newIPlayer, newIAction, newPlayers, newBoard , isTwo:newIsTwo}), 500);
    }
  }

    let handleMove = (num, index, handlePlayers, handleBoard) =>{
      let player = handlePlayers[index];
      let newNum = num === -1? -1 : 1;
      num=Math.abs(num);
      const {orientation, pos} = player;
      let y = pos[0];
      let x = pos[1];
      newNum = orientation === 'up' || orientation === 'right'? newNum : -newNum;
      let newY = y;
      let newX = x;
      orientation === 'up' || orientation === 'down' ?  newY -=newNum : newX+=newNum;
      if(newY >=0){
      if(handleBoard[newY][newX]===' '){//move into an empty place
        handleBoard[y].splice(x, 1, ' '); 
        handleBoard[newY].splice(newX, 1, player.name);
        handlePlayers.splice(index, 1, {...player, pos:[newY, newX]}); 
      } else if(handleBoard[newY][newX]==='pit'){ //move into a pit
        let startingPos = findEmptyStartingPos(handleBoard)
        handleBoard[y].splice(x, 1, ' '); 
        handleBoard[startingPos[0]].splice(startingPos[1], 1, player.name);
        handlePlayers.splice(index, 1, {...player, orientation:'up', pos:[startingPos[0],startingPos[1]]});
      } else if(robots.includes(handleBoard[newY][newX])){ //move into another robot
        let evenNewerY = y=== newY? y : y<newY? newY+1 : newY-1;
        let evenNewerX = x=== newX? x : x<newX? newX+1 : newX-1;
        if(evenNewerY >=0){
        if(handleBoard[evenNewerY][evenNewerX] === ' ' || handleBoard[evenNewerY][evenNewerX] === 'pit'){ //if the other robot would move into an obstacle or another robot nothing happens
          let indexOther = handlePlayers.findIndex(robot=>robot.pos[0] === newY && robot.pos[1] === newX);
          let otherPlayer = handlePlayers[indexOther];
          console.log(indexOther, 'indexOther', otherPlayer, 'otherPlayer', handlePlayers, 'handlePlayers, tio al que emputxes')
          handleBoard[y].splice(x, 1, ' '); 
          handleBoard[newY].splice(newX, 1, player.name); 
          handlePlayers.splice(index, 1, {...player, pos:[newY, newX]}); 
          if(handleBoard[evenNewerY][evenNewerX] === ' '){ //the other robot move into an empty place
            handlePlayers.splice(indexOther, 1, {...handlePlayers[indexOther], pos:[evenNewerY,evenNewerX]}); 
            handleBoard[evenNewerY].splice(evenNewerX, 1, otherPlayer.name);
          } else {
            let startingPos = findEmptyStartingPos(handleBoard);
            handlePlayers.splice(indexOther, 1, {...handlePlayers[indexOther], pos:[startingPos[0], startingPos[1]]}); 
            handleBoard[startingPos[0]].splice(startingPos[1], 1, otherPlayer.name);
          }
        }
        }
      }
    }
      setBoard(handleBoard);
      setPlayers(handlePlayers)
      return {newPlayers:handlePlayers, newBoard:handleBoard};
    }

    let handleRotate = (number, index, handlePlayers, handleBoard)=>{
      let newNum = number === 2? 1 : number;
      const {orientation} = handlePlayers[index];
      const numPos = orientation === 'up' ? 0 : orientation === 'left' ? -1 :  orientation === 'right' ? 1 : 2;
      const newPos = orientationToString(numPos + newNum)
      let newPlayer = {...handlePlayers[index], orientation:newPos}
      handlePlayers.splice(index, 1, newPlayer);
      setPlayers(handlePlayers)
      console.log(handlePlayers, 'handleRotate');
      return {newPlayers:handlePlayers, newBoard:handleBoard};
    }

    let sendMessage = (e)=>{
    e.preventDefault();
    let msg = e.target.elements.msg.value;
    msg = msg.trim(); 
  if (!msg){
    return false;
  }
    //Emit message to server
    socket.emit('chatMessage', msg);
    //Clea message
    e.target.elements.msg.value = ' ';
    e.target.elements.msg.focus(); //return the focus to the input
    }

    const changeReady = () => {
        socket.emit('ready', { user:props.user.username, room:room.id, robotChosen });
        setReady(!ready);
    }

    const startGame = () => {
        socket.emit('prepareGame', {room: room.id, users:room.users} );
    }

    const addBot = async (num) =>{
      //Add user in axios too
      socket.emit("join", { username: `Bot-${num}`, room: props.match.params.id, isBot:true});
      await axios.post(process.env.REACT_APP_API_URL + "/rooms/addUser", {id:room.id, user:`Bot-${num}`})
    }

    const kickOut = async (user) =>{
      await axios.post(process.env.REACT_APP_API_URL + "/rooms/removeUser", {user:user.username, id: room.id})
      socket.emit('kickOut', {userId: user.id, room: props.match.params.id, isBot:true})
    }

    const endTurn = () =>{
      if(disabled.includes('endTurn')){return};
      console.log('is not disabled')
      setDisabled(prevDisabled=>[...prevDisabled, 'endTurn', 'clickCard'])
          //socket.emit('endTurn', {room: room.id} );
        //HAS DE FER QUE DESABILITI ELS BOTONS A AQUEST AL MOMENT I ALS ALTRES AL ENDTURN
        socket.emit('countdownClicked', {room:room.id});//fa que als demes els surti el timer i que no li puguin picar al boto
        setTimeout(()=> socket.emit('endTurn', {room: room.id} ), 10500);
    }

    let clickCard = (fromWhere, iCard) => {
      if(disabled.includes('clickCard')){return};
      let newYou = JSON.parse(JSON.stringify(yourActions));
      if(newYou.cardPicked.length){
        if(newYou.cardPicked[0] === 'handCards' && fromWhere === 'handCards')
        {
          newYou = {...newYou, cardPicked:[fromWhere, iCard]}
        } else{
          let newActions = newYou.actions;
          let newHandCards = newYou.handCards;
          if(newYou.cardPicked[0] === 'actions' && fromWhere === 'actions'){
            newActions = newActions.map((action, index)=>{
              if(index === iCard){return newActions[newYou.cardPicked[1]] }
              else if(index === newYou.cardPicked[1]){return newActions[iCard]}
              else {return action}
            })
          } else if(newYou.cardPicked[0] === 'handCards'){
            newHandCards = newHandCards.map((card, index)=>index===newYou.cardPicked[1]?newYou[fromWhere][iCard] : card);
            newActions.splice(iCard, 1, newYou[newYou.cardPicked[0]][newYou.cardPicked[1]])
          } else{    
            newHandCards = newHandCards.map((card, index)=>index===iCard? newYou[newYou.cardPicked[0]][newYou.cardPicked[1]] : card);      
            newActions.splice(newYou.cardPicked[1], 1, newYou[fromWhere][iCard])
          }
          newYou = {...newYou, actions:newActions, handCards:newHandCards, cardPicked:''}
          }
      }else {
        newYou = {...newYou, cardPicked:[fromWhere, iCard]}
      }
      socket.emit('addOneAct', {room:room.id, newYou, id:socket.id})
      setYourActions(newYou)
    }
  
    let buttonName = (arr) => {
      if(arr[0] ==='disabled'){
        return arr[0];
      }else {
        return arr.join('_')
      }
    }

  return (
  <div className="container container-body">
      {/* END CHAT */}
      <div className="float-left chat-container">
          <div className="chat" style={{height:'585px'}}>
            <div className="chat-messages" style={{height:'490px', overflow:'hidden', marginBottom:'20px'}}>
              {room.messages.map((message, index)=>{
              return (
                <div key={index} className='message'>
                  <p className="meta" style={{marginBottom:'0px', fontSize:'.9rem'}}><span className="a-login">{message.username}</span> <span style={{color:'#5a5a5a'}}>{message.time}</span></p>
                  <p className="text" style={{marginBottom:'5px', fontSize:'.9rem'}}>{message.text}</p> {/* borderBottom:'2px solid #212121*/}
                </div>
              )
              })}
            </div>
            <div className="chat-form-container" style={{marginTop:'20px'}}>
              <form id="chat-form" onSubmit={(e)=>sendMessage(e)}>
                <input id="msg" className="form-control" type="text" placeholder="Enter Message" style={{width:'218px', textAlign:'left', fontFamily:'Courier Prime', fontSize:'.9rem'}} required autoComplete="off" />
              </form>
            </div>
          </div>
      </div>
      {/* END CHAT /*}
      {/*  START PLAYERS */}
      <div className="float-right robots-container">
          <div className="robots">
              <img className="" src={require("../img/gui/robot_tn.png")}alt="" />
              <img className="" src={require("../img/gui/robot-controller/countdown_active_screen.png")}alt="" />
              <img className="" src={require("../img/gui/robot-controller/countdown_active_screen.png")}alt="" />
              <img className="" src={require("../img/gui/robot-controller/countdown_active_screen.png")}alt="" />
              <img className="" src={require("../img/gui/robot-controller/countdown_active_screen.png")}alt="" />
              <img className="" src={require("../img/gui/robot-controller/countdown_disabled_screen.png")}alt="" />
              <img className="" src={require("../img/gui/robot-controller/countdown_disabled_screen.png")}alt="" />
              <img className="" src={require("../img/gui/robot-controller/countdown_disabled_screen.png")}alt="" />
          </div>
      </div>
      {/* END PLAYERS */}
    {
      start || (
        // START ROBOT SELECTION
        <div className="row r11 no-gutters">
            <div className="col-12" style={{marginTop:'16px'}}><img className="tile-bg" src={require("../img/select-robot-header.png")} alt="" /></div>
            <div className="col-12 select-robot-body d-flex justify-content-center" style={{flexDirection:'column', alignItems:'center'}}>
              <div className="row d-flex justify-content-center text-center" style={{width:'90%'}}>
              {robotChoice.map(robot=>{
              return(<div className="col-4"><p onClick={()=>setRobotChosen(robot)}>{robot}</p> <br/> <br/> </div>  )
            })}
              </div>
              <div className="row d-flex justify-content-center text-center" style={{width:'90%'}}>
              {
                (ready) ? <img onClick={changeReady} className="robot-selection-btn" src={require("../img/btn/btn-ready-ready.png")} style={{maxWidth:'130px', maxHeight:'60px', border:'1px solid #ffd21f', display:'inline'}} alt="Ready" /> :
                <img onClick={changeReady} className="robot-selection-btn" src={require("../img/btn/btn-ready-notready.png")} style={{maxWidth:'130px', maxHeight:'60px', display:'inline'}} alt="Not Ready" />
              }
                { room.users.every(user => user.ready === true) && creator && <img className="robot-selection-btn" onClick={startGame} src={require("../img/btn/btn-start-enabled.png")} style={{maxWidth:'130px', maxHeight:'60px', display:'inline', paddingLeft:'2%'}} alt="Start Game" />}
                { room.users.every(user => user.ready === false) && creator && <img className="robot-selection-btn" src={require("../img/btn/btn-start-disabled.png")} style={{maxWidth:'130px', maxHeight:'60px', display:'inline', paddingLeft:'2%'}} alt="Waiting for all players to be ready" /> } 
              </div>

            </div>
            <div className="col-12"><img className="tile-bg" src={require("../img/select-robot-footer.png")} alt="" /></div>
        </div>
        // END ROBOT SELECTION
    )}
    {
      start && (
      // START BOARD
      <>
        <div className="row no-gutters align-self-bottom">
            <div className="col-1 c0"><img className="tile-bg align-bottom" src={require("../img/tiles/left-top-coner.png")} alt="" /></div>
            <div className="col-1 c1"><img className="tile-bg align-bottom" src={require("../img/tiles/TileSep-13.png")} alt="" /></div>
            <div className="col-1 c2"><img className="tile-bg align-bottom" src={require("../img/tiles/TileSep-13.png")} alt="" /></div>
            <div className="col-1 c3"><img className="tile-bg align-bottom" src={require("../img/tiles/TileSep-13.png")} alt="" /></div>
            <div className="col-1 c4"><img className="tile-bg align-bottom" src={require("../img/tiles/TileSep-13.png")} alt="" /></div>
            <div className="col-1 c5"><img className="tile-bg align-bottom" src={require("../img/tiles/TileSep-13.png")} alt="" /></div>
            <div className="col-1 c6"><img className="tile-bg align-bottom" src={require("../img/tiles/TileSep-13.png")} alt="" /></div>
            <div className="col-1 c7"><img className="tile-bg align-bottom" src={require("../img/tiles/TileSep-13.png")} alt="" /></div>
            <div className="col-1 c8"><img className="tile-bg align-bottom" src={require("../img/tiles/TileSep-13.png")} alt="" /></div>
            <div className="col-1 c9"><img className="tile-bg align-bottom" src={require("../img/tiles/TileSep-13.png")} alt="" /></div>
            <div className="col-1 c10"><img className="tile-bg align-bottom" src={require("../img/tiles/TileSep-13.png")} alt="" /></div>
            <div className="col-1 c11"><img className="tile-bg align-bottom" src={require("../img/tiles/right-top-corner.png")} alt="" /></div>
        </div>
        <div className="row no-gutters">
            <div className="col-1 c0 tile"><img className="tile-bg" src={require("../img/tiles/top-wall-left.png")} alt="" /></div>
            <div className="col-1 c1 tile"><img className="tile-bg" src={require("../img/tiles/TileSep-38.png")} alt="" /></div>
            <div className="col-1 c2 tile"><img className="tile-bg" src={require("../img/tiles/TileSep-38.png")} alt="" /></div>
            <div className="col-1 c3 tile"><img className="tile-bg" src={require("../img/tiles/TileSep-38.png")} alt="" /></div>
            <div className="col-1 c4 tile"><img className="tile-bg" src={require("../img/tiles/door-1.png")} alt="" /></div>
            <div className="col-1 c5 tile"><img className="tile-bg" src={require("../img/tiles/door-2.png")} alt="" /></div>
            <div className="col-1 c6 tile"><img className="tile-bg" src={require("../img/tiles/door-3.png")} alt="" /></div>
            <div className="col-1 c7 tile"><img className="tile-bg" src={require("../img/tiles/TileSep-38.png")} alt="" /></div>
            <div className="col-1 c8 tile"><img className="tile-bg" src={require("../img/tiles/TileSep-38.png")} alt="" /></div>
            <div className="col-1 c9 tile"><img className="tile-bg" src={require("../img/tiles/TileSep-38.png")} alt="" /></div>
            <div className="col-1 c10 tile"><img className="tile-bg" src={require("../img/tiles/tile-lockers-4.png")} alt="" /></div>
            <div className="col-1 c11"><img className="tile-bg" src={require("../img/tiles/tile-lockers-1.png")} alt="" /></div>
        </div>
        <div className="row no-gutters">
            <div className="col-1 c0 tile"><img className="tile-bg" src={require("../img/tiles/left-wall-box.png")} alt="" /></div>
            <div className="col-1 c1 tile"><img className="tile-bg" src={require("../img/tiles/left-wall-box-2.png")} alt="" /></div>
            <div className="col-1 c2 tile"><img className="tile-bg" src={require("../img/tiles/TileSep-39.png")} alt="" /></div>
            <div className="col-1 c3 tile"><img className="tile-bg" src={require("../img/tiles/TileSep-39.png")} alt="" /></div>
            <div className="col-1 c4 tile"><img className="tile-bg" src={require("../img/tiles/door-4.png")} alt="" /></div>
            <div className="col-1 c5 tile"><img className="tile-bg" src={require("../img/tiles/door-5.png")} alt="" /></div>
            <div className="col-1 c6 tile"><img className="tile-bg" src={require("../img/tiles/door-6.png")} alt="" /></div>
            <div className="col-1 c7 tile"><img className="tile-bg" src={require("../img/tiles/TileSep-39.png")} alt="" /></div>
            <div className="col-1 c8 tile"><img className="tile-bg" src={require("../img/tiles/TileSep-39.png")} alt="" /></div>
            <div className="col-1 c9 tile"><img className="tile-bg" src={require("../img/tiles/TileSep-39.png")} alt="" /></div>
            <div className="col-1 c10 tile"><img className="tile-bg" src={require("../img/tiles/tile-lockers-5.png")} alt="" /></div>
            <div className="col-1 c11"><img className="tile-bg" src={require("../img/tiles/tile-lockers-2.png")} alt="" /></div>
        </div>
        {board.map((row, iRow)=>{
          return(
            <div key={iRow} className={'row no-gutters r'+iRow}>
              {row.map((col,iCol)=>{
                if(iCol === 0){
                  if(iRow === 0){
                    return (<div key={iCol} className={`col-1 c${iCol} tile`}><img className="tile-bg" src={require("../img/tiles/tile-boxes-1.png")} alt="" /></div>)
                  } else if(iRow === 1){
                    return(<div key={iCol} className={`col-1 c${iCol} tile`}> <img className="tile-bg" src={require("../img/tiles/left-border-box.png")} alt="" /></div>)
                  } else{
                    return(<div key={iCol} className={`col-1 c${iCol} tile`}> <img className="tile-bg" src={require("../img/tiles/left-border-regular-left-shadow.png")} alt="" /></div>)
                  }
                } else if(iCol === 11 ){
                  if(iRow === 0){
                    return (<div key={iCol} className={`col-1 c${iCol} tile`}><img className="tile-bg" src={require("../img/tiles/tile-lockers-3.png")} alt="" /></div>)
                  } else if(iRow === 1){
                    return(<div key={iCol} className={`col-1 c${iCol} tile`}> <img className="tile-bg" src={require("../img/tiles/right-border-box.png")} alt="" /></div>)
                  }else if(iRow === 11 ){
                  return (<div key={iCol} className={`col-1 c${iCol} tile`}><img className="tile-bg" src={require("../img/tiles/right-border-regular-no-shadow.png")} alt="" /></div>)
                } else{
                    return(<div key={iCol} className={`col-1 c${iCol} tile`}> <img className="tile-bg" src={require("../img/tiles/right-border-regular-shadow.png")} alt="" /></div>)
                  }
                } else if(iRow === 0 && iCol === 1){
                      return (<div key={iCol} className={`col-1 c${iCol} tile`}><img className="tile-bg" src={require("../img/tiles/tile-boxes-2.png")} alt="" /></div>)
                } else if(iRow === 0 && iCol === 10){
                      return (<div key={iCol} className={`col-1 c${iCol} tile`}><img className="tile-bg" src={require("../img/tiles/tile-lockers-6.png")} alt="" /></div>)
                } else if(iRow === 11 && iCol ===0){
                      return (<div key={iCol} className={`col-1 c${iCol} tile`}><img className="tile-bg" src={require("../img/tiles/left-border-regular-left-shadow.png")} alt="" /></div>)
                } else if(iRow === 11 && iCol <9){
                      return (<div key={iCol} className={`col-1 c${iCol} tile`}><img className="tile-bg" src={require("../img/tiles/TileSep-57.png")} alt="" /></div>)
                } else if(iRow === 11 && iCol === 9 ){
                  return (<div key={iCol} className={`col-1 c${iCol} tile`}><img className="tile-bg" src={require("../img/tiles/TileSep-60.png")} alt="" /></div>)
                } else if(iRow === 11 && iCol === 10 ){
                  return (<div key={iCol} className={`col-1 c${iCol} tile`}><img className="tile-bg" src={require("../img/tiles/TileSep-59.png")} alt="" /></div>)
                }
          
                  else {
                  return (<div key={iCol} className={`col-1 c${iCol} tile`}>{col}</div>)
                }
              })}
            </div>
          )
        })}
        <div className="row no-gutters">
          <div className="col-1 c0"><img className="tile-bg align-top" src={require("../img/tiles/left-bottom-corner.png")} alt="" /></div>
          <div className="col-1 c1"><img className="tile-bg align-top" src={require("../img/tiles/TileSep-7.png")} alt="" /></div>
          <div className="col-1 c2"><img className="tile-bg align-top" src={require("../img/tiles/TileSep-7.png")} alt="" /></div>
          <div className="col-1 c3"><img className="tile-bg align-top" src={require("../img/tiles/TileSep-7.png")} alt="" /></div>
          <div className="col-1 c4"><img className="tile-bg align-top" src={require("../img/tiles/TileSep-7.png")} alt="" /></div>
          <div className="col-1 c5"><img className="tile-bg align-top" src={require("../img/tiles/TileSep-7.png")} alt="" /></div>
          <div className="col-1 c6"><img className="tile-bg align-top" src={require("../img/tiles/TileSep-7.png")} alt="" /></div>
          <div className="col-1 c7"><img className="tile-bg align-top" src={require("../img/tiles/TileSep-7.png")} alt="" /></div>
          <div className="col-1 c8"><img className="tile-bg align-top" src={require("../img/tiles/TileSep-7.png")} alt="" /></div>
          <div className="col-1 c9"><img className="tile-bg align-top" src={require("../img/tiles/TileSep-7.png")} alt="" /></div>
          <div className="col-1 c10"><img className="tile-bg align-top" src={require("../img/tiles/TileSep-7.png")} alt="" /></div>
          <div className="col-1 c11"><img className="tile-bg align-top" src={require("../img/tiles/right-bottom-corner.png")} alt="" /></div>
        </div>

        {/* START DRAGGABLE DECK*/}
        <Draggable>
          <div id="draggable" className="draggable-deck">
              <div className="container deck-bg deck-container">
                  <div id="draggableheader" className="row no-gutters"></div>
                  <div id="" className="row no-gutters" style={{marginBottom: '4%'}}>
                      <div className="col-8 d-flex align-items-center"><img className="robot-controller-title" src={require("../img/gui/robot-controller/robot-controller-title.png")} alt="" /></div>
                      <div className="col-2 d-flex align-items-center" style={{paddingLeft:'4%', paddingRight:'1%'}}>
                        {disabled.includes('endTurn')? <img  onClick={()=>endTurn()} className="clock" src={require("../img/gui/robot-controller/clock_disabled.png")} alt="" /> : <img  onClick={()=>endTurn()} className="clock" src={require("../img/gui/robot-controller/clock_active.png")} alt="" />}
                      </div>
                      <div className="col-2"><img className="tile-bg" src={require("../img/gui/robot-controller/countdown_disabled_screen.png")} alt="" /><h1 class="countdown">{counter>0&&counter+'"'}</h1></div>
                  </div>
                  <div className="row no-gutters" style={{marginBottom: '4%'}}>
                      <div className="col-4">
                          <img className="tile-bg" src="./img/gui/robot-controller/robot-placeholder.png" alt="" />
                      </div>
                      <div className="col-8">
                          <div className="row cards-to-play no-gutters">
                              <div className="col"><img className="tile-bg d-block mx-auto" onClick={()=>clickCard('actions', 0)} src={require(`../img/gui/robot-controller/${buttonName(yourActions.actions[0])}_screen.png`)} alt="" /></div>
                              <div className="col"><img className="tile-bg d-block mx-auto" onClick={()=>clickCard('actions', 1)} src={require(`../img/gui/robot-controller/${buttonName(yourActions.actions[1])}_screen.png`)} alt="" /></div>
                              <div className="col"><img className="tile-bg d-block mx-auto" onClick={()=>clickCard('actions', 2)} src={require(`../img/gui/robot-controller/${buttonName(yourActions.actions[2])}_screen.png`)} alt="" /></div>
                              <div className="col"><img className="tile-bg d-block mx-auto" onClick={()=>clickCard('actions', 3)} src={require(`../img/gui/robot-controller/${buttonName(yourActions.actions[3])}_screen.png`)} alt="" /></div>
                              <div className="col"><img className="tile-bg d-block mx-auto" onClick={()=>clickCard('actions', 4)} src={require(`../img/gui/robot-controller/${buttonName(yourActions.actions[4])}_screen.png`)} alt="" /></div>
                          </div>
                      </div>
                  </div>
                  <div class="row  no-gutters">
                      <div className="col"><img class="tile-bg" onClick={()=>clickCard('handCards', 0)} src={require(`../img/gui/robot-controller/${buttonName(yourActions.handCards[0])}.png`)} alt="" /></div>
                      <div className="col"><img class="tile-bg" onClick={()=>clickCard('handCards', 1)} src={require(`../img/gui/robot-controller/${buttonName(yourActions.handCards[1])}.png`)} alt="" /></div>
                      <div className="col"><img class="tile-bg" onClick={()=>clickCard('handCards', 2)} src={require(`../img/gui/robot-controller/${buttonName(yourActions.handCards[2])}.png`)} alt="" /></div>
                      <div className="col"><img class="tile-bg" onClick={()=>clickCard('handCards', 3)} src={require(`../img/gui/robot-controller/${buttonName(yourActions.handCards[3])}.png`)} alt="" /></div>
                      <div className="col"><img class="tile-bg" onClick={()=>clickCard('handCards', 4)} src={require(`../img/gui/robot-controller/${buttonName(yourActions.handCards[4])}.png`)} alt="" /></div>
                      <div className="col"><img class="tile-bg" onClick={()=>clickCard('handCards', 5)} src={require(`../img/gui/robot-controller/${buttonName(yourActions.handCards[5])}.png`)} alt="" /></div>
                      <div className="col"><img class="tile-bg" onClick={()=>clickCard('handCards', 6)} src={require(`../img/gui/robot-controller/${buttonName(yourActions.handCards[6])}.png`)} alt="" /></div>
                      <div className="col"><img class="tile-bg" onClick={()=>clickCard('handCards', 7)} src={require(`../img/gui/robot-controller/${buttonName(yourActions.handCards[7])}.png`)} alt="" /></div>
                  </div>
                      <br/> <br/>
              </div>
          </div>
        </Draggable>

          {/* END DRAGGABLE DECK */}
          {/* START STATIC DECK */}
          <div className="container deck-bg static-deck-container">
              <div id="" className="row no-gutters first-row" style={{marginBottom: '4%'}}>
                  <div className="col-8 d-flex align-items-center"><img className="robot-controller-title" src={require("../img/gui/robot-controller/robot-controller-title.png")}alt="" /></div>
                  <div className="col-2 d-flex align-items-center" style={{paddingLeft:'4%', paddingRight:'1%'}}><img className="clock" src={require("../img/gui/robot-controller/clock_active.png")}alt="" /></div>
                  <div className="col-2"><img className="tile-bg" src={require("../img/gui/robot-controller/countdown_disabled_screen.png")}alt="" /><h1 className="countdown">30"</h1></div>
              </div>
              <div className="row no-gutters" style={{marginBottom: '4%'}}>
                  <div className="col-4">
                      <img className="tile-bg" src={require("../img/gui/robot-controller/robot-placeholder.png")}alt="" />
                  </div>
                  <div className="col-8">
                      <div className="row cards-to-play no-gutters">
                          <div className="col"><img className="tile-bg d-block mx-auto" src={require("../img/gui/robot-controller/turn_1_screen.png")}alt="" /></div>
                          <div className="col"><img className="tile-bg d-block mx-auto" src={require("../img/gui/robot-controller/move_2_screen.png")}alt="" /></div>
                          <div className="col"><img className="tile-bg d-block mx-auto" src={require("../img/gui//robot-controller/turn_-1_screen.png")}alt="" /></div>
                          <div className="col"><img className="tile-bg d-block mx-auto" src={require("../img/gui/robot-controller/move_-1_screen.png")}alt="" /></div>
                          <div className="col"><img className="tile-bg d-block mx-auto" src={require("../img/gui/robot-controller/repeat_x_screen.png")}alt="" /></div>
                      </div>
                  </div>
              </div>
              <div className="row  no-gutters">
                  <div className="col"><img className="tile-bg" src={require("../img/gui/robot-controller/move_1.png")}alt="" /></div>
                  <div className="col"><img className="tile-bg" src={require("../img/gui/robot-controller/move_2_disabled.png")}alt="" /></div>
                  <div className="col"><img className="tile-bg" src={require("../img/gui/robot-controller/turn_1_disabled.png")}alt="" /></div>
                  <div className="col"><img className="tile-bg" src={require("../img/gui/robot-controller/turn_-1_disabled.png")}alt="" /></div>
                  <div className="col"><img className="tile-bg" src={require("../img/gui/robot-controller/turn_2.png")}alt="" /></div>
                  <div className="col"><img className="tile-bg" src={require("../img/gui/robot-controller/repeat_x_disabled.png")}alt="" /></div>
                  <div className="col"><img className="tile-bg" src={require("../img/gui/robot-controller/move_-1_disabled.png")}alt="" /></div>
                  <div className="col"><img className="tile-bg" src={require("../img/gui/robot-controller/move_1.png")}alt="" /></div>
              </div>
                  <hr/>
          </div>
          {/* END STATIC DECK */}
          {/* START STATIC ROBOTS */}
          <div className="container robot-placeholder static-deck-container">
              <div id="" className="row no-gutters first-row" style={{marginBottom: '6%'}}>
              </div>
              <div className="row no-gutters" style={{marginBottom:'4%'}}>
                  <div className="col-3">
                      <img className="tile-bg" src={require("../img/gui/robot-controller/robot-placeholder.png")}alt="" />
                  </div>
                  <div className="col-3">
                      <img className="tile-bg" src={require("../img/gui/robot-controller/robot-placeholder.png")}alt="" />
                  </div>
                  <div className="col-3">
                      <img className="tile-bg" src={require("../img/gui/robot-controller/robot-placeholder.png")}alt="" />
                  </div>
                  <div className="col-3">
                      <img className="tile-bg" src={require("../img/gui/robot-controller/robot-placeholder.png")}alt="" />
                  </div>
              </div>
              <div className="row no-gutters" style={{marginBottom: '4%'}}>
                  <div className="col-3">
                      <img className="tile-bg" src={require("../img/gui/robot-controller/robot-placeholder.png")}alt="" />
                  </div>
                  <div className="col-3">
                      <img className="tile-bg" src={require("../img/gui/robot-controller/robot-placeholder.png")}alt="" />
                  </div>
                  <div className="col-3">
                      <img className="tile-bg" src={require("../img/gui/robot-controller/robot-placeholder.png")}alt="" />
                  </div>
                  <div className="col-3">
                      <img className="tile-bg" src={require("../img/gui/robot-controller/robot-placeholder.png")}alt="" />
                  </div>
              </div>
              <hr/>
          </div>
          {/* STRAT STATIC DECK */}
          {/* START LOW RES CHAT */}
          <div className="container robot-placeholder static-deck-container">
              <div id="" className="row no-gutters first-row" style={{marginBottom: '6%'}}>
              </div>
              <div className="row no-gutters" style={{marginBottom: '4%'}}>
                  <div className="col-3">
                      <div style={{border: '2px solid #202020', minHeight:'120px', width:'385px', borderRadius: '10px', backgroundColor: '#343434'}}></div>
                  </div>
              </div>
              <hr/>
              <hr/>
          </div>
          {/* END LOW RES CHAT */}
          {/*- START CHAT FOR MID SIZE RESOLUTIONS */}
              <div className="container chat-mid-res-bg">
                  <div id="draggableheader" className="row no-gutters" style={{marginBottom:'3%'}}></div>
                  <div className="row">
                      <div className="col-12"></div>
                  </div>
              </div>
          {/*- END CHAT FOR MID SIZE RESOLUTIONS */}
      </>
      // END BOARD
  )}
  </div>
)}

export default withAuth(Game);



// <div>
// {start || (
//   <div>
// <div className="chat-container">
//   <header className="chat-header">
//     <h1>
//       <i className="fas fa-smile"></i> ChatCord
//     </h1>
//     <Link to='/allRooms'>
//       <button className='btn'>Leave Room</button>
//     </Link>
//   </header>
//   <main className="chat-main">
//     <div className="chat-sidebar">
//       <h3>
//         <i className="fas fa-comments"></i> Room Name: {room.name}
//       </h3>
//       <h2 id="room-name"></h2>
//       <h3>
//         <i className="fas fa-users"></i> Users
//       </h3>
//       <ul id="users">
//         {robots.map((robot, index)=> room.users.length-1 < index ? <li key={index}><button onClick={()=>addBot(index)} >Add bot</button></li> : <li key={index}>{room.users[index].username} : {room.users[index].robot}{creator &&<button onClick={()=>kickOut(room.users[index])}>Kick out</button>}</li>)}
//       </ul>
//     </div>

//   <div className="chat-messages">
//       {room.messages.map((message, index)=>{
//           return (
//           <div key={index} className='message'><p className="meta">{message.username} <span>{message.time}</span></p>
//             <p className="text">{message.text}</p></div>)})}
//   </div>
//   <div className="chat-form-container">
//     <form id="chat-form" onSubmit={(e)=>sendMessage(e)}>
//       <input
//         id="msg"
//         type="text"
//         placeholder="Enter Message"
//         required
//         autoComplete="off"
//       />
//       <button type='submit' className="btn">
//         <i className="fas fa-paper-plane"></i> Send
//       </button>
//     </form>
//   </div>
// // </div>
// // )}
{/* {start && (

    <div className="row no-gutters align-self-bottom">
        <div className="col-1 c0"><img className="tile-bg align-bottom" src={require("../img/tiles/left-top-coner.png")} alt="" /></div>
        <div className="col-1 c1"><img className="tile-bg align-bottom" src={require("../img/tiles/TileSep-13.png")} alt="" /></div>
        <div className="col-1 c2"><img className="tile-bg align-bottom" src={require("../img/tiles/TileSep-13.png")} alt="" /></div>
        <div className="col-1 c3"><img className="tile-bg align-bottom" src={require("../img/tiles/TileSep-13.png")} alt="" /></div>
        <div className="col-1 c4"><img className="tile-bg align-bottom" src={require("../img/tiles/TileSep-13.png")} alt="" /></div>
        <div className="col-1 c5"><img className="tile-bg align-bottom" src={require("../img/tiles/TileSep-13.png")} alt="" /></div>
        <div className="col-1 c6"><img className="tile-bg align-bottom" src={require("../img/tiles/TileSep-13.png")} alt="" /></div>
        <div className="col-1 c7"><img className="tile-bg align-bottom" src={require("../img/tiles/TileSep-13.png")} alt="" /></div>
        <div className="col-1 c8"><img className="tile-bg align-bottom" src={require("../img/tiles/TileSep-13.png")} alt="" /></div>
        <div className="col-1 c9"><img className="tile-bg align-bottom" src={require("../img/tiles/TileSep-13.png")} alt="" /></div>
        <div className="col-1 c10"><img className="tile-bg align-bottom" src={require("../img/tiles/TileSep-13.png")} alt="" /></div>
        <div className="col-1 c11"><img className="tile-bg align-bottom" src={require("../img/tiles/right-top-corner.png")} alt="" /></div>
    </div>
    <div className="row no-gutters">
        <div className="col-1 c0 tile"><img className="tile-bg" src={require("../img/tiles/top-wall-left.png")} alt="" /></div>
        <div className="col-1 c1 tile"><img className="tile-bg" src={require("../img/tiles/TileSep-38.png")} alt="" /></div>
        <div className="col-1 c2 tile"><img className="tile-bg" src={require("../img/tiles/TileSep-38.png")} alt="" /></div>
        <div className="col-1 c3 tile"><img className="tile-bg" src={require("../img/tiles/TileSep-38.png")} alt="" /></div>
        <div className="col-1 c4 tile"><img className="tile-bg" src={require("../img/tiles/door-1.png")} alt="" /></div>
        <div className="col-1 c5 tile"><img className="tile-bg" src={require("../img/tiles/door-2.png")} alt="" /></div>
        <div className="col-1 c6 tile"><img className="tile-bg" src={require("../img/tiles/door-3.png")} alt="" /></div>
        <div className="col-1 c7 tile"><img className="tile-bg" src={require("../img/tiles/TileSep-38.png")} alt="" /></div>
        <div className="col-1 c8 tile"><img className="tile-bg" src={require("../img/tiles/TileSep-38.png")} alt="" /></div>
        <div className="col-1 c9 tile"><img className="tile-bg" src={require("../img/tiles/TileSep-38.png")} alt="" /></div>
        <div className="col-1 c10 tile"><img className="tile-bg" src={require("../img/tiles/tile-lockers-4.png")} alt="" /></div>
        <div className="col-1 c11"><img className="tile-bg" src={require("../img/tiles/tile-lockers-1.png")} alt="" /></div>
    </div>
    <div className="row no-gutters">
        <div className="col-1 c0 tile"><img className="tile-bg" src={require("../img/tiles/left-wall-box.png")} alt="" /></div>
        <div className="col-1 c1 tile"><img className="tile-bg" src={require("../img/tiles/left-wall-box-2.png")} alt="" /></div>
        <div className="col-1 c2 tile"><img className="tile-bg" src={require("../img/tiles/TileSep-39.png")} alt="" /></div>
        <div className="col-1 c3 tile"><img className="tile-bg" src={require("../img/tiles/TileSep-39.png")} alt="" /></div>
        <div className="col-1 c4 tile"><img className="tile-bg" src={require("../img/tiles/door-4.png")} alt="" /></div>
        <div className="col-1 c5 tile"><img className="tile-bg" src={require("../img/tiles/door-5.png")} alt="" /></div>
        <div className="col-1 c6 tile"><img className="tile-bg" src={require("../img/tiles/door-6.png")} alt="" /></div>
        <div className="col-1 c7 tile"><img className="tile-bg" src={require("../img/tiles/TileSep-39.png")} alt="" /></div>
        <div className="col-1 c8 tile"><img className="tile-bg" src={require("../img/tiles/TileSep-39.png")} alt="" /></div>
        <div className="col-1 c9 tile"><img className="tile-bg" src={require("../img/tiles/TileSep-39.png")} alt="" /></div>
        <div className="col-1 c10 tile"><img className="tile-bg" src={require("../img/tiles/tile-lockers-5.png")} alt="" /></div>
        <div className="col-1 c11"><img className="tile-bg" src={require("../img/tiles/tile-lockers-2.png")} alt="" /></div>
    </div>
    {board.map((row, iRow)=>{
      return(
        <div key={iRow} className={'row no-gutters r'+iRow}>
          {row.map((col,iCol)=>{
            if(iCol === 0){
              if(iRow === 0){
                return (<div key={iCol} className={`col-1 c${iCol} tile`}><img className="tile-bg" src={require("../img/tiles/tile-boxes-1.png")} alt="" /></div>)
              } else if(iRow === 1){
                return(<div key={iCol} className={`col-1 c${iCol} tile`}> <img className="tile-bg" src={require("../img/tiles/left-border-box.png")} alt="" /></div>)
              } else{
                return(<div key={iCol} className={`col-1 c${iCol} tile`}> <img className="tile-bg" src={require("../img/tiles/left-border-regular-left-shadow.png")} alt="" /></div>)
              }
            } else if(iCol === 11 ){
              if(iRow === 0){
                return (<div key={iCol} className={`col-1 c${iCol} tile`}><img className="tile-bg" src={require("../img/tiles/tile-lockers-3.png")} alt="" /></div>)
              } else if(iRow === 1){
                return(<div key={iCol} className={`col-1 c${iCol} tile`}> <img className="tile-bg" src={require("../img/tiles/right-border-box.png")} alt="" /></div>)
              } else{
                return(<div key={iCol} className={`col-1 c${iCol} tile`}> <img className="tile-bg" src={require("../img/tiles/right-border-regular-shadow.png")} alt="" /></div>)
              }
            } else if(iRow === 0 && iCol === 1){
                  return (<div key={iCol} className={`col-1 c${iCol} tile`}><img className="tile-bg" src={require("../img/tiles/tile-boxes-2.png")} alt="" /></div>)
            } else if(iRow === 0 && iCol === 10){
                  return (<div key={iCol} className={`col-1 c${iCol} tile`}><img className="tile-bg" src={require("../img/tiles/tile-lockers-6.png")} alt="" /></div>)
            }
      
              else {
              return (<div key={iCol} className={`col-1 c${iCol} tile`}>{col}</div>)
            }
          })}
        </div>
      )
    })}
    <div className="row no-gutters">
      <div className="col-1 c0"><img className="tile-bg align-top" src={require("../img/tiles/left-bottom-corner.png")} alt="" /></div>
      <div className="col-1 c1"><img className="tile-bg align-top" src={require("../img/tiles/TileSep-7.png")} alt="" /></div>
      <div className="col-1 c2"><img className="tile-bg align-top" src={require("../img/tiles/TileSep-7.png")} alt="" /></div>
      <div className="col-1 c3"><img className="tile-bg align-top" src={require("../img/tiles/TileSep-7.png")} alt="" /></div>
      <div className="col-1 c4"><img className="tile-bg align-top" src={require("../img/tiles/TileSep-7.png")} alt="" /></div>
      <div className="col-1 c5"><img className="tile-bg align-top" src={require("../img/tiles/TileSep-7.png")} alt="" /></div>
      <div className="col-1 c6"><img className="tile-bg align-top" src={require("../img/tiles/TileSep-7.png")} alt="" /></div>
      <div className="col-1 c7"><img className="tile-bg align-top" src={require("../img/tiles/TileSep-7.png")} alt="" /></div>
      <div className="col-1 c8"><img className="tile-bg align-top" src={require("../img/tiles/TileSep-7.png")} alt="" /></div>
      <div className="col-1 c9"><img className="tile-bg align-top" src={require("../img/tiles/TileSep-7.png")} alt="" /></div>
      <div className="col-1 c10"><img className="tile-bg align-top" src={require("../img/tiles/TileSep-7.png")} alt="" /></div>
      <div className="col-1 c11"><img className="tile-bg align-top" src={require("../img/tiles/right-bottom-corner.png")} alt="" /></div>
  </div> */}
    
    {/* <div>
        <div style={{display:'flex', justifyContent:'center'}}>
          <p>{yourActions.name}:</p>
          {yourActions.actions.map((card, iCard)=>{
            return (<p onClick={()=>clickCard('actions', iCard)} key={iCard}>{'|'+card[1]+' '+card[0]+'|'}</p>)
          })}
        </div>
        <div style={{display:'flex', justifyContent:'center'}}>
          {yourActions.handCards.map((card, iCard)=>{
            return (<p onClick={()=>clickCard('handCards', iCard)} key={iCard}>{'|'+card[1]+' '+card[0]+'|'}</p>)
          })}
        </div>
        <button onClick={()=>endTurn()}>End Turn</button>
        <p>{counter} counter</p>
    </div> */}
  {/* </div>
)} */}