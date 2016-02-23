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

module.exports = {
    insertFile: insertFile,
    deleteFile: deleteFile,
    mkDir: mkDir,
    share: share,
    unshare: unshare,
    getFileInfo: getFileInfo,
    listFiles: listFiles
}

//TODO no errors on redundant calls!

function fileExists(fileInfo, parentId, successCallback, failCallback){
    authClient.authorize(function(err, tokens){

        var requestParams = {auth: authClient};
        if (parentId){
            requestParams.q = "'" + parentId + "' in parents";
        }

        listFiles(parentId
            , function(err, files) {
                if (err) {
                    failCallback(err);
                    return;
                }
                for (var i = 0; i < files.length; i++) {
                    var file = files[i];
                    if (file.title == fileInfo.path[0]) {
                        console.log('gdrive | fileExists: ', file.title, file.id);
                        successCallback(null);
                        return;
                    }
                }
                failCallback(null);
            });
    });
}

function insertFile(fileInfo, callback){
    if (fileInfo.path.length == 0) {
        callback(new Error("insertFile requires a path of length > 0"));
    }
    else if (fileInfo.path.length == 1){
        console.log('gDrive | insertFile | length==1 block');
        //insert file
        authClient.authorize(function(err, tokens) {
            if (err) {
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
            }

            drive.files.insert({
                auth: authClient,
                resource: resource,
                media: {
                    mimeType: mimeType,
                    body: fileInfo.body
                }
            }, function(err, response){
                if (err) { callback(err); return; }
                console.log("gdrive | Inserted ", fileInfo.location, " as ", fileInfo.path[0]);
                callback(null, response);
            });
        });
    } else {
        console.log('gDrive | insertFile | create folders block');
        //create folders for insert
        var folderInfo = JSON.parse(JSON.stringify(fileInfo));
        folderInfo.path = folderInfo.path.slice(0, -1);
        fileInfo.path = fileInfo.path.slice(-1);
        mkDir(folderInfo, function(err, response){
            if (err) { callback(err); return; }
            fileInfo.parentId = folderInfo.parentId;
            insertFile(fileInfo, callback);
        });
    }
}

function mkDir(fileInfo, callback){
    authClient.authorize(function(err, tokens) {
        if (err) {
            callback(err);
            return;
        }

        if (fileInfo.path.length == 0) { callback(null); return; }

        listFiles(fileInfo.parentId, function(err, files){
            if (err) {
                callback(err);
                return;
            } else {
                //check if folder already exists
                for (var i=0; i < files.length; i++){
                    if (files[i].title == fileInfo.path[0]){
                        console.log("gdrive | Directory already exists: ", files[i].title, files[i].id);
                        fileInfo.path = fileInfo.path.slice(1);
                        fileInfo.parentId = files[i].id;
                        if (fileInfo.path.length > 0){
                            mkDir(fileInfo, callback);
                        } else {
                            callback(null, files[i]);
                        }
                        return;
                    }
                }

                //if not exists, create directory
                var resource = {
                    title: fileInfo.path[0],
                    mimeType: 'application/vnd.google-apps.folder'
                }
                if (fileInfo.parentId){
                    resource.parents = [{id: fileInfo.parentId}];
                }

                drive.files.insert({
                    auth: authClient,
                    resource: resource
                }, function(err, response){
                    if (err) {
                        callback(err);
                        return;
                    } else {
                        console.log("gdrive | Directory created: ", response.title, response.id);
                        fileInfo.path = fileInfo.path.slice(1);
                        fileInfo.parentId = response.id;
                        if (fileInfo.path.length > 0){
                            mkDir(fileInfo, callback);
                        } else {
                            callback(null, response);
                        }
                    }
                });
            }
        });
    });
}

function share(fileName, email, permission, callback){
    authClient.authorize(function(err, tokens) {
        listFiles(null
            , function (err, files) {
                if (err) { callback(err); return; }
                for (var i = 0; i < files.length; i++) {
                    var file = files[i];
                    if (file.title == fileName) {
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
                            if (err){ callback(err); return; }
                            else {
                                console.log("gdrive | Added permissions for ", fileName, " to ", email);
                                callback(null);
                            }
                        });
                        return;
                    }
                }
            });
    });
}

function unshare(fileName, email, callback) {
    getFileInfo(fileName, function(err, fileInfo){
        if (err) { callback(err); return; }
        getPermissions(fileInfo.id, function(err, permissions){
            if (err) { callback(err); return; }
            for (var i in permissions){
                if (permissions[i].emailAddress == email){
                    deletePermission(fileInfo.id, permissions[i].id
                        , function(err){
                            if (err) { callback(err); return; }
                            console.log("gdrive | Removed permissions for ", fileName, " from ", permissions[i].emailAddress);
                            callback(null);
                        })
                }
            }
        });
    });
    //TODO file not found should return error?
    callback(null);
}

function deletePermission(fileId, permissionId, callback){
    authClient.authorize(function(err, tokens) {
        drive.permissions.delete({
            auth: authClient,
            fileId: fileId,
            permissionId: permissionId
        } , function (err, response) {
            callback(err);
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
                callback(err);
                return;
            } else {
                callback(null, response.items);
            }
        });
    });
}

function getFileInfo(fileName, callback){
    authClient.authorize(function(err, tokens) {
        listFiles(null, function(err, files){
            if (err) {
                callback(err);
                return;
            }
            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                if (file.title == fileName) {
                    callback(null, file);
                    return;
                }
            }
            callback(null, null);
        });
    });
}

//TODO understand console output bug
function deleteAll(callback){
    authClient.authorize(function(err, tokens) {
        listFiles(null,
            function (err, files) {
                if (err) {
                    callback(err);
                    return;
                }
                for (var i = 0; i < files.length; i++) {
                    var file = files[i];
                    drive.files.delete({
                        auth: authClient,
                        fileId: file.id
                    }, function(err){
                        if (err){
                            callback(err);
                        } else {
                            console.log("gdrive | Deleted: ", file.title, file.id);
                        }
                    });
                }
            }
        );
    });
}

function listFiles(parentId, callback){
    authClient.authorize(function(err, tokens) {
        if (err) {
            callback(err);
            return;
        }

        var requestParams = {auth: authClient};
        if (parentId){
            requestParams.q = "'" + parentId + "' in parents";
        }

        drive.files.list(requestParams
            , function(err, response) {
                if (err) {
                    callback(err);
                    return;
                }
                callback(null, response.items);
            });
    });
}

function deleteFile(filename, parentId, callback){
    authClient.authorize(function(err, tokens) {
        if (err) {
            callback(err)
            return;
        }
        listFiles(parentId, function (err, files) {
            if (err) {
                callback(err)
                return;
            }
            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                if (file.title == filename) {
                    drive.files.delete({
                        auth: authClient,
                        fileId: file.id
                    }, function (err) {
                        if (err) {
                            callback(err);
                            return;
                        } else {
                            console.log("gdrive | Deleted: ", file.title);
                        }
                    });
                }
            }
            //TODO no file case, should it raise error?
            callback(null);
        });
    });
}