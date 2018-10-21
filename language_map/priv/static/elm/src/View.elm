module View exposing (view)

import Html exposing (Html, div, text)
import Html.Attributes exposing (id)
import Model exposing (Model, Msg(..))


view : Model -> Html Msg
view model =
    div [ id "map" ]
        []
