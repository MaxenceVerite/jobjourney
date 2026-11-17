using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MyJobBoard.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSmartJobMatchingProfileFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CompactCareerManifesto",
                table: "UserProfiles",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<List<string>>(
                name: "CoreSkills",
                table: "UserProfiles",
                type: "text[]",
                nullable: false);

            migrationBuilder.AddColumn<List<string>>(
                name: "DesiredSkills",
                table: "UserProfiles",
                type: "text[]",
                nullable: false);

            migrationBuilder.AddColumn<bool>(
                name: "EnableTradeOffAlerts",
                table: "UserProfiles",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "TargetHorizonRole",
                table: "UserProfiles",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<List<string>>(
                name: "VetoKeywords",
                table: "UserProfiles",
                type: "text[]",
                nullable: false);

            migrationBuilder.AddColumn<int>(
                name: "WeightCareerGrowth",
                table: "UserProfiles",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "WeightSalary",
                table: "UserProfiles",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "WeightTechChallenge",
                table: "UserProfiles",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "WeightWorkLifeBalance",
                table: "UserProfiles",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "CompanyLogoUrl",
                table: "Opportunities",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ContractType",
                table: "Opportunities",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ExperienceLevel",
                table: "Opportunities",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ExternalReference",
                table: "Opportunities",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "PublishedAt",
                table: "Opportunities",
                type: "timestamp without time zone",
                nullable: true);

            migrationBuilder.AddColumn<List<string>>(
                name: "Skills",
                table: "Opportunities",
                type: "text[]",
                nullable: false);

            migrationBuilder.AddColumn<string>(
                name: "SourceJobBoard",
                table: "Opportunities",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CompactCareerManifesto",
                table: "UserProfiles");

            migrationBuilder.DropColumn(
                name: "CoreSkills",
                table: "UserProfiles");

            migrationBuilder.DropColumn(
                name: "DesiredSkills",
                table: "UserProfiles");

            migrationBuilder.DropColumn(
                name: "EnableTradeOffAlerts",
                table: "UserProfiles");

            migrationBuilder.DropColumn(
                name: "TargetHorizonRole",
                table: "UserProfiles");

            migrationBuilder.DropColumn(
                name: "VetoKeywords",
                table: "UserProfiles");

            migrationBuilder.DropColumn(
                name: "WeightCareerGrowth",
                table: "UserProfiles");

            migrationBuilder.DropColumn(
                name: "WeightSalary",
                table: "UserProfiles");

            migrationBuilder.DropColumn(
                name: "WeightTechChallenge",
                table: "UserProfiles");

            migrationBuilder.DropColumn(
                name: "WeightWorkLifeBalance",
                table: "UserProfiles");

            migrationBuilder.DropColumn(
                name: "CompanyLogoUrl",
                table: "Opportunities");

            migrationBuilder.DropColumn(
                name: "ContractType",
                table: "Opportunities");

            migrationBuilder.DropColumn(
                name: "ExperienceLevel",
                table: "Opportunities");

            migrationBuilder.DropColumn(
                name: "ExternalReference",
                table: "Opportunities");

            migrationBuilder.DropColumn(
                name: "PublishedAt",
                table: "Opportunities");

            migrationBuilder.DropColumn(
                name: "Skills",
                table: "Opportunities");

            migrationBuilder.DropColumn(
                name: "SourceJobBoard",
                table: "Opportunities");
        }
    }
}
