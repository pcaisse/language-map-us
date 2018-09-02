module Main exposing (main)

import Navigation exposing (program, Location)
import Model exposing (Model, Msg(..), init, parseLocation)


-- import Update exposing (update)

import View exposing (view)


subscriptions : Model -> Sub Msg
subscriptions model =
    Sub.none


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        UrlChange location ->
            ( { model | filters = parseLocation location }, Cmd.none )


main : Program Never Model Msg
main =
    program
        UrlChange
        { init = init
        , view = view
        , update = update
        , subscriptions = subscriptions
        }
