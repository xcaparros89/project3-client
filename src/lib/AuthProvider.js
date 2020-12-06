import React from "react";
import auth from "./auth-service"; // Importamos funciones para llamadas axios a la API
const { Consumer, Provider } = React.createContext();

// HOC para crear Consumer
// el componente withAuth recibe un componente como argumento y nos devuelve un componente con el mismo componente dentro de un <Consumer /> con las propiedades user e isLoggedin (state), y los métodos login, signup y logout (this)
const withAuth = (WrappedComponent) => {
  return class extends React.Component {
    render() {
      return (
        <Consumer>
          {/* El componente <Consumer> provee un callback que recibe el "value" con el objeto Providers */}
          {({ login, signup, user, logout, isLoggedin, guest, errorMessage }) => {
            return (
              <WrappedComponent
                login={login}
                signup={signup}
                user={user}
                logout={logout}
                isLoggedin={isLoggedin}
                guest={guest}
                errorMessage={errorMessage}
                {...this.props}
              />
            );
          }}
        </Consumer>
      );
    }
  };
};

// Provider
class AuthProvider extends React.Component {
  state = { isLoggedin: false, user: null, isLoading: true, errorMessage:false };

  componentDidMount() {
    // luego de que se monte el componente, llama a auth.me() que nos devuelve el usuario y setea los valores para loguearlo
    auth
      .me()
      .then((user) =>
        this.setState({ isLoggedin: true, user: user, isLoading: false, errorMessage:false })
      )
      .catch((err) =>
        this.setState({ isLoggedin: false, user: null, isLoading: false, errorMessage:false })
      );
  }

  signup = (user) => {
    console.log(user, 'user signup')
    const { username, password } = user;

    auth
      .signup({ username, password })
      .then((data) => {console.log(data, 'data'); data.errorMessage? this.setState({ errorMessage:data.errorMessage }) : this.setState({ isLoggedin: true, user:data.user })})
      .catch(({ response }) =>
        this.setState({ message: response.data.statusMessage })
      );
  };

  login = (user) => {
    console.log(user, 'user login')
    const { username, password } = user;

    auth
      .login({ username, password })
      .then((data) => {console.log(data, 'data'); data.errorMessage? this.setState({ errorMessage:data.errorMessage }) : this.setState({ isLoggedin: true, user:data.user })})
      .catch((err) => console.log(err));
  };

  guest = (user) => {
    auth
    .guest(user)
    .then((user)=>{this.setState({ isLoggedin: true, user}); console.log(user)})
  };

  logout = () => {
    auth
      .logout()
      .then(() => this.setState({ isLoggedin: false, user: null }))
      .catch((err) => console.log(err));
  };

  render() {
    // destructuramos isLoading, isLoggedin y user de this.state y login, logout y signup de this
    const { isLoading, isLoggedin, user, errorMessage } = this.state;
    const { login, logout, signup, guest } = this;

    return isLoading ? (
      // si está loading, devuelve un <div> y sino devuelve un componente <Provider> con un objeto con los valores: { isLoggedin, user, login, logout, signup}
      // el objeto pasado en la prop value estará disponible para todos los componentes <Consumer>
      <div>Loading</div>
    ) : (
      <Provider value={{ isLoggedin, user, errorMessage, login, logout, signup, guest }}>
        {this.props.children}
      </Provider>
    ); /*<Provider> "value={}" datos que estarán disponibles para todos los componentes <Consumer> */
  }
}

export { Consumer, withAuth }; //  <--	RECUERDA EXPORTAR  ! ! !

export default AuthProvider; //	<--	RECUERDA EXPORTAR  ! ! !
