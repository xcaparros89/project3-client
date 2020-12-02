import React, { useEffect, useState } from "react";
import { withAuth } from "../lib/AuthProvider";
import { io } from "socket.io-client";
import { Link, useHistory } from "react-router-dom";
import axios from "axios";
import './Game.css'
import {orientationToString, findEmptyStartingPos} from '../utils/gameAct'
import Draggable from 'react-draggable'; 
import Map from './Map'

//const socket = io(process.env.REACT_APP_API_URL, {
const socket = io("https://robo-race-game.herokuapp.com", {
  transports: ["websocket", "polling"],
});
const Game = (props) => {
  const robotChoice= ['cam', 'cve', 'cvi', 'ham', 'hve', 'hvi', 'qam', 'qve', 'qvi', 'tam', 'tve', 'tvi'];
  const history = useHistory();
    const [room, setRoom] = useState({name:props.user.username, id:props.match.params.id, users:[], messages:[]})
    const [ready, setReady] = useState(false);
    const [creator, setCreator] = useState('');
    const [start, setStart] = useState(false);
    const robots = ['x', 'y', 'z', 'a', 's', 'd', 'f', 'j']
    const [players, setPlayers] = useState([]);
    const [board, setBoard] = useState([]);
    const [yourActions, setYourActions] = useState({actions:[['disabled',0, 9],['disabled',0, 9],['disabled',0, 9],['disabled',0, 9],['disabled',0, 9]], handCards:[['disabled',0, 'disabled'],['disabled',0, 'disabled'],['disabled',0, 'disabled'],['disabled',0, 'disabled'],['disabled',0, 'disabled'],['disabled',0, 'disabled'],['disabled',0,'disabled'],['disabled',0,'disabled']], cardPicked:''})
    const [robotChosen, setRobotChosen] = useState('')
    const [id, setId] = useState('');
    const [disabled, setDisabled] = useState([])
    const [counter, setCounter] = useState(0);
    const [robotsTaken, setRobotsTaken] = useState([])

    useEffect(() => {
        if(props.history.location.state){ setCreator(props.history.location.state.creator)
          console.log(props.history.location.state.creator, 'true')
          socket.emit("join", { username: props.user.username, room: props.match.params.id, isCreator:true});
        }else{  
          socket.emit("join", { username: props.user.username, room: props.match.params.id, isCreator:false});
        }
        socket.on('roomUsers', ({users, username, id}) =>{setRoom(prevRoom=>({...prevRoom, users})); setPlayers(users); if(id && username === props.user.username)setId(id);console.log(users, 'users')});
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

          socket.on('addedAllActions', ({game})=>{
            let newYourActions = game.players.find(player=>player.id === socket.id)
            setYourActions({actions: newYourActions.actions, handCards:newYourActions.handCards, cardPicked:''});
            handleActions(0, 0, game.players, game.board, false);
            console.log(game)
          })

          socket.on('startCountdown', ()=>{
            setCounter(10)
            setDisabled(prevDisabled=>[...prevDisabled, 'endTurn'])
            setTimeout(()=>setDisabled(prevDisabled=>[...prevDisabled, 'clickCard']), 10000);
          })
        
          socket.on('finishGame',({winner, newBoard, newPlayers})=>{
            console.log('winner', winner)
            alert('The winner is: ' + winner)
            setTimeout(()=>history.push({pathname: `/allRooms`}), 5000); 

          })

          socket.on('doActions',({newIPlayer, newIAction, newBoard, newPlayers, isTwo, creator})=>{
            handleActions(newIPlayer, newIAction, newPlayers, newBoard, isTwo, creator)
          })

          socket.on('disableRobot',({robot})=>{
            setRobotsTaken(prev=>[...prev, robot])
            if(robotChosen === robot){setRobotChosen('')}
          })

          socket.on('enableRobot',({robot})=>{
            setRobotsTaken(prev=>{
              let newRobotsTaken = prev.filter(name=>name!==robot);
              return newRobotsTaken
            })
          })
          

          document.body.classList.remove('home');
        return () => {
            socket.close();
        }
    }, [])

    useEffect(()=>{counter > 0 && setTimeout(() => setCounter(counter - 1), 1000)}, [counter])

    let handleActions = (iPlayer, iAction, newPlayers, newBoard, isTwo) =>{
      console.log('handleActions', iPlayer, iAction, 'aqui')
      let newHandle
      const [action, number] = newPlayers[iPlayer].actions[iAction][0]!=='repeat'? newPlayers[iPlayer].actions[iAction] : iAction === 0 || newPlayers[iPlayer].actions[iAction-1][0] ==='repeat' ? ['disabled', 0, 9] : newPlayers[iPlayer].actions[iAction-1];

      if(action === 'move'){
        newHandle = handleMove(number, iPlayer, newPlayers, newBoard)
      } else if(action === 'turn'){
        newHandle = handleRotate(number, iPlayer, newPlayers, newBoard)
       } else{
          newHandle = {newPlayers, newBoard};
       }
       let creatorId;
       newPlayers.forEach(player => player.isCreator? creatorId = player.id : null);
      if(socket.id === creatorId){
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
        console.log('finasfsf', newIPlayer, newIAction, 'sfsdfd')
        setTimeout(()=>socket.emit('sendActions', {room:room.id, newIPlayer, newIAction, newPlayers, newBoard , isTwo:newIsTwo}), 1000);
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
      } else if(robotChoice.includes(handleBoard[newY][newX])){ //move into another robot
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
      if(!ready){
        socket.emit('ready', { user:props.user.username, room:room.id, robotChosen });
        setReady(true);
      }
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
        socket.emit('countdownClicked', {room:room.id});//fa que als demes els surti el timer i que no li puguin picar al boto
        setTimeout(()=> socket.emit('endTurn', {room: room.id} ), 10500);
    }

    let clickCard = (iCard) => {
      if(disabled.includes('clickCard')){return};
      let newYou = JSON.parse(JSON.stringify(yourActions));
      let newActions = newYou.actions;
      let newHandCards = newYou.handCards;
      if(newYou.handCards[iCard][2] === 'disabled'){
        console.log(newActions, 'newActions')
        newActions = newActions.map(action=>{
          console.log(action[2], iCard)
          return action[2] === iCard ? ['disabled', 0, 9] : action
        }) 
        newHandCards = newHandCards.map((card, iHand)=>{
          return iHand === iCard ? [card[0], card[1], 'active'] : card
        })
        console.log(newActions, 'newActons2')
      } else{
        console.log('disable dones includes nandcard')
        if(!newActions.every(action=>action[0] !== 'disabled')){
          let iAct = 0;
          while(newActions[iAct][0] !== 'disabled'){
            iAct++;
          }
          console.log(newYou.handCards, 'handCards', iCard, 'iCard')
          newActions.splice(iAct, 1, [newYou.handCards[iCard][0], newYou.handCards[iCard][1], iCard]) 
          newHandCards = newHandCards.map((card, iHand)=>{
            return iHand === iCard ? [card[0], card[1], 'disabled'] : card
          })
        }
      }
        newYou = {...newYou, actions:newActions, handCards:newHandCards}
        setYourActions(newYou)
        socket.emit('addOneAct', {room:room.id, newYou, id:socket.id})
    }
  
    let buttonName = (arr,) => {
      if(arr[0] ==='disabled'){
        return arr[0];
      }else {
        return arr[0] + '_' + arr[1]
      }
    }

    let roboColor = (name) =>{
      if(name[2] === 'm'){return '#f8910c'
    } else if(name[2] === 'e'){return '#24a350'
    } else if(name[2] === 'i'){return '#9b4a9c'
    } else {return 'black'}
  }
  return (
  <div className="container container-body">

<div className="container-fluid d-flex justify-content-center" style={{marginTop:'50px'}}>
          <div className="row navbar-row-ingame d-flex justify-content-center end">
              <Link to={"/"} id='home-btn'>
                <button className='homeBtn'></button>
              </Link>
              <Link to={'/'} id='lobby-btn'>
                <button className='roomsBtn'></button>
              </Link>
              <Link to={"/"} id='rules-btn'>
                <button className='rulesBtn'></button>
              </Link>
              <Link to={"/"} id='home-btn'>
                <button onClick={async()=>props.logout(socket.id, room.id )} className='logoutBtn'></button>
              </Link>
          </div>
        </div>
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
              {robots.map((robot, index)=>{
                return players.length>index ? (
                <div classname="container"> 
                  <p className="robot-placeholder-name" style={{color:`${roboColor(players[index].name)}`}}>{players[index].username}</p>
                  {
                  creator && !start?
                  <img onClick={()=>kickOut(room.users[index])} className="" src={require(`../img/gui/robot-screen-${players[index].name}.png`)} alt="" /> :
                  <img className="" src={require(`../img/gui/robot-screen-${players[index].name}.png`)}alt="" />
                  }
                  
                </div>
              ) : creator && !start?
                (<img onClick={()=>addBot(index)} className="" src={require(`../img/gui/robot-screen-placeholder.png`)}alt="" /> ):(
                <img className="" src={require(`../img/gui/robot-screen-placeholder.png`)}alt="" />)
              })}
          </div>
      </div>
      {/* END PLAYERS */}
    {
      start || (
        // START ROBOT SELECTION
        <div className="row r11 no-gutters">
            <div className="col-12" style={{marginTop:'16px'}}><img className="tile-bg" src={require("../img/select-robot-header.png")} alt="" /></div>
            <div className="col-12 select-robot-body d-flex justify-content-center" style={{flexDirection:'column', alignItems:'center'}}>
              <div className="row d-flex justify-content-center text-center" style={{width:'80%'}}>
              {robotChoice.map(robot=>{
                return robotsTaken.includes(robot)? 
              (<div className="col-4"><img className="bg-90" src={require(`../img/gui/robot-select-disable-${robot}.png`)} alt="" /></div>  ):
              robot===robotChosen?
              (<div className="col-4"><img onClick={()=>setRobotChosen(robot)} className="bg-90" src={require(`../img/gui/robot-select-selected-${robot}.png`)} alt="" /></div>  ):
              (<div className="col-4"><img onClick={()=>setRobotChosen(robot)} className="bg-90" src={require(`../img/gui/robot-select-active-${robot}.png`)} alt="" /></div>  )
            })}
              </div>
              <div className="row d-flex justify-content-center text-center" style={{width:'90%', marginTop:'3%', marginBottom:'2%'}}>
              {
                (ready) ? <img onClick={changeReady} className="robot-selection-btn" src={require("../img/btn/btn-ready-ready.png")} style={{maxWidth:'130px', maxHeight:'60px', border:'1px solid  #ffcc00', display:'inline'}} alt="Ready" /> :
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
        <Map board={board} players={players}/>
        {/* START DRAGGABLE DECK*/}
        <Draggable handle=".handle">
          <div id="draggable" className="draggable-deck">
              <div className="container deck-bg deck-container">
                  <div id="draggableheader" className="row no-gutters handle"></div>
                  <div id="" className="row no-gutters" style={{marginBottom: '4%'}}>
                      <div className="col-8 d-flex align-items-center"><img className="robot-controller-title" src={require("../img/gui/robot-controller/robot-controller-title.png")} alt="" /></div>
                      <div className="col-2 d-flex align-items-center" style={{paddingLeft:'4%', paddingRight:'1%'}}>
                        {disabled.includes('endTurn')? <img  onClick={()=>endTurn()} className="clock" src={require("../img/gui/robot-controller/clock_disabled.png")} alt="" /> : <img  onClick={()=>endTurn()} className="clock" src={require("../img/gui/robot-controller/clock_active.png")} alt="" />}
                      </div>
                      <div className="col-2">{counter>0?<img className="tile-bg" src={require("../img/gui/robot-controller/countdown_active_screen.png")} alt="" /> : <img className="tile-bg" src={require("../img/gui/robot-controller/countdown_disabled_screen.png")} alt="" />}<h1 className="countdown">{counter<1?'' : counter===10?counter:'0'+counter}</h1></div>
                  </div>
                  <div className="row no-gutters" style={{marginBottom: '4%'}}>
                      <div className="col-4">
                          <img className="tile-bg" src={require(`../img/gui/robot-controller/robot-placeholder-${robotChosen}.png`)} alt="" />
                      </div>
                      <div className="col-8">
                          <div className="row cards-to-play no-gutters">
                              <div className="col"><img className="tile-bg d-block mx-auto" src={require(`../img/gui/robot-controller/${buttonName(yourActions.actions[0])}_screen.png`)} alt="" /></div>
                              <div className="col"><img className="tile-bg d-block mx-auto" src={require(`../img/gui/robot-controller/${buttonName(yourActions.actions[1])}_screen.png`)} alt="" /></div>
                              <div className="col"><img className="tile-bg d-block mx-auto" src={require(`../img/gui/robot-controller/${buttonName(yourActions.actions[2])}_screen.png`)} alt="" /></div>
                              <div className="col"><img className="tile-bg d-block mx-auto" src={require(`../img/gui/robot-controller/${buttonName(yourActions.actions[3])}_screen.png`)} alt="" /></div>
                              <div className="col"><img className="tile-bg d-block mx-auto" src={require(`../img/gui/robot-controller/${buttonName(yourActions.actions[4])}_screen.png`)} alt="" /></div>
                          </div>
                      </div>
                  </div>
                  <div className="row  no-gutters">
                    {robots.map((r, index)=>{
                      return yourActions.handCards[index][2]==='disabled'? (
                        <div className="col"><img className="tile-bg" onClick={()=>clickCard(index)} src={require(`../img/gui/robot-controller/${buttonName(yourActions.handCards[index])}_disabled.png`)} alt="" /></div>
                      ) :(
                        <div className="col"><img className="tile-bg" onClick={()=>clickCard(index)} src={require(`../img/gui/robot-controller/${buttonName(yourActions.handCards[index])}.png`)} alt="" /></div>
                      )
                    })}
                  </div>
                      <br/> <br/>
              </div>
          </div>
        </Draggable>

          {/* END DRAGGABLE DECK */}
          {/* START STATIC DECK */}
          <div className="container deck-bg static-deck-container">
              <div id="" className="row no-gutters" style={{marginBottom: '4%'}}>
                      <div className="col-8 d-flex align-items-center"><img className="robot-controller-title" src={require("../img/gui/robot-controller/robot-controller-title.png")} alt="" /></div>
                      <div className="col-2 d-flex align-items-center" style={{paddingLeft:'4%', paddingRight:'1%'}}>
                        {disabled.includes('endTurn')? <img  onClick={()=>endTurn()} className="clock" src={require("../img/gui/robot-controller/clock_disabled.png")} alt="" /> : <img  onClick={()=>endTurn()} className="clock" src={require("../img/gui/robot-controller/clock_active.png")} alt="" />}
                      </div>
                      <div className="col-2">{counter>0?<img className="tile-bg" src={require("../img/gui/robot-controller/countdown_active_screen.png")} alt="" /> : <img className="tile-bg" src={require("../img/gui/robot-controller/countdown_disabled_screen.png")} alt="" />}<h1 className="countdown">{counter<1?'' : counter===10?counter:'0'+counter}</h1></div>
                  </div>
              <div className="row no-gutters" style={{marginBottom: '4%'}}>
                  <div className="col-4">
                      <img className="tile-bg" src={require(`../img/gui/robot-controller/robot-placeholder.png`)} alt="Your Robot" />
                  </div>
                  <div className="col-8">
                          <div className="row cards-to-play no-gutters">
                              <div className="col"><img className="tile-bg d-block mx-auto" src={require(`../img/gui/robot-controller/${buttonName(yourActions.actions[0])}_screen.png`)} alt="" /></div>
                              <div className="col"><img className="tile-bg d-block mx-auto" src={require(`../img/gui/robot-controller/${buttonName(yourActions.actions[1])}_screen.png`)} alt="" /></div>
                              <div className="col"><img className="tile-bg d-block mx-auto" src={require(`../img/gui/robot-controller/${buttonName(yourActions.actions[2])}_screen.png`)} alt="" /></div>
                              <div className="col"><img className="tile-bg d-block mx-auto" src={require(`../img/gui/robot-controller/${buttonName(yourActions.actions[3])}_screen.png`)} alt="" /></div>
                              <div className="col"><img className="tile-bg d-block mx-auto" src={require(`../img/gui/robot-controller/${buttonName(yourActions.actions[4])}_screen.png`)} alt="" /></div>
                          </div>
                      </div>
                  </div>
                  <div className="row  no-gutters">
                    {robots.map((r, index)=>{
                      return yourActions.handCards[index][2]==='disabled'? (
                        <div className="col"><img className="tile-bg" onClick={()=>clickCard(index)} src={require(`../img/gui/robot-controller/${buttonName(yourActions.handCards[index])}_disabled.png`)} alt="" /></div>
                      ) :(
                        <div className="col"><img className="tile-bg" onClick={()=>clickCard(index)} src={require(`../img/gui/robot-controller/${buttonName(yourActions.handCards[index])}.png`)} alt="" /></div>
                      )
                    })}
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
