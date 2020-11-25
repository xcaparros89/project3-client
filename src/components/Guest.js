import React, { Component } from "react";
import { Link } from "react-router-dom";
import { withAuth } from "../lib/AuthProvider";
import { Redirect } from 'react-router-dom';
import logo from "../img/logo.png"
import playBtn from "../img/btn/btn-play.png";
import $ from 'jquery';

class Guest extends Component {
    state = { guest:""};

    componentDidMount() {
        document.body.classList.add('home');
      }

    handleFormSubmit = (event) => {
        event.preventDefault();
        const { guest } = this.state;
        this.props.guest(guest);
        console.log(this.props)
    };

    handleChange = (event) => {
        const { name, value } = event.target;
        this.setState({ [name]: value });
    };

  render() {
    const { guest } = this.state;
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
                        <form id="signup-form"  onSubmit={(e)=>this.handleFormSubmit(e)}>
                            <div className="form-group">
                              <input type="text" name="guest" value={guest} className="form-control" placeholder="Type a Name" onChange={this.handleChange} />
                            </div>
                            <input type='submit' className="submitPlayBtn" value='' />
                            <p className="" style={{marginBottom:"0"}}>Already have an account? </p>
                            <p><Link to={"/login"} className="a-login"> Login</Link> or <Link to={"/signup"} className="a-login"> Signup</Link> to create it.</p> 
                            <br/>
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

export default withAuth(Guest);