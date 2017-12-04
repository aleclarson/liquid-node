const Scope = require('./scope')
const tokenizer = require('./tokenizer')
const Render = require('./render')
const lexical = require('./lexical')
const TagCache = require('./tag')
const FilterCache = require('./filter')
const Parser = require('./parser')
const Syntax = require('./syntax')
const tags = require('../tags')
const filters = require('../filters')
const anySeries = require('./util/promise').anySeries
const Errors = require('./util/error')

module.exports = function Engine(options) {
  options = Object.assign({
    trim_right: false,
    trim_left: false,
    strict_filters: false,
    strict_variables: false
  }, options)

  this.options = options
  this.tag = new TagCache(this)
  this.filter = new FilterCache(this, options)
  this.parser = Parser(tag, filter)
  this.renderer = Render()

  tags(this)
  filters(this)

  return this
}

Engine.prototype = {
  constructor: Engine,
  parse: function (html, filepath) {
    var tokens = tokenizer.parse(html, filepath, this.options)
    return this.parser.parse(tokens)
  },
  render: function (tpl, ctx, opts) {
    opts = Object.assign({}, this.options, opts)
    var scope = Scope.factory(ctx || {}, opts)
    return this.renderer.renderTemplates(tpl, scope)
  },
  parseAndRender: function (html, ctx, opts) {
    return Promise.resolve()
      .then(() => this.parse(html))
      .then(tpl => this.render(tpl, ctx, opts))
      .catch(e => {
        if (e instanceof Errors.RenderBreakError) {
          return e.html
        }
        throw e
      })
  },
  evalOutput: function (str, scope) {
    var tpl = this.parser.parseOutput(str.trim())
    return this.renderer.evalOutput(tpl, scope)
  },
  registerFilter: function (name, filter) {
    return this.filter.register(name, filter)
  },
  registerTag: function (name, tag) {
    return this.tag.register(name, tag)
  }
}

Object.assign(Engine, {
  lexical: lexical,
  isTruthy: Syntax.isTruthy,
  isFalsy: Syntax.isFalsy,
  evalExp: Syntax.evalExp,
  evalValue: Syntax.evalValue,
  Types: {
    ParseError: Errors.ParseError,
    TokenizationEroor: Errors.TokenizationError,
    RenderBreakError: Errors.RenderBreakError,
  }
})
