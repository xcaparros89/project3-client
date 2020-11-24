import React, { useState, useEffect } from 'react';
import shortid from 'shortid'
import { useHistory } from "react-router-dom";
import { withAuth } from "../lib/AuthProvider";
import axios from "axios";
import newGameBtn from "../img/btn/btn-new-game.png"

export function AllRooms(props){

    
    const [roomArr, setRoomArr] =useState([])//NECESITAMOS QUE LAS ROOMS DESAPAREZCAN CUANDO NO HAYA NADIE Y QUE PONGA LA CANTIDAD DE GENTE QUE TIENEN
    const history = useHistory();

    document.body.classList.add('home'); // Remove big BG

    useEffect(()=>{
        async function fetchData(){
        const rooms = await axios.get("http://localhost:4000/rooms/getAllRooms")
        setRoomArr(rooms.data)
      }; fetchData();
    }, []);
    
    let createGame = async ()=>{
        let id=shortid.generate();
        const rooms = await axios.post("http://localhost:4000/rooms/addRoom", {id, creator:props.user.username})
        setRoomArr(rooms.data);
        history.push({pathname: `/rooms/${id}`, state:{creator:props.user.username}})
    }

    let joinGame = async (id, index)=>{
        if(roomArr[index].users.length !== 8){
            const rooms = await axios.post("http://localhost:4000/rooms/addUser", {id, user:props.user.username})
            setRoomArr(rooms.data);
            history.push(`/rooms/${id}`)
        }
    }
        return (


            <div className="container login-container d-flex align-items-center" style={{marginTop:'5%'}}>
            <div className="container">
                <div className="row no-gutters rooms" style={{minHeight:'500px'}}>
                    <div className="container text-center">
                        <img class ="new-game" src={newGameBtn} style={{maxWidth:'130px', maxHeight:'60px'}}onClick={createGame} alt="Create New Game"/>
                        <div className="row d-flex rooms-container">
                        {roomArr.length && (
                            <div style={{width:'100%', overflow: 'auto', maxHeight:'260px'}}>
                                {roomArr.map((room, index) =>{
                                return (<p>{room.creator}'s game ({room.users.length} / 8) <span onClick={()=>joinGame(room.room, index)} key={room.room} className="a-login">Join Game</span> </p>)//aixo hauria de ser una funcio que miri si hi ha lloc i després el fiqui
                                })}
                            </div>)} 
                        </div>
                    </div>
                </div>
            </div>
        </div>
        )
}

export default withAuth(AllRooms)

// OLD CODE

{/*}
<div>
<h1>All Games</h1>
<button onClick={createGame}>Create a new game</button>
{roomArr.length && (
    <div>
    <p>Join a game:</p>
    {roomArr.map((room, index) =>{
        return (<p onClick={()=>joinGame(room.room, index)} key={room.room}>{room.creator}'s game ({room.users.length} / 8)</p>)//aixo hauria de ser una funcio que miri si hi ha lloc i després el fiqui
    })}
    </div>)}


    IMPLEMENTAR QUE SOLAMENTE SE ENSEÑE SI ESTÁ VACÍA

</div> */}