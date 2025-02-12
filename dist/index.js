/**
 * Configure user pool and client
 */
let poolData = {
	UserPoolId: "us-east-2_RoJFmlDSr", //"us-east-2_JTIfkBS7K",
	ClientId: "73g5dfelj45uh1q61aen4q4a2n" //"thdcka5bmminf8sanfnff3ild"
};

let userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
let cognitoUser;

/**
 * Helpers
 */
function openTab(tabName) {
	var i;
	var x = document.getElementsByClassName("tab");
	for (i = 0; i < x.length; i++) {
		x[i].style.display = "none";
	}
	document.getElementById(tabName).style.display = "block";
}

function parseJwt(token) {
	var base64Url = token.split('.')[1];
	var base64 = base64Url.replace('-', '+').replace('_', '/');
	return JSON.parse(window.atob(base64));
};


/**
 * Add Sign Up
 */
function signUp() {

	var email = $("#signup_email").val();
	var username = $("#signup_username").val();
	var password = $("#signup_password").val();
	var name = $("#signup_name").val();
	var phone = $("#signup_phone").val();

	var attributeList = [];

	var dataEmail = { Name: 'email', Value: email };
	var dataPhone = { Name: 'phone_number', Value: phone };
	var dataName = { Name: 'name', Value: name };

	var attributeEmail = new AmazonCognitoIdentity.CognitoUserAttribute(dataEmail);
	var attributeName = new AmazonCognitoIdentity.CognitoUserAttribute(dataName);
	var attributePhone = new AmazonCognitoIdentity.CognitoUserAttribute(dataPhone);

	attributeList.push(attributeEmail);
	attributeList.push(attributeName);
	attributeList.push(attributePhone);

	userPool.signUp(username, password, attributeList, null, function (err, result) {
		if (err) {
			console.log(err.message || JSON.stringify(err));
			return;
		} else {
			console.log("Success:" + result);

			var cognitoUser = result.user;
			var confirmationCode = prompt("Please enter confirmation code:");

			cognitoUser.confirmRegistration(confirmationCode, true, function (err, result) {
				if (err) {
					alert(err.message || JSON.stringify(err));
					return;
				}
				console.log('call result: ' + result);
			});
		}
	});
}


/**
 * Add Sign In
 */
function signIn() {

	var username = document.getElementById("signin_username").value //$("#signin_username").val();
	var password = document.getElementById("signin_password").value //$("#signin_password").val();

	var authenticationData = {
		Username: username,
		Password: password
	};

	var userData = {
		Username: username,
		Pool: userPool,
	};

	var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(
		authenticationData
	);

	console.log("--------Authenticate --- " + username + ", UserPool:" + userPool);

	cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

	//cognitoUser.setAuthenticationFlowType('CUSTOM_AUTH');

	cognitoUser.authenticateUser(authenticationDetails, {
		onSuccess: function (result) {
			var idToken = result.getIdToken().getJwtToken();
			var accessToken = result.getAccessToken().getJwtToken();

			document.getElementById("idToken").innerHTML = '<b>ID Token</b><br>' + JSON.stringify(parseJwt(idToken), null, 2);
			//	$("#idToken").html('<b>ID Token</b><br>'+JSON.stringify(parseJwt(idToken),null, 2));
			document.getElementById("accessToken").innerHTML = '<b>Access Token</b><br>' + JSON.stringify(parseJwt(accessToken), null, 2);
			//	$("#accessToken").html('<b>Access Token</b><br>'+JSON.stringify(parseJwt(accessToken), null, 2));
			console.log("AccessToken:" + accessToken);
		},

		onFailure: function (err) {
			alert(err.message || JSON.stringify(err));
		},

		totpRequired: function (codeDeliveryDetails) {
			console.log("mfaRequired");
			console.log(codeDeliveryDetails);
			var verificationCode = prompt('Please input second factor code', '');
			cognitoUser.sendMFACode(verificationCode, this, 'SOFTWARE_TOKEN_MFA');
		},
	});
}

