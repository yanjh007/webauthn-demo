const showHome =(res)=> {
    if(res.R == 200) {
        v_secret.innerHTML = res.C.secret
        v_name.innerHTML   = res.C.name
        showView(0)
    } else {
        showView(1)
    }
}

const showView = function(vlist) {
    if (vlist == 0) {
        showView([c_home, c_login, c_register])
    } else if (vlist == 1) {
        showView([c_login, c_home, c_register])
    } else if (vlist == 2) {
        showView([c_register, c_login, c_home])
    } else if (vlist && vlist.length) {
        vlist.map((v,i)=>{
            v.style.display = (i>0) ? 'none' : "block";
        })
    }
}

/* Handle for register form submission */
var doRegister = ()=> {
    let login    = r_lname.value;
    let name     = r_name.value;

    if(!login || !name) return alert('需要登录和名称信息!')

    getMakeCredentialsChallenge({login, name})
        .then((response) => {
            // decode publicKey and create credential
            let publicKey = preformatMakeCredReq(response);
            return navigator.credentials.create({ publicKey })
        })
        .then((response) => { // send webAuthn Response
            let makeCredResponse = publicKeyCredentialToJSON(response);
            return sendWebAuthnResponse(makeCredResponse);
        })
        .then((response) => { // response ok get userinfo
            getUinfo().then(res => { showHome(res) });
        })
        .catch((error) => alert(error))
}

// do login
var doLogin = ()=> {
    let login = r_login.value;

    if(!login) return alert('需要登录名称!')

    getGetAssertionChallenge({login})
        .then((response) => {
            let publicKey = preformatGetAssertReq(response);
            return navigator.credentials.get({ publicKey })
        })
        .then((response) => { // send webAuthn Response
            let getAssertionResponse = publicKeyCredentialToJSON(response);
            return sendWebAuthnResponse(getAssertionResponse)
        })
        .then((response) => { // response ok get userinfo
            getUinfo().then(res => { showHome(res) });
        })
        .catch((error) => alert(error))
}

// do login
var doLogout = () => {
    userLogout().then(res=>{
        showView([c_login, c_home, c_register]);
    })
}
