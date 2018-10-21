module GeoJsonResults
    exposing
        ( PumaGeoJsonResult
        , StateGeoJsonResult
        , PumaGeoJsonResults
        , StateGeoJsonResults
        , stateGeoJsonResultDecoder
        , pumaGeoJsonResultDecoder
        , stateGeoJsonResultsDecoder
        , pumaGeoJsonResultsDecoder
        )

import GeoJson exposing (GeoJson)
import Json.Encode as E
import Json.Decode as D


type alias PumaGeoJsonResult =
    { geom : GeoJson
    , name : String
    , geo_id : String
    }


type alias PumaGeoJsonResults =
    { success : Bool
    , results : List PumaGeoJsonResult
    }


pumaGeoJsonResultDecoder : D.Decoder PumaGeoJsonResult
pumaGeoJsonResultDecoder =
    D.map3 PumaGeoJsonResult
        (D.field "geom" GeoJson.decoder)
        (D.field "name" D.string)
        (D.field "geo_id" D.string)


pumaGeoJsonResultsDecoder : D.Decoder PumaGeoJsonResults
pumaGeoJsonResultsDecoder =
    D.map2 PumaGeoJsonResults
        (D.field "success" D.bool)
        (D.field "results" (D.list pumaGeoJsonResultDecoder))


type alias StateGeoJsonResult =
    { geom : GeoJson
    , name : String
    , stusps : String
    , state_id : String
    }


type alias StateGeoJsonResults =
    { success : Bool
    , results : List StateGeoJsonResult
    }


stateGeoJsonResultDecoder : D.Decoder StateGeoJsonResult
stateGeoJsonResultDecoder =
    D.map4 StateGeoJsonResult
        (D.field "geom" GeoJson.decoder)
        (D.field "name" D.string)
        (D.field "stusps" D.string)
        (D.field "state_id" D.string)


stateGeoJsonResultsDecoder : D.Decoder StateGeoJsonResults
stateGeoJsonResultsDecoder =
    D.map2 StateGeoJsonResults
        (D.field "success" D.bool)
        (D.field "results" (D.list stateGeoJsonResultDecoder))
