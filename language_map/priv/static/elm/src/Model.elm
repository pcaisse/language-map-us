module Model
    exposing
        ( Model
        , Msg(..)
        , init
        , parseLocation
        , decodeMapChanges
        , ApiError(..)
        )

import Navigation exposing (Location)
import QueryString exposing (parse, one, string, int, empty, add, render)
import Port exposing (initializeMap)
import BoundingBox exposing (BoundingBox, boundingBoxToString, boundingBoxParser)
import Parser exposing (run)
import Speakers
    exposing
        ( PumaSpeakerResult
        , StateSpeakerResult
        , PumaSpeakerResults
        , StateSpeakerResults
        , pumaSpeakerResultDecoder
        , stateSpeakerResultDecoder
        , pumaSpeakerResultsDecoder
        , stateSpeakerResultsDecoder
        )
import Json.Encode as E
import Json.Decode as D
import Http


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
