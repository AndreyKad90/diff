const fs = require('fs');

function readFile(path) {
    return new Promise((resolve, reject) => {
        fs.readFile(path, (err, content) => {
            if (err) {
                reject(err);
            } else {
                resolve(content);
            }
        })
    });
}

function readFiles(paths) {
    return paths.map(readFile);
}

module.exports = {
    readFile,
    readFiles
}