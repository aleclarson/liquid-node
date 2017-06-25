const Syntax = require('./syntax')
const mapSeries = require('./util/promise').mapSeries
const RenderBreakError = require('./util/error').RenderBreakError
const RenderError = require('./util/error').RenderError

var render = {

  renderTemplates: function (templates, scope) {
    if (!scope) throw Error('unable to evalTemplates: scope undefined')

    var html = ''
    return mapSeries(templates, (tpl) => {
      return renderTemplate.call(this, tpl)
        .then(partial => (html += partial))
        .catch(e => {
          if (e instanceof RenderBreakError) {
            e.resolvedHTML = html
            throw e
          }
          throw RenderError(e, tpl)
        })
    }).then(() => html)

    function renderTemplate (template) {
      if (template.type === 'tag') {
        return this.renderTag(template, scope)
                    .then(partial => partial === undefined ? '' : partial)
      } else if (template.type === 'output') {
        return Promise.resolve()
                    .then(() => this.evalOutput(template, scope))
                    .then(partial => partial === undefined ? '' : stringify(partial))
      } else { // template.type === 'html'
        return Promise.resolve(template.value)
      }
    }
  },

  renderTag: function (template, scope) {
    if (template.name === 'continue') {
      return Promise.reject(new RenderBreakError('continue'))
    }
    if (template.name === 'break') {
      return Promise.reject(new RenderBreakError('break'))
    }
    return template.render(scope)
  },

  evalOutput: function (template, scope) {
    if (!scope) throw Error('unable to evalOutput: scope undefined')
    return template.filters.reduce(
            (prev, filter) => filter.render(prev, scope),
            Syntax.evalExp(template.initial, scope))
  }
}

function factory () {
  var instance = Object.create(render)
  return instance
}

function stringify (val) {
  if (typeof val === 'string') return val
  return JSON.stringify(val)
}

module.exports = factory
