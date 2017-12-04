
const Liquid = require('./src/engine')

function liquid(options) {
  return new Liquid(options)
}

liquid.Engine = Liquid

// Copy all static properties of `Liquid`
Object.assign(liquid, Liquid)

module.exports = liquid
