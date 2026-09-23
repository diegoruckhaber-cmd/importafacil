export type HumanValidationMarker = {
  id: "server_verified_v2" | "live_pro_subscription" | "pilot_response";
  satisfied: boolean;
};

export type HumanValidationReadiness = {
  contract: "importafacil-human-validation-v1";
  status: "complete" | "pending" | "unavailable";
  markers: HumanValidationMarker[];
};

export function summarizeHumanValidation(markers: HumanValidationMarker[]): HumanValidationReadiness {
  return {
    contract: "importafacil-human-validation-v1",
    status: markers.length !== 3 ? "unavailable" : markers.every(marker => marker.satisfied) ? "complete" : "pending",
    markers,
  };
}
