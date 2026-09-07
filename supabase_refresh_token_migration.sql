START TRANSACTION;

CREATE TABLE "UserRefreshTokens" (
    "Id" uuid NOT NULL,
    "UserId" text NOT NULL,
    "Token" text NOT NULL,
    "Expires" timestamp with time zone NOT NULL,
    "Created" timestamp with time zone NOT NULL,
    "Revoked" timestamp with time zone,
    "ReplacedByToken" text,
    CONSTRAINT "PK_UserRefreshTokens" PRIMARY KEY ("Id")
);

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20260907211618_AddUserRefreshToken', '8.0.4');

COMMIT;

