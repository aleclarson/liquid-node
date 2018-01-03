const chai = require('chai')
const expect = chai.expect

chai.use(require('sinon-chai'))

var FilterRegistry = require('../src/filter.js')()
var TagRegistry = require('../src/tag.js')()
var Template = require('../src/parser.js')

describe('template', function () {
  var tags, filters, template
  var add = (l, r) => l + r

  beforeEach(function () {
    tags = new TagRegistry({})
    filters = new FilterRegistry({}, {})
    filter.register('add', add)

    template = Template(tags, filters)
  })

  it('should throw when output string illegal', function () {
    expect(function () {
      template.parseOutput('/')
    }).to.throw(/illegal output string/)
  })

  it('should parse output string', function () {
    var tpl = template.parseOutput('foo')
    expect(tpl.type).to.equal('output')
    expect(tpl.initial).to.equal('foo')
    expect(tpl.filters).to.deep.equal([])
  })

  it('should parse output string with a simple filter', function () {
    var tpl = template.parseOutput('foo | add: 3, "foo"')
    expect(tpl.initial).to.equal('foo')
    expect(tpl.filters.length).to.equal(1)
    expect(tpl.filters[0].filter).to.equal(add)
  })

  it('should parse output string with filters', function () {
    var tpl = template.parseOutput('foo | add: "|" | add')
    expect(tpl.initial).to.equal('foo')
    expect(tpl.filters.length).to.equal(2)
  })
})
