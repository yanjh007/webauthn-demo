
const 
base64url = require('base64url'),
cfg       = require('./config'),
utils     = require('./utils');
database  = require('./pdb'),
WPATH_ROOT   = "/wauth",
WREPLY_PARTY = "ULSC Crop.";

// standard result ok 
const jr_ok = ( content = null, rcode = 200) =>{
    return content ? { R: rcode, C: content } : { R: rcode};
}

// standard result 
const jr_error = (msg = "Unknow Error", rcode = 500) =>{
    return { R: rcode, C: msg };
}


// set router 
exports.setRouter = (app)=>{
    app.get('/', function (req, rep) {
        rep.sendFile('index.html') // serving path.join(__dirname, 'public', 'myHtml.html') directly
    })

    /* Returns personal info and THE SECRET INFORMATION and if logged in*/
    app.get(WPATH_ROOT+'/uinfo', (req, rep) => {
        rep.send(req.session.login ? 
        jr_ok({
            'name': database[req.session.login].name,
            'secret': '<img width="250px" src="img/theworstofthesecrets.jpg">'
        }) : 
        jr_error ('访问拒绝',403));
    })

    /* Logs user out */
    app.get(WPATH_ROOT+'/logout', (req, rep) => {
        req.session.login = null;
        rep.send(jr_ok());
    })

    // webauthn register router 
    app.post(WPATH_ROOT+'/register', (req, rep) => {
        if(!(req.body && req.body.login && req.body.name)) {
            return rep.send(jr_error( "需要用户名和登录名称信息!",501));
        }

        let { login,name } = req.body;

        // already register
        if(database[login] && database[login].registered) {
            rep.send(jr_error( `用户 ${login} 已经存在`));
        } else {
            // register set to database
            let uid = utils.randomBase64URLBuffer();
            
            database[login] = {
                id: uid,
                name: name,
                registered: false, // set true after response
                authenticators: []
            }

            // challage Cred
            let challengeMakeCred    = utils.generateServerMakeCredRequest({ name: login, displayName: name, id: uid}, WREPLY_PARTY)

            // remember challenge and login for res check 
            req.session.challenge = challengeMakeCred.challenge
            req.session.login = login

            // res challagenMakeCred
            rep.send(jr_ok(challengeMakeCred));
        }
    })


    // client response
    app.post(WPATH_ROOT+'/response', (req, rep) => {
        if(!req.body       || !req.body.id
        || !req.body.rawId || !req.body.response
        || !req.body.type  || req.body.type !== 'public-key' ) {
            return rep.send(jr_error( '响应内容缺乏必要组成部分或类型不是公钥!'));
        }

        // webauthn Content
        let webauthnResp = req.body
        let clientData   = JSON.parse(base64url.decode(webauthnResp.response.clientDataJSON));

        /* Check challenge information ... ...and origin*/
        let challenge = req.session.challenge
        let login     = req.session.login
        if(clientData.challenge !== challenge || clientData.origin !== cfg.origin) {
            return rep.send(jr_error('挑战或来源信息不匹配!'));
        }

        let result;
        if(webauthnResp.response.attestationObject !== undefined) {
            /* This is create cred register OK */
            result = utils.verifyAuthenticatorAttestationResponse(webauthnResp);

            if(result.verified) {
                database[login].authenticators.push(result.authrInfo);
                database[login].registered = true
            }
        } else if(webauthnResp.response.authenticatorData !== undefined) {
            /* This is get assertion */
            result = utils.verifyAuthenticatorAssertionResponse(webauthnResp, database[login].authenticators);
        } else {
            return rep.send(jr_error('无效的响应内容'));
        }

        // check verified 
        if(result.verified) {
            rep.send(jr_ok());
        } else {
            rep.send(jr_error( '无法验证签名'));
        }
    })

    // client login 
    app.post(WPATH_ROOT+'/login', (req, rep) => {
        if(!req.body || !req.body.login) {
            return rep.send(jr_error( '缺少登录信息！'));
        }

        let login = req.body.login;

        // check exist 
        if(!database[login] || !database[login].registered) {
            return rep.send(jr_error( `用户 ${login} 不存在!`));
        }

        // response assertion 
        let getAssertion    = utils.generateServerGetAssertion(database[login].authenticators);
        getAssertion.status = 'ok';

        req.session.challenge = getAssertion.challenge;
        req.session.login  = login;

        rep.send(jr_ok(getAssertion));
    })
}