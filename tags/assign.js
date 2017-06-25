const Liquid = require('..');
const lexical = Liquid.lexical;
const re = new RegExp(`(${lexical.identifier.source})\\s*=(.*)`);

module.exports = function(liquid) {

    liquid.registerTag('assign', {
        parse: function(token){
            var match = token.args.match(re);
            if (!match) throw Error(`illegal token ${token.raw}`);
            this.key = match[1];
            this.value = match[2];
        },
        render: function(scope) {
            scope.set(this.key, liquid.evalOutput(this.value, scope));
            return Promise.resolve('');
        }
    });

};
