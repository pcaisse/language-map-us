port module Port exposing (..)

import Json.Encode as E


port initializeMap : E.Value -> Cmd msg


port updateUrl : E.Value -> Cmd msg


port mapPosition : (E.Value -> msg) -> Sub msg
