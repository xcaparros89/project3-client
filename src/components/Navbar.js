import React, { Component } from "react";
import { Link } from "react-router-dom";
import { withAuth } from "../lib/AuthProvider";

class Navbar extends Component {
  render() {
    const {logout, isLoggedin } = this.props;
    const redirect = ()=>{
      logout();
      
    }
    return (
        isLoggedin && ( 
        <div className="container-fluid navbar-container d-flex justify-content-center">
          <div className="row navbar-row d-flex justify-content-center">
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
                <button className='logoutBtn' onClick={logout}></button>
              </Link>
          </div>
        </div>
      )
    );
  }
}

export default withAuth(Navbar);
