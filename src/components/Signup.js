import React, { Component } from "react";
import { Link } from "react-router-dom";
import { withAuth } from "../lib/AuthProvider";
import logo from "../img/logo.png"
import { Redirect } from 'react-router-dom';
import signupBtn from "../img/btn/btn-signup.png";
import $ from 'jquery';

class Signup extends Component {
  state = { username: "", password: "" };

  componentDidMount() {
    document.body.classList.add('home');
  }

  handleFormSubmit = (event) => {
    event.preventDefault();
    const { username, password } = this.state;
    //console.log('Signup -> form submit', { username, password });
    this.props.signup({ username, password });
  };

  handleChange = (event) => {
    const { name, value } = event.target;
    this.setState({ [name]: value });
  };

  render() {
    const { username, password } = this.state;
    return (
      <> {this.props.isLoggedin && <Redirect to='/allRooms' />}
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
                        <form id="signup-form" onSubmit={this.handleFormSubmit}>
                            <div className="form-group">
                              <input type="text" name="username" value={username} className="form-control" placeholder="Username" onChange={this.handleChange} />
                            </div>
                            <div className="form-group">
                              <input type="password" name="password" value={password} onChange={this.handleChange} className="form-control"  placeholder="Password" />
                            </div>
                            <input type='submit' className="submitSignupBtn" value='' />
                            <p className="" style={{marginBottom:"0"}}>Already have an account? <Link to={"/login"} className="a-login"> Login</Link></p> 
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
    </>
    );
  }
}

export default withAuth(Signup);
