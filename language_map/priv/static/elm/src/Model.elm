module Model exposing (Model, Msg(..), init, parseLocation, BoundingBox)

import Navigation exposing (Location)
import QueryString exposing (parse, one, string)
import Parser exposing (Parser, (|.), (|=), succeed, symbol, float, run, oneOf, map)


type alias BoundingBox =
    { southwestLat : Float
    , southwestLng : Float
    , northeastLat : Float
    , northeastLng : Float
    }


mapDefaultBounds : BoundingBox
mapDefaultBounds =
    BoundingBox
        24.937163301755536
        -127.70907193422319
        49.41877065980485
        -63.76864224672318


mapDefaultZoomLevel =
    5


type alias Filters =
    { boundingBox : BoundingBox }


type Msg
    = UrlChange Location


type alias Model =
    { filters : Filters }



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


parseBoundingBoxString : String -> BoundingBox
parseBoundingBoxString boundingBoxString =
    let
        parserResult =
            run boundingBoxParser boundingBoxString
    in
        case parserResult of
            Ok boundingBox ->
                boundingBox

            Err _ ->
                mapDefaultBounds


parseLocation : Location -> Filters
parseLocation location =
    let
        boundingBoxMaybeString =
            parse location.search
                |> one string "boundingBox"

        boundingBox =
            case boundingBoxMaybeString of
                Just boundingBoxString ->
                    parseBoundingBoxString boundingBoxString

                Nothing ->
                    mapDefaultBounds
    in
        { boundingBox = boundingBox }


init : Location -> ( Model, Cmd Msg )
init location =
    let
        model =
            { filters = parseLocation location }

        cmd =
            Cmd.none
    in
        ( model, cmd )
