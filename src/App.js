import React, { Component } from "react";
import "./App.css";
import { Switch, Route } from "react-router-dom";
import AuthProvider from "./lib/AuthProvider";
import './css/bootstrap.min.css'
import './css/Styles.css';
import './css/Draggable.css';
import './css/Handle-elements.css';
import Signup from "./components/Signup";
import Login from "./components/Login";
import Guest from "./components/Guest";
import Private from "./components/Private";
import Game from './components/Game';
import AllRooms from './components/AllRooms'
import HomeOrRooms from './components/HomeOrRooms'
import PrivateRoute from "./routes/PrivateRoute";

class App extends Component {
  render() {
    return (
      <AuthProvider>
          <Switch>
            <Route exact path='/' component={HomeOrRooms} />
            <Route exact path='/signup' component={Signup} />
            <Route exact path='/login' component={Login} />
            <Route exact path='/guest' component={Guest} />
            <PrivateRoute exact path='/private' component={Private} />
            <Route exact path='/allRooms' component={AllRooms}/>
            <Route exact path='/rooms/:id' component={(props)=><Game {...props} />}/>

          </Switch>
      </AuthProvider>
    );
  }
}

export default App;
