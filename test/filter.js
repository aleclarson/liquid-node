const chai = require('chai')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')
const expect = chai.expect

chai.use(sinonChai)

var FilterRegistry = require('../src/filter.js')()
var Scope = require('../src/scope.js')

describe('filter', function () {
  var scope
  var filters
  beforeEach(function () {
    filters = new FilterRegistry({}, {})
    scope = Scope.factory()
  })
  it('should return default filter when not registered', function () {
    var result = filters.construct('foo')
    expect(result.name).to.equal('foo')
  })

  it('should throw when filter name illegal', function () {
    expect(function () {
      filters.construct('/')
    }).to.throw(/illegal filter/)
  })

  it('should parse argument syntax', function () {
    filters.register('foo', x => x)
    var f = filters.construct('foo: a, "b"')

    expect(f.name).to.equal('foo')
    expect(f.args).to.deep.equal(['a', '"b"'])
  })

  it('should register a simple filter', function () {
    filters.register('upcase', x => x.toUpperCase())
    expect(filters.construct('upcase').render('foo', scope)).to.equal('FOO')
  })

  it('should register a argumented filter', function () {
    filters.register('add', (a, b) => a + b)
    expect(filters.construct('add: 2').render(3, scope)).to.equal(5)
  })

  it('should register a multi-argumented filter', function () {
    filters.register('add', (a, b, c) => a + b + c)
    expect(filters.construct('add: 2, "c"').render(3, scope)).to.equal('5c')
  })

  it('should call filter with corrct arguments', function () {
    var spy = sinon.spy()
    filters.register('foo', spy)
    filters.construct('foo: 33').render('foo', scope)
    expect(spy).to.have.been.calledWith('foo', 33)
  })
})
