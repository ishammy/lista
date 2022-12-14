import React from "react";
import {GoogleLogin} from "react-google-login";
const clientId = "393048546212-rbmdqi89tvb3kp71vpjhdin250f9294t.apps.googleusercontent.com";
 function Login(){
    const onSuccess = (res) =>{
        console.log("LOGIN SUCCESS! Current User: ", res.profileObj);
    }

    const onFailure = (res) =>{
        console.log("LOGIN FAILED!", res);
    }
    return(
        <div id="signInButton">
            <GoogleLogin
                clientId={clientId}
                buttonText="Login"
                onSuccess={onSuccess}
                onFailure={onFailure}
                cookiePolicy={'single_host_origin'}
                isSignedIn={true}/>
        </div>
    )
 }
export default Login;
