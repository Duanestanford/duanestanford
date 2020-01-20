const SftpClient = require('ssh2-sftp-client');
const sftp = new SftpClient();

const util = require('util');
const glob = util.promisify(require('glob'));
const upath = require('upath');
const fs = require('fs');


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
  console.log("SFTP Connection Ended");
});

function scanLocalFiles() {
  let localPublicDir = upath.join(process.cwd(), 'public');
  console.log(localPublicDir);

  return glob(`${localPublicDir}/**/*`).then(globMatches => {
    let items = globMatches.map(path => {
      return {
        isDirectory: fs.lstatSync(path).isDirectory(),
        localPath: path
      }
    });
    console.log(items);
    return items;
  })
}

function cleanRemote() {
  console.log('\nCleaned Remote Server');

  return sftp.list(remotePathBase)
    .then(objectList => {
      objectList = objectList.filter(obj => !ignoredRemoteItems.has(obj.name));

      let directoriesToRemove = objectList
      .filter(obj => obj.type === 'd')
      .map(obj => obj.name);

      let operations = directoriesToRemove.map(dir => sftp.rmdir(upath.join(remotePathBase, dir), true)
    .then(() => console.log(`Removed directory $(dir)`)))
    .concat(filesToRemove.map(file =>
      sftp.delete(upath.join(remotePathBase, file))
    ))
    })
}

function createDirectoriesFor(items) {
  console.log("Creating directories");``
}

function uploadFiles(items) {
  console.log("uploading files");
}
