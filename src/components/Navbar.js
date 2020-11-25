import React, { Component } from "react";
import { Link } from "react-router-dom";
import { withAuth } from "../lib/AuthProvider";

class Navbar extends Component {
  render() {
    const { user, logout, isLoggedin } = this.props;
    const redirect = ()=>{
      logout();
      
    }
    return (
      <nav className='navbar'>
        <Link to={"/"} id='home-btn'>
          <h4>Home</h4>
        </Link>
        <Link to={'/Lobby'} id='lobby-btn'>
          <h4>Lobby</h4>
        </Link>
        {isLoggedin ? (
          <>
            <p className='navbar-user'>username: {user.username}</p>
            <Link to={"/"} id='home-btn'>
              <button className='navbar-button' onClick={logout}>
                Logout
              </button>
            </Link>
          </>
        ) : (
          <>
            <Link to='/signup'>
              <button className='navbar-button'>Sign Up</button>
            </Link>
          </>
        )}
        <button>Rules</button>
      </nav>
    );
  }
}

export default withAuth(Navbar);
