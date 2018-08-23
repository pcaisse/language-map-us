module View exposing (view)

import Html exposing (Html, div, text)
import Html.Attributes exposing (class)
import Model exposing (Model, Msg(..))


view : Model -> Html Msg
view model =
    div [ class "main" ]
        [ text model.location.search ]
