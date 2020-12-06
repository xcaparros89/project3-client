import React, { Component } from "react";
import { Link } from "react-router-dom";
import { withAuth } from "../lib/AuthProvider";
import { Redirect } from 'react-router-dom';
import logo from "../img/logo.png"

class Guest extends Component {
    state = { guest:"", isEmpty:false};

    componentDidMount() {
        document.body.classList.add('home');
      }

    handleFormSubmit = (event) => {
        event.preventDefault();
        const { guest } = this.state;
        const newGuest = guest.trim();
        if(newGuest){
            this.setState({guest:newGuest, isEmpty:false})
            this.props.guest(guest);
        } else{
            this.setState({isEmpty:true})
        }
    };

    handleChange = (event) => {
        const { name, value } = event.target;
        this.setState({ [name]: value });
    };

  render() {
    const { guest } = this.state;
    return (
        <> {this.props.isLoggedin && <Redirect to='/allRooms' />}
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
                        <div className="d-flex align-items-center" style={{width:'100%', height:'100%', justifyContent:'center'}}>
                        <form id="signup-form"  onSubmit={(e)=>this.handleFormSubmit(e)} style={{alignSelf:'center'}}>
                            <div className="form-group" >
                              <input type="text" name="guest" value={guest} className="form-control" placeholder="Type a Name" onChange={this.handleChange} />
                            </div>
                            {this.state.isEmpty && <p className='error-message'>Write a username!</p>}
                            <input type='submit' className="submitPlayBtn" value='' />
                            <p className="" style={{marginBottom:"0"}}>Already have an account? </p>
                            <p className="last-p"><Link to={"/login"} className="a-login"> Login</Link> or <Link to={"/signup"} className="a-login"> Signup</Link> to create it.</p> 
                        </form>
                        </div>
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

export default withAuth(Guest);