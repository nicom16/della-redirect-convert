// Functions

async function downloadFile(url, path) {
  const axios = require('axios');
  const fs = require('fs');

  const file = await axios.get(url, { responseType: "stream" });
  const stream = file.data.pipe(fs.createWriteStream(path));

  return new Promise ((resolve, reject) => {
    stream
      .on('finish', () => {
        console.log("Video downloaded!");
        resolve();
      })
      .on('error', (err) => reject(err));
  });
}

async function cleanDir(directory) {
  const fs = require("fs");
  const path = require("path");

  const files = fs.readdirSync(directory);

  for (const file of files) {
    fs.unlinkSync(path.join(directory, file));
  }
  
  console.log(`Cleaned directory: ${directory}`);

  return;
}

module.exports = {
  downloadFile,
  cleanDir  
}
