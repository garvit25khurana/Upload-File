const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require("body-parser");
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const GridFsStorage = require("multer-gridfs-storage");
const Grid = require("gridfs-stream");
const methodOverride = require("method-override");
const crypto = require('crypto');

var ObjectId = require('mongodb').ObjectID;
const app = express();

// app.use(express.static('public'))
app.use(express.static(path.join(__dirname, '/public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(methodOverride('_method'));
app.set('view engine', 'ejs');

const mongoURI = 'mongodb://localhost:27017/mydb';

const conn = mongoose.createConnection(mongoURI,{ useNewUrlParser: true, useUnifiedTopology: true, });
let gfs;
conn.once('open', () => {
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection('uploads');
})


const storage = new GridFsStorage({
    url: mongoURI,
    file: (req, file) => {
      return new Promise((resolve, reject) => {
        // crypto.randomBytes(16, (err, buf) => {
          // if (err) {
          //   return reject(err);
          // }
          const filename = file.originalname;
          const fileInfo = {
            filename: filename,
            bucketName: 'uploads'
          };
          resolve(fileInfo);
        // });
      });
    }
  });
  const upload = multer({ storage });

app.get('/', (req,res) => {
  gfs.files.find().toArray((err,files) => {
    if(!files || files.length === 0)
    {
        res.render('index', {isFiles: false});
    }
    else
    {
      res.render('index', {files, isFiles: true});
    }
    
    // console.log(files);
  })
  
    
})

app.get('/files', (req,res) => {
    gfs.files.find().toArray((err,files) => {
        if(!files || files.length === 0)
        {
            return res.status(404).json({
                err: 'no files exist'
            });
        }
        return res.json(files);
    })
})

app.get('/files/:id', (req,res) => {
  const id = req.params.id;
  gfs.files.findOne({_id: ObjectId(id)}, (err, file) => {
    if(!file || file.length === 0)
        {
            return res.status(404).json({
                err: 'no files exist'
            });
        }
        const readstream = gfs.createReadStream(file.filename);
        readstream.pipe(res);
        // return res.json(file);
  })
})


app.post('/upload', upload.single('fileToUpload') , (req,res) => {
    // res.json({file : req.file});
    res.redirect('/');
})

app.delete('/files/:id', (req,res) => {
  const id = req.params.id;
  gfs.remove({_id: id, root: 'uploads'}, (err) => {
    if(err)
    {
      return res.status(404).json({err: err});
    }
    redirect('/');
  })
})
{

}

app.listen(3000, () => {
    console.log("server is listening at 3000");
})