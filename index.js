const Scope = require('./src/scope')
const _ = require('./src/util/underscore.js')
const tokenizer = require('./src/tokenizer.js')
const Render = require('./src/render.js')
const lexical = require('./src/lexical.js')
const Tag = require('./src/tag.js')
const Filter = require('./src/filter.js')
const Parser = require('./src/parser')
const Syntax = require('./src/syntax.js')
const tags = require('./tags')
const filters = require('./filters')
const anySeries = require('./src/util/promise.js').anySeries
const Errors = require('./src/util/error.js')

var _engine = {
  init: function (tag, filter, options) {
    this.options = options
    this.tag = tag
    this.filter = filter
    this.parser = Parser(tag, filter)
    this.renderer = Render()

    tags(this)
    filters(this)

    return this
  },
  parse: function (html, filepath) {
    var tokens = tokenizer.parse(html, filepath, this.options)
    return this.parser.parse(tokens)
  },
  render: function (tpl, ctx, opts) {
    opts = _.assign({}, this.options, opts)
    var scope = Scope.factory(ctx, opts)
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

function factory (options) {
  options = _.assign({
    trim_right: false,
    trim_left: false,
    strict_filters: false,
    strict_variables: false
  }, options)

  var engine = Object.create(_engine)
  engine.init(Tag(), Filter(options), options)
  return engine
}

factory.lexical = lexical
factory.isTruthy = Syntax.isTruthy
factory.isFalsy = Syntax.isFalsy
factory.evalExp = Syntax.evalExp
factory.evalValue = Syntax.evalValue
factory.Types = {
  ParseError: Errors.ParseError,
  TokenizationEroor: Errors.TokenizationError,
  RenderBreakError: Errors.RenderBreakError,
  AssertionError: Errors.AssertionError
}

module.exports = factory
