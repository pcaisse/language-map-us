module Model
    exposing
        ( Model
        , Msg(..)
        , init
        , parseLocation
        , decodeMapChanges
        , BoundingBox
        , boundingBoxToString
        )

import Navigation exposing (Location)
import QueryString exposing (parse, one, string, int)
import Parser exposing (Parser, (|.), (|=), succeed, symbol, float, run, oneOf, map)
import Port exposing (initializeMap)
import Json.Encode as E
import Json.Decode as D


type alias BoundingBox =
    { southwestLng : Float
    , southwestLat : Float
    , northeastLng : Float
    , northeastLat : Float
    }


mapDefaultBounds : BoundingBox
mapDefaultBounds =
    BoundingBox
        -127.70907193422319
        24.937163301755536
        -63.76864224672318
        49.41877065980485


mapDefaultZoomLevel =
    5


type alias Filters =
    { boundingBox : BoundingBox
    , zoomLevel : Int
    }


type Msg
    = UrlChange Location
    | MapMove E.Value


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

        zoomLevel =
            parse location.search
                |> one int "zoomLevel"
                |> Maybe.withDefault mapDefaultZoomLevel
    in
        { boundingBox = boundingBox
        , zoomLevel = zoomLevel
        }


type alias MapPosition =
    { boundingBoxString : String
    , zoomLevel : Int
    }


mapPositionDecoder : D.Decoder MapPosition
mapPositionDecoder =
    D.map2 MapPosition
        (D.field "boundingBoxString" D.string)
        (D.field "zoomLevel" D.int)


decodeMapChanges : E.Value -> Filters
decodeMapChanges json =
    let
        result =
            D.decodeValue mapPositionDecoder json
    in
        case result of
            Ok { boundingBoxString, zoomLevel } ->
                { boundingBox = parseBoundingBoxString boundingBoxString
                , zoomLevel = zoomLevel
                }

            Err _ ->
                { boundingBox = mapDefaultBounds
                , zoomLevel = mapDefaultZoomLevel
                }


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


init : Location -> ( Model, Cmd Msg )
init location =
    let
        filters =
            parseLocation location

        model =
            { filters = filters }

        cmd =
            initializeMap
                (E.object
                    [ ( "boundingBox"
                      , E.object
                            [ ( "southwestLat", E.float filters.boundingBox.southwestLat )
                            , ( "southwestLng", E.float filters.boundingBox.southwestLng )
                            , ( "northeastLat", E.float filters.boundingBox.northeastLat )
                            , ( "northeastLng", E.float filters.boundingBox.northeastLng )
                            ]
                      )
                    , ( "zoomLevel", E.int filters.zoomLevel )
                    ]
                )
    in
        ( model, cmd )
