var fs = require('fs');
var mime = require('mime-types');
var google = require('googleapis');
var key = require('./../auth/appKey.json')
var drive = google.drive('v2');

var authClient = new google.auth.JWT(
    key.client_email,
    null,
    key.private_key,
    ['https://www.googleapis.com/auth/drive'],
    null
);

//test
/*
 insertFile({
 path: ["tryAgain", "std01", "prt03", "oneMore", "hammock.jpg"],
 location: "hammock.jpg",
 parentId: null
 });
 */

module.exports = {
    insertFile: insertFile,
    share: share,
    unshare: unshare
}

//TODO finish this function
function fileExists(fileInfo, parentId, successCallback, failCallback){
    authClient.authorize(function(err, tokens){

        var requestParams = {auth: authClient};
        if (parentId){
            requestParams.q = "'" + parentId + "' in parents";
        }

        drive.files.list(requestParams
        , function(err, response) {
            if (err) {
                console.log('The API returned an error: ' + err);
                return;
            }
            var files = response.items;
            if (files.length == 0) {
                console.log('No files found.');
                failCallback(fileInfo);
            } else {
                for (var i = 0; i < files.length; i++) {
                    var file = files[i];
                    if (file.title == fileInfo.path[0]) {
                        console.log('Found ', file.title, file.id);
                        fileInfo.path = fileInfo.path.slice(1);
                        fileInfo.parentId = file.id;
                        successCallback(fileInfo);
                        return;
                    }
                    //console.log('%s (%s)', file.title, file.id);
                }
                //TODO if folder not found, create folder and return id
                failCallback(fileInfo);
            }
        });
    });
}

function insertFile(fileInfo, callback){
    if (fileInfo.path.length == 1){
        //insert file
        authClient.authorize(function(err, tokens) {
            if (err) {
                console.log('createFolder:', err);
                callback(err);
                return;
            }

            var mimeType = mime.lookup(fileInfo.location) || 'application/octet-stream';
            var resource = {
                title: fileInfo.path[0],
                mimeType: mimeType
            }
            if (fileInfo.parentId){
                resource.parents = [{id: fileInfo.parentId}];
                console.log('Parent ', fileInfo.parentId);
            }

            drive.files.insert({
                auth: authClient,
                resource: resource,
                media: {
                    mimeType: mimeType,
                    body: fs.createReadStream(fileInfo.location) // read streams are awesome!
                }
            }, callback);
        });
        console.log("Saved", fileInfo.location, "as", fileInfo.path[0]);
    } else {
        createFolder(fileInfo);
    }
}

function createFolder(fileInfo){
    authClient.authorize(function(err, tokens) {
        if (err) {
            console.log('createFolder:', err);
            return;
        }

        var requestParams = {auth: authClient};
        if (fileInfo.parentId){
            requestParams.q = "'" + fileInfo.parentId + "' in parents";
        }

        drive.files.list(requestParams
            , function(err, response) {
                if (err) {
                    console.log('The API returned an error: ' + err);
                    return;
                }
                var files = response.items;
                if (files.length == 0) {
                    console.log('No files found.');
                    mkDir(fileInfo);
                } else {
                    for (var i = 0; i < files.length; i++) {
                        var file = files[i];
                        if (file.title == fileInfo.path[0]) {
                            console.log('Found ', file.title, file.id);
                            fileInfo.path = fileInfo.path.slice(1);
                            fileInfo.parentId = file.id;
                            insertFile(fileInfo);
                            return;
                        }
                        //console.log('%s (%s)', file.title, file.id);
                    }
                    //TODO if folder not found, create folder and return id
                    mkDir(fileInfo);
                }
            });
    });
}

function mkDir(fileInfo){
    authClient.authorize(function(err, tokens) {
        if (err) {
            console.log(err);
            return;
        }

        var resource = {
            title: fileInfo.path[0],
            mimeType: 'application/vnd.google-apps.folder'
        }
        if (fileInfo.parentId){
            resource.parents = [{id: fileInfo.parentId}];
            console.log('Parent ', fileInfo.parentId);
        }

        console.log('The parent:', fileInfo.parentId);

        drive.files.insert({
            auth: authClient,
            resource: resource
        }, function(err, response){
            if (err){
                console.log(err);
            } else{
                console.log("Created ", response.title, response.id);
                fileInfo.path = fileInfo.path.slice(1);
                fileInfo.parentId = response.id;
                insertFile(fileInfo);
            }
        });
    });
}

