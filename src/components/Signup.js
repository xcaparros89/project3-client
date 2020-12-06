import React, { Component } from "react";
import { Link } from "react-router-dom";
import { withAuth } from "../lib/AuthProvider";
import logo from "../img/logo.png"
import { Redirect } from 'react-router-dom';

class Signup extends Component {
  state = { username: "", password: "", repeatPassword:'', isEmpty:false, isDifferent:false };

  componentDidMount() {
    document.body.classList.add('home');
  }

  handleFormSubmit = (event) => {
    event.preventDefault();
    const { username, password, repeatPassword } = this.state;
    const newUsername = username.trim();
    const newPassword = password.trim();
    const newRepeatPassword = repeatPassword.trim();
    if(!newUsername || !newPassword){
      this.setState({isEmpty:true, isDifferent:false})
    } else if(newRepeatPassword !== newPassword){
      this.setState({isEmpty:false, isDifferent:true})
    } else{
    this.setState({username:newUsername, password:newPassword, isEmpty:false, isDifferent:false})
    //console.log('Signup -> form submit', { username, password });
    this.props.signup({username:newUsername, password:newPassword });
    }
  };

  handleChange = (event) => {
    const { name, value } = event.target;
    this.setState({ [name]: value });
  };

  render() {
    const { username, password, repeatPassword } = this.state;
    return (
      <> {this.props.isLoggedin && <Redirect to='/allRooms' />}
       {console.log(this.props, 'signup props')}
    <div className="container login-container d-flex align-items-center">
        <div className="container home-bg">
            <div className="row no-gutters">
                <div className="col-12">
                    <img className="tile-bg mx-auto d-block" src={logo} alt="" />
                </div>
            </div>
            <div className="row no-gutters">
                <div className="container login-inner-container">
                <div className="col-12">
					        <img src={require("../img/home-login-bg-top.png")} alt="" className="tile-bg"/>
                </div>
                    <div className="col-12 text-center login">
                        <form id="signup-form" onSubmit={this.handleFormSubmit}>
                            <div className="form-group">
                              <input type="text" name="username" value={username} className="form-control" placeholder="Username" onChange={this.handleChange} />
                            </div>
                            <div className="form-group">
                              <input type="password" name="password" value={password} onChange={this.handleChange} className="form-control"  placeholder="Password" />
                            </div>
                            <div className="form-group">
                              <input type="password" name="repeatPassword" value={repeatPassword} onChange={this.handleChange} className="form-control"  placeholder="Repeat password" />
                            </div>
                            <p className='error-message'>{this.props.errorMessage}</p>
                            {this.state.isEmpty && <p className='error-message'>Write a username and password!</p>}
                            {this.state.isDifferent && <p className='error-message'>The passwords do not match!</p>}
                            <input type='submit' className="submitSignupBtn" value='' />
                            <p className="" style={{marginBottom:"0"}}>Already have an account? <Link to={"/login"} className="a-login"> Login</Link></p> 
                        </form>
                    </div>
                    <div className="col-12">
					        <img src={require("../img/home-login-bg-footer.png")} alt="" className="tile-bg"/>
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
