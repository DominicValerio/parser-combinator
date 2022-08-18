"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.skip = exports.sequenceMap = exports.optional = exports.map = exports.sequence = exports.oneOf = exports.zeroOrMore = exports.regex = exports.str = exports.err = exports.ok = exports.ctx = exports.panic = exports.eprint = exports.printj = exports.print = void 0;
const process_1 = require("process");
const util_1 = __importDefault(require("util"));
// utilities
const print = (format, ...param) => process_1.stdout.write(util_1.default.format(format, ...param));
exports.print = print;
const printj = (value) => (0, exports.print)(JSON.stringify(value, null, 2));
exports.printj = printj;
const eprint = (format, ...param) => process_1.stderr.write(util_1.default.format(format, ...param));
exports.eprint = eprint;
const panic = (message) => {
    (0, exports.eprint)(message);
    (0, process_1.exit)(1);
};
exports.panic = panic;
// Parsers
exports.ctx = { src: "", idx: 0 }; // global variable for convienences
function ok(value) {
    return {
        value: value,
        error: null,
    };
}
exports.ok = ok;
function err(err) {
    return {
        value: "",
        error: err,
    };
}
exports.err = err;
function str(text) {
    return () => {
        let slice = exports.ctx.src.slice(exports.ctx.idx, exports.ctx.idx + text.length);
        if (slice != text) {
            return err(`${slice} is not equal to ${text}`);
        }
        exports.ctx.idx += slice.length;
        return ok(slice);
    };
}
exports.str = str;
function regex(re, errormsg) {
    return () => {
        re.lastIndex = exports.ctx.idx;
        let slice = exports.ctx.src.slice(exports.ctx.idx);
        const res = re.exec(slice);
        if (res && res[0] && slice.startsWith(res[0])) {
            const text = res[0];
            exports.ctx.idx += text.length;
            return ok(text);
        }
        return err(errormsg || "");
    };
}
exports.regex = regex;
// match zero or more of the Parser's pattern (called many)
function zeroOrMore(p) {
    return () => {
        let values = [];
        let oldIdx = exports.ctx.idx;
        let curP = p();
        while (!curP.error) {
            values.push(curP.value);
            oldIdx = exports.ctx.idx;
            curP = p();
        }
        exports.ctx.idx = oldIdx;
        return ok(values);
    };
}
exports.zeroOrMore = zeroOrMore;
// match one of the parsers in the list (also called choice)
function oneOf(parsers) {
    return () => {
        for (const p of parsers) {
            let oldIdx = exports.ctx.idx;
            let res = p();
            if (res.error == null) {
                return res;
            }
            exports.ctx.idx = oldIdx;
        }
        return err("No match found in one of the parsers");
    };
}
exports.oneOf = oneOf;
// match a sequence of requirements
function sequence(parsers) {
    return () => {
        let values = [];
        for (const p of parsers) {
            let res = p();
            if (res.error) { //return early
                return res;
            }
            values.push(res.value);
        }
        return { value: values, error: null };
    };
}
exports.sequence = sequence;
// used to transform a Parser's value
function map(p, callback) {
    return () => {
        let res = p();
        res.value = callback(res.value);
        return res;
    };
}
exports.map = map;
// makes a parser not return an error, therefore making it optional
function optional(p) {
    return () => {
        let oldIdx = exports.ctx.idx;
        let res = p();
        if (res.error != null) {
            exports.ctx.idx = oldIdx;
            // eprint(res.error)
            // print("\n")
        }
        return { value: res.value, error: null };
    };
}
exports.optional = optional;
const sequenceMap = (parsers, callback) => map(sequence(parsers), callback);
exports.sequenceMap = sequenceMap;
function skip(p, toSkip) {
    return () => {
        let { value, error } = sequence([p, toSkip])();
        value = value[0];
        return { value: value, error: error };
    };
}
exports.skip = skip;
// export function box(p: Parser): Parser {
// 	return () => {
// 		let oldIdx = ctx.idx
// 		let res = p()
// 		ctx.idx = oldIdx
// 		return res
// 	}
// }
// export const thru = (target: Parser, wrapper: (p: Parser) => Parser) => {
// 	return wrapper(target)
// }
