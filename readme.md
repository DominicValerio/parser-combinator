https://github.com/sigma-engineering/blog-combinators/blob/master/index.ts
https://github.com/LowLevelJavaScript/Parser-Combinators-From-Scratch/blob/master/episode-7/index.js
https://github.com/benthosdev/benthos/tree/9e57bae30319fd7c62c33d70ff11311377fdc672


The Grammar
expr : add_expr ( ( '*' |'/' ) add_expr )*
add_expr : unary_expr ( ( '+' | '-' ) unary_expr )*
unary_expr :  ( '-' )? number
number: [0-9] | '(' expr ')'