import process, {stdin, stdout, stderr, exit} from "process"
import util from "util"

const print = (format?: any, ...param: any[]) => stdout.write(util.format(format, ...param))
const printj = (value: any) => print(JSON.stringify(value, null, 2))
const eprint = (value: any) => stderr.write(util.format(value))
const panic = (message: any) => {
	eprint(message)
	exit(1)
}

type Context = {
	src: string
	idx: number
}
let ctx: Context = {src: "", idx: 0}

type Value = string | number | Value[]

type Result = {
	value: Value,
	error: string | null,
}

type Parser = () => Result

function ok(value: any): Result {
	return {
		value: value,
		error: null,
	}
}

function err(err: string): Result {
	return {
		value: "",
		error: err,
	}
}

function str(text: string): Parser {
	return () => {
		let slice = ctx.src.slice(ctx.idx, ctx.idx + text.length)
		if (slice != text) {
			return err(`${slice} is not equal to ${text}`)
		}
		return ok(slice)
	}
}

function regex(re: RegExp, errormsg?: string): Parser {
	return () => {
		const res = re.exec(ctx.src.slice(ctx.idx))
		if (!res || res[0].length <= 0) 
			return err(errormsg || "")
		const text = res[0]
		ctx.idx += text.length
		return ok(text)
	}
}
// match zero or more of the Parser's pattern
function many(p: Parser): Parser {
	return () => {
		let values = []
		while (true) {
			let temp = ctx
			let res = p()
			if (res.error) {
				ctx = temp
				break;
			}
			values.push(res.value)
		}
		return ok(values)
	}
}
// match one of the parsers in the list
function choice(parsers: Parser[]): Parser {
	return () => {

		for (const p of parsers) {
			let oldIdx = ctx.idx
			let res = p()
			if (res.error == null) {
				return res
			}
			ctx.idx = oldIdx
		}
		return err("No match found in choice()")
	}
}
// match a sequence of requirements
function sequence(parsers: Parser[]): Parser {
	return () => {
		let values = []
		for (const p of parsers) {
			let res = p()
			if (res.error != null) {
				return res
			}
			values.push(res.value)
		}
		return {value: values, error: null}
	}
}
// used to transform a Parser's value
function map(p: Parser, callback: (oldvalue: any) => any): Parser {
	return () => {
		let res = p()
		res.value = callback(res.value)
		return res
	}
}
// makes a parser not return an error, therefore making it optional
function optional(p: Parser): Parser {
	return () => {
		return {value: p().value, error: null}
	}
}

// local parsers
const whitespace = regex(/( )*|(\t)*/)

const num = map(
	regex(/[0-9]*/, "No number found"), 
	parseInt
)
const op = regex(/(\+)|(\-)/, "No operator found")

const binop = sequence([
	num,
	optional(whitespace),
	op,
	optional(whitespace),
	num
])


const expr = choice([
	binop,
	num
])



const parser = () => {
	let error = null
	let value = []
	while (ctx.idx != ctx.src.length) {
		whitespace()
		let v = expr()
		value.push(v.value)
		if (v.error) {
			v.error = error
			break;
		}
	}   
	return {value: value, error: error}
}

function parse(src: string) {
	ctx.src = src
	ctx.idx = 0
	return parser()
}

printj(parse("3+3"))