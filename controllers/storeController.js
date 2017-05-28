const mongoose = require('mongoose');
const Store = mongoose.model('Store');
const multer = require('multer');
const jimp = require('jimp');
const uuid = require('uuid');

const multerOptions = {
  storage: multer.memoryStorage(),
  fileFilter(req, file, next){
    const isPhoto = file.mimetype.startsWith('image/');
    if(isPhoto){
      next(null, true);
    } else {
      next({ message: 'That filetype isn\'t allowed!' }, false);
    }
  }
}

exports.homePage = (req, res) => {
  // const person = { name: 'Bob', age: 35 };
  console.log(req.name);
  res.render('index');
};

exports.addStore = (req, res) => {
  res.render('editStore', { title: 'Add Store!' });
};

exports.upload = multer(multerOptions).single('photo');

exports.resize = async (req, res, next) => {
  // check if there is no new file to resize
  if(!req.file){
    next(); // skip to next middleware
    return;
  }
  const extension = req.file.mimetype.split('/')[1];
  req.body.photo = `${uuid.v4()}.${extension}`;

  // now resize
  const photo = await jimp.read(req.file.buffer);
  await photo.resize(800, jimp.AUTO);
  await photo.write(`./public/uploads/${req.body.photo}`);

  // Once written to filesystem, continue
  next();
  return;
}

exports.createStore = async (req, res) => {
  const store = await (new Store(req.body)).save();
  console.log(`It worked! ${store.slug}`);
  req.flash('success', `Successfully created ${store.name}. Care to leave a review?`);

  res.redirect(`/store/${store.slug}`);
};

exports.getStores = async (req, res) => {
  // Query DB for list of all stores
  const stores = await Store.find();
  res.render('stores', { title: 'Stores', stores });
};

exports.editStore = async (req, res) => {
  // Find store with the ID
  const store = await Store.findById(req.params.id);

  // Confirm user is owner of the store

  // Render edit form
  res.render('editStore', { title: `Edit ${store.name}`, store });
};

exports.updateStore = async (req, res) => {
  // Set the location data to be a point
  req.body.location.type = 'Point';

  // find and update the store
  const store = await Store.findByIdAndUpdate(req.params.id, req.body, {
    new: true, // return new store instead of old
    runValidators: true
  }).exec();

  // Redirect user to store, tell them it worked
  req.flash('success', `Successfully updated <strong>${store.name}</strong>. <a href="/stores/${store.slug}">View Store ➡️</a>`);
  res.redirect(`stores/${store._id}/edit'`);
};
