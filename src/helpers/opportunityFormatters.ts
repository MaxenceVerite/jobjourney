import { EOpportunityState, EArchiveReason } from "../models/opportunities/Opportunity";
import i18n from "../i18n";

export const STATE_LABELS_FR: Record<EOpportunityState, string> = {
  [EOpportunityState.DRAFT]: "Brouillon / À postuler",
  [EOpportunityState.APPLIED]: "Candidature envoyée",
  [EOpportunityState.INTERVIEWING]: "Entretiens en cours",
  [EOpportunityState.NEGOCIATION_ON_OFFERS]: "Offres & Négociations",
  [EOpportunityState.VALIDATED]: "Offre acceptée",
  [EOpportunityState.REFUSED]: "Refusé",
  [EOpportunityState.ABORTED]: "Annulé",
  [EOpportunityState.ARCHIVED]: "Archivé",
};

export const ARCHIVE_REASON_LABELS_FR: Record<string, string> = {
  [EArchiveReason.ACCEPTED]: "Offre acceptée",
  [EArchiveReason.COMPANY_REJECTED]: "Refusé par l'entreprise",
  [EArchiveReason.USER_DECLINED]: "Refusé par moi (Candidat)",
  [EArchiveReason.GHOSTED]: "Sans réponse / Ghosté",
  [EArchiveReason.POSITION_FROZEN]: "Poste annulé ou gelé",
  [EArchiveReason.OTHER]: "Autre motif",
};

export function getOpportunityStateLabel(state?: EOpportunityState | string): string {
  if (!state) return "";
  const key = `state.${state}`;
  if (i18n.exists(key)) {
    return i18n.t(key);
  }
  return STATE_LABELS_FR[state as EOpportunityState] || String(state);
}

export function getArchiveReasonLabel(reason?: EArchiveReason | string): string {
  if (!reason) return "";
  const key = `archiveReason.${reason}`;
  if (i18n.exists(key)) {
    return i18n.t(key);
  }
  return ARCHIVE_REASON_LABELS_FR[reason] || String(reason);
}
