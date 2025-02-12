A local build following the AWS Cognito Workshop Pet Shop from
https://www.cognitobuilders.training/30-lab2/ using the resources created in
my AWS trial account in the preoceeding steps instead of JSFiddle.

This is a serverless web app with index.html is the entry point.  The app 
allows the user to sign in (signup and MFA features not revised from JSFiddle)
and retrieve a payload from AWS with an API Gateway GET method call.

w3.css content downloaded from https://www.w3schools.com/w3css/4/w3.css.  This
replaces the ...w3.css resource added to the fiddle project.

Using the AWS SDK in the client side browser requires the npm packages and all
of their dependencies be bundled into a single JavaScript file.  This file is
added to as a script in the index.html file to provide access to the SDK
resources in the browser.  WebPack is the recommended tool to create the 
single JavaScript file.  But in this case, we will just use the demo file 
from the work shop which is webPack.js downloaded from 
https://demowebapp.s3-us-west-2.amazonaws.com/amazon-cognito-identity.js.

WebPack References:
https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/welcome.html
	look for "Using browsers in V3" on the page
https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/webpack.html

The remaining resources referenced in the demo have not been added to this app.
Axios was bypassed by using native XMLHttpRequest commands rather than the Axios
convienence functions.  QR Codes were not implemented since the MFA tab, while
coded, was not migrated from JSFiddle.  This could have been done by putting the
QR resource into a JavaScript file and adding it as a <script/> to the index.html
file as well and completing the conversion of the code base.

The Signup page was not converted either.  Conversion consists of removing the $
JSFiddle commands and replacing them with native document.getElementById 
statements.

The Call APIs tab will display the response body if it is successful.  The 
request includes the JWT in the header.  This code does not require any imported
functions from the webPack.  The Signin button require the inports that the 
webPack exposes and makes available to the app such as:
- AmazonCognitoIdentity.  This would be best in a UI5 model.

Successful Extra Efforts:
- Added response handling for status other than 200, and
- Reviesed the AWS API Gateway to use the User Pool from bopenui5walkthrough by:
	- Changeing the UserPoolId and ClientId in the index.js JSON varialble,
	- Creating a new Authorizer,
	- Changing the Resources GET method to use the new Authorizer, and
	- Re-deploying the API.
- Manually created the /dist folder and added files.
- Deployed to AWS Amplify using an amplify.yaml like the bopenui5walkthrough app.
	- Succusfully ran on the hosted sight just like the local site.

Future Learings:
- Build the webPack.js based on AWS documentation for the app's required AWS SDK 
	imported functions.
- Determine if the webPack can be loaded as a project shim or using the 
	ui5-tooling-modules as in the bopenui5walkthrough project to expose third 
	party packages that do not comform to the UI5 sap.ui.define requirements for 
	modules.  This would eliminate needing to include it as a <script/> in the 
	index.html file which is a better practice.
