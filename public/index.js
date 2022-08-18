"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const combinators_1 = require("./combinators");
// local parsers
const whitespace = (0, combinators_1.regex)(/( |\t)*/);
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
    (0, combinators_1.print)("unreachable\n");
    (0, combinators_1.printj)(oldValue);
    (0, combinators_1.print)("\n");
    return -1;
}
const product = (0, combinators_1.sequenceMap)([
    (0, combinators_1.skip)(num, whitespace),
    (0, combinators_1.skip)((0, combinators_1.zeroOrMore)((0, combinators_1.sequence)([(0, combinators_1.skip)(mul, whitespace), num])), whitespace)
], leftAssociate);
const sum = (0, combinators_1.sequenceMap)([
    (0, combinators_1.skip)(product, whitespace),
    (0, combinators_1.skip)((0, combinators_1.zeroOrMore)((0, combinators_1.sequence)([(0, combinators_1.skip)(additive, whitespace), product])), whitespace)
], leftAssociate);
const expr = sum;
const parser = () => {
    let error = null;
    let value = [];
    while (combinators_1.ctx.idx != combinators_1.ctx.src.length) {
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
let res = parse("2 * 3 + 1 * 8 + 3");
function walk(v) {
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
    (0, combinators_1.print)("Unreachable\n");
    (0, combinators_1.printj)(v);
    (0, combinators_1.print)(v.l !== undefined);
    (0, combinators_1.panic)("");
    return 0;
}
(0, combinators_1.print)(walk(res.value));
