module Model exposing (Model, Msg(..), init)

import Navigation exposing (Location)


type alias BoundingBox =
    { southwest : Coordinate
    , northeast : Coordinate
    }


type alias Coordinate =
    { lat : Float
    , lng : Float
    }


mapDefaultBounds =
    { southwest = { lat = 24.937163301755536, lng = -127.70907193422319 }
    , northeast = { lat = 49.41877065980485, lng = -63.76864224672318 }
    }


mapDefaultZoomLevel =
    5


type alias Filters =
    { filters : { boundingBox : BoundingBox } }


type Msg
    = UrlChange Location



-- = UpdateBoundingBox BoundingBox


type alias Model =
    -- Filters
    { location : Location }


init : Location -> ( Model, Cmd Msg )
init location =
    let
        model =
            { location = location }

        cmd =
            Cmd.none
    in
        ( model, cmd )
