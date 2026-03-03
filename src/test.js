(async () => {
  const url = 'https://google.com/'

  console.log("Started!");

  setTimeout(() => {
    require('node-fetch')(url, { method: 'HEAD' })
      .then(() => console.log('Redirected!'))
      .catch((err) => console.log(err));
  }, 3000);
})();
