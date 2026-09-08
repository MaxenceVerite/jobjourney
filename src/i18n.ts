// i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
    en: {
        translation: {
          "state.DRAFT": "Draft",
          "state.APPLIED": "Applied",
          "state.INTERVIEWING": "Interviewing",
          "state.NEGOCIATION_ON_OFFERS": "Offers & Negotiations",
          "state.VALIDATED": "Offer Accepted",
          "state.REFUSED": "Rejected",
          "state.ABORTED": "Cancelled",
          "state.ARCHIVED": "Archived",
          
          "archiveReason.ACCEPTED": "Offer Accepted",
          "archiveReason.COMPANY_REJECTED": "Rejected by Company",
          "archiveReason.USER_DECLINED": "Declined by Candidate",
          "archiveReason.GHOSTED": "No response / Ghosted",
          "archiveReason.POSITION_FROZEN": "Position frozen or cancelled",
          "archiveReason.OTHER": "Other reason",

          "phase.Applied": "Applied",
          "phase.Interviewing": "Interviewing",
          "phase.NegociatingOnOffers": "Negociating on offers",
          "phase.Over": "Over",
          "meetingConditions.VIDEOCALL": "Video Call", 
          "meetingConditions.PHYSICAL": "Physical",
          "interviewType.HR":"HR Interview",
          "interviewType.TECHNICAL":"Technical Interview",
          "interviewType.CLIENT":"Client Interview",
          "interviewType.OTHER":"Other",
          "documentType.CV": "CV",
          "documentType.MOTIVATION_LETTER": "Motivation Letter",
          "RemoteCondition.Remote": "Remote",
          "RemoteCondition.Hybrid": "Hybrid",
          "RemoteCondition.Office": "Office"
        }
      },
      fr: {
        translation: {
          "state.DRAFT": "Brouillon / À postuler",
          "state.APPLIED": "Candidature envoyée",
          "state.INTERVIEWING": "Entretiens en cours",
          "state.NEGOCIATION_ON_OFFERS": "Offres & Négociations",
          "state.VALIDATED": "Offre acceptée",
          "state.REFUSED": "Refusé",
          "state.ABORTED": "Annulé",
          "state.ARCHIVED": "Archivé",

          "archiveReason.ACCEPTED": "Offre acceptée",
          "archiveReason.COMPANY_REJECTED": "Refusé par l'entreprise",
          "archiveReason.USER_DECLINED": "Refusé par moi (Candidat)",
          "archiveReason.GHOSTED": "Sans réponse / Ghosté",
          "archiveReason.POSITION_FROZEN": "Poste annulé ou gelé",
          "archiveReason.OTHER": "Autre motif",

          "phase.Applied": "Candidature envoyée",
          "phase.Interviewing": "Entretiens en cours",
          "phase.NegociatingOnOffers": "Négociation des offres",
          "phase.Over": "Clôturé",
          "meetingConditions.VIDEOCALL": "Visioconférence", 
          "meetingConditions.PHYSICAL": "En présentiel",
          "interviewType.HR":"Entretien RH",
          "interviewType.TECHNICAL":"Entretien Technique",
          "interviewType.CLIENT":"Entretien Client Final",
          "interviewType.OTHER":"Autre",
          "documentType.CV": "CV",
          "documentType.MOTIVATION_LETTER": "Lettre de motivation",
          "RemoteCondition.Remote": "Télétravail total",
          "RemoteCondition.Hybrid": "Hybride",
          "RemoteCondition.Office": "Présentiel"
        }
      }
};

i18n
  .use(initReactI18next) 
  .init({
    resources,
    lng: "fr", 
    interpolation: {
      escapeValue: false 
    }
  });

export default i18n;
