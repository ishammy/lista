import React from "react";
import {GoogleLogout} from "react-google-login";
const clientId = "393048546212-rbmdqi89tvb3kp71vpjhdin250f9294t.apps.googleusercontent.com";

function Logout(){
    const onSuccess = () =>{
        console.log("Logout Successful")
    }
    return(
        <div id="signOutButton">
            <GoogleLogout
                clientId={clientId}
                buttonText={"Logout"}
                onLogoutSuccess={onSuccess}/>
        </div>
    )
}

export default Logout;
