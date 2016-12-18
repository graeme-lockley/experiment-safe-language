import file:./Rails as R;
import file:./Schema as Schema;
import file:./Subst as Subst;
import file:./SubstitutableType as SubstitutableType;
import file:./Type as Type;
import file:./TypeEnv as TypeEnv;

import file:../../core/Array as List;
import file:../../core/Map as Map;
import file:../../core/Maybe as Maybe;
import file:../../core/Record as Record;
import file:../../core/Result as Result;
import file:../../core/Tuple as Tuple;

import file:../../core/Debug as DEBUG;


mkState typeEnv constraints names =
    Record.mk3
        "typeEnv" typeEnv
        "constraints" constraints
        "names" names;


initialState =
    mkState TypeEnv.empty List.empty 0;


lookupEnv name =
    R.andThen (R.get "typeEnv") (\typeEnv \state ->
        Maybe.withDefault
            (Result.Error ("Unknown identifier " ++ name))
            (Maybe.map (\v -> instantiate v state) (TypeEnv.find name typeEnv))
    );


instantiate schema =
    R.andThen (R.returns (Schema.names schema)) (\_ ->
    R.andThen (R.map (\_ -> fresh)) (\asp ->
        R.returns (SubstitutableType.apply s (Schema.type schema))
            where {
                s =
                    Map.fromList (List.zip (Schema.names schema) asp)
            }
    ));


inferN expr =
    if expr.type == "APPLY" then
        R.andThen (inferN expr.operation) (\t1 ->
        R.andThen (inferN expr.operand) (\t2 ->
        R.andThen fresh (\tv ->
        R.andThen (uni t1 (Type.TArr t2 tv)) (\_ ->
            R.returns tv
        ))))

    else if expr.type == "ADDITION" then
        inferBinaryOperation expr (Type.TArr Type.typeInteger (Type.TArr Type.typeInteger Type.typeInteger))

    else if expr.type == "BOOLEAN_AND" then
        inferBinaryOperation expr (Type.TArr Type.typeBoolean (Type.TArr Type.typeBoolean Type.typeBoolean))

    else if expr.type == "BOOLEAN_NOT" then
        R.andThen (inferN expr.operand) (\t1 ->
        R.andThen fresh (\tv ->
        R.andThen (uni (Type.TArr t1 tv) (Type.TArr Type.typeBoolean Type.typeBoolean)) (\_ ->
            R.returns tv
        )))

    else if expr.type == "BOOLEAN_OR" then
        inferBinaryOperation expr (Type.TArr Type.typeBoolean (Type.TArr Type.typeBoolean Type.typeBoolean))

    else if expr.type == "COMPOSITION" then
        R.andThen (inferN expr.left) (\t1 ->
        R.andThen (inferN expr.right) (\t2 ->
        R.andThen fresh (\tv1 ->
        R.andThen fresh (\tv2 ->
        R.andThen fresh (\tv3 ->
        R.andThen (uni t1 (Type.TArr tv1 tv2)) (\_ ->
        R.andThen (uni t2 (Type.TArr tv3 tv1)) (\_ ->
            R.returns (Type.TArr tv3 tv2)
        )))))))

    else if expr.type == "CONSTANT_BOOLEAN" then
        R.returns Type.typeBoolean

    else if expr.type == "CONSTANT_CHARACTER" then
        R.returns Type.typeCharacter

    else if expr.type == "CONSTANT_INTEGER" then
        R.returns Type.typeInteger

    else if expr.type == "CONSTANT_STRING" then
        R.returns Type.typeString

    else if expr.type == "CONSTANT_UNIT" then
        R.returns Type.typeUnit

    else if expr.type == "DECLARATION" then
        R.andThen (inferN expr.expression) (\inferExpression ->
        R.andThen (lookupEnv expr.name) (\t ->
        R.andThen (uni t inferExpression) (\_ ->
            R.returns inferExpression
        )))

    else if expr.type == "IDENTIFIER" then
        lookupEnv expr.name

    else if expr.type == "LAMBDA" then
        R.andThen fresh (\tv ->
        R.andThen (inEnv expr.variable (Schema.Forall List.empty tv)) (\_ ->
        R.andThen (inferN expr.expression) (\t ->
            R.returns (Type.TArr tv t)
        )))

    else if expr.type == "MODULE" then
        R.andThen (
            R.foldl (\declaration ->
                R.andThen fresh (\tv ->
                R.andThen (inEnv declaration.name (Schema.Forall List.empty tv)) (\_ ->
                    R.returns Type.typeUnit
                ))) expr.declarations) (\_ ->
        R.andThen (R.foldl (\declaration -> inferN declaration) expr.declarations) (\_ ->
        R.andThen fresh (\tv ->
        R.andThen (inferN expr.expression) (\te ->
            R.returns te
        ))))

    else
    {
        DEBUG.log "No inference for " expr.type;
        Result.Error ("No inference for " ++ expr.type)
    };


inferBinaryOperation expr type =
    R.andThen (inferN expr.left) (\t1 ->
    R.andThen (inferN expr.right) (\t2 ->
    R.andThen fresh (\tv ->
    R.andThen (uni (Type.TArr t1 (Type.TArr t2 tv)) type) (\_ ->
        R.returns tv
    ))));


fresh =
    R.andThen (R.get "names") (\names ->
    R.andThen (R.set "names" (names + 1)) (\names ->
        R.returns (Type.TVar ("a" ++ names))
    ))
assumptions {
    DEBUG.eq (fresh (mkInferResult () initialState)) (mkInferResult (Type.TVar "a1") (mkState TypeEnv.empty List.empty 1))
};


inEnv name schema =
    R.andThen (R.get "typeEnv") (\typeEnv ->
        R.set "typeEnv" (TypeEnv.extend name schema typeEnv)
    );


uni t1 t2 =
    R.andThen (R.get "constraints") (\constraints ->
        R.set "constraints" (List.append (Tuple.Tuple t1 t2) constraints)
    );


infer expr inferState =
    inferN expr (mkInferResult () inferState);


mkInferResult type inferState =
    Result.Ok (Tuple.Tuple type inferState);