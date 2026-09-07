import Interlocutor from "./Interlocutor"
import Range from "../../valueObjects/Range"
import { Document } from "../document"

export interface IAnnotable{
    freeNotes?: string
}

export default interface Opportunity extends IAnnotable{
    id?: string,
    roleTitle: string,
    industry?: string,
  
    remoteCondition?: RemoteCondition,
    location?: string,
    companyId?: string,
    startDate: Date,
    lastUpdateDate: Date,
    lastFollowUpDate?: Date,
    state: EOpportunityState,
    relatedApplication?: Application, 
    interviews?: Interview[], 
    offers?: Offer[]
    indicativeSalaryRange?: SalaryRange,
    documents?: OpportunityDocument[],
    userAppreciationLevel?: number,
    confidenceLevel?: number,
    archiveReason?: string,
    archiveFeedback?: string,
    archivedDate?: Date
}

export enum EArchiveReason {
    ACCEPTED = "ACCEPTED",                     // Offre acceptée 🎉
    COMPANY_REJECTED = "COMPANY_REJECTED",     // Candidature non retenue par l'entreprise
    USER_DECLINED = "USER_DECLINED",           // Décliné / Refusé par le candidat
    GHOSTED = "GHOSTED",                       // Sans réponse / Ghosté
    POSITION_FROZEN = "POSITION_FROZEN",       // Offre annulée / Gel de poste
    OTHER = "OTHER"                            // Autre motif
}



export interface Interview extends IAnnotable {
    id?: string,
    interviewers: OpportunityInterviewInterlocutors[],
    type: InterviewType,
    customType?: string,
    dueDate: Date,
    meetingCondition: MeetingConditions,

}



export interface Application extends IAnnotable {
    type: ApplicationType,
    customType?: string,
    expectedExperienceInYears?: Range,
    offerBudget?: SalaryRange,
    linkToJobOffer?: string,
}



export interface Offer extends IAnnotable{
    isCounterOffer: boolean,
    grossYearlySalary: number,
}


export interface SalaryRange extends Range{
    periodicity: Periodicity
}

export interface OpportunityDocument {
    id: string
}

export interface OpportunityInterviewInterlocutors {
    id: string
}


export enum EOpportunityState{
    DRAFT= "DRAFT",
    APPLIED = "APPLIED", // A postuler, n'a encore aucun entretien de planifier
    INTERVIEWING = "INTERVIEWING", // A passé au moins un entretien
    NEGOCIATION_ON_OFFERS = "NEGOCIATION_ON_OFFERS", // A validé l'ensemble des entretiens, attend une offre qui lui convient
    ABORTED = "ABORTED", // Process annulée (absence de réponse du recruteur par exemple)
    REFUSED = "REFUSED", // Opportunité refusée par l'un des deux parties
    VALIDATED = "VALIDATED",  // Opportunité validé (acceptation d'une offre)
    ARCHIVED = "ARCHIVED"
}


export enum InterviewType{
    HR = "HR", 
    Technical = "TECHNICAL",
    Client = "CLIENT",
    Other = "OTHER"
}

export enum MeetingConditions{
    Videocall = "VIDEOCALL", 
    Physical = "PHYSICAL"
}


export enum RemoteCondition {
    Remote = "Remote",
    Hybrid = "Hybrid",
    Office = "Office"
}

export  enum Periodicity{
    Yearly = "Yearly",
    Monthly = "Monthly",
    Daily = "Daily"
}

export enum ApplicationType{
    Spontaneous ="Spontaneous" , 
    JobOffer = "JobOffer"
}









