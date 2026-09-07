namespace MyJobBoard.Domain.Enums;

public enum EOpportunityState
{
    DRAFT,
    APPLIED,
    INTERVIEWING,
    NEGOCIATION_ON_OFFERS,
    ABORTED,
    REFUSED,
    VALIDATED,
    ARCHIVED
}

public enum InterviewType
{
    HR,
    TECHNICAL,
    CLIENT,
    OTHER
}

public enum MeetingConditions
{
    VIDEOCALL,
    PHYSICAL
}

public enum RemoteCondition
{
    Remote,
    Hybrid,
    Office
}

public enum Periodicity
{
    Yearly,
    Monthly,
    Daily
}

public enum ApplicationType
{
    Spontaneous,
    JobOffer
}

public enum DocumentType
{
    CV,
    MOTIVATION_LETTER
}
