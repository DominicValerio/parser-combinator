import process, {stdin, stdout, stderr, exit} from "process"
import util from "util"

// utilities
export const print = (format?: any, ...param: any[]) => stdout.write(util.format(format, ...param))
export const printj = (value: any) => print(JSON.stringify(value, null, 2))
export const eprint = (format?: any, ...param: any[]) => stderr.write(util.format(format, ...param))
export const panic = (message: any) => {
	eprint(message)
	exit(1)
}

// types
export type Context = {
	src: string
	idx: number
}
export type BinOp = {l: Value, op: Value, r: Value}
export type Value = string | number | BinOp | Array<Value>

export type Result = {
	value: Value,
	error: string | null,
}

export type Parser = () => Result

// Parsers
export let ctx: Context = {src: "", idx: 0} // global variable for convienences

export function ok(value: any): Result {
	return {
		value: value,
		error: null,
	}
}

export function err(err: string): Result {
	return {
		value: "",
		error: err,
	}
}

export function str(text: string): Parser {
	return () => {
		let slice = ctx.src.slice(ctx.idx, ctx.idx + text.length)
		if (slice != text) {
			return err(`${slice} is not equal to ${text}`)
		}
		ctx.idx += slice.length
		return ok(slice)
	}
}

export function regex(re: RegExp, errormsg?: string): Parser {
	return () => {
		re.lastIndex = ctx.idx
		let slice = ctx.src.slice(ctx.idx)
		const res = re.exec(slice)
		
		if (res && res[0] && slice.startsWith(res[0])) {
			const text = res[0]
			ctx.idx += text.length
			return ok(text)
		}
		return err(errormsg || "")
	}
}
// match zero or more of the Parser's pattern (called many)
export function zeroOrMore(p: Parser): Parser {
	return () => {
		let values = []
		let oldIdx = ctx.idx
		let curP = p()
		while (!curP.error ) {
			values.push(curP.value)
			oldIdx = ctx.idx
			curP = p()
		}
		ctx.idx = oldIdx
		return ok(values)
	}
}
// match one of the parsers in the list (also called choice)
export function oneOf(parsers: Parser[]): Parser {
	return () => {
		for (const p of parsers) {
			let oldIdx = ctx.idx
			let res = p()
			if (res.error == null) {
				return res
			}
			ctx.idx = oldIdx
		}
		return err("No match found in one of the parsers")
	}
}
// match a sequence of requirements
export function sequence(parsers: Parser[]): Parser {
	return () => {
		let values = []
		for (const p of parsers) {
			let res = p()
			if (res.error) { //return early
				return res
			}
			values.push(res.value)
		}
		return {value: values, error: null}
	}
}
// used to transform a Parser's value
export function map(p: Parser, callback: (oldvalue: Value) => Value): Parser {
	return () => {
		let res = p()
		res.value = callback(res.value)
		return res
	}
}
// makes a parser not return an error, therefore making it optional
export function optional(p: Parser): Parser {
	return () => {
		let oldIdx = ctx.idx
		let res = p()
		if (res.error != null) {
			ctx.idx = oldIdx
			// eprint(res.error)
			// print("\n")
		}
		return {value: res.value, error: null}
	}
}

export const sequenceMap = 
(parsers: Parser[], callback: (oldvalue: Value) => Value) => map(sequence(parsers), callback)

export function skip(p: Parser, toSkip: Parser): Parser {
	return () => {
		let {value, error} = sequence([p, toSkip])()
		value = (value as Value[])[0]
		return  {value: value, error: error}
	}
}

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