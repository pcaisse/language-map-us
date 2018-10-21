module Main exposing (main)

import Navigation exposing (program, Location)
import Model exposing (Model, Msg(..), ApiError(..), init, parseLocation, decodeMapChanges, boundingBoxToString)
import View exposing (view)
import Port exposing (updateUrl, mapPosition)
import Json.Encode as E


subscriptions : Model -> Sub Msg
subscriptions model =
    mapPosition (\json -> MapMove json)


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        UrlChange location ->
            ( { model | filters = parseLocation location }, Cmd.none )

        MapMove json ->
            ( { model | filters = decodeMapChanges json }
            , updateUrl
                (E.object
                    [ ( "boundingBox", E.string (boundingBoxToString model.filters.boundingBox) )
                    , ( "zoomLevel", E.int model.filters.zoomLevel )
                    ]
                )
            )

        PumaSpeakers pumaSpeakersResults ->
            case pumaSpeakersResults of
                Ok speakersResults ->
                    if speakersResults.success == False then
                        ( { model
                            | pumaSpeakers = speakersResults.results
                            , error = Just DataError
                          }
                        , Cmd.none
                        )
                    else
                        ( { model
                            | pumaSpeakers = speakersResults.results
                            , error = Nothing
                          }
                        , Cmd.none
                        )

                Err error ->
                    ( { model
                        | pumaSpeakers = []
                        , error = Just ServerError
                      }
                    , Cmd.none
                    )

        StateSpeakers stateSpeakersResults ->
            case stateSpeakersResults of
                Ok speakersResults ->
                    if speakersResults.success == False then
                        ( { model
                            | stateSpeakers = speakersResults.results
                            , error = Just DataError
                          }
                        , Cmd.none
                        )
                    else
                        ( { model
                            | stateSpeakers = speakersResults.results
                            , error = Nothing
                          }
                        , Cmd.none
                        )

                Err error ->
                    ( { model
                        | stateSpeakers = []
                        , error = Just ServerError
                      }
                    , Cmd.none
                    )


main : Program Never Model Msg
main =
    program
        UrlChange
        { init = init
        , view = view
        , update = update
        , subscriptions = subscriptions
        }
