import React from 'react'
import Login from './Login'
import logo from '../img/logo.png'
import loginBtn from "../img/btn/btn-login.png";
import { Link } from "react-router-dom";

function Home() {
  let handleFormSubmit = (event) => {
    event.preventDefault();
    const { email, password } = this.state;
    this.props.login({ email, password });
  };

  document.body.classList.add('home');

  return (
	<div className="container login-container d-flex align-items-center" style={{marginTop:'5%'}}>
	<div className="container home-bg">
		<div className="row no-gutters">
			<div className="col-12">
				<img className="tile-bg mx-auto d-block" src={logo} alt="RoboRace" />
			</div>
		</div>
		<div className="row no-gutters">
			<div className="container login-inner-container">
				<div className="col-12 text-center login">
					<p className="login-text">Assume control of a robot in a dangerous widget factory filled with moving, course-altering conveyor belts, metal-melting laser beams,  bottomless pits, crushers and a variety of other obstacles. Just try to survive and escape!</p>
					<Link to={"/login"} className="a-login"><button className="submitLoginBtn"></button></Link>
					<p className="" style={{marginBottom:"0"}}>Don't you have an account?</p>
					<p><Link to={"/guest"} className="a-login">Play as Guest</Link> or <Link to={"/signup"} className="a-login">Register</Link></p>
					<br/><br/><br/>
				</div>
			</div>
		</div>
			   
	</div>
</div>
  )
}

export default Home;