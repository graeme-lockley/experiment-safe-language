import file:./AST as AST;
import file:../core/Array as Array;
import file:../core/Debug as DEBUG;
import file:../core/Maybe as Maybe;
import file:../core/Record as Record;
import file:../core/RegularExpression as RegularExpression;
import file:../core/String as String;


infixOperator operator =
    "(_$a => (_$b => (_$a " ++ jsOperator ++ " _$b)))"
        where {
            jsOperator =
                if operator == "++" then
                    "+"
                else
                    operator
        };


searchNewlinePattern =
    Maybe.withDefault () (RegularExpression.compileWithOptions "\n" "g");


searchEscapedQuote =
    Maybe.withDefault () (RegularExpression.compileWithOptions "\"" "g");


encodeString =
    (String.replace searchNewlinePattern "\\\\n") o (String.replace searchEscapedQuote "\\\\\"");


astToJavascript ast indentation =
    if ast.type == "ADDITION" then
        "(" ++ (astToJavascript ast.left indentation) ++ " + " ++ (astToJavascript ast.right indentation) ++ ")"

    else if ast.type == "APPLY" then
        (astToJavascript ast.operation indentation) ++ "(" ++ (astToJavascript ast.operand indentation) ++ ")"

    else if ast.type == "BOOLEAN_AND" then
        "(" ++ (astToJavascript ast.left indentation) ++ " && " ++ (astToJavascript ast.right indentation) ++ ")"

    else if ast.type == "BOOLEAN_NOT" then
        "(!" ++ (astToJavascript ast.operand indentation) ++ ")"

    else if ast.type == "BOOLEAN_OR" then
        "(" ++ (astToJavascript ast.left indentation) ++ " || " ++ (astToJavascript ast.right indentation) ++ ")"

    else if ast.type == "COMPOSITION" then
        "(" ++ variableName ++ " => " ++ (astToJavascript ast.left indentation) ++ "(" ++ (astToJavascript ast.right indentation) ++ "(" ++ variableName ++ ")))"
            where {
                variableName =
                    "_$" ++ indentation
            }

    else if ast.type == "CONSTANT_BOOLEAN" then
        if ast.value then
            "true"
        else
            "false"

    else if ast.type == "CONSTANT_CHARACTER" then
        '"' ++ (encodeString ast.value) ++ '"'

    else if ast.type == "CONSTANT_INTEGER" then
        ast.value

    else if ast.type == "CONSTANT_STRING" then
        '"' ++ (encodeString ast.value) ++ '"'

    else if ast.type == "CONSTANT_UNIT" then
        "undefined"

    else if ast.type == "DIVISION" then
        "(" ++ (astToJavascript ast.left indentation) ++ " / " ++ (astToJavascript ast.right indentation) ++ ")"

    else if ast.type == "EQUAL" then
        "(" ++ (astToJavascript ast.left indentation) ++ " == " ++ (astToJavascript ast.right indentation) ++ ")"

    else if ast.type == "DECLARATION" then
        if (Record.get "type" (Record.get "expression" ast)) == "LAMBDA" then
            (spaces indentation) ++ "function " ++ ast.name ++ "(" ++ (Record.get "variable" (Record.get "expression" ast)) ++ ") {\n" ++
            (
            (spaces indentation) ++ "  return " ++ (astToJavascript (Record.get "expression" (Record.get "expression" ast)) (indentation + 1)) ++ ";\n"
            ) ++ (spaces indentation) ++ "}"
        else
            (spaces indentation) ++ "const " ++ ast.name ++ " = " ++ (astToJavascript (ast.expression) 0) ++ ";"

    else if (ast.type == "EXPRESSIONS") then
        "(() => {\n" ++ (spaces (indentation + 2)) ++

        Array.join (";\n" ++ (spaces (indentation + 2)))
            ( Array.map (\e -> astToJavascript e (indentation + 2)) (Array.take (Array.length (ast.expressions) - 1) ast.expressions) ) ++
        (
            if (Array.length ast.expressions) > 1 then
                ";\n"
            else
                ""
        ) ++
        (spaces (indentation + 2)) ++ "return " ++ (astToJavascript (at (Array.length ast.expressions - 1) ast.expressions) 0) ++ ";\n" ++
        (spaces (indentation + 1)) ++ "})()"

    else if ast.type == "GREATER_THAN" then
        "(" ++ (astToJavascript ast.left indentation) ++ " > " ++ (astToJavascript ast.right indentation) ++ ")"

    else if ast.type == "GREATER_THAN_EQUAL" then
        "(" ++ (astToJavascript ast.left indentation) ++ " >= " ++ (astToJavascript ast.right indentation) ++ ")"

    else if ast.type == "IDENTIFIER" then
        ast.name

    else if ast.type == "IF" then
        "(" ++ (astToJavascript ast.ifExpr indentation) ++ "\n" ++
        (spaces (indentation + 1)) ++ "? " ++ (astToJavascript ast.thenExpr (indentation + 1)) ++ "\n" ++
        (spaces (indentation + 1)) ++ ": " ++ (astToJavascript ast.elseExpr (indentation + 1)) ++ ")"

    else if ast.type == "IMPORT" then
        "const " ++ (Record.get "name" (Record.get "id" ast)) ++ " = require('" ++
        (
            if (String.startsWith "./" fileName) || (String.startsWith "/" fileName) then
                fileName
            else
                "./" ++ fileName
        ) ++ "');"
            where {
                fileName =
                    String.substring 5 (String.length (Record.get "value" (Record.get "url" ast))) (Record.get "value" (Record.get "url" ast))
            }

    else if ast.type == "INFIX_OPERATOR" then
         infixOperator ast.operator

    else if ast.type == "LAMBDA" then
        ("(" ++ ast.variable ++ " => " ++ (astToJavascript ast.expression indentation) ++ ")")

    else if ast.type == "LESS_THAN" then
        "(" ++ (astToJavascript ast.left indentation) ++ " < " ++ (astToJavascript ast.right indentation) ++ ")"

    else if ast.type == "LESS_THAN_EQUAL" then
        "(" ++ (astToJavascript ast.left indentation) ++ " <= " ++ (astToJavascript ast.right indentation) ++ ")"

    else if ast.type == "MULTIPLICATION" then
        "(" ++ (astToJavascript ast.left indentation) ++ " * " ++ (astToJavascript ast.right indentation) ++ ")"

    else if ast.type == "MODULE" then
        (if (String.length imports) == 0 then
            ""
        else
            imports ++ "\n" ++ "\n") ++
        Array.join ("\n" ++ "\n") (Array.map  (\d -> astToJavascript d indentation) (Record.get "declarations" ast)) ++
        "\n" ++ "\nconst _$EXPR = " ++ (astToJavascript (Record.get "expression" ast) indentation) ++ ";" ++
        "\n" ++ "\n" ++ "const _$ASSUMPTIONS = [].concat(\n" ++
        Array.join ",\n" (
            Array.map (\i ->
                    "  " ++
                    (Record.get "name" (Record.get "id" i)) ++
                    "._$ASSUMPTIONS || []")
                (Record.get "imports" ast)) ++
        ");\n" ++ "\n" ++
        "_$ASSUMPTIONS.push({\n" ++
        "  source: '" ++
        (simplifyPath (encodeString (Record.get "sourceName" ast))) ++
        "',\n" ++
        "  declarations: [\n" ++
        Array.join ",\n" (
            Array.map
                (\d ->
                    "    {\n" ++
                    "      name: \'" ++
                    d.name ++
                    "\',\n" ++
                    "      predicates: [\n" ++
                    Array.join ",\n" (
                        Array.map
                            (\a ->
                                "        {\n" ++
                                "          line: " ++ a.line ++ ",\n" ++
                                "          source: \'" ++ simplifyPath (encodeString a.sourceName) ++ "\',\n" ++
                                "          text: \'" ++ encodeString a.text ++ "\',\n" ++
                                "          predicate: () => " ++ astToJavascript a.expression 6 ++ "\n" ++
                                "        }")
                            (Record.get "assumptions" d)) ++
                    "\n" ++
                    "      ]\n" ++
                    "    }"
                )
                (Array.filter (\d -> (Array.length (Record.get "assumptions" d)) > 0) (Record.get "declarations" ast))
        ) ++
        "\n" ++
        "  ]\n" ++
        "});\n" ++ "\n" ++
        suffix
            where {
                imports =
                    moduleImports (Record.get "imports" ast) indentation;

                suffix =
                    moduleSuffix (Record.get "declarations" ast) (Record.get "optionalExpression" ast)
            }

    else if ast.type == "QUALIFIED_IDENTIFIER" then
        ast.module ++ "." ++ ast.identifier

    else if ast.type == "SCOPE" then
        "(() => {\n" ++
        Array.join ("\n" ++ "\n") (Array.map  (\d -> astToJavascript d (indentation + 1)) (Record.get "declarations" ast)) ++
        "\n\n" ++ (spaces (indentation + 1)) ++ "return " ++ (astToJavascript ast.expression (indentation + 2)) ++ ";\n" ++
        (spaces indentation) ++ "})()"

    else if ast.type == "STRING_CONCAT" then
        "(" ++ (astToJavascript ast.left indentation) ++ " + " ++ (astToJavascript ast.right indentation) ++ ")"

    else if ast.type == "SUBTRACTION" then
        "(" ++ (astToJavascript ast.left indentation) ++ " - " ++ (astToJavascript ast.right indentation) ++ ")"

    else if ast.type == "UNARY_PLUS" then
        "(+" ++ (astToJavascript ast.operand indentation) ++ ")"

    else if ast.type == "UNARY_NEGATE" then
        "(-" ++ (astToJavascript ast.operand indentation) ++ ")"
    else
        "undefined";


moduleImports imports indentation =
    Array.join "\n" (Array.map (\i -> astToJavascript i indentation) imports);


moduleSuffix declarations optionalExpression =
        if (Array.length declarations) > 0 then
            "\n" ++ "module.exports = {\n" ++ (Array.join ",\n" (Array.map (\d -> (spaces 1) ++ (Record.get "name" d)) declarations)) ++ ",\n" ++ (spaces 1) ++ "_$EXPR,\n" ++ (spaces 1) ++ "_$ASSUMPTIONS\n};"
        else
            "\n" ++ "module.exports = {\n" ++ (spaces 1) ++ "_$EXPR,\n" ++ (spaces 1) ++ "_$ASSUMPTIONS\n};";


blanks =
    "  ";


spaces count =
    blanks.repeat count;


simplifyPath path =
    let {
        candidateResult =
            String.replace "/./" "/" path
    } in
        if (candidateResult == path) then
            path
        else
            simplifyPath candidateResult;


at i a =
    Maybe.withDefault () (Array.at i a);
