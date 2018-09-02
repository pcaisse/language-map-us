module View exposing (view)

import Html exposing (Html, div, text)
import Html.Attributes exposing (class)
import Model exposing (Model, Msg(..), BoundingBox)


showBoundingBox : BoundingBox -> String
showBoundingBox boundingBox =
    let
        { southwestLat, southwestLng, northeastLat, northeastLng } =
            boundingBox
    in
        String.join ", "
            ([ southwestLat, southwestLng, northeastLng, northeastLng ]
                |> List.map toString
            )


view : Model -> Html Msg
view model =
    div [ class "main" ]
        [ text (showBoundingBox model.filters.boundingBox) ]
