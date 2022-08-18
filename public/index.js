"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const combinators_1 = require("./combinators");
// local parsers
const whitespace = (0, combinators_1.regex)(/( )*|(\t)*/);
const num = (0, combinators_1.map)((0, combinators_1.regex)(/[0-9]+/, "No number found"), (v) => {
    let res = parseInt(v);
    return res;
});
const mul = (0, combinators_1.regex)(/(\*)|(\/)/, "No multiplicitave found");
const additive = (0, combinators_1.regex)(/(\+)|(\-)/, "No additive found");
// used in a sequence map, [left, [op, right]]
function leftAssociate(oldValue) {
    if (oldValue && oldValue.hasOwnProperty("length")) {
        let v = oldValue;
        let guaranteed = v[0];
        let optionPart = v[1];
        // printj(oldValue); print("\n") //printj(guaranteed); print("\n") // printj(optionPart); print("\n")
        if (optionPart.length == 0)
            return guaranteed;
        if (optionPart.length == 1)
            return { l: guaranteed, op: optionPart[0][0], r: optionPart[0][1] };
        let res = { l: guaranteed, op: null, r: null };
        for (let i = 0; i < optionPart.length; i++) {
            let [op, r] = optionPart[i];
            res.op = op;
            res.r = r;
            if (i < optionPart.length - 1)
                res = { l: res, op: null, r: null };
        }
        return res;
    }
    (0, combinators_1.panic)("unreachable\n");
    return -1;
}
const product = (0, combinators_1.sequenceMap)([
    num,
    (0, combinators_1.zeroOrMore)((0, combinators_1.sequence)([mul, num]))
], leftAssociate);
const sum = (0, combinators_1.sequenceMap)([
    product,
    (0, combinators_1.zeroOrMore)((0, combinators_1.sequence)([additive, product]))
], leftAssociate);
const expr = sum;
const parser = () => {
    let error = null;
    let value = [];
    while (combinators_1.ctx.idx != combinators_1.ctx.src.length) {
        whitespace();
        let v = expr();
        if (v.error) {
            error = v.error;
            (0, combinators_1.printj)(combinators_1.ctx);
            (0, combinators_1.print)("\n");
            (0, combinators_1.printj)(value);
            (0, combinators_1.print)("\n");
            (0, combinators_1.panic)(error);
            break;
        }
        value.push(v.value);
    }
    return { value: value, error: error };
};
function parse(src) {
    combinators_1.ctx.src = src;
    combinators_1.ctx.idx = 0;
    return parser();
}
//printj(parse("1*2+3"))
//printj(parse("2+3"))
let res = parse("2-1+2");
(0, combinators_1.printj)(res);
(0, combinators_1.print)("\n");
function walk(v) {
    //let v = res[0]
    if (!isNaN(v)) { // number
        return v;
    }
    else if (v instanceof Array) { // Value[]
        let res = [];
        for (const k of v) {
            res.push(walk(k));
        }
        return res;
    }
    else if (v.l !== undefined) { // BinOp
        let k = v;
        let l = walk(k.l);
        let r = walk(k.r);
        switch (k.op) {
            case '+':
                return l + r;
            case '-':
                return l - r;
            case '*':
                return l * r;
            case '/':
                return l / r;
        }
    }
    else if (v instanceof String) { // string
        (0, combinators_1.panic)("Found string in tree");
        return v;
    }
    (0, combinators_1.panic)("Unreachable\n");
    return 0;
}
(0, combinators_1.print)(walk(res.value));
