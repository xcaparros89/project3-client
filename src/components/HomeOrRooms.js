import React, { Component } from 'react'
import Home from './Home'
import AllRooms from './AllRooms'
import { withAuth } from "../lib/AuthProvider";

export class HomeOrRooms extends Component {
    render() {
        return (
            <div>
                {this.props.isLoggedin? <AllRooms /> : <Home />}
            </div>
        )
    }
}

export default  withAuth(HomeOrRooms);
