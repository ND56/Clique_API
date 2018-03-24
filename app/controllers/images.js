'use strict'

const controller = require('lib/wiring/controller')
const models = require('app/models')
const Image = models.image

const authenticate = require('./concerns/authenticate')
const setUser = require('./concerns/set-current-user')
const setModel = require('./concerns/set-mongoose-model')

const s3Upload = require('lib/aws-upload')
const multer = require('multer')
const interimMulterUpload = multer({ dest: '/tmp/' })

const index = (req, res, next) => {
  Image.find()
    .then(images => res.json({
      images: images.map((e) =>
        e.toJSON({ user: req.user }))
    }))
    .catch(next)
}

const show = (req, res) => {
  res.json({
    image: req.image.toJSON({ user: req.user })
  })
}

const create = (req, res, next) => {
  // create file object from our multer-req object, which we will then pass
  // to s3Upload and the create function
  console.log('req is ', req)
  console.log('req.data is ', req.data)
  console.log('req.body is ', req.body)
  console.log('req.file is ', req.file)
  console.log('req.user._id is ', req.user._id)
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
      _owner: file.owner
    }))
    .then(image =>
      res.status(201)
        .json({ image: image.toJSON({ user: req.user }) }))
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
  { method: setModel(Image), only: ['show'] },
  { method: setModel(Image, { forUser: true }), only: ['update', 'destroy'] }
] })
