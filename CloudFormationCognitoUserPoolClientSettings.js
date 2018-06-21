const AWS = require('aws-sdk');

exports.handler = async (event) => {
    try {
        switch (event.RequestType) {
            case 'Create':
            case 'Update':
                var cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider();
                
                await cognitoIdentityServiceProvider.updateUserPoolClient({
                    UserPoolId: event.ResourceProperties.UserPoolId,
                    ClientId: event.ResourceProperties.UserPoolClientId,
                    SupportedIdentityProviders: event.ResourceProperties.SupportedIdentityProviders,
                    CallbackURLs: [event.ResourceProperties.CallbackURL],
                    LogoutURLs: [event.ResourceProperties.LogoutURL],
                    AllowedOAuthFlowsUserPoolClient: (event.ResourceProperties.AllowedOAuthFlowsUserPoolClient == 'true'),
                    AllowedOAuthFlows: event.ResourceProperties.AllowedOAuthFlows,
                    AllowedOAuthScopes: event.ResourceProperties.AllowedOAuthScopes
                }).promise();
                
                await sendCloudFormationResponse(event, 'SUCCESS');
                break;
                
            case 'Delete':
                await sendCloudFormationResponse(event, 'SUCCESS');
                break;
        }
        
        console.info(`CognitoUserPoolClientSettings Success for request type ${event.RequestType}`);
    } catch (error) {
        console.error(`CognitoUserPoolClientSettings Error for request type ${event.RequestType}:`, error);
        await sendCloudFormationResponse(event, 'FAILED');
    }
}

async function sendCloudFormationResponse(event, responseStatus, responseData) {
    var params = {
        FunctionName: 'CloudFormationSendResponse',
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify({
            StackId: event.StackId,
            RequestId: event.RequestId,
            LogicalResourceId: event.LogicalResourceId,
            ResponseURL: event.ResponseURL,
            ResponseStatus: responseStatus,
            ResponseData: responseData
        })
    };
    
    var lambda = new AWS.Lambda();
    var response = await lambda.invoke(params).promise();
    
    if (response.FunctionError) {
        var responseError = JSON.parse(response.Payload);
        throw new Error(responseError.errorMessage);
    }
}