'use strict'

const mongoose = require('mongoose')

const controller = require('lib/wiring/controller')
const models = require('app/models')
const Image = models.image
const User = models.user

const authenticate = require('./concerns/authenticate')
const setUser = require('./concerns/set-current-user')
const setModel = require('./concerns/set-mongoose-model')

const s3Upload = require('lib/aws-upload')
const multer = require('multer')
const interimMulterUpload = multer({ dest: '/tmp/' })

const index = (req, res, next) => {
  Image.find()
    // can use .populate() on an array as well!
    .populate('_owner')
    //
    .then(images => res.json({
      images: images.map((e) =>
        e.toJSON({ user: req.user }))
    }))
    .catch(next)
}

const show = (req, res) => {
  Image.findById(req.params.id)
    .populate('_owner')
    .then((image) => {
      res.json({
        image: image.toJSON({ user: req.user })
      })
    })
}

const create = (req, res, next) => {
  // create file object from our multer-req object, which we will then pass
  // to s3Upload and the create function
  const file = {
    path: req.file.path,
    title: req.body.image.title,
    description: req.body.image.description,
    tags: req.body.image.tags,
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    owner: req.user._id
  }
  // passing file to AWS
  s3Upload(file)
  // Passing AWS response to create function (which will importantly
  // include the AWS url path for our image)
    .then((s3Response) => Image.create({
      url: s3Response.Location,
      title: file.title,
      description: file.description,
      tags: file.tags,
      _owner: req.user._id
    }))
    .then(image => {
      res.status(201)
        .json({ image: image.toJSON({ user: req.user }) })
      return image
    })
    // then push the image to the user's images array
    .then(function (image) {
      User.findById(req.user._id)
        .then(function (user) {
          console.log('**USER IS***', user)
          user.images.push(mongoose.Types.ObjectId(image._id))
          console.log('**PUSHED USER IS***', user)
        })
    })
    .catch(next)
}

const update = (req, res, next) => {
  delete req.body.image._owner  // disallow owner reassignment.

  req.image.update(req.body.image)
    .then(() => res.sendStatus(204))
    .catch(next)
}

const destroy = (req, res, next) => {
  req.image.remove()
    .then(() => res.sendStatus(204))
    .catch(next)
}

module.exports = controller({
  index,
  show,
  create,
  update,
  destroy
}, { before: [
  { method: setUser, only: ['index', 'show'] },
  { method: authenticate, except: ['index', 'show'] },
  { method: interimMulterUpload.single('image[file]'), only: ['create'] },
  // { method: setModel(Image), only: ['show'] },
  // ***NOTE*** I don't think this is necessary anymore because we now manually
  // find the image to populate it
  { method: setModel(Image, { forUser: true }), only: ['update', 'destroy'] }
] })
