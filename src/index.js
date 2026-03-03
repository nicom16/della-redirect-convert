// Index
const express = require('express'); 
const app = express(); 

const PORT = 8080;

app.get('/', (req, res) => res.send("Online!"));

app.get('/redirect', (req, res) => { 
  const params = new URLSearchParams({
    bot: req.query.bot
  });

  const url = `${process.env.MANAGER}?${params.toString()}`;

  console.log(url);

  require('node-fetch')(url, { method: 'HEAD' })
    .then((response) => console.log(`Result: ${response.data}`))
    .catch((err) => console.log(err));

  res.send("Redirection requested!");
}); 

app.get('/converter', (req, res) => {

  const { exec } = require('child_process');
  const { promisify } = require('util');
  const promisifiedExec = promisify(exec);

  const functions = require('./functions.js');
  const fs = require('fs');
  const path = require('path');
  const axios = require('axios');    

  const { Telegraf } = require('telegraf');
  const bot = new Telegraf(process.env.UMORE_TOKEN);
  
  const channel = process.env.UMORE_CHANNEL;
  const spec = req.query.spec;

  const videoName = spec + ".mp4";
  const videoPath = path.join("converter", videoName);
  const gifPath = path.join("converter", `no-${videoName}`);
  
  functions.cleanDir("converter")
    .then(() => bot.telegram.getFileLink(spec))
    .then((url) => functions.downloadFile(url, videoPath))
    .then(() => promisifiedExec(`ffmpeg -i ${videoPath} -c copy -an ${gifPath}`))
    .then(() => bot.telegram.sendAnimation(channel, { source: gifPath }, { caption: req.query.caption, parse_mode: "html" }))
    .then(() => {
      fs.unlink(videoPath, (err) => err);
      fs.unlink(gifPath, (err) => err);
      axios.get(process.env.UMORE_ALTERVISTA, { 
        params: {
          gifID_unique: req.query.unique,
          chatID: req.query.chat_id
        }
      })
    })
    .catch((err) => console.log(err));

  res.send("Ok");

});

app.get('/blur', (req, res) => {
  
  const { exec } = require('child_process');
  const { promisify } = require('util');
  const promisifiedExec = promisify(exec);
  
  const functions = require('./functions.js');
  const { Telegraf } = require('telegraf');
  const fs = require('fs');
  const path = require('path');
  const axios = require('axios');

  const spec = req.query.spec;
  if (req.query.name == "ai") {
    var bot = new Telegraf(process.env.AI_TOKEN);
    var channel = process.env.AI_CHANNEL;
    var altervista = process.env.AI_ALTERVISTA;
    var baseDirectory = "blur-ai";
  } else {
    var bot = new Telegraf(process.env.DAI_TOKEN);
    var channel = process.env.DAI_CHANNEL;
    var altervista = process.env.DAI_ALTERVISTA;
    var baseDirectory = "blur-dai";
  }
  
  const picName = spec + ".jpg";
  const picPath = path.join(baseDirectory, picName);
  const blurredPicPath = path.join(baseDirectory, `b-${picName}`);
  
  functions.cleanDir(baseDirectory)
    .then(() => bot.telegram.getFileLink(spec))
    .then((url) => functions.downloadFile(url, picPath))
    .then(() => console.log("Pic downloaded!"))
    .then(() => promisifiedExec(`identify ${picPath} | awk -F' ' '{ print $3 }'`))
    .then((output) => {
      console.log("Pic identified!");
      const size = output.stdout.split('x');
      const width = Number(size[0]);
      const height = Number(size[1]);

      // Horizontal
      if (width >= height) {
        const perWidth = 26/100;
        const perHeight = 13/100;

        const blurWidth = Math.ceil(width * perWidth);
        const blurHeight = Math.ceil(height * perHeight);

        return promisifiedExec(`magick -limit memory 64MiB -limit map 64MiB ${picPath} -gravity SouthEast -region ${blurWidth}x${blurHeight}+0+0 -blur 0x20 ${blurredPicPath}`);
      } 

      // Vertical
      if (width < height) {
        const perWidth = 26/100;
        const perHeight = 5/100;

        const blurWidth = Math.ceil(width * perWidth);
        const blurHeight = Math.ceil(height * perHeight);

        return promisifiedExec(`magick -limit memory 64MiB -limit map 64MiB ${picPath} -gravity SouthEast -region ${blurWidth}x${blurHeight}+0+0 -blur 0x20 ${blurredPicPath}`);
      }
    })
    .then(() => console.log("Blurred!"))
    .then(() => bot.telegram.sendPhoto(channel, { source: blurredPicPath }, { caption: req.query.caption, parse_mode: "html", has_spoiler: true }))
    .then(() => {
      console.log("Cleaning files!");
      fs.unlink(picPath, (err) => err);
      fs.unlink(blurredPicPath, (err) => err);
      axios.get(altervista, { 
        params: {
          unique_id: req.query.unique
        }
      })
    })
    .catch((err) => console.log(err));

  res.send('Blurring!');

});

app.get('/counter', (req, res) => {
  
  const axios = require('axios');    

  var bots = JSON.parse(process.env.BOTS);
  
  bots.forEach((bot) => {
    axios
      .get(bot, { params: { counter: true } })
      .catch((err) => console.log(err));
  });

  res.send("Counted!");

});

app.get('/requests', (req, res) => {

  const axios = require('axios');    

  if (req.query.start) {
    var bots = JSON.parse(process.env.BOTS_START);
    bots.forEach((bot) => axios.get(bot))

    res.send("Started automatic requests acceptation and accepted pending invites!");
  } else {
    var bots = JSON.parse(process.env.BOTS_STOP);
    bots.forEach((bot) => axios.get(bot))

    res.send("Stopped automatic requests acceptation!");
  }

});

// Routes for pep-app
app.get('/pep', (req, res) => {
  const params = new URLSearchParams({
    send: req.query.send
  });
  const url = `${req.query.bot_page}?${params.toString()}`;

  require('node-fetch')(url, { method: 'HEAD' })
    .then(() => console.log('Redirected!'))
    .catch((err) => console.log(err));

  res.send("Pep redirection requested!");
}); 

app.get('/pep-requests-on', (req, res) => {
  const axios = require('axios');    
  
  var pep = JSON.parse(process.env.PEPON); 
  
  axios
    .get(pep[req.query.index])
    .then((response) => console.log(`Ok: ${response}`))
    .catch((err) => console.log(err));

  res.send("Pep req on!");
});

app.get('/pep-requests-off', (req, res) => {
  const axios = require('axios');    

  var pep = JSON.parse(process.env.PEPOFF); 
  
  axios
    .get(pep[req.query.index])
    .then((response) => console.log(`Ok: ${response}`))
    .catch((err) => console.log(err));

  res.send("Pep req off!");
});

app.get('/pep-requests-on-all', (req, res) => {
  const axios = require('axios');    
  var pep = JSON.parse(process.env.PEPON); 
  pep.map(url => axios.get(url));
  res.send("Ok!");
});

app.get('/pep-requests-off-all', (req, res) => {
  const axios = require('axios');    
  var pep = JSON.parse(process.env.PEPOFF); 
  pep.map(url => axios.get(url));
  res.send("Ok!");
});

app.listen(PORT, '0.0.0.0', () => console.log(`App listening on port ${PORT}`));
