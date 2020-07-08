'use strict';

const 
WPATH_ROOT = '/wauth',
WPATH = {
    REGISTER  : WPATH_ROOT+"/register",
    RESPONSE  : WPATH_ROOT+"/response",
    LOGIN     : WPATH_ROOT+"/login",
    LOGOUT    : WPATH_ROOT+"/logout",
    LOGGEDIN  : WPATH_ROOT+"/islogin",
    UINFO     : WPATH_ROOT+"/uinfo",
}

/**
 * Converts PublicKeyCredential into serialised JSON
 * @param  {Object} pubKeyCred
 * @return {Object}            - JSON encoded publicKeyCredential
 */
const publicKeyCredentialToJSON = (pubKeyCred) => {
    if( pubKeyCred instanceof Array) {
        return pubKeyCred.map(v => { return publicKeyCredentialToJSON(v) } )
    } else if( pubKeyCred instanceof ArrayBuffer) {
        return base64url.encode(pubKeyCred)
    } else if( pubKeyCred instanceof Object) {
        let obj = {}
        for (let key in pubKeyCred) {
            obj[key] = publicKeyCredentialToJSON(pubKeyCred[key])
        }
        return obj
    } else {
        return pubKeyCred
    }
}

/**
 * Generate secure random buffer
 * @param  {Number} len - Length of the buffer (default 32 bytes)
 * @return {Uint8Array} - random string
 */
const generateRandomBuffer = (len) => {
    len = len || 32;

    let randomBuffer = new Uint8Array(len);
    window.crypto.getRandomValues(randomBuffer);

    return randomBuffer
}

/**
 * Decodes arrayBuffer required fields.
 */
const preformatMakeCredReq = (makeCredReq) => {
    makeCredReq.challenge = base64url.decode(makeCredReq.challenge);
    makeCredReq.user.id = base64url.decode(makeCredReq.user.id);

    return makeCredReq
}

/**
 * Decodes arrayBuffer required fields.
 */
const preformatGetAssertReq = (getAssert) => {
    getAssert.challenge = base64url.decode(getAssert.challenge);
    
    for(let allowCred of getAssert.allowCredentials) {
        allowCred.id = base64url.decode(allowCred.id);
    }

    return getAssert
}

const doPost = (fpath,fbody) =>{
    return fetch(fpath, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fbody)
    }).then((response) => response.json());
}

// register 
const getMakeCredentialsChallenge = (fbody) => {
    return doPost(WPATH.REGISTER, fbody).then(res => {
        if(res.R == 200) {
            return res.C;
        } else {
            throw new Error(`服务器处理错误：: ${res.R} - ${ res.C }`);
        }
    })
}

// server response
const sendWebAuthnResponse = (fbody) => {
    return doPost(WPATH.RESPONSE, fbody).then(res => {
        if(res.R == 200) {
            return res.C;
        } else {
            throw new Error(`响应处理错误: ${res.R} - ${res.C}`);
        }
    })
}

// login 
const getGetAssertionChallenge = (fbody) => {
    return doPost(WPATH.LOGIN, fbody).then(res => {
        if(res.R == 200) {
            return res.C;
        } else {
            throw new Error(`服务器处理错误: ${res.R} - ${res.C}`);
        }
    })
}

// get user info and login status
const getUinfo = () => {
    return fetch(WPATH.UINFO, { credentials: 'include' })
        .then((response) => response.json())
        .then((response) => {
            return response
        })
}

// get user info and login status
const userLogout = () => {
    return fetch(WPATH.LOGOUT, { credentials: 'include' })
        .then((response) => response.json())
        .then((response) => {
            return response
        })
}