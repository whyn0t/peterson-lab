var fs = require('fs');
var google = require('googleapis');
var mime = require('mime-types');
var queue = require('queue');
var key = require('./../auth/appKey.json')
var drive = google.drive({
    version: 'v2',
    auth: new google.auth.JWT(
        key.client_email,
        null,
        key.private_key,
        ['https://www.googleapis.com/auth/drive'],
        null
    )
});

module.exports = {
    init: populateTree,
    insert: insert,
    deleteFile: deleteFile,
    mkdir: mkdir,
    share: share,
    unshare: unshare,
    queueRequest: queueRequest
}

//initialization
var q = queue();
q.concurrency = 1;
//TODO track shared files
var dirTree = {
    id: 'root',
    children: [],
    shared: []
};

function queueRequest(request){
    //TODO one failure will kill the whole queue. Need a timeout.
    q.push(function(callback){
        request(callback);
    });
    if (q.length == 1) {
        q.start();
    }
}

function populateTree(callback){
    //TODO paginate files lists (in case of resultcount > 1000) https://developers.google.com/drive/v2/reference/files/list
    drive.files.list({
        maxResults: 1000
    }, function(err, response) {
        if (err) {
            callback(err);
            return;
        }

        var files = response.items;
        //reset dirTree object
        dirTree = {
            id: 'root',
            children: [],
            shared: []
        };
        var buffer = {}

        //push all files to buffer object
        for (var i = 0; i < files.length; i++) {
            file = files[i];
            file['children'] = [];
            buffer[file.id] = file;
        }
        //sort files into dirTree
        for (var id in buffer){
            if (buffer.hasOwnProperty(id)) {
                var file = buffer[id];
                for (var i = 0; i < file.parents.length; i++){
                    console.log(file.title);
                    if (file.parents[i].isRoot){
                        dirTree.children.push(file);
                    } else {
                        var parent = buffer[file.parents[i].id];
                        parent.children.push(file)
                    }
                }
            }
        }
        if (callback){
            callback();
        }
    });
}

function insert(fileInfo, callback) {
    //get parent id
    var parent = {};
    mkdir(fileInfo.path, null, function(err, dir) {
        if (err) {
            callback(err);
            return;
        }
        parent = dir;

        //insert file into parent dir (or root)
        var mimeType = mime.lookup(fileInfo.location) || 'application/octet-stream';

        drive.files.insert({
            resource: {
                parents: [parent],
                title: fileInfo.title,
                mimeType: mimeType
            },
            media: {
                mimeType: mimeType,
                body: fileInfo.body // read streams are awesome!
            }
        }, function(err, file){
            if (err) {
                callback(err);
                return;
            }
            console.log("gdrive | Inserted ", fileInfo.location, " as ", fileInfo.title);
            parent.children.push(file);
            callback(null, file);
        });
    });

}

function mkdir(path, parent, callback) {
    if (!parent) {
        parent = dirTree;
    }

    if (path == null || path.length == 0) {
        callback(null, parent);
        return;
    }

    var dirname = path.shift();
    //directory exists
    for (var i in parent.children) {
        if (parent.children[i].title == dirname) {
            mkdir(path, parent.children[i], callback);
            return;
        }
    }
    var parents = [parent];

    drive.files.insert({
        resource: {
            parents: parents,
            title: dirname,
            mimeType: 'application/vnd.google-apps.folder'
        }
    }, function(err, dir){
        if (err) {
            callback(err);
            return;
        } else {
            console.log("gdrive | Directory created: ", dir.title);
            //add directory to dirTree
            dir.children = [];
            parent.children.push(dir);
            mkdir(path, dir, callback);
        }
    });

}

function seek(path, filename, parent, callback){
    if (!path) {
        path = [];
    }
    if (filename){
        path.push(filename);
    }
    if (path.length == 0 && filename == null) {
        callback(null, parent);
        return;
    }
    if (!parent) {
        parent = dirTree;
    }
    var nodename = path.shift();
    for (var i = 0; i < parent.children.length; i++) {
        if (parent.children[i].title == nodename) {
            seek(path, null, parent.children[i], callback);
            return;
        }
    }
    callback(new Error("The sought out file or directory does not exist."))
}

function share(fileInfo, email, permission, callback){
    seek(fileInfo.path, fileInfo.title, null, function(err, file){
        if (err) {
            callback(err);
            return;
        }
        drive.permissions.insert({
            fileId: file.id,
            sendNotificationEmails: false,
            resource: {
                value: email,
                type: "user",
                role: permission
            }
        }, function(err){
            if (err) {
                callback(err);
                return;
            } else {
                console.log("gdrive | Added permissions for ", file.title, " to ", email);
                callback(null);
            }
        });
    });
}

function unshare(fileInfo, email, callback) {
    seek(fileInfo.path, fileInfo.title, null, function(err, file){
        if (err) {
            callback(err);
            return;
        }
        drive.permissions.list({
            fileId: file.id
        }, function(err, response){
            if (err) {
                callback(err);
                return;
            } else {
                var permissions = response.items;
                for (var i in permissions){
                    if (permissions[i].emailAddress == email){
                        drive.permissions.delete({
                            fileId: file.id,
                            permissionId: permissions[i].id
                        }, function (err, response) {
                            if (err) {
                                callback(err);
                                return;
                            }
                            console.log("gdrive | Removed permissions for ", file.title, " from ", permissions[i].emailAddress);
                            callback(null);
                        });
                        return;
                    }
                }
                //permission does not exist
                callback(null);
                return;
            }
        });
    });
}

function deleteFile(fileInfo, callback){
    seek(fileInfo.path, fileInfo.title, null, function(err, file) {
        if (err) {
            callback(err);
            return;
        }
        drive.files.delete({
            fileId: file.id
        }, function (err) {
            if (err) {
                callback(err);
                return;
            } else {
                console.log("gdrive | Deleted: ", file.title);
                callback(null);
            }
        });
    });
}

function deleteAll(callback){
    for (var i = 0; i < dirTree.children.length; i++) {
        var file = dirTree.children[i];
        var index = i;
        drive.files.delete({
            fileId: file.id
        }, function(err){
            if (err){
                callback(err);
            } else {
                console.log("gdrive | Deleted: ", file.title, file.id);
            }
        });
    }
    //reset dirTree object
    dirTree = {
        id: 'root',
        children: [],
        shared: []
    };
    if (callback) {
        callback();
    }
}