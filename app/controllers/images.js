'use strict'

const controller = require('lib/wiring/controller')
const models = require('app/models')
const Image = models.image

const authenticate = require('./concerns/authenticate')
const setUser = require('./concerns/set-current-user')
const setModel = require('./concerns/set-mongoose-model')

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
  const image = Object.assign(req.body.image, {
    _owner: req.user._id
  })
  Image.create(image)
    .then(image =>
      res.status(201)
        .json({
          image: image.toJSON({ user: req.user })
        }))
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
  { method: setModel(Image), only: ['show'] },
  { method: setModel(Image, { forUser: true }), only: ['update', 'destroy'] }
] })
