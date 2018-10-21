module BoundingBox
    exposing
        ( BoundingBox
        , boundingBoxToString
        , boundingBoxParser
        )

import Parser exposing (Parser, (|.), (|=), succeed, symbol, float, oneOf, map)


type alias BoundingBox =
    { southwestLng : Float
    , southwestLat : Float
    , northeastLng : Float
    , northeastLat : Float
    }



-- Workaround for elm-tools/parser not handling negative floats.
-- See: https://github.com/elm-tools/parser/issues/2


float : Parser Float
float =
    Parser.succeed
        (\negative f ->
            if negative then
                -f
            else
                f
        )
        |= minus
        |= Parser.float


minus : Parser Bool
minus =
    oneOf
        [ map (\_ -> True) (symbol "-")
        , succeed False
        ]


boundingBoxParser : Parser BoundingBox
boundingBoxParser =
    succeed BoundingBox
        |= float
        |. symbol ","
        |= float
        |. symbol ","
        |= float
        |. symbol ","
        |= float


boundingBoxToString : BoundingBox -> String
boundingBoxToString boundingBox =
    String.join ","
        ([ boundingBox.southwestLng
         , boundingBox.southwestLat
         , boundingBox.northeastLng
         , boundingBox.northeastLat
         ]
            |> List.map toString
        )
