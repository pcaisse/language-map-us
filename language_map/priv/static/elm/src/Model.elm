module Model
    exposing
        ( Model
        , Msg(..)
        , init
        , parseLocation
        , decodeMapChanges
        , BoundingBox
        , boundingBoxToString
        , ApiError(..)
        )

import Navigation exposing (Location)
import QueryString exposing (parse, one, string, int, empty, add, render)
import Parser exposing (Parser, (|.), (|=), succeed, symbol, float, run, oneOf, map)
import Port exposing (initializeMap)
import Json.Encode as E
import Json.Decode as D
import Http


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


isStateLevel : Int -> Bool
isStateLevel zoomLevel =
    zoomLevel < 8


type alias Filters =
    { boundingBox : BoundingBox
    , zoomLevel : Int
    }


type Msg
    = UrlChange Location
    | MapMove E.Value
    | PumaSpeakers (Result Http.Error PumaSpeakerResults)
    | StateSpeakers (Result Http.Error StateSpeakerResults)


type ApiError
    = ServerError
    | DataError


type alias Model =
    { filters : Filters
    , pumaSpeakers : List PumaSpeakerResult
    , stateSpeakers : List StateSpeakerResult
    , error : Maybe ApiError
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


type alias PumaSpeakerResult =
    { sum_weight : Int
    , percentage : Float
    , geo_id : String
    }


type alias PumaSpeakerResults =
    { success : Bool
    , results : List PumaSpeakerResult
    }


pumaSpeakerResultDecoder : D.Decoder PumaSpeakerResult
pumaSpeakerResultDecoder =
    D.map3 PumaSpeakerResult
        (D.field "sum_weight" D.int)
        (D.field "percentage" D.float)
        (D.field "geo_id" D.string)


pumaSpeakerResultsDecoder : D.Decoder PumaSpeakerResults
pumaSpeakerResultsDecoder =
    D.map2 PumaSpeakerResults
        (D.field "success" D.bool)
        (D.field "results" (D.list pumaSpeakerResultDecoder))


type alias StateSpeakerResult =
    { sum_weight : Int
    , percentage : Float
    , state_id : String
    }


type alias StateSpeakerResults =
    { success : Bool
    , results : List StateSpeakerResult
    }


stateSpeakerResultDecoder : D.Decoder StateSpeakerResult
stateSpeakerResultDecoder =
    D.map3 StateSpeakerResult
        (D.field "sum_weight" D.int)
        (D.field "percentage" D.float)
        (D.field "state_id" D.string)


stateSpeakerResultsDecoder : D.Decoder StateSpeakerResults
stateSpeakerResultsDecoder =
    D.map2 StateSpeakerResults
        (D.field "success" D.bool)
        (D.field "results" (D.list stateSpeakerResultDecoder))


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


encodeMapPosition : Filters -> E.Value
encodeMapPosition filters =
    E.object
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


fetchPumaSpeakers : Filters -> Cmd Msg
fetchPumaSpeakers filters =
    Http.send PumaSpeakers <|
        Http.get
            ("/api/speakers/"
                ++ (empty
                        |> add "level" "puma"
                        |> add "boundingBox" (boundingBoxToString filters.boundingBox)
                        |> render
                   )
            )
            pumaSpeakerResultsDecoder


fetchStateSpeakers : Filters -> Cmd Msg
fetchStateSpeakers filters =
    Http.send StateSpeakers <|
        Http.get
            ("/api/speakers/"
                ++ (empty
                        |> add "level" "state"
                        |> add "boundingBox" (boundingBoxToString filters.boundingBox)
                        |> render
                   )
            )
            stateSpeakerResultsDecoder


init : Location -> ( Model, Cmd Msg )
init location =
    let
        filters =
            parseLocation location

        model =
            { filters = filters
            , pumaSpeakers = []
            , stateSpeakers = []
            , error = Nothing
            }

        cmds =
            Cmd.batch
                [ initializeMap (encodeMapPosition filters)
                , (if isStateLevel filters.zoomLevel then
                    fetchStateSpeakers filters
                   else
                    fetchPumaSpeakers filters
                  )
                ]
    in
        ( model, cmds )
