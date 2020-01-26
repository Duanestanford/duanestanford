const SftpClient = require('ssh2-sftp-client');
const sftp = new SftpClient();

const util = require('util');
const glob = util.promisify(require('glob'));
const upath = require('upath');
const fs = require('fs');

const remotePathBase = "/home/ofbagvxe/public_html";
const ignoredRemoteItems = new Set(['.well-known', 'cgi-bin', '.htaccess', 'favicon.ico']);


let itemsToUpload = [];

sftp.connect({
  host: "eu1.getlark.com",
  port: "22",
  username: "ofbagvxe",
  password: "P8pb52iF7w"
})

.then(() => scanLocalFiles())
.then(items => {
  if (!items || items.length < 1) throw new Error('Nothing To Upload!');

  console.log(items);
  itemsToUpload = items;
})
.then(() => cleanRemote())
.then(() => createDirectoriesFor(itemsToUpload))
.then(() => uploadFiles(itemsToUpload))
.then(() => sftp.end())
.catch(err => {
  sftp.end();
  console.error(err);
  process.exit(1);
});

function scanLocalFiles() {
  let localPublicDir = upath.join(process.cwd(), 'public');
  console.log("Local Public Is: "+ localPublicDir + "\n");

  return glob(`${localPublicDir}/**/*`).then(globMatches => {
    let items = globMatches.map(path => {
      return {
        isDirectory: fs.lstatSync(path).isDirectory(),
        localPath: path,
        remotePath: upath.join(
          remotePathBase,
          upath.relative(localPublicDir, path)
        )}
    });
    return items;
  })
}

function cleanRemote() {
  console.log('\nNext: Cleaning Remote Server . . .');

  return sftp.list(remotePathBase)
    .then(objectList => {
      objectList = objectList.filter(obj => !ignoredRemoteItems.has(obj.name));

      let directoriesToRemove = objectList
      .filter(obj => obj.type === 'd')
      .map(obj => obj.name);

      let filesToRemove = objectList
      .filter(obj => obj.type === '-')
      .map(obj => obj.name);

      let operations = directoriesToRemove.map(dir =>
        sftp.rmdir(upath.join(remotePathBase, dir), true)
      .then(() => console.log(`Removed Directory ${dir}`)))
    .concat(filesToRemove.map(file => sftp.delete(upath.join(remotePathBase, file))
      .then(() => console.log(`Removed File ${file}`))));

      return Promise.all(operations);
    })
}

function createDirectoriesFor(items) {
  console.log("\nNext: Creating directories . . . \n");

  let directoriesToCreate = items.filter(path => path.isDirectory);

  console.log(" \'Directories to Create\' is defined as: " + directoriesToCreate);

  return Promise.all(directoriesToCreate.map(dir => sftp.mkdir(dir.remotePath)
.then(() => console.log(`Created Directory ${dir.remotePath}`))));



}


function uploadFiles(items) {
  console.log("\nUploading files . . . \n");

  let filesToUpload = items.filter(path => !path.isDirectory);

  return Promise.all(filesToUpload.map(file =>
  sftp.put(file.localPath, file.remotePath)
  .then(() => console.log(`Uploaded file ${file.remotePath}`))));
}
