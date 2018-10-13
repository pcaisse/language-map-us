port module Port exposing (..)

import Json.Encode


port initializeMap : Json.Encode.Value -> Cmd msg
