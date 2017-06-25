const Liquid = require('..')
const lexical = Liquid.lexical
const mapSeries = require('../src/util/promise.js').mapSeries
const RenderBreakError = Liquid.Types.RenderBreakError
const re = new RegExp(`^(${lexical.identifier.source})\\s+in\\s+` +
    `(${lexical.value.source})` +
    `(?:\\s+${lexical.hash.source})*` +
    `(?:\\s+(reversed))?` +
    `(?:\\s+${lexical.hash.source})*$`)

module.exports = function (liquid) {
  liquid.registerTag('for', {

    parse: function (tagToken, remainTokens) {
      var match = re.exec(tagToken.args)
      if (!match) throw Error(`illegal tag: ${tagToken.raw}`)
      this.variable = match[1]
      this.collection = match[2]
      this.reversed = !!match[3]

      this.templates = []
      this.elseTemplates = []

      var p
      var stream = liquid.parser.parseStream(remainTokens)
        .on('start', () => (p = this.templates))
        .on('tag:else', () => (p = this.elseTemplates))
        .on('tag:endfor', () => stream.stop())
        .on('template', tpl => p.push(tpl))
        .on('end', () => {
          throw Error(`tag ${tagToken.raw} not closed`)
        })

      stream.start()
    },

    render: function (scope, hash) {
      var collection = Liquid.evalExp(this.collection, scope)

      if (!Array.isArray(collection) ||
                (Array.isArray(collection) && collection.length === 0)) {
        return liquid.renderer.renderTemplates(this.elseTemplates, scope)
      }

      var length = collection.length
      var offset = hash.offset || 0
      var limit = (hash.limit === undefined) ? collection.length : hash.limit

      collection = collection.slice(offset, offset + limit)
      if (this.reversed) collection.reverse()

      var contexts = collection.map((item, i) => {
        var ctx = {}
        ctx[this.variable] = item
        ctx.forloop = {
          first: i === 0,
          index: i + 1,
          index0: i,
          last: i === length - 1,
          length: length,
          rindex: length - i,
          rindex0: length - i - 1,
          stop: false,
          skip: false
        }
        return ctx
      })

      var html = ''
      return mapSeries(contexts, (context) => {
        scope.push(context)
        return liquid.renderer
          .renderTemplates(this.templates, scope)
          .then(partial => (html += partial))
          .catch(e => {
            if (e instanceof RenderBreakError) {
              html += e.resolvedHTML
              if (e.message === 'continue') return
            }
            throw e
          })
          .then(() => scope.pop())
      }).catch((e) => {
        if (e instanceof RenderBreakError && e.message === 'break') {
          return
        }
        throw e
      }).then(() => html)
    }
  })
}
