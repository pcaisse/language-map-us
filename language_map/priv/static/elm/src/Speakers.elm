module Speakers
    exposing
        ( PumaSpeakerResult
        , StateSpeakerResult
        , PumaSpeakerResults
        , StateSpeakerResults
        , stateSpeakerResultDecoder
        , pumaSpeakerResultDecoder
        , stateSpeakerResultsDecoder
        , pumaSpeakerResultsDecoder
        )

import Json.Encode as E
import Json.Decode as D


type alias PumaSpeakerResult =
    { sum_weight : Int
    , percentage : Float
    , geo_id : String
    }


type alias PumaSpeakerResults =
    { success : Bool
    , results : List PumaSpeakerResult
    }


pumaSpeakerResultDecoder : D.Decoder PumaSpeakerResult
pumaSpeakerResultDecoder =
    D.map3 PumaSpeakerResult
        (D.field "sum_weight" D.int)
        (D.field "percentage" D.float)
        (D.field "geo_id" D.string)


pumaSpeakerResultsDecoder : D.Decoder PumaSpeakerResults
pumaSpeakerResultsDecoder =
    D.map2 PumaSpeakerResults
        (D.field "success" D.bool)
        (D.field "results" (D.list pumaSpeakerResultDecoder))


type alias StateSpeakerResult =
    { sum_weight : Int
    , percentage : Float
    , state_id : String
    }


type alias StateSpeakerResults =
    { success : Bool
    , results : List StateSpeakerResult
    }


stateSpeakerResultDecoder : D.Decoder StateSpeakerResult
stateSpeakerResultDecoder =
    D.map3 StateSpeakerResult
        (D.field "sum_weight" D.int)
        (D.field "percentage" D.float)
        (D.field "state_id" D.string)


stateSpeakerResultsDecoder : D.Decoder StateSpeakerResults
stateSpeakerResultsDecoder =
    D.map2 StateSpeakerResults
        (D.field "success" D.bool)
        (D.field "results" (D.list stateSpeakerResultDecoder))