/**
* Add Sign Out
*/
function signOut() {
	cognitoUser.signOut();
	document.getElementById("idToken").innerHTML = '';
	//	$("#idToken").html('');
	document.getElementById("accessToken").innerHTML = '';
	//	$("#accessToken").html('');
	document.getElementById("apiresponse").innerHTML = '';
	//	$("#apiresponse").html('');
}


/**
 * Enable MFA
 *
 * Important Note: Make sure TOTP/MFA is enabled in the user pool
 */
function enableMFA() {

	console.log("--------Start TOTP MFA Setup");
	cognitoUser.associateSoftwareToken({
		onSuccess: function (result) {
			console.log(result);
		},
		associateSecretCode: function (secretCode) {
			console.log("MFASecretCode:" + secretCode);

			var canvas = document.getElementById('qrcanvas');
			var tokenObj = cognitoUser.signInUserSession.idToken.payload;
			var totpUri = "otpauth://totp/MFA:" + tokenObj["email"] + "?secret=" + secretCode + "&issuer=CognitoJSPOC";
			console.log(totpUri);

			var qrcode = new QRCode(document.getElementById("qrcode"), {
				text: totpUri,
				width: 128,
				height: 128,
				colorDark: "#000000",
				colorLight: "#ffffff",
				correctLevel: QRCode.CorrectLevel.H
			});
		},

		onFailure: function (err) {
			console.log(err);
		}
	});
}


function continueMFA() {

	var totpCode = prompt("Enter software token code");
	cognitoUser.verifySoftwareToken(totpCode, 'SoftwareToken', {
		onSuccess: function (result) {
			console.log(result);

			totpMfaSettings = {
				PreferredMfa: true,
				Enabled: true
			};
			cognitoUser.setUserMfaPreference(null, totpMfaSettings, function (err, result) {
				if (err) {
					alert(err);
				}
				console.log('setUserMfaPreference call result ' + result)
			});
		},

		onFailure: function (err) {
			console.log(err);
		}
	});
}

/**
 * Disable MFA
 */
function disableMFA() {

	var mfaSettings = {
		PreferredMfa: false,
		Enabled: false
	};

	cognitoUser.setUserMfaPreference(mfaSettings, mfaSettings, function (err, result) {
		if (err) {
			console.error(err);
		}
		console.log('clear MFA call result ' + result);
	});
}


/**
 * Call protected APIGW endpoint
 *
 * Important:
 *   Make sure apigw cognito authorizer configuration is complete
 *   Make sure api accepts id-token (no oauth scope defined in authorization)
 *   You can only use id-token since custom scopes are not supported when sdk is used
 */
function callAPIGW() {

	apiGatewayUrl = "https://6pb2sqnbcl.execute-api.us-east-2.amazonaws.com/Prod/pets";

	// set ID Token in "Authorization" header
	const headers = {
		'Content-Type': 'application/json',
		'Authorization': cognitoUser.signInUserSession.idToken.jwtToken
	}

	// New request for the GET method call with the headers for authentication
	let xhr = new XMLHttpRequest();

	// Callback function for the response
	const onload = () => {
		document.getElementById('apiresponse').innerHTML = '';
		if(xhr.status === 200) {
			let json;
			if(xhr.responseType === 'json') {
				json = xhr.response;
			} else {
				json = JSON.parse(xhr.responseText);
			}
			console.log(json);
			document.getElementById('apiresponse').innerHTML = '<b>Response</b><br>'+JSON.stringify(json,null, 2);
		} else {
			document.getElementById('apiresponse').innerHTML = xhr.status + ' - ' + xhr.response.message;
		}
	};
	xhr.onload = onload;

	// Open the request providing the request Method and URL and assign the response type
	xhr.open("GET", apiGatewayUrl, true);
	xhr.responseType = 'json';

	// Set the headers
	xhr.setRequestHeader('Content-Type', 'application/json');
	xhr.setRequestHeader('Accept', 'application/json');
	xhr.setRequestHeader('Authorization', cognitoUser.signInUserSession.idToken.jwtToken);


	// Send the request
	xhr.send();

}