function listFiles(parentId){
    authClient.authorize(function(err, tokens) {
        if (err) {
            console.log(err);
            return;
        }

        var requestParams = {auth: authClient};
        if (parentId){
            requestParams.q = "'" + parentId + "' in parents";
        }

        //TODO include query for parent
        drive.files.list(requestParams
            , function(err, response) {
                if (err) {
                    console.log('The API returned an error: ' + err);
                    return;
                }
                var files = response.items;
                if (files.length == 0) {
                    console.log('No files found.');
                } else {
                    console.log('Files:');
                    for (var i = 0; i < files.length; i++) {
                        var file = files[i];
                        console.log('%s (%s)', file.title, file.id);
                    }
                }
            });
    });
}

function getPermissions(fileId, callback){
    authClient.authorize(function(err, tokens) {
        drive.permissions.list({
            auth: authClient,
            fileId: fileId
        }, function(err, response){
            if (err) {
                console.log('List permissions failed: ' + err);
                return;
            } else {
                console.log('Got permissions for', fileId);
                callback(response.items);
            }
        });
    });
}

function getFileInfo(fileName, callback){
    authClient.authorize(function(err, tokens) {
        drive.files.list({
            auth: authClient
        }, function(err, response){
            if (err) {
                console.log('API call List Files failed: ' + err);
                return;
            }
            var files = response.items;
            if (files.length == 0) {
                console.log('No files found.');
            } else {
                for (var i = 0; i < files.length; i++) {
                    var file = files[i];
                    if (file.title == fileName) {
                        console.log('Found file info for', file.title, file.id);
                        callback(file);
                        return;
                    }
                }
            }
        });
    });
}

function share(fileName, email, permission){
    authClient.authorize(function(err, tokens) {
        drive.files.list({
            auth: authClient
        } , function (err, response) {
            if (err) {
                console.log('The API returned an error: ' + err);
                return;
            }
            var files = response.items;
            if (files.length == 0) {
                console.log('No files found.');
            } else {
                for (var i = 0; i < files.length; i++) {
                    var file = files[i];
                    if (file.title == fileName) {
                        console.log('Found ', file.title, file.id);
                        drive.permissions.insert({
                            auth: authClient,
                            fileId: file.id,
                            sendNotificationEmails: false,
                            resource: {
                                value: email,
                                type: "user",
                                role: permission
                            }
                        }, function(err){
                            if (err){
                                console.log(err);
                            } else {
                                console.log("Permission granted!")
                            }
                        });
                        return;
                    }
                }
            }
        });
    });
}

function unshare(fileName, email, callback) {
    getFileInfo(fileName, function(fileInfo){
        getPermissions(fileInfo.id, function(permissions){
            var i;
            for (i in permissions){
                console.log(permissions[i]);
                if (permissions[i].emailAddress == email){
                    console.log('Unshared', fileName, 'with', email);
                }
            }
        });
    });
}

function deletePermission(fileId, permissionId, callback){
    authClient.authorize(function(err, tokens) {
        drive.permissions.delete({
            auth: authClient,
            fileId: fileId,
            permissionId: permissionId
        } , function (err, response) {
            if (err) {
                console.log('The API returned an error: ' + err);
                return;
            } else {
                callback()
            }
        });
    });
}

function deleteAll(){
    authClient.authorize(function(err, tokens) {
        drive.files.list({
                auth: authClient
            },
            function (err, response) {
                if (err) {
                    console.log('The API returned an error: ' + err);
                    return;
                }
                var files = response.items;
                if (files.length == 0) {
                    console.log('No files found.');
                } else {
                    for (var i = 0; i < files.length; i++) {
                        var file = files[i];
                        drive.files.delete({
                            auth: authClient,
                            fileId: file.id
                        }, function(err){
                            if (err){
                                console.log(err);
                            } else {
                                console.log("Deleted", file.title);
                            }
                        });
                    }
                }
            }
        );
    });
}