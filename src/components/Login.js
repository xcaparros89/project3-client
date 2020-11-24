import React, { Component } from "react";
import { withAuth } from "../lib/AuthProvider";
import { Redirect } from 'react-router-dom';
import logo from "../img/logo.png"
import playBtn from "../img/btn/btn-play.png";
import { Link } from "react-router-dom";
import $ from 'jquery';

class Login extends Component {
  state = { username: "", password: "" };

  componentDidMount() {
    document.body.classList.add('home');
  }

  handleFormSubmit = (event) => {
    event.preventDefault();
    const { username, password } = this.state;
    this.props.login({ username, password });
    console.log(this.props)
  };

  handleChange = (event) => {
    const { name, value } = event.target;
    this.setState({ [name]: value });
  };
  // if(this.props.isLoggering) {
  //   return <Redirect to='/allRooms'></Redirect>
  // }
  render() {
    const { username, password } = this.state;
    return (
      
          <div className="container login-container d-flex align-items-center" style={{marginTop:'5%'}}>
        <div className="container home-bg">
            <div className="row no-gutters">
                <div className="col-12">
                    <img className="tile-bg mx-auto d-block" src={logo} alt="" />
                </div>
            </div>
            <div className="row no-gutters">
                <div className="container login-inner-container">
                    <div className="col-12 text-center login">
                        <form id="signup-form" onSubmit={(e)=>this.handleFormSubmit(e)}>
                            <div className="form-group">
                              <input type="text" name="username" value={username} className="form-control" placeholder="Username" onChange={this.handleChange} />
                            </div>
                            <div className="form-group">
                                <input type="password" name="password" value={password} className="form-control" placeholder="Password" onChange={this.handleChange} />
                            </div>
                            <input type='submit' className="submitPlayBtn" value='' />
                            <p className="" style={{marginBottom:"0"}}>Don't you have an account?</p>
                            <p><Link to={"/guest"} className="a-login">Play as Guest</Link> or <Link to={"/signup"} className="a-login">Register</Link></p>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
    );
  }
}

export default withAuth(Login);
