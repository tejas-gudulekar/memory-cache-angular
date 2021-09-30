const express = require('express'),
http = require('http'),
path = require('path'),
morgan      = require('morgan'),
compression = require('compression');
const mcache = require('memory-cache');
const app = express();
const port = process.env.PORT || '3000';
const _app_folder = '/dist_prod';
const rateLimit = require("express-rate-limit");


// ---- LIMIT FOR TOO MANY CONNECTIONS ---- //
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again"
});

const allowedExt = [
  '.js',
  '.ico',
  '.css',
  '.png',
  '.jpg',
  '.woff2',
  '.woff',
  '.ttf',
  '.svg',
  '.json'
];



// ---- MEMORY CACHE ---- //
const cache = {
  getCache: () => {
      return (req, res, next) => {
          let key = '__express__' + req.originalUrl;
          let cachedBody = mcache.get(key);
          if (cachedBody) {
              res.type(cachedBody.headers['content-type']);
              res.send(cachedBody.body);
          } else {
              next()
          }
      }
  },

  handleResponse: (req, res, url) => {
      request(url, function (error, response) {
          let key = '__express__' + req.originalUrl;
          mcache.put(key, response, 120000); //2 min
      }).pipe(res);
  }
  
};
app.use(limiter);
app.use(express.static(path.join(__dirname, _app_folder)));
//https://mu.etranscript.in/testapp/assets/onboarding/example.json
app.use('/assets/onboarding/',express.static(__dirname + _app_folder+"/assets/onboarding/"));
app.use(morgan('dev'));
app.use(compression()) //compressing dist folder 
//app.disable('etag');
 app.get('*', cache.getCache(),(req, res) => {
  //console.log("req.url "+req.url);
  if(req.url == '/app/assets/onboarding/example.json'){
    var  paths = req.url.split("/");
    res.sendFile(path.resolve(`dist_prod/${paths[2]}/onboarding/example.json`));
  }else if(req.url == '/app/nebular.e5b059e952431846f8ab.ttf?4ozerq'){
    res.sendFile(path.resolve(`dist_prod/nebular.e5b059e952431846f8ab.ttf`));
  }else if(req.url == '/app/ionicons.dd4781d1acc57ba4c480.ttf?v=2.0.1'){
    res.sendFile(path.resolve(`dist_prod/ionicons.dd4781d1acc57ba4c480.ttf`));
  }else if (allowedExt.filter(ext => req.url.indexOf(ext) > 0).length > 0) {
    var  paths = req.url.split("/");
    //console.log("paths[2] "+paths[2]);
    res.sendFile(path.resolve(`dist_prod/${paths[2]}`));
  } else {
    res.sendFile(path.resolve('dist_prod/index.html'));
  }
 })




app.set('port', port);

const server = http.createServer(app);
server.listen(port, () => console.log('Running client app at port ' + port))