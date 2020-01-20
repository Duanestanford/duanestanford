const SftpClient = require('ssh2-sftp-client');
const sftp = new SftpClient();

let itemsToUpload = [];

sftp.connect({
  host: "eu1.getlark.com",
  port: "22",
  username: "ofbagvxe",
  password: "P8pb52iF7w"
})

.then(() => scanLocalFiles())
.then(items => {
  if (!items || items.length < 1) throw new Error('Nothing to Upload');

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
  return[];
}

function cleanRemote() {
  console.log('\nCleaned Remote Server');
}

function createDirectoriesFor(items) {
  console.log("Creating directories");
}

function uploadFiles(items) {
  console.log("uploading files");
}
